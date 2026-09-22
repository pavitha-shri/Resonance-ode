import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GameState, Participant, PulseEvent, ClientMessage, ServerMessage } from './src/types';
import { PHYSICS_STAGES } from './src/stagesData';

const PORT = 3000;
const app = express();
app.use(express.json());

// Safari, iOS, and cross-platform mobile browser support middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Set partition-safe cookie for Safari and in-app browser sessions
  try {
    res.cookie('__SECURE-aistudio_auth_flow_may_set_cookies', 'true', {
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
      maxAge: 86400000
    });
  } catch {
    // Ignore if headers already sent
  }
  next();
});

// In-Memory Game State
let currentStageIndex = 0;
let stageData = PHYSICS_STAGES[currentStageIndex];
let autoAdvanceTimer: NodeJS.Timeout | null = null;

const gameState: GameState = {
  gameStatus: 'LOBBY',
  currentStageId: stageData.id,
  timerSeconds: 120,
  isTimerRunning: false,
  maxTimerSeconds: 120,
  matchDurationSeconds: 120,
  structuralIntegrity: 100,
  accumulatedEnergy: 0,
  targetEnergy: stageData.breakdownThreshold,
  isBreakdownAchieved: false,
  autoAdvanceCountdown: 0,
  participants: [],
  recentPulses: [],
  teamHarmonicCoherence: 0,
  peakAmplitude: 0,
  stageResults: {}
};

// Periodic 2-minute match timer tick
setInterval(() => {
  if (gameState.gameStatus === 'IN_PROGRESS' && gameState.isTimerRunning && gameState.timerSeconds > 0) {
    gameState.timerSeconds -= 1;
    if (gameState.timerSeconds <= 0) {
      gameState.timerSeconds = 0;
      gameState.isTimerRunning = false;
      gameState.gameStatus = 'GAME_OVER';
    }
    broadcastState();
  }
}, 1000);

// Helper to calculate accuracy and mechanical vibration energy delivered
function calculatePulseMetrics(freq: number, stage: typeof stageData) {
  const diff = Math.abs(freq - stage.targetFrequency);
  let accuracy = 0;

  if (diff <= stage.perfectBand) {
    accuracy = 1.0;
  } else if (diff <= stage.tolerance) {
    const range = stage.tolerance - stage.perfectBand;
    const progress = (diff - stage.perfectBand) / range;
    accuracy = 1.0 - progress * 0.6;
  } else {
    accuracy = Math.max(0.05, 0.4 * Math.exp(-diff / (stage.tolerance * 2)));
  }

  const baseEnergy = 140;
  const energy = Math.round(baseEnergy * Math.pow(accuracy, 2) * (accuracy >= 0.95 ? 1.5 : 1.0));

  return { accuracy, energy };
}

// Recalculate team coherence & harmonic coupling
function updateTeamMetrics() {
  if (gameState.participants.length === 0) {
    gameState.teamHarmonicCoherence = 0;
    gameState.peakAmplitude = 0;
    return;
  }

  let inBandCount = 0;
  let totalAccuracy = 0;

  for (const p of gameState.participants) {
    const { accuracy } = calculatePulseMetrics(p.frequency, stageData);
    totalAccuracy += accuracy;
    if (Math.abs(p.frequency - stageData.targetFrequency) <= stageData.tolerance) {
      inBandCount++;
    }
  }

  const ratio = inBandCount / gameState.participants.length;
  gameState.teamHarmonicCoherence = Math.round(ratio * 100);
  const averageAccuracy = totalAccuracy / gameState.participants.length;
  gameState.peakAmplitude = Number((averageAccuracy * (1 + (100 - gameState.structuralIntegrity) / 80)).toFixed(2));
}

// Advance to next question within the 2-minute game
function advanceToNextStage() {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  gameState.autoAdvanceCountdown = 0;

  if (currentStageIndex < PHYSICS_STAGES.length - 1) {
    currentStageIndex += 1;
    stageData = PHYSICS_STAGES[currentStageIndex];
    gameState.currentStageId = stageData.id;
    gameState.structuralIntegrity = 100;
    gameState.accumulatedEnergy = 0;
    gameState.targetEnergy = stageData.breakdownThreshold;
    gameState.isBreakdownAchieved = false;
    gameState.recentPulses = [];
    gameState.gameStatus = 'IN_PROGRESS';

    gameState.participants.forEach(p => {
      p.frequency = Number(((stageData.minFrequency + stageData.maxFrequency) / 2).toFixed(1));
      p.currentRoundEnergy = 0;
      p.currentRoundScore = 0;
      p.streak = 0;
      p.isLockedIn = false;
    });

    updateTeamMetrics();
    broadcast({ type: 'STAGE_CHANGED', stageId: stageData.id });
    broadcastState();
  } else {
    // All 10 questions completed!
    gameState.gameStatus = 'GAME_OVER';
    gameState.isTimerRunning = false;
    broadcastState();
  }
}

// Reset or change to specific stage
function changeStage(newStageId: number) {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  gameState.autoAdvanceCountdown = 0;

  const targetStage = PHYSICS_STAGES.find(s => s.id === newStageId) || PHYSICS_STAGES[0];
  currentStageIndex = PHYSICS_STAGES.findIndex(s => s.id === targetStage.id);
  stageData = targetStage;

  gameState.currentStageId = targetStage.id;
  gameState.structuralIntegrity = 100;
  gameState.accumulatedEnergy = 0;
  gameState.targetEnergy = targetStage.breakdownThreshold;
  gameState.isBreakdownAchieved = false;
  gameState.recentPulses = [];

  gameState.participants.forEach(p => {
    p.currentRoundEnergy = 0;
    p.currentRoundScore = 0;
    p.frequency = Number(((targetStage.minFrequency + targetStage.maxFrequency) / 2).toFixed(1));
    p.streak = 0;
    p.isLockedIn = false;
  });

  updateTeamMetrics();
  broadcast({ type: 'STAGE_CHANGED', stageId: targetStage.id });
  broadcastState();
}

// Trigger breakdown and schedule auto-advance to next question
function handleBreakdownOccurred(breakerCallsign?: string) {
  if (gameState.isBreakdownAchieved) return;

  gameState.structuralIntegrity = 0;
  gameState.isBreakdownAchieved = true;
  gameState.gameStatus = 'STAGE_CLEARED';

  // Credit any participant who pulsed this question or broke it
  gameState.participants.forEach(p => {
    if (!p.solvedQuestions) p.solvedQuestions = [];
    const isBreaker = breakerCallsign && p.callsign.toLowerCase() === breakerCallsign.toLowerCase();
    if (isBreaker || (p.currentRoundEnergy || 0) > 0) {
      if (!p.solvedQuestions.includes(stageData.id)) {
        p.solvedQuestions.push(stageData.id);
        p.questionsCompleted = p.solvedQuestions.length;
        const elapsed = gameState.gameStartTime 
          ? Math.round((Date.now() - gameState.gameStartTime) / 1000) 
          : (120 - gameState.timerSeconds);
        p.totalTimeSeconds = elapsed;
      }
    }
  });

  // Find question MVP
  const sorted = [...gameState.participants].sort((a, b) => (b.currentRoundEnergy || 0) - (a.currentRoundEnergy || 0));
  const topParticipant = breakerCallsign 
    ? gameState.participants.find(p => p.callsign.toLowerCase() === breakerCallsign.toLowerCase()) || sorted[0]
    : sorted[0];
  const mvpName = topParticipant ? topParticipant.callsign : (breakerCallsign || 'CLASSROOM');

  if (topParticipant) {
    topParticipant.stageWins = (topParticipant.stageWins || 0) + 1;
  }

  const elapsedNow = gameState.gameStartTime ? Math.round((Date.now() - gameState.gameStartTime) / 1000) : (120 - gameState.timerSeconds);
  gameState.stageResults[gameState.currentStageId] = {
    cleared: true,
    clearTimeSeconds: elapsedNow,
    totalEnergy: gameState.accumulatedEnergy,
    mvpCallsign: mvpName,
    stageName: stageData.name
  };

  if (currentStageIndex >= PHYSICS_STAGES.length - 1) {
    // Question 10 finished! Game is complete!
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      gameState.gameStatus = 'GAME_OVER';
      gameState.isTimerRunning = false;
      broadcastState();
    }, 1800);
    return;
  }

  // Automatic advance after 1.8 seconds (giving students time to enjoy the object blast explosion)
  gameState.autoAdvanceCountdown = 2;

  broadcast({
    type: 'BREAKDOWN_EVENT',
    stageId: gameState.currentStageId,
    mvp: mvpName,
    nextStageIn: 2
  });
  broadcastState();

  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = setTimeout(() => {
    advanceToNextStage();
  }, 1800);
}

// Server creation
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clientSockets = new Map<WebSocket, string>(); // socket -> participantId

function broadcast(message: ServerMessage) {
  const raw = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  });
}

function broadcastState() {
  broadcast({ type: 'STATE_UPDATE', state: gameState });
}

// WebSocket message handling
wss.on('connection', (ws) => {
  // Send immediate current state
  ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: gameState }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as ClientMessage;

      switch (msg.type) {
        case 'JOIN': {
          let participant = gameState.participants.find(p => p.callsign.toLowerCase() === msg.callsign.toLowerCase());
          if (!participant) {
            participant = {
              id: 'p_' + Math.random().toString(36).substring(2, 9),
              callsign: msg.callsign.trim().slice(0, 16).toUpperCase(),
              avatar: msg.avatar || '⚡',
              frequency: Number(((stageData.minFrequency + stageData.maxFrequency) / 2).toFixed(1)),
              lastPulseTime: 0,
              pulseCount: 0,
              currentQuestionIndex: 0,
              currentStageHealth: 100,
              questionsCompleted: 0,
              solvedQuestions: [],
              isFinished: false,
              totalTimeSeconds: 0,
              precisionPercent: 100,
              accuracySum: 0,
              currentRoundEnergy: 0,
              currentRoundScore: 0,
              energyContributed: 0,
              totalEnergy: 0,
              totalScore: 0,
              stageWins: 0,
              streak: 0,
              isLockedIn: false,
              score: 0,
              joinedAt: Date.now()
            };
            gameState.participants.push(participant);
          } else {
            participant.avatar = msg.avatar || participant.avatar;
          }

          clientSockets.set(ws, participant.id);
          updateTeamMetrics();
          broadcastState();
          break;
        }

        case 'SET_FREQUENCY': {
          const participantId = clientSockets.get(ws);
          if (participantId) {
            const p = gameState.participants.find(part => part.id === participantId);
            if (p) {
              p.frequency = Number(msg.frequency);
              const diff = Math.abs(p.frequency - stageData.targetFrequency);
              p.isLockedIn = diff <= stageData.tolerance;
              updateTeamMetrics();
              broadcastState();
            }
          }
          break;
        }

        case 'PULSE': {
          const participantId = clientSockets.get(ws);
          const p = gameState.participants.find(part => part.id === participantId);
          if (p && gameState.gameStatus === 'IN_PROGRESS' && !p.isFinished) {
            const now = Date.now();
            // Throttle to 250ms
            if (now - p.lastPulseTime < 250) break;
            p.lastPulseTime = now;
            p.pulseCount = (p.pulseCount || 0) + 1;

            if (p.currentQuestionIndex === undefined) p.currentQuestionIndex = 0;
            if (p.currentStageHealth === undefined) p.currentStageHealth = 100;

            const qIndex = typeof msg.questionIndex === 'number' && msg.questionIndex >= 0 && msg.questionIndex < PHYSICS_STAGES.length
              ? msg.questionIndex
              : p.currentQuestionIndex;
            const studentStage = PHYSICS_STAGES[qIndex] || PHYSICS_STAGES[0];

            const { accuracy, energy } = calculatePulseMetrics(msg.frequency, studentStage);
            p.accuracySum = (p.accuracySum || 0) + accuracy;
            p.precisionPercent = Number(((p.accuracySum / p.pulseCount) * 100).toFixed(1));

            const freqDiff = Math.abs(msg.frequency - studentStage.targetFrequency);
            const isPerfect = freqDiff <= studentStage.perfectBand;
            const isCorrectFrequency = freqDiff <= studentStage.tolerance;

            if (isCorrectFrequency) {
              p.streak = (p.streak || 0) + 1;
            } else {
              p.streak = Math.max(0, (p.streak || 0) - 1);
            }

            const streakMultiplier = 1 + Math.min(p.streak * 0.25, 2.5);
            const baseGain = isCorrectFrequency ? Math.max(energy, 800) : energy;
            const totalPulseEnergy = Math.round(baseGain * streakMultiplier);
            const pulseScore = Math.round(totalPulseEnergy * (isPerfect ? 1.8 : isCorrectFrequency ? 1.2 : 0.4));

            // Current question stats
            p.currentRoundEnergy = (p.currentRoundEnergy || 0) + totalPulseEnergy;
            p.currentRoundScore = (p.currentRoundScore || 0) + pulseScore;
            p.energyContributed = p.currentRoundEnergy;

            // Overall match stats
            p.totalEnergy = (p.totalEnergy || 0) + totalPulseEnergy;
            p.totalScore = (p.totalScore || 0) + pulseScore;
            p.score = p.totalScore;

            // Physics-grounded progressive structural fatigue damage:
            if (isCorrectFrequency) {
              const diffTier = studentStage.difficulty;
              const nominalPct = diffTier === 'Easy' ? 48 : diffTier === 'Moderate' ? 34 : 26;
              const critBonus = isPerfect ? 1.4 : 1.0;
              const damageDealt = Math.max(14, Math.round(nominalPct * accuracy * critBonus));
              p.currentStageHealth = Math.max(0, Number((p.currentStageHealth - damageDealt).toFixed(1)));
            } else {
              if (p.currentStageHealth > 0 && p.currentStageHealth < 98) {
                p.currentStageHealth = Math.min(100, Number((p.currentStageHealth + 1.5).toFixed(1)));
              }
            }

            // Check if THIS student shattered their question
            let solvedJustNow = false;
            if (p.currentStageHealth <= 0) {
              solvedJustNow = true;
              if (!p.solvedQuestions) p.solvedQuestions = [];
              if (!p.solvedQuestions.includes(studentStage.id)) {
                p.solvedQuestions.push(studentStage.id);
              }
              p.questionsCompleted = p.solvedQuestions.length;
              const elapsed = gameState.gameStartTime 
                ? Math.round((Date.now() - gameState.gameStartTime) / 1000) 
                : (120 - gameState.timerSeconds);
              p.totalTimeSeconds = elapsed;

              const clearBonus = Math.round(1500 * (accuracy >= 0.95 ? 1.5 : 1.0));
              p.totalScore = (p.totalScore || 0) + clearBonus;
              p.score = p.totalScore;

              // Record stage result if first student to finish this question
              if (!gameState.stageResults[studentStage.id]) {
                gameState.stageResults[studentStage.id] = {
                  cleared: true,
                  clearTimeSeconds: elapsed,
                  totalEnergy: p.totalEnergy,
                  mvpCallsign: p.callsign,
                  stageName: studentStage.name
                };
              }

              // Advance student independently to next question!
              if (p.currentQuestionIndex < PHYSICS_STAGES.length - 1) {
                p.currentQuestionIndex += 1;
                p.currentStageHealth = 100;
              } else {
                p.isFinished = true;
                p.finishTimeSeconds = elapsed;
              }

              broadcast({
                type: 'BREAKDOWN_EVENT',
                stageId: studentStage.id,
                mvp: p.callsign,
                nextStageIn: 0
              });
            }

            // Check if all active humans are finished
            const activeHumans = gameState.participants.filter(pt => !pt.isSimulated);
            if (activeHumans.length > 0 && activeHumans.every(pt => pt.isFinished)) {
              gameState.gameStatus = 'GAME_OVER';
              gameState.isTimerRunning = false;
            }

            // Keep host structural integrity aligned with lead student
            const leader = [...gameState.participants].sort((a, b) => (b.questionsCompleted || 0) - (a.questionsCompleted || 0))[0];
            if (leader) {
              gameState.structuralIntegrity = leader.currentStageHealth ?? 100;
            }

            const pulseEv: PulseEvent = {
              id: 'pulse_' + now + '_' + Math.random().toString(36).substr(2, 4),
              participantId: p.id,
              callsign: p.callsign,
              frequency: msg.frequency,
              accuracy,
              energy: totalPulseEnergy,
              timestamp: now
            };

            gameState.recentPulses.unshift(pulseEv);
            if (gameState.recentPulses.length > 20) {
              gameState.recentPulses.pop();
            }

            updateTeamMetrics();
            broadcast({
              type: 'PULSE_BROADCAST',
              pulse: pulseEv,
              structureHealth: p.currentStageHealth
            });
            broadcastState();
          }
          break;
        }

        case 'HOST_START_GAME': {
          if (autoAdvanceTimer) {
            clearInterval(autoAdvanceTimer);
            autoAdvanceTimer = null;
          }
          currentStageIndex = 0;
          stageData = PHYSICS_STAGES[0];
          gameState.currentStageId = stageData.id;
          gameState.gameStatus = 'IN_PROGRESS';
          gameState.timerSeconds = 120;
          gameState.maxTimerSeconds = 120;
          gameState.matchDurationSeconds = 120;
          gameState.gameStartTime = Date.now();
          gameState.isTimerRunning = true;
          gameState.structuralIntegrity = 100;
          gameState.accumulatedEnergy = 0;
          gameState.targetEnergy = stageData.breakdownThreshold;
          gameState.isBreakdownAchieved = false;
          gameState.autoAdvanceCountdown = 0;
          gameState.recentPulses = [];
          gameState.stageResults = {};

          // Reset all participants for a fresh 10-question match
          gameState.participants.forEach(p => {
            p.currentQuestionIndex = 0;
            p.currentStageHealth = 100;
            p.questionsCompleted = 0;
            p.solvedQuestions = [];
            p.isFinished = false;
            p.finishTimeSeconds = undefined;
            p.totalTimeSeconds = 0;
            p.precisionPercent = 100;
            p.accuracySum = 0;
            p.pulseCount = 0;
            p.currentRoundEnergy = 0;
            p.currentRoundScore = 0;
            p.energyContributed = 0;
            p.totalEnergy = 0;
            p.totalScore = 0;
            p.score = 0;
            p.streak = 0;
            p.frequency = Number(((stageData.minFrequency + stageData.maxFrequency) / 2).toFixed(1));
            p.isLockedIn = false;
          });

          updateTeamMetrics();
          broadcast({ type: 'STAGE_CHANGED', stageId: stageData.id });
          broadcastState();
          break;
        }

        case 'HOST_RETURN_TO_LOBBY': {
          if (autoAdvanceTimer) {
            clearInterval(autoAdvanceTimer);
            autoAdvanceTimer = null;
          }
          gameState.gameStatus = 'LOBBY';
          gameState.isTimerRunning = false;
          broadcastState();
          break;
        }

        case 'HOST_NEXT_STAGE': {
          advanceToNextStage();
          break;
        }

        case 'HOST_START_TIMER':
          gameState.isTimerRunning = true;
          broadcastState();
          break;

        case 'HOST_PAUSE_TIMER':
          gameState.isTimerRunning = false;
          broadcastState();
          break;

        case 'HOST_RESET_TIMER':
          gameState.timerSeconds = 120;
          gameState.isTimerRunning = false;
          broadcastState();
          break;

        case 'HOST_SET_TIMER':
          gameState.timerSeconds = msg.seconds;
          broadcastState();
          break;

        case 'HOST_CHANGE_STAGE':
          changeStage(msg.stageId);
          break;

        case 'HOST_RESET_STAGE':
          changeStage(gameState.currentStageId);
          break;

        case 'HOST_TRIGGER_BREAKDOWN':
          handleBreakdownOccurred();
          break;

        case 'HOST_ADD_BOTS': {
          const count = msg.count || 3;
          const botNames = ['KINETIC_FOX', 'CYBER_PULSE', 'HARMONIC_9', 'FLUTTER_BOT', 'TESLA_WAVE', 'RESONATOR_X', 'MODAL_BEAM'];
          for (let i = 0; i < count; i++) {
            const name = botNames[Math.floor(Math.random() * botNames.length)] + '_' + Math.floor(Math.random() * 90 + 10);
            if (!gameState.participants.some(p => p.callsign === name)) {
              const target = stageData.targetFrequency;
              const offset = (Math.random() - 0.5) * stageData.tolerance * 1.4;
              const botFreq = Number((target + offset).toFixed(1));

              const initialScore = Math.floor(Math.random() * 400 + 150);
              const questionsDone = Math.floor(Math.random() * (currentStageIndex + 1));
              gameState.participants.push({
                id: 'bot_' + Math.random().toString(36).substring(2, 9),
                callsign: name,
                avatar: ['🤖', '⚡', '🛰️', '🔮', '🌀', '🌊'][Math.floor(Math.random() * 6)],
                frequency: botFreq,
                lastPulseTime: 0,
                pulseCount: Math.floor(Math.random() * 4 + 1),
                currentQuestionIndex: questionsDone,
                currentStageHealth: 100,
                questionsCompleted: questionsDone,
                solvedQuestions: Array.from({ length: questionsDone }, (_, idx) => idx + 1),
                totalTimeSeconds: Math.floor(Math.random() * 50 + 15),
                precisionPercent: Math.floor(Math.random() * 12 + 88),
                accuracySum: 0,
                currentRoundEnergy: initialScore,
                currentRoundScore: initialScore,
                energyContributed: initialScore,
                totalEnergy: initialScore * 2,
                totalScore: initialScore * 2,
                stageWins: 0,
                streak: Math.floor(Math.random() * 3),
                isLockedIn: Math.abs(offset) <= stageData.tolerance,
                score: initialScore * 2,
                joinedAt: Date.now(),
                isSimulated: true
              });
            }
          }
          updateTeamMetrics();
          broadcastState();
          break;
        }

        case 'HOST_CLEAR_BOTS':
          gameState.participants = gameState.participants.filter(p => !p.isSimulated);
          updateTeamMetrics();
          broadcastState();
          break;

        case 'SET_READY': {
          const participantId = clientSockets.get(ws);
          if (participantId) {
            const p = gameState.participants.find(part => part.id === participantId);
            if (p) {
              p.isReady = Boolean(msg.isReady);
              broadcastState();
            }
          }
          break;
        }

        case 'HOST_KICK_PARTICIPANT': {
          if (msg.participantId) {
            gameState.participants = gameState.participants.filter(p => p.id !== msg.participantId);
            updateTeamMetrics();
            broadcastState();
          }
          break;
        }

        case 'HOST_CLEAR_PARTICIPANTS': {
          gameState.participants = [];
          updateTeamMetrics();
          broadcastState();
          break;
        }

        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    // Keep participant in list so scores persist during reconnection
  });
});

// REST API fallback routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now(), totalParticipants: gameState.participants.length });
});

// Explicit SPA routes
app.get(['/student', '/join', '/play', '/host', '/lobby'], (req, res, next) => {
  if (req.path === '/student' || req.path === '/join' || req.path === '/play') {
    return res.redirect('/?student=true&__storage_access_granted=1');
  }
  if (req.path === '/host') {
    return res.redirect('/?host=true&__storage_access_granted=1');
  }
  if (process.env.NODE_ENV === 'production') {
    return res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  }
  next();
});

app.get('/api/state', (req, res) => {
  res.json(gameState);
});

app.post('/api/join', (req, res) => {
  const { callsign, avatar } = req.body;
  if (!callsign) {
    return res.status(400).json({ error: 'Callsign required' });
  }

  let participant = gameState.participants.find(p => p.callsign.toLowerCase() === callsign.toLowerCase());
  if (!participant) {
    participant = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      callsign: callsign.trim().slice(0, 16).toUpperCase(),
      avatar: avatar || '⚡',
      frequency: Number(((stageData.minFrequency + stageData.maxFrequency) / 2).toFixed(1)),
      lastPulseTime: 0,
      pulseCount: 0,
      currentQuestionIndex: 0,
      currentStageHealth: 100,
      questionsCompleted: 0,
      solvedQuestions: [],
      totalTimeSeconds: 0,
      precisionPercent: 100,
      accuracySum: 0,
      currentRoundEnergy: 0,
      currentRoundScore: 0,
      energyContributed: 0,
      totalEnergy: 0,
      totalScore: 0,
      stageWins: 0,
      streak: 0,
      isLockedIn: false,
      score: 0,
      joinedAt: Date.now()
    };
    gameState.participants.push(participant);
  }

  updateTeamMetrics();
  broadcastState();
  res.json({ participant, state: gameState });
});

app.post('/api/pulse', (req, res) => {
  const { participantId, frequency, questionIndex } = req.body;
  const p = gameState.participants.find(part => part.id === participantId);
  if (!p) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  p.frequency = frequency;
  p.pulseCount = (p.pulseCount || 0) + 1;

  if (p.currentQuestionIndex === undefined) p.currentQuestionIndex = 0;
  if (p.currentStageHealth === undefined) p.currentStageHealth = 100;

  const qIdx = typeof questionIndex === 'number' && questionIndex >= 0 && questionIndex < PHYSICS_STAGES.length
    ? questionIndex
    : p.currentQuestionIndex;
  const studentStage = PHYSICS_STAGES[qIdx] || PHYSICS_STAGES[0];

  const { accuracy, energy } = calculatePulseMetrics(frequency, studentStage);
  p.accuracySum = (p.accuracySum || 0) + accuracy;
  p.precisionPercent = Number(((p.accuracySum / p.pulseCount) * 100).toFixed(1));

  const freqDiff = Math.abs(frequency - studentStage.targetFrequency);
  const isPerfect = freqDiff <= studentStage.perfectBand;
  const isCorrectFrequency = freqDiff <= studentStage.tolerance;

  if (isCorrectFrequency) {
    p.streak = (p.streak || 0) + 1;
  } else {
    p.streak = Math.max(0, (p.streak || 0) - 1);
  }

  const baseGain = isCorrectFrequency ? Math.max(energy, 800) : energy;
  const streakMultiplier = 1 + Math.min(p.streak * 0.25, 2.5);
  const totalPulseEnergy = Math.round(baseGain * streakMultiplier);
  const pulseScore = Math.round(totalPulseEnergy * (isPerfect ? 1.8 : isCorrectFrequency ? 1.2 : 0.4));

  p.currentRoundEnergy = (p.currentRoundEnergy || 0) + totalPulseEnergy;
  p.currentRoundScore = (p.currentRoundScore || 0) + pulseScore;
  p.energyContributed = p.currentRoundEnergy;
  p.totalEnergy = (p.totalEnergy || 0) + totalPulseEnergy;
  p.totalScore = (p.totalScore || 0) + pulseScore;
  p.score = p.totalScore;

  if (isCorrectFrequency) {
    const diffTier = studentStage.difficulty;
    const nominalPct = diffTier === 'Easy' ? 48 : diffTier === 'Moderate' ? 34 : 26;
    const critBonus = isPerfect ? 1.4 : 1.0;
    const damageDealt = Math.max(14, Math.round(nominalPct * accuracy * critBonus));
    p.currentStageHealth = Math.max(0, Number((p.currentStageHealth - damageDealt).toFixed(1)));
  } else {
    if (p.currentStageHealth > 0 && p.currentStageHealth < 98) {
      p.currentStageHealth = Math.min(100, Number((p.currentStageHealth + 1.5).toFixed(1)));
    }
  }

  let solvedJustNow = false;
  if (p.currentStageHealth <= 0) {
    solvedJustNow = true;
    if (!p.solvedQuestions) p.solvedQuestions = [];
    if (!p.solvedQuestions.includes(studentStage.id)) {
      p.solvedQuestions.push(studentStage.id);
    }
    p.questionsCompleted = p.solvedQuestions.length;
    const elapsed = gameState.gameStartTime 
      ? Math.round((Date.now() - gameState.gameStartTime) / 1000) 
      : (120 - gameState.timerSeconds);
    p.totalTimeSeconds = elapsed;

    const clearBonus = Math.round(1500 * (accuracy >= 0.95 ? 1.5 : 1.0));
    p.totalScore = (p.totalScore || 0) + clearBonus;
    p.score = p.totalScore;

    if (p.currentQuestionIndex < PHYSICS_STAGES.length - 1) {
      p.currentQuestionIndex += 1;
      p.currentStageHealth = 100;
    } else {
      p.isFinished = true;
      p.finishTimeSeconds = elapsed;
    }

    broadcast({
      type: 'BREAKDOWN_EVENT',
      stageId: studentStage.id,
      mvp: p.callsign,
      nextStageIn: 0
    });
  }

  const leader = [...gameState.participants].sort((a, b) => (b.questionsCompleted || 0) - (a.questionsCompleted || 0))[0];
  if (leader) {
    gameState.structuralIntegrity = leader.currentStageHealth ?? 100;
  }

  updateTeamMetrics();
  broadcastState();
  res.json({ success: true, accuracy, energy: totalPulseEnergy, solved: solvedJustNow, stageHealth: p.currentStageHealth, state: gameState });
});

// Start dev or production server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Resonance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
