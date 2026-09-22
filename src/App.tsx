import React, { useState, useEffect } from 'react';
import { useResonanceSocket } from './hooks/useResonanceSocket';
import { StudentMobileView } from './components/StudentMobileView';
import { HostDashboardView } from './components/HostDashboardView';
import { HostAuthModal } from './components/HostAuthModal';
import { Monitor, Smartphone, Columns, Lock } from 'lucide-react';
import { safeSessionStorage } from './utils/storage';

export default function App() {
  // Determine view mode based on URL query parameter ?host=true, ?student=true, or ?split=true
  const [viewMode, setViewMode] = useState<'student' | 'host' | 'split'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      if (params.get('split') === 'true' || params.get('split') === '1' || path.includes('/split')) return 'split';
      if (params.get('student') === 'true' || path.includes('/student') || path.includes('/join') || path.includes('/play')) return 'student';
      if (params.get('host') === 'true' || params.get('host') === '1' || path.includes('/host')) return 'host';

      // Mobile / iPhone auto-detection: Default mobile phone users directly to Student Join view
      const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
      if (isMobile) {
        return 'student';
      }
    }
    // Default to 'host' so teachers/evaluators on desktop immediately see the Projector and control room
    return 'host';
  });

  const [isHostAuthOpen, setIsHostAuthOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'host' | 'split' | null>(null);

  // Listen to popstate (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      if (params.get('split') === 'true' || params.get('split') === '1' || path.includes('/split')) {
        setViewMode('split');
      } else if (params.get('host') === 'true' || params.get('host') === '1' || path.includes('/host')) {
        setViewMode('host');
      } else {
        setViewMode('student');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleApplyMode = (mode: 'student' | 'host' | 'split') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (mode === 'host') {
        url.searchParams.set('host', 'true');
        url.searchParams.delete('split');
        url.searchParams.delete('student');
      } else if (mode === 'split') {
        url.searchParams.set('split', 'true');
        url.searchParams.delete('host');
        url.searchParams.delete('student');
      } else {
        url.searchParams.set('student', 'true');
        url.searchParams.delete('host');
        url.searchParams.delete('split');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleSetMode = (mode: 'student' | 'host' | 'split') => {
    if (mode === 'student') {
      handleApplyMode('student');
      return;
    }

    // Require password authentication to access host or split screen
    const isAuthed = safeSessionStorage.getItem('eigencrush_host_auth') === 'true';
    if (isAuthed) {
      handleApplyMode(mode);
    } else {
      setPendingMode(mode);
      setIsHostAuthOpen(true);
    }
  };

  // Real-time socket hook
  const {
    gameState,
    currentStage,
    isConnected,
    joinGame,
    setFrequency,
    triggerPulse,
    setReady,
    hostStartGame,
    hostReturnToLobby,
    hostNextStage,
    hostStartTimer,
    hostPauseTimer,
    hostResetTimer,
    hostSetTimer,
    hostChangeStage,
    hostResetStage,
    hostTriggerBreakdown,
    hostAddBots,
    hostClearBots,
    hostKickParticipant,
    hostClearParticipants
  } = useResonanceSocket();

  return (
    <div className="min-h-screen bg-[#06090e] text-[#e0f7fc] font-sans antialiased relative">
      {/* Top indicator for connection status - only visible when disconnected */}
      <div 
        className={`fixed top-0 left-0 right-0 bg-red-600/95 text-white text-[11px] font-mono-tech py-1 px-2 text-center z-50 transition-all duration-300 pointer-events-none shadow-md ${
          isConnected ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
        }`}
      >
        Reconnecting to Harmonic Field...
      </div>

      {/* Floating In-App View Switcher Bar (Only visible in Host or Split mode so students cannot tamper with host controls) */}
      {viewMode !== 'student' && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-cyan-500/50 shadow-[0_0_25px_rgba(0,240,255,0.35)]">
          <button
            onClick={() => handleSetMode('host')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'host'
                ? 'bg-cyan-400 text-black shadow-md'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Host (Projector)</span>
          </button>

          <button
            onClick={() => handleSetMode('student')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-cyan-300 hover:bg-white/5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Student (Mobile)</span>
          </button>

          <button
            onClick={() => handleSetMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
            }`}
            title="See both Student controller and Projector view side-by-side"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split View (Both)</span>
          </button>
        </div>
      )}

      {/* Host Password Authentication Modal */}
      <HostAuthModal
        isOpen={isHostAuthOpen}
        onSuccess={() => {
          setIsHostAuthOpen(false);
          safeSessionStorage.setItem('eigencrush_host_auth', 'true');
          if (pendingMode) {
            handleApplyMode(pendingMode);
            setPendingMode(null);
          }
        }}
        onCancel={() => {
          setIsHostAuthOpen(false);
          setPendingMode(null);
        }}
      />

      {/* RENDER ACTIVE VIEW */}
      {viewMode === 'split' ? (
        <div className="flex flex-col lg:flex-row min-h-screen pb-14">
          {/* Left / Top: Student Mobile Controller */}
          <div className="w-full lg:w-[420px] lg:border-r border-cyan-500/30 bg-[#05080d] overflow-y-auto max-h-screen">
            <div className="bg-cyan-950/40 p-2 text-center text-xs text-cyan-300 border-b border-cyan-500/20 font-bold">
              📱 Student Controller View
            </div>
            <StudentMobileView
              gameState={gameState}
              currentStage={currentStage}
              onJoin={joinGame}
              onSetFrequency={setFrequency}
              onPulse={triggerPulse}
              onSetReady={setReady}
              onSwitchToHost={() => handleSetMode('host')}
            />
          </div>

          {/* Right: Host Projector View */}
          <div className="flex-1 bg-[#06090e] overflow-y-auto max-h-screen">
            <div className="bg-amber-950/40 p-2 text-center text-xs text-amber-300 border-b border-amber-500/20 font-bold">
              🖥️ Host Projector Screen
            </div>
            <HostDashboardView
              gameState={gameState}
              currentStage={currentStage}
              onStartGame={hostStartGame}
              onReturnToLobby={hostReturnToLobby}
              onNextStage={hostNextStage}
              onStartTimer={hostStartTimer}
              onPauseTimer={hostPauseTimer}
              onResetTimer={hostResetTimer}
              onSetTimer={hostSetTimer}
              onChangeStage={hostChangeStage}
              onResetStage={hostResetStage}
              onTriggerBreakdown={hostTriggerBreakdown}
              onAddBots={hostAddBots}
              onClearBots={hostClearBots}
              onSwitchToStudent={() => handleSetMode('student')}
              onKickParticipant={hostKickParticipant}
              onClearParticipants={hostClearParticipants}
            />
          </div>
        </div>
      ) : viewMode === 'host' ? (
        <div className="pb-14">
          {/* Student Redirect Safety Banner if participant opens host link */}
          <div className="bg-amber-950/90 border-b border-amber-500/50 py-1.5 px-3 flex items-center justify-between text-xs text-amber-200 z-40 relative">
            <div className="flex items-center gap-2">
              <span className="text-sm">🖥️</span>
              <span className="font-bold">Host / Projector Control Screen</span>
              <span className="hidden sm:inline text-amber-300/80">• Teacher controls active</span>
            </div>
            <button
              onClick={() => handleSetMode('student')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-[11px] flex items-center gap-1 transition-all shadow"
            >
              Are you a student? Join with your name →
            </button>
          </div>

          <HostDashboardView
            gameState={gameState}
            currentStage={currentStage}
            onStartGame={hostStartGame}
            onReturnToLobby={hostReturnToLobby}
            onNextStage={hostNextStage}
            onStartTimer={hostStartTimer}
            onPauseTimer={hostPauseTimer}
            onResetTimer={hostResetTimer}
            onSetTimer={hostSetTimer}
            onChangeStage={hostChangeStage}
            onResetStage={hostResetStage}
            onTriggerBreakdown={hostTriggerBreakdown}
            onAddBots={hostAddBots}
            onClearBots={hostClearBots}
            onSwitchToStudent={() => handleSetMode('student')}
            onKickParticipant={hostKickParticipant}
            onClearParticipants={hostClearParticipants}
          />
        </div>
      ) : (
        <div className="pb-16">
          <StudentMobileView
            gameState={gameState}
            currentStage={currentStage}
            onJoin={joinGame}
            onSetFrequency={setFrequency}
            onPulse={triggerPulse}
            onSetReady={setReady}
            onSwitchToHost={() => handleSetMode('host')}
          />
        </div>
      )}
    </div>
  );
}

