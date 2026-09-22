import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Users, Trophy, QrCode, Zap, 
  Volume2, VolumeX, CheckCircle2, Bot, Trash2, Copy, Check, ChevronRight, ExternalLink, BookOpen
} from 'lucide-react';
import { GameState, PhysicsStage } from '../types';
import { PHYSICS_STAGES } from '../stagesData';
import { StructureCanvas } from './StructureCanvas';
import { LeaderboardPanel } from './LeaderboardPanel';
import { QuestionAnswersReview } from './QuestionAnswersReview';
import { soundFx } from '../utils/audio';

interface HostDashboardViewProps {
  gameState: GameState;
  currentStage: PhysicsStage;
  onStartGame?: () => void;
  onReturnToLobby?: () => void;
  onNextStage?: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onSetTimer: (sec: number) => void;
  onChangeStage: (stageId: number) => void;
  onResetStage: () => void;
  onTriggerBreakdown: () => void;
  onAddBots: (count?: number) => void;
  onClearBots: () => void;
  onSwitchToStudent: () => void;
  onKickParticipant?: (participantId: string) => void;
  onClearParticipants?: () => void;
}

export const HostDashboardView: React.FC<HostDashboardViewProps> = ({
  gameState,
  currentStage,
  onStartGame,
  onReturnToLobby,
  onNextStage,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSetTimer,
  onChangeStage,
  onResetStage,
  onTriggerBreakdown,
  onAddBots,
  onClearBots,
  onSwitchToStudent,
  onKickParticipant,
  onClearParticipants
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Warning chime at low time
  useEffect(() => {
    if (gameState.isTimerRunning && gameState.timerSeconds <= 10 && gameState.timerSeconds > 0) {
      soundFx.playWarning();
    }
  }, [gameState.timerSeconds, gameState.isTimerRunning]);

  // Host dashboard does NOT play breakdown blast sound; blast sound and vibration are reserved for mobile view!

  const toggleAudio = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
    if (!next) soundFx.playBlip();
  };

  // Detect AI Studio dev environment to prevent 404 on external student devices
  const isAisDev = typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-');
  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicOrigin = isAisDev ? rawOrigin.replace('ais-dev-', 'ais-pre-') : rawOrigin;

  // Student Links ALWAYS have ?student=true to enforce participant name prompt and hide host controls.
  // &__storage_access_granted=1 is included to instruct Google proxy to set cookies server-side,
  // fixing the issue where Safari/iPhone blocks document.cookie and gets stuck in cookie-check loops.
  const studentPublicUrl = publicOrigin ? `${publicOrigin}/?student=true&__storage_access_granted=1` : '';
  const studentDirectUrl = rawOrigin ? `${rawOrigin}/?student=true&__storage_access_granted=1` : '';

  const [linkTab, setLinkTab] = useState<'public' | 'direct' | 'custom'>(isAisDev ? 'public' : 'direct');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [copiedHost, setCopiedHost] = useState<boolean>(false);

  const hostDirectUrl = rawOrigin ? `${rawOrigin}/?host=true&__storage_access_granted=1` : '';
  const hostPublicUrl = publicOrigin ? `${publicOrigin}/?host=true&__storage_access_granted=1` : '';
  const activeHostUrl = linkTab === 'public' ? hostPublicUrl : hostDirectUrl;

  const activeStudentUrl = linkTab === 'custom' && customInputUrl.trim()
    ? (customInputUrl.includes('?') 
        ? `${customInputUrl.trim()}&student=true&__storage_access_granted=1` 
        : `${customInputUrl.trim()}/?student=true&__storage_access_granted=1`)
    : linkTab === 'public'
    ? studentPublicUrl
    : studentDirectUrl;

  const handleCopyLink = (urlToCopy = activeStudentUrl) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(urlToCopy).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyHostLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeHostUrl).catch(() => {});
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    }
  };

  const handleOpenStudentTab = () => {
    if (typeof window !== 'undefined') {
      window.open(activeStudentUrl, '_blank');
    }
  };

  // Format MM:SS timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Check if game is over
  const isGameOver = gameState.gameStatus === 'GAME_OVER' || gameState.gameStatus === 'CHAMPIONSHIP_OVER';

  // Sorted participants for podium (Questions Done -> Speed -> Precision)
  const ranked = [...gameState.participants].sort((a, b) => {
    const qA = a.questionsCompleted ?? 0;
    const qB = b.questionsCompleted ?? 0;
    if (qB !== qA) return qB - qA;

    const tA = a.totalTimeSeconds && a.totalTimeSeconds > 0 ? a.totalTimeSeconds : 999;
    const tB = b.totalTimeSeconds && b.totalTimeSeconds > 0 ? b.totalTimeSeconds : 999;
    if (tA !== tB) return tA - tB;

    const pA = a.precisionPercent ?? 0;
    const pB = b.precisionPercent ?? 0;
    return pB - pA;
  });

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col p-3 md:p-5 relative overflow-x-hidden font-sans">
      
      {/* Dev Environment Projector Switch Alert */}
      {isAisDev && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/50 rounded-2xl p-3 mb-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📢</span>
            <div>
              <span className="font-bold text-amber-300">Classroom Host Recommendation:</span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                You are currently inside the private AI Studio editor. To let students on phones or other computers join without Google sign-in, open the public screen:
              </p>
            </div>
          </div>
          <a
            href={hostPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold font-mono text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
          >
            Open Public Host Screen (Projector) ↗
          </a>
        </div>
      )}

      {/* TOP HEADER: Host Controls, 2-Minute Match Timer, Sharing */}
      <header className="bg-[#0b1322] rounded-2xl p-4 mb-4 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20">
        
        {/* Left: Branding & Current Question Status */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-extrabold tracking-wide text-white">
                EIGENCRUSH
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                Harmonic ODE Arena
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                PROJECTOR HOST
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Question <strong className="text-cyan-400 font-mono">{currentStage.id} of 10</strong>: {currentStage.mechanicalObject}
            </p>
          </div>
        </div>

        {/* Center: 2-Minute Game Timer */}
        <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border border-cyan-500/30">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              2-MIN MATCH TIMER
            </span>
            <div className={`text-2xl md:text-3xl font-mono font-extrabold tracking-wider ${
              gameState.timerSeconds <= 15
                ? 'text-red-400 animate-pulse'
                : 'text-cyan-300'
            }`}>
              {formatTime(gameState.timerSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-2 border-l border-cyan-500/20 pl-3">
            {gameState.isTimerRunning ? (
              <button
                onClick={onPauseTimer}
                className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all"
                title="Pause Timer"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onStartTimer}
                className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all"
                title="Resume Timer"
              >
                <Play className="w-4 h-4 fill-emerald-300" />
              </button>
            )}

            <button
              onClick={onResetTimer}
              className="p-2 rounded-lg bg-black/40 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
              title="Reset Timer to 2:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Actions (Share, Answers Key, Start Game, Add Peers, Audio) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Share with Students Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-bold transition-all shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            Share Links & QR
          </button>

          {/* Review Answers & Solutions Key (Only outside of active match) */}
          {gameState.gameStatus !== 'IN_PROGRESS' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-xs font-mono font-bold transition-all shadow-sm"
              title="View 10-Question Answers Key, Formulas & Physics Details"
            >
              <BookOpen className="w-4 h-4" />
              Answers Key
            </button>
          )}

          {/* Add Demo Bots for immediate testing */}
          <button
            onClick={() => onAddBots(3)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition-all"
            title="Add 3 simulated student peers to test leaderboard"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            +3 Demo Students
          </button>

          {gameState.participants.some(p => p.isSimulated) && (
            <button
              onClick={onClearBots}
              className="p-2 rounded-xl bg-black/60 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-slate-700 text-xs"
              title="Clear simulated students"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            className="p-2 rounded-xl bg-black/60 hover:bg-slate-800 border border-slate-700 text-slate-300"
            title="Toggle Sound Effects"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Return to Lobby or Start Match */}
          {gameState.gameStatus === 'LOBBY' ? (
            <button
              onClick={onStartGame}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              <Play className="w-4 h-4 fill-black" />
              Start 2-Min Match
            </button>
          ) : (
            <button
              onClick={onReturnToLobby}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-mono transition-all"
              title="Reset match and return to lobby"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Lobby
            </button>
          )}

          {/* Mobile view toggle */}
          <button
            onClick={onSwitchToStudent}
            className="px-3 py-2 rounded-xl bg-black/60 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 transition-all"
          >
            Student View 📱
          </button>
        </div>
      </header>

      {/* LOBBY BANNER & PARTICIPANT ROSTER (When waiting for students to connect) */}
      {gameState.gameStatus === 'LOBBY' && (
        <div className="bg-[#0c182b] rounded-2xl p-4 md:p-5 mb-4 border border-cyan-500/50 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                    Classroom Lobby: Waiting for Students
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                  <span className="text-slate-300">
                    {gameState.participants.length} connected
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className={`font-bold ${
                    gameState.participants.filter(p => p.isReady).length === gameState.participants.length && gameState.participants.length > 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}>
                    {gameState.participants.filter(p => p.isReady).length}/{gameState.participants.length} Ready & Understood Rules
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {onClearParticipants && gameState.participants.length > 0 && (
                <button
                  onClick={onClearParticipants}
                  className="px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-1.5 transition-all"
                  title="Clear any test participant joins from the lobby before students join"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Test Players
                </button>
              )}

              <button
                onClick={handleOpenStudentTab}
                className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono flex items-center gap-1.5"
                title="Open a student player screen in a new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Student Tab ↗
              </button>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Preview Differential Equations & Physics Theory for all 10 stages"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                Diff Eq & Physics Theory
              </button>
              <button
                onClick={() => setShareModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                Show QR on Projector
              </button>
              <button
                onClick={onStartGame}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                Start 2-Minute Match
              </button>
            </div>
          </div>

          {/* Student Roster Grid */}
          <div className="bg-black/40 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="font-bold text-slate-300">
                Connected Students & Understanding Status ({gameState.participants.length}):
              </span>
              <span className="text-[11px] text-slate-500">
                Click ✕ to remove any test player
              </span>
            </div>

            {gameState.participants.length === 0 ? (
              <div className="py-4 text-center text-xs font-mono text-slate-500">
                No students connected yet. Share the student link or display the QR code on your projector!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {gameState.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0b1322] border border-cyan-500/30 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-lg">{p.avatar}</span>
                      <span className="font-bold text-white truncate">{p.callsign}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.isReady ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-0.5">
                          ✓ Ready
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px]">
                          Reading rules
                        </span>
                      )}

                      {onKickParticipant && (
                        <button
                          onClick={() => onKickParticipant(p.id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                          title={`Kick ${p.callsign}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE CLEARED BANNER */}
      {gameState.gameStatus === 'STAGE_CLEARED' && (
        <div className="bg-emerald-950/70 rounded-xl p-3.5 mb-4 border border-emerald-400 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-200 uppercase">
                Question {currentStage.id} Solved: Structural Breakdown!
              </h2>
              <p className="text-xs text-slate-300">
                Resonance achieved at {currentStage.targetFrequency} {currentStage.unit}. Advancing to next question in {gameState.autoAdvanceCountdown ?? 3}s...
              </p>
            </div>
          </div>

          {onNextStage && (
            <button
              onClick={onNextStage}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase transition-all"
            >
              Next Question Now ⏭️
            </button>
          )}
        </div>
      )}

      {/* GAME OVER SCREEN (Podium + Final Rankings) */}
      {isGameOver && (
        <div className="bg-[#0b1424] rounded-2xl p-6 mb-4 border-2 border-amber-400/80 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-300 mb-2">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            2-MINUTE MATCH FINISHED!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            10 questions completed. Final standings ranked by: <strong>Questions Done</strong>, <strong>Speed</strong>, and <strong>Precision</strong>.
          </p>

          {/* Top 3 Podium */}
          {ranked.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto my-5">
              {/* 2nd Place */}
              {ranked[1] && (
                <div className="bg-black/40 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center order-2 md:order-1">
                  <span className="text-2xl mb-1">🥈</span>
                  <span className="font-bold text-sm text-slate-200">{ranked[1].callsign}</span>
                  <span className="text-xs text-emerald-400 font-bold">{ranked[1].questionsCompleted ?? 0}/10 Done</span>
                  <span className="text-[11px] text-slate-400">Precision: {(ranked[1].precisionPercent ?? 100).toFixed(1)}%</span>
                </div>
              )}

              {/* 1st Place */}
              {ranked[0] && (
                <div className="bg-amber-950/40 border-2 border-amber-400 rounded-xl p-4 flex flex-col items-center justify-center order-1 md:order-2 shadow-lg scale-105">
                  <span className="text-3xl mb-1">🥇</span>
                  <span className="font-bold text-base text-amber-200">{ranked[0].callsign}</span>
                  <span className="text-sm text-emerald-400 font-bold">{ranked[0].questionsCompleted ?? 0}/10 Done</span>
                  <span className="text-xs text-amber-300">
                    Time: {Math.floor((ranked[0].totalTimeSeconds ?? 0) / 60)}:{(ranked[0].totalTimeSeconds ?? 0) % 60 < 10 ? '0' : ''}{(ranked[0].totalTimeSeconds ?? 0) % 60}
                  </span>
                  <span className="text-xs text-slate-300">Precision: {(ranked[0].precisionPercent ?? 100).toFixed(1)}%</span>
                </div>
              )}

              {/* 3rd Place */}
              {ranked[2] && (
                <div className="bg-black/40 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center order-3">
                  <span className="text-2xl mb-1">🥉</span>
                  <span className="font-bold text-sm text-slate-200">{ranked[2].callsign}</span>
                  <span className="text-xs text-emerald-400 font-bold">{ranked[2].questionsCompleted ?? 0}/10 Done</span>
                  <span className="text-[11px] text-slate-400">Precision: {(ranked[2].precisionPercent ?? 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border-2 border-amber-400/80 text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-lg hover:scale-105"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              Review All 10 Answers & Details
            </button>
            <button
              onClick={onStartGame}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-md"
            >
              Start New 2-Minute Game
            </button>
            <button
              onClick={onReturnToLobby}
              className="px-4 py-2.5 rounded-xl bg-black/60 text-slate-300 border border-slate-700 text-xs font-bold"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* 10-QUESTION PROGRESS BAR */}
      <div className="bg-[#0b1322] rounded-xl p-2.5 mb-4 border border-cyan-500/20 flex items-center justify-between gap-2 overflow-x-auto z-10">
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono text-slate-400 px-2">
          <span>Questions (1-10):</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 flex-1">
          {PHYSICS_STAGES.map((st) => {
            const isCurrent = st.id === currentStage.id;
            const isCleared = gameState.stageResults[st.id]?.cleared;
            return (
              <button
                key={st.id}
                onClick={() => {
                  onChangeStage(st.id);
                  soundFx.playBlip();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-cyan-500 text-black shadow-md scale-105'
                    : isCleared
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-black/40 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {isCleared ? '✓ ' : ''}Q{st.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN PROJECTOR SPLIT: Visualizer (Left) + Live Classroom Leaderboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 z-10">
        
        {/* LEFT COLUMN: Physical Vibration Simulation (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          {/* Simulation Stage Viewport */}
          <div className="relative flex-1 min-h-[360px] md:min-h-[440px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-xl bg-black">
            <StructureCanvas
              stage={currentStage}
              structuralIntegrity={gameState.structuralIntegrity}
              teamHarmonicCoherence={gameState.teamHarmonicCoherence}
              isBreakdownAchieved={gameState.isBreakdownAchieved}
              peakAmplitude={gameState.peakAmplitude}
              recentPulseTrigger={gameState.recentPulses[0]?.timestamp}
              userFrequency={
                gameState.participants.length > 0
                  ? Number((gameState.participants.reduce((sum, p) => sum + p.frequency, 0) / gameState.participants.length).toFixed(1))
                  : currentStage.targetFrequency
              }
            />

            {/* Target Resonant Frequency & Health Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
              <div className="bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/40 text-xs font-mono flex items-center gap-3">
                <span className="text-cyan-300 font-bold">
                  Resonant Frequency: {currentStage.targetFrequency} {currentStage.unit}
                </span>
                <span className="text-slate-400">
                  (±{currentStage.tolerance} {currentStage.unit})
                </span>
              </div>

              <div className="bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/40 text-xs font-mono flex items-center gap-2">
                <span className="text-slate-300">Structure Health:</span>
                <strong className={`font-bold ${
                  gameState.structuralIntegrity < 30 ? 'text-red-400' : 'text-cyan-300'
                }`}>
                  {gameState.structuralIntegrity}%
                </strong>
              </div>
            </div>
          </div>

          {/* Question Description Card */}
          <div className="bg-[#0b1322] rounded-xl p-3.5 border border-cyan-500/20 text-xs flex items-center justify-between">
            <div>
              <span className="text-cyan-400 font-bold">Question {currentStage.id}: </span>
              <span className="text-slate-200">{currentStage.description}</span>
            </div>
            {onNextStage && (
              <button
                onClick={onNextStage}
                className="ml-3 shrink-0 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs flex items-center gap-1"
              >
                Skip <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Classroom Leaderboard (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          {gameState.gameStatus === 'IN_PROGRESS' ? (
            <div className="bg-[#0b1322] rounded-2xl p-6 border border-cyan-500/30 flex-1 flex flex-col justify-between shadow-xl text-center font-mono">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Match In Progress</span>
                </div>

                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                  Harmonic Field Telemetry
                </h3>

                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Students are actively calculating natural eigenfrequencies. Leaderboard and final standings will be revealed at the end of the match.
                </p>
              </div>

              {/* Collective Resonance & Connected Solvers */}
              <div className="grid grid-cols-2 gap-3 my-6">
                <div className="bg-black/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] uppercase text-slate-400 block mb-1">Active Solvers</span>
                  <span className="text-2xl font-bold text-cyan-300">{gameState.participants.length}</span>
                </div>
                <div className="bg-black/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] uppercase text-slate-400 block mb-1">Harmonic Coherence</span>
                  <span className="text-2xl font-bold text-amber-300">{gameState.teamHarmonicCoherence}%</span>
                </div>
              </div>

              <div className="bg-cyan-950/20 p-4 rounded-xl border border-cyan-500/20 text-left">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Structural Energy Injected
                  </span>
                  <span className="text-cyan-300">{gameState.accumulatedEnergy.toLocaleString()} J</span>
                </div>
                <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (gameState.accumulatedEnergy / Math.max(1, gameState.targetEnergy)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-4">
                ⏱ {gameState.timerSeconds}s remaining in 2-minute arena
              </div>
            </div>
          ) : (
            <LeaderboardPanel
              gameState={gameState}
              isGameOver={isGameOver}
              onKickParticipant={onKickParticipant}
            />
          )}
        </div>

      </div>

      {/* SHARE MODAL: Direct Link, 1-Click Copy, QR Code, and Projector Guide */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#0b1322] border-2 border-cyan-500/60 p-5 md:p-6 rounded-2xl shadow-2xl text-center my-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-left">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  Connect Students to Match
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Real-time multiplayer synchronization for phones, tablets & laptops
                </p>
              </div>
              <button
                onClick={handleOpenStudentTab}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold"
                title="Open a student player screen in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Student Tab ↗
              </button>
            </div>

            {/* Link Mode Selector Tabs */}
            <div className="flex rounded-xl bg-black/60 p-1 border border-cyan-500/30 mb-3 text-xs">
              <button
                onClick={() => setLinkTab('public')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  linkTab === 'public'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📱 Student Phones (Public)
              </button>
              <button
                onClick={() => setLinkTab('direct')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  linkTab === 'direct'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                💻 Classroom / Same Device
              </button>
              <button
                onClick={() => setLinkTab('custom')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  linkTab === 'custom'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ⚙️ Custom URL
              </button>
            </div>

            {/* 404 Explanation Notice for AI Studio Links */}
            {isAisDev && linkTab === 'public' && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left text-xs text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-0.5">
                  <span>💡</span> Why mobile students might get a 404:
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Google AI Studio's dev preview (<code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">ais-dev-</code>) requires Google login. 
                  To give students 100% public access without 404, click the <strong>"Share"</strong> button in the top-right header of Google AI Studio to enable the public link!
                </p>
              </div>
            )}

            {/* Custom URL Input (When custom tab selected) */}
            {linkTab === 'custom' && (
              <div className="mb-3 text-left">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Enter your deployed / local network URL:
                </label>
                <input
                  type="text"
                  placeholder="https://your-custom-domain.com or http://192.168.1.50:3000"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/40 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Active Student Mobile Link + Copy Button */}
            <div className="text-left mb-1.5 flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                <span>📱</span> Student Mobile Join Link:
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🍏</span> Safari & iPhone Ready
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  ✓ Asks for Name
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/80 p-2.5 rounded-xl border-2 border-cyan-400 font-mono text-xs text-cyan-200 mb-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="truncate flex-1 text-left select-all font-bold text-white">
                {activeStudentUrl}
              </span>
              <button
                onClick={() => handleCopyLink(activeStudentUrl)}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1 shrink-0 transition-all shadow cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Student Link'}
              </button>
            </div>
            <p className="text-[11px] text-slate-300 text-left mb-3 leading-relaxed">
              Share this exact link with students. When opened, it <strong>always asks for their name/nickname</strong> and displays only their mobile controller. They will <strong>never</strong> see host controls.
            </p>

            {/* iPhone / Safari Tip Callout */}
            <div className="mb-4 p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-left text-xs text-slate-300">
              <div className="font-bold flex items-center gap-1.5 text-cyan-300 mb-1">
                <span>🍏</span> iPhone & Safari Tips:
              </div>
              <ul className="text-[11px] leading-relaxed text-slate-300/90 space-y-1 list-disc list-inside">
                <li>This link includes Safari storage authorization to bypass cookie check screens automatically.</li>
                <li><strong>Scanning QR on iPhone:</strong> Open the built-in Camera app, point at the QR code, and tap the yellow link banner.</li>
                <li>If prompted by Safari, tap <em>Open in Safari</em> or ensure <em>Settings → Safari → Block All Cookies</em> is turned OFF.</li>
              </ul>
            </div>

            {/* QR Code */}
            <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl border-4 border-cyan-400 flex flex-col items-center justify-center shadow-lg mb-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeStudentUrl)}`}
                alt="Student Join QR Code"
                className="w-40 h-40 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[11px] text-cyan-300 font-mono mb-4">
              Students scan with camera to enter participant name & join
            </p>

            {/* Host Projector Link (Clearly Separated & Warning) */}
            <div className="text-left mb-1 pt-3 border-t border-slate-800 flex items-center justify-between">
              <label className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
                <span>🔒</span> Host (Projector) Screen Link:
              </label>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
                ⚠️ Teacher Only • Keep Private
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-amber-500/30 font-mono text-xs text-amber-200/90 mb-1">
              <span className="truncate flex-1 text-left select-all text-[11px]">
                {activeHostUrl}
              </span>
              <button
                onClick={handleCopyHostLink}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all"
              >
                {copiedHost ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedHost ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-amber-400/80 text-left mb-4">
              Do not share this with students. This is your teacher screen with timer controls and game management.
            </p>

            {/* Mobile / Classroom Quick Opener */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleOpenStudentTab}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Student Screen in New Tab
              </button>
            </div>

            {/* 3-Step Teacher Guide */}
            <div className="bg-black/40 rounded-xl p-3 text-left text-xs text-slate-300 space-y-1.5 border border-slate-800 mb-4 font-mono">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <span><strong>Display on Projector:</strong> Show this screen to the room. Students scan with phone camera.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <span><strong>Connect:</strong> Students choose callsign & avatar. They appear in the live lobby.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <span><strong>Start Match:</strong> Click "Start Match" — 2:00 timer begins for all students at once! When someone hits the resonant frequency, the object blasts and auto-advances.</span>
              </div>
            </div>

            <button
              onClick={() => setShareModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all"
            >
              Done / Return to Projector
            </button>
          </motion.div>
        </div>
      )}

      {/* QUESTION ANSWERS REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-5 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl h-[92vh] my-auto">
            <QuestionAnswersReview
              stages={PHYSICS_STAGES}
              gameState={gameState}
              mode="host"
              onClose={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
