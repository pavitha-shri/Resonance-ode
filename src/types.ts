export interface MechanicalParameters {
  stiffness: string; // e.g. "k = 9.2 × 10⁷ N/m"
  mass: string; // e.g. "m = 10,000 tonnes"
  dampingRatio: string; // e.g. "ζ = 0.015 (critically low)"
  naturalFreqFormula: string; // e.g. "f_n = (1/2π)·√(k/m)"
  realFailure: string; // e.g. "Tacoma Narrows (1940)"
}

export interface PhysicsStage {
  id: number;
  name: string;
  mechanicalObject: string; // Real-world mechanical vibrating object
  subtitle: string;
  vibrationMode: string; // e.g. "Torsional Flutter & Standing Wave"
  description: string;
  realWorldPhenomenon: string;
  formula: string;
  differentialEquation?: string; // e.g. "m · d²x/dt² + c · dx/dt + k · x = F_0 · cos(ω t)"
  resonanceBehavior?: string; // Explanation of what resonance does to this object
  mechanicalParams: MechanicalParameters;
  targetFrequency: number; // in Hz
  tolerance: number; // +/- Hz for partial resonance
  perfectBand: number; // +/- Hz for perfect resonance
  minFrequency: number;
  maxFrequency: number;
  step: number;
  unit: string;
  breakdownThreshold: number; // energy required to cause collapse
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Introductory' | 'Intermediate' | 'Advanced' | 'Mastery';
  structureType: 'bridge' | 'skyscraper' | 'cantilever' | 'helicopter' | 'drill' | 'turbine' | 'footbridge' | 'railway' | 'vehicle' | 'pipe';
  teachingPrompts: string[];
  physicsExplanation: string;
  clueHint?: string;
  acousticNote?: string;
}

export interface HallOfFameEntry {
  id: string;
  callsign: string;
  avatar: string;
  score: number;
  questionsCompleted: number; // 0 to 10
  totalTimeSeconds: number;
  precisionPercent: number;
  date: string;
  accolade: string; // e.g. "Tacoma Breaker", "Resonance Grandmaster"
}

export interface Participant {
  id: string;
  callsign: string;
  avatar: string;
  frequency: number;
  lastPulseTime: number;
  pulseCount: number;
  // Performance metrics for the 10 questions match
  currentQuestionIndex: number; // 0 to 9 for current question
  currentStageHealth: number; // 100 down to 0 for this student's active structure
  questionsCompleted: number; // 0 to 10
  solvedQuestions: number[]; // e.g. [1, 2, 3]
  isFinished?: boolean;
  finishTimeSeconds?: number;
  totalTimeSeconds: number; // Total seconds taken across completed questions
  precisionPercent: number; // Average accuracy percentage (e.g. 97.5%)
  accuracySum: number;
  
  // Scoring & energy
  currentRoundEnergy: number;
  currentRoundScore: number;
  energyContributed: number;
  totalEnergy: number;
  totalScore: number;
  stageWins: number;
  streak: number;
  isLockedIn: boolean;
  score: number;
  joinedAt: number;
  isReady?: boolean; // True when student has read instructions & confirmed ready
  isSimulated?: boolean;
}

export interface PulseEvent {
  id: string;
  participantId: string;
  callsign: string;
  frequency: number;
  accuracy: number; // 0 to 1
  energy: number;
  timestamp: number;
}

export interface GameState {
  gameStatus: 'LOBBY' | 'IN_PROGRESS' | 'STAGE_CLEARED' | 'GAME_OVER' | 'CHAMPIONSHIP_OVER';
  currentStageId: number;
  timerSeconds: number;
  isTimerRunning: boolean;
  maxTimerSeconds: number;
  gameStartTime?: number;
  matchDurationSeconds: number; // 120 (2 minutes)
  structuralIntegrity: number; // 100% down to 0%
  accumulatedEnergy: number;
  targetEnergy: number;
  isBreakdownAchieved: boolean;
  autoAdvanceCountdown?: number;
  participants: Participant[];
  recentPulses: PulseEvent[];
  teamHarmonicCoherence: number;
  peakAmplitude: number;
  stageResults: Record<number, {
    cleared: boolean;
    clearTimeSeconds: number;
    totalEnergy: number;
    mvpCallsign: string;
    stageName: string;
  }>;
}

export type ClientMessage = 
  | { type: 'JOIN'; callsign: string; avatar: string }
  | { type: 'SET_FREQUENCY'; frequency: number }
  | { type: 'PULSE'; frequency: number; questionIndex?: number }
  | { type: 'ADVANCE_QUESTION' }
  | { type: 'SET_READY'; isReady: boolean } // Student confirms they understand how to play
  | { type: 'HOST_START_GAME' } // Start game from lobby
  | { type: 'HOST_RETURN_TO_LOBBY' } // Return to lobby
  | { type: 'HOST_NEXT_STAGE' } // Advance to next stage immediately
  | { type: 'HOST_START_TIMER' }
  | { type: 'HOST_PAUSE_TIMER' }
  | { type: 'HOST_RESET_TIMER' }
  | { type: 'HOST_SET_TIMER'; seconds: number }
  | { type: 'HOST_CHANGE_STAGE'; stageId: number }
  | { type: 'HOST_RESET_STAGE' }
  | { type: 'HOST_TRIGGER_BREAKDOWN' }
  | { type: 'HOST_KICK_PARTICIPANT'; participantId: string }
  | { type: 'HOST_CLEAR_PARTICIPANTS' }
  | { type: 'HOST_ADD_BOTS'; count: number }
  | { type: 'HOST_CLEAR_BOTS' }
  | { type: 'PING' };

export type ServerMessage = 
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'PULSE_BROADCAST'; pulse: PulseEvent; structureHealth: number }
  | { type: 'BREAKDOWN_EVENT'; stageId: number; mvp: string; nextStageIn: number }
  | { type: 'STAGE_CHANGED'; stageId: number }
  | { type: 'PONG' };
