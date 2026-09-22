import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Play, BookOpen, ShieldCheck, Flame, Cpu, ArrowRight } from 'lucide-react';

interface GraphicIntroHeroProps {
  onContinue: () => void;
}

export const GraphicIntroHero: React.FC<GraphicIntroHeroProps> = ({ onContinue }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [driveFrequency, setDriveFrequency] = useState<number>(3.0);
  const [activeHarmonicMode, setActiveHarmonicMode] = useState<number>(2);

  // Animated Harmonic Standing Wave Simulation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      const w = canvas.width;
      const h = canvas.height;

      // Dark cyber canvas background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      const step = 25;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center baseline
      const centerY = h / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Resonant resonance factor
      const resonancePeak = Math.exp(-Math.pow((driveFrequency - 3.0) / 0.8, 2));
      const amp = (20 + resonancePeak * 48);

      // Draw Standing Wave Modes: y = A * sin(n * pi * x / L) * cos(omega * t)
      const n = activeHarmonicMode;
      const omega = driveFrequency * 2.5;

      // Multi-layer wave glow
      const layers = [
        { color: 'rgba(0, 240, 255, 0.2)', width: 8 },
        { color: 'rgba(0, 240, 255, 0.5)', width: 4 },
        { color: resonancePeak > 0.8 ? '#ff3366' : '#38bdf8', width: 2 }
      ];

      layers.forEach(({ color, width }) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        for (let x = 0; x < w; x += 3) {
          const normX = x / w;
          const standingWave = amp * Math.sin(n * Math.PI * normX) * Math.cos(omega * t);
          // Small travel ripple
          const ripple = Math.sin(normX * 8 - omega * t * 0.5) * 4;
          const y = centerY + standingWave + ripple;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Nodes & Antinodes markers
      for (let i = 0; i <= n; i++) {
        const nodeX = (i / n) * w;
        // Node marker
        ctx.beginPath();
        ctx.arc(nodeX, centerY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();

        if (i < n) {
          // Antinode marker
          const antinodeX = ((i + 0.5) / n) * w;
          const antinodeY = centerY + amp * Math.sin(n * Math.PI * (antinodeX / w)) * Math.cos(omega * t);
          ctx.beginPath();
          ctx.arc(antinodeX, antinodeY, 4, 0, Math.PI * 2);
          ctx.fillStyle = resonancePeak > 0.8 ? '#ff0055' : '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Dynamic Resonance Overlay Text inside canvas
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`MODE n = ${n} (EIGENMODE)`, 12, 20);
      ctx.fillText(`ω_drive = ${(driveFrequency * 2 * Math.PI).toFixed(1)} rad/s`, 12, 34);

      if (resonancePeak > 0.8) {
        ctx.fillStyle = '#ff3366';
        ctx.fillText(`⚡ CATASTROPHIC RESONANT AMPLIFICATION!`, w - 240, 20);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`HARMONIC RESPONSE: ${(resonancePeak * 100).toFixed(0)}%`, w - 160, 20);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [driveFrequency, activeHarmonicMode]);

  return (
    <div className="min-h-screen min-h-[100dvh] max-w-xl mx-auto flex flex-col justify-between px-3 py-4 font-sans text-slate-100 ios-safe-bottom">
      
      {/* Top Banner Branding + Quick Skip */}
      <div className="text-center space-y-1.5 relative">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-[10px] font-mono text-cyan-300">
            <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>MULTIPLAYER SHOWDOWN</span>
          </div>
          <button
            onClick={onContinue}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Skip to Join</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold tracking-wider text-white uppercase mt-1">
          EIGEN<span className="text-cyan-400">CRUSH</span>
        </h1>
        <p className="text-xs md:text-sm font-mono text-cyan-200">
          The Harmonic ODE Structural Arena
        </p>
      </div>

      {/* Interactive Standing Wave Graphic Simulation */}
      <div className="my-3 rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/80 shadow-2xl relative">
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          className="w-full h-[160px] md:h-[180px] object-cover"
        />

        {/* Interactive Mode Switches */}
        <div className="p-2.5 bg-[#09101d] border-t border-cyan-500/20 flex items-center justify-between gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Test Standing Wave:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveHarmonicMode(mode)}
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${
                  activeHarmonicMode === mode
                    ? 'bg-cyan-500 text-black border-cyan-400'
                    : 'bg-black/40 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                Mode {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mechanics & Differential Equation Briefing */}
      <div className="bg-[#0b1322] border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Differential Equation Card */}
        <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-center font-mono">
          <span className="text-[10px] text-cyan-400 block uppercase tracking-wider mb-1">
            2nd-Order Mechanical Resonance ODE
          </span>
          <div className="text-xs md:text-sm text-amber-300 font-bold tracking-wide">
            m · (d²x/dt²) + c · (dx/dt) + k · x = F₀ · cos(ω t)
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Resonant Eigenfrequency: f_n = (1 / 2π) · √(k / m)
          </span>
        </div>

        {/* 3 Core Rules / Strategies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          
          <div className="bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
              <span>1. Calculate or Probe</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Analyze the object's mass, stiffness, and clues. Estimate the harmonic frequency rather than guessing blindly!
            </p>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
              <span>2. Multi-Pulse Lock</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              One pulse isn't enough! Real structures have damping: deliver 2 to 4 consecutive coherent pulses to crack and shatter.
            </p>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
              <span>3. 10 Scaled Stages</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Progress from 4 Easy → 3 Moderate → 3 Difficult engineering structures in a 120-second showdown.
            </p>
          </div>

        </div>

      </div>

      {/* Enter Arena Button */}
      <div className="mt-4 pt-1 text-center">
        <button
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 hover:from-cyan-300 hover:to-teal-300 text-black font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>ENTER ARENA & JOIN MATCH</span>
          <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
        </button>
        <p className="text-[10px] font-mono text-slate-400 mt-2">
          Pick your callsign and avatar to compete on speed and accuracy
        </p>
      </div>

    </div>
  );
};
