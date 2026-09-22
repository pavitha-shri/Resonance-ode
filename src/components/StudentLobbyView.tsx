import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Volume2, VolumeX, Trophy, CheckCircle2, Circle, HelpCircle, Zap, Sparkles, Timer } from 'lucide-react';
import { GameState, PhysicsStage } from '../types';
import { soundFx } from '../utils/audio';

interface StudentLobbyViewProps {
  gameState: GameState;
  currentStage: PhysicsStage;
  callsign: string;
  selectedAvatar: string;
  onSetReady?: (isReady: boolean) => void;
  onChangeName?: () => void;
  onOpenLeaderboard?: () => void;
}

export const StudentLobbyView: React.FC<StudentLobbyViewProps> = ({
  gameState,
  currentStage,
  callsign,
  selectedAvatar,
  onSetReady,
  onChangeName,
  onOpenLeaderboard
}) => {
  const [testFreq, setTestFreq] = useState<number>(() => {
    return Number(((currentStage.minFrequency + currentStage.maxFrequency) / 2).toFixed(1));
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'practice'>('rules');

  const myParticipant = gameState.participants.find(
    p => p.callsign.toLowerCase() === callsign.toLowerCase()
  );
  const isAgreed = myParticipant?.isReady ?? false;

  const toggleAudio = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
    if (!next) soundFx.playBlip();
  };

  const handleTestSlider = (val: number) => {
    setTestFreq(val);
    soundFx.playFrequencyTone(val, currentStage.targetFrequency, currentStage.tolerance);
  };

  const handleToggleReady = () => {
    const next = !isAgreed;
    onSetReady?.(next);
    soundFx.playBlip();
  };

  const readyCount = gameState.participants.filter(p => p.isReady).length;
  const totalStudents = gameState.participants.length;

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-lg mx-auto flex flex-col justify-between px-3.5 py-3 relative select-none font-sans space-y-3 ios-safe-bottom">
      
      {/* Top Header */}
      <header className="bg-[#0b1322] rounded-2xl p-3 border border-cyan-500/30 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{selectedAvatar}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white font-mono">
                {callsign}
              </span>
              {onChangeName && (
                <button
                  onClick={onChangeName}
                  className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-mono cursor-pointer"
                  title="Change Nickname"
                >
                  edit
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isAgreed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={`text-[11px] font-mono font-bold ${isAgreed ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isAgreed ? '✓ Rules Understood' : 'Waiting for agreement'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="p-1.5 px-2 rounded-xl bg-black/40 border border-cyan-500/30 text-amber-300 hover:text-amber-200 text-xs font-mono flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5" /> Leaderboard
            </button>
          )}

          <button
            onClick={toggleAudio}
            className="p-1.5 rounded-xl bg-black/40 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Waiting Status Card */}
      <div className="bg-[#0c182b] rounded-2xl p-4 border-2 border-cyan-400/50 text-center shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-[11px] font-mono font-bold uppercase mb-1.5">
          <Timer className="w-3.5 h-3.5" /> Classroom Waiting Lobby
        </div>
        <h1 className="text-lg md:text-xl font-extrabold text-white tracking-wide">
          WAITING FOR HOST TO START MATCH
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          When the teacher starts, all students will begin simultaneously with a <strong>2:00 timer</strong> and <strong>10 questions</strong>.
        </p>
      </div>

      {/* Tab Switcher: How to Play vs Physics of Resonance vs Practice */}
      <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-1 rounded-xl border border-cyan-500/30">
        <button
          onClick={() => setActiveTab('rules')}
          className={`py-2 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'rules'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <HelpCircle className="w-3 h-3" />
          Rules
        </button>
        <button
          onClick={() => setActiveTab('physics' as any)}
          className={`py-2 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            (activeTab as string) === 'physics'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-amber-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Physics & Diff Eq
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`py-2 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'practice'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3" />
          Practice Q1
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'rules' ? (
        /* HOW TO PLAY SCREEN */
        <div className="bg-[#0b1322] rounded-2xl p-4 border border-cyan-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Game Rules & How to Play
            </h2>
            <span className="text-[11px] font-mono text-cyan-300">
              Read & Confirm below
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-200 font-sans">
            {/* Step 1 */}
            <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h3 className="font-bold text-white text-xs">Tune the Resonant Frequency</h3>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Each of the 10 mechanical objects has a natural frequency. Slide the frequency bar and use fine-tuning buttons (-5, -1, +1, +5) to reach resonance.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h3 className="font-bold text-white text-xs">Tap "PULSE" When Locked In</h3>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Watch for the <span className="text-emerald-300 font-bold">RESONANT LOCK!</span> badge. Tap the big round <strong>PULSE</strong> button to strike the structure with harmonic energy.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h3 className="font-bold text-emerald-300 text-xs">💥 Object Shatters & Auto-Advances!</h3>
                <p className="text-emerald-200/90 text-[11px] mt-0.5 leading-relaxed">
                  Hitting the correct frequency completely shatters the structure and <strong>instantly advances you to the next question</strong>!
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h3 className="font-bold text-amber-300 text-xs">Beat the 2-Minute Clock & Win</h3>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Leaderboard ranks students first by <strong>Questions Completed (out of 10)</strong>, then by speed and frequency precision.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (activeTab as string) === 'physics' ? (
        /* INTRO: WHAT RESONANCE IS DOING & DIFFERENTIAL EQUATION */
        <div className="bg-[#0b1322] rounded-2xl p-4 border border-cyan-500/40 space-y-3.5 shadow-xl text-left max-h-[360px] overflow-y-auto pr-1">
          <div className="border-b border-cyan-500/20 pb-2 flex items-center justify-between">
            <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-1.5 uppercase font-mono">
              <span className="text-amber-300">⚡</span> What Resonance Is Doing to Objects
            </h2>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
              VIBRATION THEORY
            </span>
          </div>

          {/* Core Concept explanation */}
          <div className="bg-black/50 p-3 rounded-xl border border-cyan-500/25 text-xs text-slate-200 leading-relaxed">
            <strong className="text-cyan-300">Resonant Destruction:</strong> Every physical system has innate mass (<span className="text-amber-300 font-mono">m</span>), elastic stiffness (<span className="text-emerald-300 font-mono">k</span>), and internal damping (<span className="text-sky-300 font-mono">c</span>). When your frequency tuning matches the object's eigenmode (<span className="text-amber-300 font-mono">ω ≈ ω₀</span>), external kinetic pulses inject energy precisely in-phase with the oscillation. Instead of dissipating, energy compounds exponentially until internal shear/tensile stress exceeds the material's failure limit, causing catastrophic breakdown!
          </div>

          {/* Differential Equation Card */}
          <div className="bg-[#050912] p-3.5 rounded-xl border-2 border-amber-500/50 shadow-inner">
            <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Fundamental Mech Vibration Equation</span>
              <span className="text-slate-400">2nd-Order Non-Homogeneous ODE</span>
            </div>

            {/* The Equation */}
            <div className="bg-black/80 p-3 rounded-lg border border-amber-400/30 text-center font-mono text-xs md:text-sm text-white tracking-widest shadow-md">
              <span className="text-amber-300 font-bold">m·(d²x/dt²)</span> + <span className="text-sky-300 font-bold">c·(dx/dt)</span> + <span className="text-emerald-300 font-bold">k·x</span> = <span className="text-red-300 font-bold">F₀·cos(ω·t)</span>
            </div>

            {/* Parameter Breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] font-mono">
              <div className="bg-black/40 p-2 rounded border border-slate-800">
                <span className="text-amber-300 font-bold">m·ẍ (Inertia):</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Mass resisting acceleration of bridge, skyscraper, or glass.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-slate-800">
                <span className="text-sky-300 font-bold">c·ẋ (Damping):</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Viscous friction converting motion to heat (Q = 1/(2ζ)).</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-slate-800">
                <span className="text-emerald-300 font-bold">k·x (Stiffness):</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Elastic spring restoring force; determines natural freq ω₀=√(k/m).</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-slate-800">
                <span className="text-red-300 font-bold">F₀ cos(ωt) (Drive):</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Your acoustic or mechanical pulse tuned to frequency ω = 2πf.</p>
              </div>
            </div>
          </div>

          {/* Real-World Stage Examples */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              Equations in Today's 10 Stages:
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="bg-black/40 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-200">Tacoma Narrows (0.2 Hz)</span>
                <span className="text-cyan-300 text-[10px]">I_θ·θ'' + c_θ·θ' + k_θ·θ = M_aero</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-200">Wine Glass (556 Hz)</span>
                <span className="text-cyan-300 text-[10px]">D·∇⁴w + ρ·h·(∂²w/∂t²) = P_acoustic</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-200">Helicopter Rotor (3.8 Hz)</span>
                <span className="text-cyan-300 text-[10px]">M_pylon·ẍ + K_strut·x = F_leadlag</span>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-200">Skyscraper (0.15 Hz)</span>
                <span className="text-cyan-300 text-[10px]">{"[M]·{x''} + [C]·{x'} + [K]·{x} = -[M]·{1}·x_g''"}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PRACTICE SLIDER & PREVIEW */
        <div className="bg-[#0b1322] rounded-2xl p-4 border border-cyan-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <h2 className="text-sm font-bold text-white uppercase font-mono">
              Question 1 Preview & Practice
            </h2>
            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]">
              Target: ~{currentStage.targetFrequency} {currentStage.unit}
            </span>
          </div>

          <div className="bg-black/50 p-3 rounded-xl border border-cyan-500/20">
            <h3 className="text-sm font-bold text-white">
              {currentStage.mechanicalObject}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {currentStage.description}
            </p>
          </div>

          {/* Test Frequency Slider */}
          <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-center">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-slate-300">Practice Frequency Slider:</span>
              <span className="text-cyan-300 font-bold font-mono text-sm">
                {testFreq.toFixed(1)} {currentStage.unit}
              </span>
            </div>

            <input
              type="range"
              min={currentStage.minFrequency}
              max={currentStage.maxFrequency}
              step={currentStage.step}
              value={testFreq}
              onChange={(e) => handleTestSlider(parseFloat(e.target.value))}
              className="w-full h-3 bg-black/60 rounded-lg border border-cyan-500/40 cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Drag to listen to the pitch change before the match starts
            </p>
          </div>
        </div>
      )}

      {/* AGREEMENT & UNDERSTANDING CONFIRMATION BUTTON */}
      <div className="pt-1">
        <button
          onClick={handleToggleReady}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold font-mono text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
            isAgreed
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)]'
              : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse'
          }`}
        >
          {isAgreed ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
              <span>✓ I Understand the Rules & I'm Ready! (Click to change)</span>
            </>
          ) : (
            <>
              <Circle className="w-5 h-5 text-black shrink-0" />
              <span>Tap Here to Agree: I Understand the Rules & I'm Ready!</span>
            </>
          )}
        </button>
      </div>

      {/* Connected Classmates Readiness List */}
      <div className="bg-[#0b1322] rounded-2xl p-3 border border-cyan-500/30 flex flex-col min-h-[110px]">
        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <span className="text-slate-300 flex items-center gap-1.5 font-bold">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Classmates in Lobby ({totalStudents})
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            readyCount === totalStudents && totalStudents > 0
              ? 'bg-emerald-950 text-emerald-300 border-emerald-400'
              : 'bg-amber-950 text-amber-300 border-amber-400'
          }`}>
            {readyCount}/{totalStudents} Ready & Agreed
          </span>
        </div>

        <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[110px]">
          {gameState.participants.map((p) => {
            const isMe = p.callsign.toLowerCase() === callsign.toLowerCase();
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-mono ${
                  isMe ? 'bg-cyan-950/40 border-cyan-500/40' : 'bg-black/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{p.avatar}</span>
                  <span className={`font-bold ${isMe ? 'text-cyan-200' : 'text-slate-200'}`}>
                    {p.callsign}
                  </span>
                  {isMe && <span className="text-[10px] text-cyan-400 font-normal">(You)</span>}
                </div>
                <div className="flex items-center gap-1">
                  {p.isReady ? (
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-amber-400/90 text-[11px] font-normal">
                      Reading rules...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {gameState.participants.length === 0 && (
            <div className="text-center text-xs text-slate-500 py-3 font-mono">
              Waiting for classmates to enter callsigns...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
