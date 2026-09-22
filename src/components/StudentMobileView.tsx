import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Zap, Trophy, Award, Clock, CheckCircle2, ChevronRight, Sparkles, BookOpen, HelpCircle, ChevronDown, ChevronUp, Lock, RotateCcw } from 'lucide-react';
import { PhysicsStage, GameState } from '../types';
import { PHYSICS_STAGES } from '../stagesData';
import { soundFx } from '../utils/audio';
import { StructureCanvas } from './StructureCanvas';
import { LeaderboardPanel } from './LeaderboardPanel';
import { StudentLobbyView } from './StudentLobbyView';
import { QuestionAnswersReview } from './QuestionAnswersReview';
import { GraphicIntroHero } from './GraphicIntroHero';
import { HostAuthModal } from './HostAuthModal';
import { PhysicistPersonaModal } from './PhysicistPersonaModal';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage';

interface StudentMobileViewProps {
  gameState: GameState;
  currentStage: PhysicsStage;
  onJoin: (callsign: string, avatar: string) => void;
  onSetFrequency: (freq: number) => void;
  onPulse: (freq: number, questionIndex?: number) => void;
  onSetReady?: (isReady: boolean) => void;
  initialCallsign?: string;
  onSwitchToHost?: () => void;
}

const AVATAR_OPTIONS = ['⚡', '🔮', '🛰️', '🌀', '🛡️', '🧬', '🚀', '⚛️'];

export const StudentMobileView: React.FC<StudentMobileViewProps> = ({
  gameState,
  currentStage,
  onJoin,
  onSetFrequency,
  onPulse,
  onSetReady,
  initialCallsign = '',
  onSwitchToHost
}) => {
  // Start with empty or explicit initial callsign so new students are never trapped with a previous player's name
  const [callsign, setCallsign] = useState<string>(() => initialCallsign || '');
  const [savedCallsign, setSavedCallsign] = useState<string | null>(() => {
    return safeLocalStorage.getItem('resonance_callsign');
  });

  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    return safeLocalStorage.getItem('resonance_avatar') || '⚡';
  });

  // Prompt for participant name unless this active tab already submitted in this session
  const [isJoined, setIsJoined] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new_student') === 'true') return false;
    return Boolean(safeSessionStorage.getItem('resonance_session_joined'));
  });

  // Intro Graphic Briefing Screen State
  const [showGraphicIntro, setShowGraphicIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !safeSessionStorage.getItem('resonance_intro_seen');
  });

  // Host password modal state
  const [isHostAuthOpen, setIsHostAuthOpen] = useState<boolean>(false);

  // Clue & Formula Dropdown State
  const [showClueCard, setShowClueCard] = useState<boolean>(false);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [gameOverTab, setGameOverTab] = useState<'leaderboard' | 'answers'>('leaderboard');
  const [showPersonaModal, setShowPersonaModal] = useState<boolean>(true);
  const [clearedBanner, setClearedBanner] = useState<{ show: boolean; questionNumber: number; objectName: string } | null>(null);

  // Find my participant stats
  const myParticipant = gameState.participants.find(
    p => p.callsign.toLowerCase() === callsign.toLowerCase()
  );

  const studentQIdx = myParticipant?.currentQuestionIndex ?? 0;
  const activeStage = PHYSICS_STAGES[studentQIdx] || currentStage;
  const activeHealth = myParticipant?.currentStageHealth ?? 100;
  const isStudentFinished = Boolean(
    myParticipant?.isFinished || 
    (myParticipant?.questionsCompleted && myParticipant.questionsCompleted >= 10)
  );

  const [frequency, setFrequency] = useState<number>(() => {
    return Number(((activeStage.minFrequency + activeStage.maxFrequency) / 2).toFixed(activeStage.step < 0.1 ? 2 : 1));
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cooldownProgress, setCooldownProgress] = useState<number>(100);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [floatingPulses, setFloatingPulses] = useState<Array<{ id: number; text: string; perfect: boolean; damage?: number }>>([]);

  const cooldownIntervalRef = useRef<number | null>(null);
  const nextPulseIdRef = useRef<number>(1);
  const prevQIdxRef = useRef<number>(studentQIdx);

  // Sync frequency defaults when this student's active question changes
  useEffect(() => {
    const mid = Number(((activeStage.minFrequency + activeStage.maxFrequency) / 2).toFixed(activeStage.step < 0.1 ? 2 : 1));
    setFrequency(mid);
    onSetFrequency(mid);
    setShowClueCard(false); // Collapse clue card for new stage
  }, [activeStage.id]);

  // Handle audio and vibration when student clears a question
  useEffect(() => {
    if (studentQIdx > prevQIdxRef.current) {
      soundFx.playBreakdown();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 60, 200, 60, 400]);
      }
      const prevStage = PHYSICS_STAGES[prevQIdxRef.current];
      setClearedBanner({
        show: true,
        questionNumber: prevQIdxRef.current + 1,
        objectName: prevStage?.mechanicalObject || 'Structure'
      });
      const timer = setTimeout(() => setClearedBanner(null), 2200);
      prevQIdxRef.current = studentQIdx;
      return () => clearTimeout(timer);
    }
  }, [studentQIdx]);

  // Frequency accuracy calculations against active student question
  const freqDiff = Math.abs(frequency - activeStage.targetFrequency);
  const isPerfect = freqDiff <= activeStage.perfectBand;
  const isClose = freqDiff <= activeStage.tolerance;

  const handleFreqChange = (newVal: number) => {
    const clamped = Math.max(activeStage.minFrequency, Math.min(activeStage.maxFrequency, newVal));
    const formatted = Number(clamped.toFixed(activeStage.step < 0.1 ? 2 : 1));
    setFrequency(formatted);
    onSetFrequency(formatted);
    soundFx.playFrequencyTone(formatted);
  };

  const adjustFreq = (delta: number) => {
    handleFreqChange(frequency + delta);
    soundFx.playBlip();
  };

  const handlePulse = () => {
    const isGameOver = gameState.gameStatus === 'GAME_OVER' || gameState.gameStatus === 'CHAMPIONSHIP_OVER';
    if (cooldownProgress < 100 || isStudentFinished || isGameOver) return;

    setIsPulsing(true);
    setCooldownProgress(0);

    const accuracy = isPerfect ? 1.0 : isClose ? 0.7 : 0.2;
    soundFx.playPulse(frequency, accuracy);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isPerfect ? [60, 40, 90] : isClose ? [40, 30] : [20]);
    }

    onPulse(frequency, studentQIdx);

    // Compute feedback without revealing numerical answer
    const damage = isPerfect 
      ? (activeStage.difficulty === 'Easy' ? 48 : activeStage.difficulty === 'Moderate' ? 36 : 28)
      : isClose
      ? (activeStage.difficulty === 'Easy' ? 32 : activeStage.difficulty === 'Moderate' ? 24 : 18)
      : 0;

    const pulseText = isPerfect 
      ? `⚡ CRITICAL RESONANT HIT! (-${damage}%)` 
      : isClose 
      ? `HARMONIC STRAIN! (-${damage}%)` 
      : 'OFF FREQUENCY (WAVE DAMPED)';

    const newPulse = { id: nextPulseIdRef.current++, text: pulseText, perfect: isPerfect, damage };
    setFloatingPulses(prev => [...prev, newPulse]);
    setTimeout(() => {
      setFloatingPulses(prev => prev.filter(p => p.id !== newPulse.id));
    }, 1200);

    setTimeout(() => setIsPulsing(false), 200);

    const startTime = Date.now();
    const duration = 650;
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    cooldownIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setCooldownProgress(progress);
      if (progress >= 100 && cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    }, 30);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim()) return;
    const cleanCallsign = callsign.trim().toUpperCase().slice(0, 14);
    setCallsign(cleanCallsign);
    safeLocalStorage.setItem('resonance_callsign', cleanCallsign);
    safeLocalStorage.setItem('resonance_avatar', selectedAvatar);
    safeSessionStorage.setItem('resonance_session_joined', 'true');
    setIsJoined(true);
    onJoin(cleanCallsign, selectedAvatar);
    soundFx.playBlip();
  };

  const toggleAudio = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
    if (!next) soundFx.playBlip();
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleChangeName = () => {
    safeSessionStorage.removeItem('resonance_session_joined');
    setIsJoined(false);
  };

  const handleJoinAgain = () => {
    safeSessionStorage.removeItem('resonance_session_joined');
    safeSessionStorage.removeItem('resonance_intro_seen');
    setIsJoined(false);
    setShowGraphicIntro(true);
    setShowPersonaModal(true);
    setIsLeaderboardOpen(false);
    setIsReviewOpen(false);
    setGameOverTab('leaderboard');
    setCallsign('');
  };

  // 1A. INTRO GRAPHIC BRIEFING SCREEN (First step before entering name)
  if (!isJoined && showGraphicIntro) {
    return (
      <div className="min-h-screen bg-[#06090e]">
        <GraphicIntroHero
          onContinue={() => {
            safeSessionStorage.setItem('resonance_intro_seen', 'true');
            setShowGraphicIntro(false);
          }}
        />
        
        {/* Discreet Host Access Link Protected by Password */}
        {onSwitchToHost && (
          <div className="pb-6 text-center">
            <button
              onClick={() => setIsHostAuthOpen(true)}
              className="text-[11px] font-mono text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Instructor / Host Access</span>
            </button>
          </div>
        )}

        <HostAuthModal
          isOpen={isHostAuthOpen}
          onSuccess={() => {
            setIsHostAuthOpen(false);
            safeSessionStorage.setItem('eigencrush_host_auth', 'true');
            onSwitchToHost?.();
          }}
          onCancel={() => setIsHostAuthOpen(false)}
        />
      </div>
    );
  }

  // 1B. JOIN SCREEN (Enter Name & Avatar)
  if (!isJoined) {
    return (
      <div className="min-h-screen min-h-[100dvh] max-w-md mx-auto flex flex-col justify-center px-4 py-6 font-sans ios-safe-bottom">
        <div className="bg-[#0b1322] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-center relative">
          
          <button
            type="button"
            onClick={() => setShowGraphicIntro(true)}
            className="absolute top-4 left-4 text-xs font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
          >
            ← Briefing
          </button>

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400 mx-auto flex items-center justify-center text-cyan-300 mb-3 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Zap className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-bold text-white mb-1">
            EIGENCRUSH: Enter Arena
          </h1>
          <p className="text-xs text-slate-300 mb-6">
            10 vibration questions in 2 minutes. Solve the ODE resonance frequency to crack each structure!
          </p>

          <form onSubmit={handleJoinSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Choose Harmonic Avatar:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`py-2 text-xl rounded-xl border transition-all ${
                      selectedAvatar === av
                        ? 'bg-cyan-500/30 border-cyan-400 scale-105'
                        : 'bg-black/40 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300">
                  Student Name / Callsign:
                </label>
                {callsign && (
                  <button
                    type="button"
                    onClick={() => setCallsign('')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 underline"
                  >
                    Clear Name
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                  placeholder="E.g. ALEX, KEVIN_M"
                  maxLength={14}
                  required
                  style={{ fontSize: '16px' }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-white font-mono text-base placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {savedCallsign && !callsign && (
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span>Previous player: <strong className="text-cyan-300">{savedCallsign}</strong></span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCallsign(savedCallsign)}
                      className="text-cyan-400 hover:text-cyan-200 underline font-bold"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        safeLocalStorage.removeItem('resonance_callsign');
                        setSavedCallsign(null);
                      }}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Forget
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-black font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg mt-2 cursor-pointer"
            >
              Join Classroom Match →
            </button>
          </form>

          {/* Discreet host link (requires passkey odeINresonance) */}
          {onSwitchToHost && (
            <div className="mt-6 pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setIsHostAuthOpen(true)}
                className="text-[11px] font-mono text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Teacher / Host Control Access</span>
              </button>
            </div>
          )}

          <HostAuthModal
            isOpen={isHostAuthOpen}
            onSuccess={() => {
              setIsHostAuthOpen(false);
              safeSessionStorage.setItem('eigencrush_host_auth', 'true');
              onSwitchToHost?.();
            }}
            onCancel={() => setIsHostAuthOpen(false)}
          />
        </div>
      </div>
    );
  }

  // 2. LOBBY SCREEN (Waiting for Host to start match)
  if (gameState.gameStatus === 'LOBBY') {
    return (
      <>
        <StudentLobbyView
          gameState={gameState}
          currentStage={currentStage}
          callsign={callsign}
          selectedAvatar={selectedAvatar}
          onChangeName={() => {
            safeSessionStorage.removeItem('resonance_session_joined');
            setIsJoined(false);
          }}
          onSetReady={onSetReady}
        />
        {onSwitchToHost && (
          <div className="fixed bottom-1 left-3 z-30">
            <button
              onClick={() => setIsHostAuthOpen(true)}
              className="text-[10px] font-mono text-slate-600 hover:text-slate-400 flex items-center gap-1"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Host</span>
            </button>
            <HostAuthModal
              isOpen={isHostAuthOpen}
              onSuccess={() => {
                setIsHostAuthOpen(false);
                safeSessionStorage.setItem('eigencrush_host_auth', 'true');
                onSwitchToHost?.();
              }}
              onCancel={() => setIsHostAuthOpen(false)}
            />
          </div>
        )}
      </>
    );
  }

  // 3. GAME OVER OR FINISHED SCREEN
  const isGameOver = gameState.gameStatus === 'GAME_OVER' || gameState.gameStatus === 'CHAMPIONSHIP_OVER';
  if (isGameOver || isStudentFinished) {
    const solvedCount = myParticipant?.solvedQuestions?.length ?? myParticipant?.questionsCompleted ?? 0;

    return (
      <div className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-start px-3 py-4 font-sans space-y-3 ios-safe-bottom">
        {/* Congratulatory / Encouraging Physicist Persona Modal */}
        <PhysicistPersonaModal
          isOpen={showPersonaModal}
          participant={myParticipant}
          allParticipants={gameState.participants}
          callsign={callsign}
          onProceed={() => setShowPersonaModal(false)}
          onJoinAgain={handleJoinAgain}
        />

        {/* Navigation Tabs between Leaderboard & Answer Key */}
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-cyan-500/30">
          <button
            onClick={() => setGameOverTab('leaderboard')}
            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
              gameOverTab === 'leaderboard'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Final Leaderboard
          </button>
          <button
            onClick={() => setGameOverTab('answers')}
            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
              gameOverTab === 'answers'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Answers & Details ({solvedCount}/10)
          </button>
        </div>

        {gameOverTab === 'leaderboard' ? (
          <div className="bg-[#0b1322] rounded-2xl p-4 md:p-5 border-2 border-amber-400 text-center shadow-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-300">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white uppercase">
                {isStudentFinished ? 'All 10 Questions Completed!' : '2-Minute Match Completed!'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Great effort, {callsign}! Review your class standing and answers below.
              </p>
            </div>

            {/* Persona Modal Trigger Button */}
            <button
              onClick={() => setShowPersonaModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-400/80 text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>🌟 View My Physicist / Mathematician Persona</span>
            </button>

            {/* Quick Answer Banner */}
            <button
              onClick={() => setGameOverTab('answers')}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-400 text-cyan-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <span>View All 10 Answers, Formulas & Solutions</span>
              </div>
              <span className="text-emerald-400 font-bold">
                {solvedCount}/10 Solved →
              </span>
            </button>

            {/* Join Again Option */}
            <button
              onClick={handleJoinAgain}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Join Again (Return to Start)</span>
            </button>

            <LeaderboardPanel
              gameState={gameState}
              highlightCallsign={callsign}
              compact={true}
              isGameOver={true}
            />
          </div>
        ) : (
          <div className="h-[88vh] flex flex-col">
            <div className="flex-1 min-h-0">
              <QuestionAnswersReview
                stages={PHYSICS_STAGES}
                gameState={gameState}
                currentUserCallsign={callsign}
                mode="student"
              />
            </div>
            <button
              onClick={handleJoinAgain}
              className="mt-2 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Join Again (Return to Start)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. ACTIVE GAMEPLAY INTERFACE
  const questionsDone = myParticipant?.questionsCompleted ?? 0;
  const precision = myParticipant?.precisionPercent ?? 100;

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-md mx-auto flex flex-col justify-between px-3 py-3 font-sans select-none ios-safe-bottom">
      
      {/* Floating Damage Text */}
      <AnimatePresence>
        {floatingPulses.map((fp) => (
          <motion.div
            key={fp.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -50, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={`fixed left-1/2 -translate-x-1/2 top-1/2 pointer-events-none z-50 px-4 py-1.5 rounded-full font-mono text-xs font-bold shadow-xl border ${
              fp.perfect
                ? 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_20px_#10b981]'
                : 'bg-cyan-950 text-cyan-300 border-cyan-400'
            }`}
          >
            {fp.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Top Header: Student Info, 2-Min Timer, Leaderboard Icon */}
      <header className="bg-[#0b1322] rounded-xl p-3 border border-cyan-500/30 flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedAvatar}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-white">
                {callsign}
              </span>
              <button
                onClick={handleChangeName}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-mono cursor-pointer"
                title="Change nickname / avatar"
              >
                edit
              </button>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                {questionsDone}/10 Done
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>Score: <strong className="text-cyan-300">{myParticipant?.score ?? 0}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{precision.toFixed(0)}% Acc</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Timer */}
          <div className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
            gameState.timerSeconds <= 15
              ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
              : 'bg-black/60 border-cyan-500/30 text-cyan-300'
          }`}>
            ⏱ {formatTime(gameState.timerSeconds)}
          </div>

          <button
            onClick={toggleAudio}
            className="p-1.5 rounded-lg bg-black/40 border border-cyan-500/30 text-slate-300 cursor-pointer"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Main Gameplay Column */}
      <main className="flex-1 flex flex-col justify-around py-1 gap-2">
        
        {/* Dedicated Question & Object Banner Card */}
        <div className="bg-[#0b1322] rounded-xl px-3 py-2 border border-cyan-500/30 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-300">
                  Question {activeStage.id} of 10
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                  activeStage.difficulty === 'Easy'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : activeStage.difficulty === 'Moderate'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    : 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                }`}>
                  {activeStage.difficulty}
                </span>
              </div>
              <h2 className="text-xs md:text-sm font-bold text-white truncate mt-0.5">
                {activeStage.mechanicalObject}
              </h2>
              <p className="text-[10px] font-mono text-slate-400 truncate">
                Mode: {activeStage.vibrationMode}
              </p>
            </div>
          </div>
        </div>

        {/* Structure Canvas Viewport */}
        <div className="w-full relative rounded-xl overflow-hidden shadow-lg border border-cyan-500/30 bg-black min-h-[185px] max-h-[250px]">
          <StructureCanvas
            stage={activeStage}
            structuralIntegrity={activeHealth}
            teamHarmonicCoherence={gameState.teamHarmonicCoherence}
            isBreakdownAchieved={activeHealth <= 0}
            peakAmplitude={gameState.peakAmplitude}
            recentPulseTrigger={isPulsing ? Date.now() : 0}
            userFrequency={frequency}
            compactMode={true}
          />
        </div>

        {/* Health & Strain Indicator */}
        <div className="bg-[#0b1322] rounded-xl p-3 border border-cyan-500/30">
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-slate-300">Stage Target Health:</span>
            <span className={`font-bold ${
              activeHealth < 30 ? 'text-red-400' : 'text-cyan-300'
            }`}>
              {activeHealth}%
            </span>
          </div>

          <div className="w-full h-2 bg-black/70 rounded-full overflow-hidden border border-cyan-500/20">
            <div
              className={`h-full transition-all duration-300 ${
                activeHealth < 30
                  ? 'bg-gradient-to-r from-red-600 to-amber-500'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-400'
              }`}
              style={{ width: `${activeHealth}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-400">
              Strain: {activeHealth < 100 ? `${Math.round(100 - activeHealth)}% Fatigue` : 'Undamaged'}
            </span>
            <span className="text-emerald-400 font-bold">
              Precision: {precision.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Frequency Controller */}
        <div className="bg-[#0b1322] rounded-2xl p-4 border border-cyan-500/40 text-center">
          
          {/* Status Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-2 border border-slate-700 bg-black/50 text-cyan-300">
            <span>ACOUSTIC GENERATOR ARMED</span>
          </div>

          {/* Big Frequency Display */}
          <div className="my-1">
            <div className="text-4xl font-mono font-extrabold text-white">
              {frequency.toFixed(activeStage.step < 0.1 ? 2 : 1)}
              <span className="text-xl text-cyan-400 ml-1.5 font-normal">
                {activeStage.unit}
              </span>
            </div>
          </div>

          {/* Direct Numerical Input */}
          <div className="flex items-center justify-center gap-2 my-2">
            <span className="text-xs font-mono text-slate-400">Direct Entry:</span>
            <input
              type="number"
              min={activeStage.minFrequency}
              max={activeStage.maxFrequency}
              step={activeStage.step}
              value={frequency}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleFreqChange(val);
              }}
              className="w-28 px-2 py-1 bg-black/80 border border-cyan-500/60 rounded-lg text-white font-mono text-center text-sm font-bold focus:outline-none focus:border-cyan-300"
            />
            <span className="text-xs font-mono text-cyan-400 font-bold">{activeStage.unit}</span>
          </div>

          {/* Frequency Slider */}
          <div className="my-2 px-1">
            <input
              type="range"
              min={activeStage.minFrequency}
              max={activeStage.maxFrequency}
              step={activeStage.step}
              value={frequency}
              onChange={(e) => handleFreqChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-black/60 rounded-lg border border-cyan-500/40 cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
              <span>{activeStage.minFrequency} {activeStage.unit}</span>
              <span>{activeStage.maxFrequency} {activeStage.unit}</span>
            </div>
          </div>

          {/* Fine Tuning Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            <button
              onClick={() => adjustFreq(- (activeStage.step >= 1 ? 5 : 1))}
              className="py-1.5 rounded-lg bg-black/50 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold cursor-pointer"
            >
              -{activeStage.step >= 1 ? '5' : '1.0'}
            </button>
            <button
              onClick={() => adjustFreq(-activeStage.step)}
              className="py-1.5 rounded-lg bg-black/50 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold cursor-pointer"
            >
              -{activeStage.step}
            </button>
            <button
              onClick={() => adjustFreq(activeStage.step)}
              className="py-1.5 rounded-lg bg-black/50 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold cursor-pointer"
            >
              +{activeStage.step}
            </button>
            <button
              onClick={() => adjustFreq(activeStage.step >= 1 ? 5 : 1)}
              className="py-1.5 rounded-lg bg-black/50 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold cursor-pointer"
            >
              +{activeStage.step >= 1 ? '5' : '1.0'}
            </button>
          </div>
        </div>

        {/* Big Pulse / Strike Button with Dynamic Floating Feedback */}
        <div className="flex flex-col items-center justify-center my-1 relative">
          
          {/* Floating Pulse Feedback Badges */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
            {floatingPulses.map((fp) => (
              <motion.div
                key={fp.id}
                initial={{ y: 0, opacity: 1, scale: 0.9 }}
                animate={{ y: -20, opacity: 0, scale: 1.1 }}
                transition={{ duration: 1.1 }}
                className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold shadow-lg whitespace-nowrap border ${
                  fp.perfect
                    ? 'bg-emerald-500 text-black border-white shadow-[0_0_20px_#10b981]'
                    : fp.damage && fp.damage > 0
                    ? 'bg-amber-400 text-black border-white shadow-[0_0_15px_#f59e0b]'
                    : 'bg-black/90 text-slate-300 border-slate-700'
                }`}
              >
                {fp.text}
              </motion.div>
            ))}
          </div>

          <button
            onClick={handlePulse}
            disabled={cooldownProgress < 100 || isStudentFinished}
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${
              isStudentFinished
                ? 'bg-emerald-950/80 border-2 border-emerald-500 cursor-not-allowed opacity-90'
                : cooldownProgress < 100
                ? 'bg-cyan-950/60 border-2 border-cyan-800 cursor-wait opacity-80'
                : 'bg-gradient-to-b from-cyan-400 to-blue-600 border-4 border-cyan-200 shadow-[0_0_25px_#00f0ff] active:scale-95'
            }`}
          >
            <Zap className={`w-9 h-9 mb-0.5 fill-current ${
              isStudentFinished ? 'text-emerald-400' : 'text-black'
            }`} />
            <span className="font-extrabold text-sm tracking-wider text-black uppercase">
              {isStudentFinished ? 'DONE' : 'PULSE'}
            </span>
            <span className="text-[10px] font-mono text-black/80 font-bold">
              {isStudentFinished ? '10/10' : cooldownProgress < 100 ? `${Math.round(cooldownProgress)}%` : 'TAP'}
            </span>
          </button>
        </div>

      </main>

      {/* Non-blocking Shatter Banner */}
      <AnimatePresence>
        {clearedBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 font-mono text-xs font-bold shadow-[0_0_25px_#10b981] flex items-center gap-2 pointer-events-none"
          >
            <span className="text-base">💥</span>
            <span>Q{clearedBanner.questionNumber} SHATTERED ({clearedBanner.objectName})! Advancing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md h-[85vh]">
            <LeaderboardPanel
              gameState={gameState}
              highlightCallsign={callsign}
              onClose={() => setIsLeaderboardOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Answer Key & Physics Review Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 p-3 flex items-center justify-center">
          <div className="w-full max-w-lg h-[92vh]">
            <QuestionAnswersReview
              stages={PHYSICS_STAGES}
              gameState={gameState}
              currentUserCallsign={callsign}
              mode="student"
              onClose={() => setIsReviewOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
