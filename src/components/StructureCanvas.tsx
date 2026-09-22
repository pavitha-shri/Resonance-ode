import React, { useEffect, useRef, useState } from 'react';
import { PhysicsStage } from '../types';
import { RotateCcw, AlertTriangle, Radio } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface StructureCanvasProps {
  stage: PhysicsStage;
  structuralIntegrity: number; // 100 to 0
  teamHarmonicCoherence: number; // 0 to 100
  isBreakdownAchieved: boolean;
  peakAmplitude: number;
  recentPulseTrigger?: number; // timestamp of pulse
  userFrequency?: number; // active student frequency input (if provided)
  compactMode?: boolean; // optimized for mobile screen
  onReplayBreakdown?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface DebrisChunk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  w: number;
  h: number;
  type: 'glass' | 'steel' | 'concrete' | 'plasma' | 'rock' | 'carbon';
  color: string;
  points?: Array<{ x: number; y: number }>;
}

// Universal rounded rect fallback for iOS Safari < 16.4 and older WebViews
function safeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }
}

export const StructureCanvas: React.FC<StructureCanvasProps> = ({
  stage,
  structuralIntegrity,
  teamHarmonicCoherence,
  isBreakdownAchieved,
  peakAmplitude,
  recentPulseTrigger = 0,
  userFrequency,
  compactMode = false,
  onReplayBreakdown
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Particles & Debris state
  const particlesRef = useRef<Particle[]>([]);
  const debrisRef = useRef<DebrisChunk[]>([]);
  const cracksRef = useRef<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const breakdownTimeRef = useRef<number>(0);
  const [localReplayTrigger, setLocalReplayTrigger] = useState<number>(0);

  // Effective frequency (student's or default target)
  const activeFreq = userFrequency !== undefined ? userFrequency : stage.targetFrequency;
  const freqRatio = activeFreq / (stage.targetFrequency || 1);
  const freqDiff = Math.abs(activeFreq - stage.targetFrequency);

  // Lorentzian resonance response factor: peaks sharply at freqRatio = 1
  const Q = 16; // high mechanical Quality factor
  const denom = Math.sqrt(Math.pow(1 - freqRatio * freqRatio, 2) + Math.pow(freqRatio / Q, 2));
  const rawResonance = (1 / Q) / Math.max(0.001, denom);
  const resonanceFactor = Math.min(1.0, Math.max(0.04, rawResonance));

  // Reset physics state when stage changes
  useEffect(() => {
    cracksRef.current = [];
    particlesRef.current = [];
    debrisRef.current = [];
    breakdownTimeRef.current = 0;
  }, [stage.id]);

  // Generate cracks progressively as integrity lowers
  useEffect(() => {
    if (structuralIntegrity < 85 && cracksRef.current.length < 25) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      const targetCrackCount = Math.floor((100 - structuralIntegrity) / 3.5);
      for (let i = cracksRef.current.length; i < targetCrackCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (Math.min(w, h) * 0.28) + 15;
        const x1 = cx + Math.cos(angle) * dist;
        const y1 = cy + Math.sin(angle) * dist;
        const branchLen = Math.random() * 45 + 15;
        const branchAngle = angle + (Math.random() - 0.5) * 1.5;
        cracksRef.current.push({
          x1,
          y1,
          x2: x1 + Math.cos(branchAngle) * branchLen,
          y2: y1 + Math.sin(branchAngle) * branchLen
        });
      }
    }
  }, [structuralIntegrity]);

  // Spawn pulse shockwave particles
  useEffect(() => {
    if (recentPulseTrigger > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const count = Math.floor(18 + resonanceFactor * 30);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particlesRef.current.push({
          x: w / 2 + (Math.random() - 0.5) * 50,
          y: h / 2 + (Math.random() - 0.5) * 50,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1.5,
          color: resonanceFactor > 0.8 ? '#ff0055' : resonanceFactor > 0.4 ? '#ffaa00' : '#00f0ff',
          life: 0,
          maxLife: Math.random() * 35 + 20
        });
      }
    }
  }, [recentPulseTrigger, resonanceFactor]);

  // Initialize catastrophic breakdown debris and blast particles when breakdown is triggered
  const triggerBreakdownDebris = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    breakdownTimeRef.current = Date.now();
    soundFx.playBreakdown();

    // Spawn 120-140 physical debris chunks blasted outward radially
    const newDebris: DebrisChunk[] = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 12 + 4;
      const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 4;
      const vy = Math.sin(angle) * speed - Math.random() * 5; // upward explosion impulse

      // Custom debris geometry per structure type
      let type: DebrisChunk['type'] = 'steel';
      let color = '#00f0ff';
      let points: Array<{ x: number; y: number }> | undefined = undefined;

      if (stage.structureType === 'cantilever') {
        type = 'glass';
        color = Math.random() > 0.3 ? 'rgba(0, 240, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        points = [
          { x: 0, y: -Math.random() * 16 - 8 },
          { x: Math.random() * 14 + 5, y: Math.random() * 12 + 3 },
          { x: -Math.random() * 14 - 5, y: Math.random() * 12 + 3 }
        ];
      } else if (stage.structureType === 'bridge' || stage.structureType === 'footbridge') {
        type = Math.random() > 0.5 ? 'steel' : 'concrete';
        color = type === 'steel' ? '#00f0ff' : '#64748b';
      } else if (stage.structureType === 'skyscraper') {
        type = Math.random() > 0.5 ? 'glass' : 'concrete';
        color = type === 'glass' ? 'rgba(0, 240, 255, 0.85)' : '#94a3b8';
      } else if (stage.structureType === 'helicopter') {
        type = 'carbon';
        color = Math.random() > 0.5 ? '#f59e0b' : '#38bdf8';
        points = [
          { x: -Math.random() * 18, y: -4 },
          { x: Math.random() * 18, y: -4 },
          { x: 0, y: 10 }
        ];
      } else if (stage.structureType === 'drill') {
        type = 'rock';
        color = Math.random() > 0.6 ? '#d97706' : '#64748b';
      } else if (stage.structureType === 'turbine') {
        type = 'steel';
        color = Math.random() > 0.5 ? '#f1f5f9' : '#0ea5e9';
        points = [
          { x: 0, y: -14 },
          { x: 8, y: 8 },
          { x: -8, y: 8 }
        ];
      } else if (stage.structureType === 'railway') {
        type = 'concrete';
        color = Math.random() > 0.5 ? '#94a3b8' : '#334155';
      } else if (stage.structureType === 'vehicle') {
        type = 'steel';
        color = Math.random() > 0.5 ? '#ef4444' : '#1e293b';
      } else if (stage.structureType === 'pipe') {
        type = 'steel';
        color = Math.random() > 0.5 ? '#0284c7' : '#e2e8f0';
      }

      newDebris.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        vx,
        vy,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.45,
        w: Math.random() * 18 + 6,
        h: Math.random() * 14 + 5,
        type,
        color,
        points
      });
    }

    debrisRef.current = newDebris;

    // Spawn 70+ fiery explosion spark and plasma particles
    const sparks: Particle[] = [];
    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 3;
      sparks.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.4 ? '#ff0055' : Math.random() > 0.5 ? '#ffaa00' : '#ffffff',
        life: 0,
        maxLife: Math.random() * 45 + 30
      });
    }
    particlesRef.current = sparks;
  };

  // Trigger breakdown debris on breakdown status or manual replay
  useEffect(() => {
    if (isBreakdownAchieved || localReplayTrigger > 0) {
      triggerBreakdownDebris();
    }
  }, [isBreakdownAchieved, localReplayTrigger]);

  // Main 60FPS physics animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.035;
      const w = canvas.width;
      const h = canvas.height;

      // Calculate vibration amplitude and driving speed
      const stressRatio = (100 - structuralIntegrity) / 100;
      const elapsedBlast = breakdownTimeRef.current > 0 ? (Date.now() - breakdownTimeRef.current) : 0;
      const effectiveBreakdown = isBreakdownAchieved || (elapsedBlast > 0 && elapsedBlast < 3500);

      // Driving speed reacts to player's active frequency!
      const drivingSpeed = Math.min(22, Math.max(2.0, 2.5 + (activeFreq / (stage.targetFrequency || 1)) * 5.0));

      // Dynamic amplitude: grows sharply as resonanceFactor -> 1.0
      const amp = (5 + resonanceFactor * 35 + stressRatio * 20 + peakAmplitude * 6) * (effectiveBreakdown ? 2.4 : 1.0);

      // Determine glowing color theme based on resonance lock & stress
      let glowColor = '#00f0ff'; // Cool Cyan (off resonance)
      if (resonanceFactor > 0.82 || freqDiff <= stage.perfectBand) {
        glowColor = '#ff0055'; // Searing Magenta (100% resonant lock)
      } else if (resonanceFactor > 0.38 || freqDiff <= stage.tolerance) {
        glowColor = '#ffb700'; // Amber/Gold (approaching resonance)
      }

      // Screen shake during breakdown or high resonance pulses
      ctx.save();
      if (effectiveBreakdown) {
        const shake = Math.sin(time * 50) * 12 * Math.max(0, 1 - elapsedBlast / 2000);
        ctx.translate(shake, (Math.cos(time * 40) * shake) * 0.7);
      }

      // Clear frame with cyber backdrop
      ctx.fillStyle = 'rgba(6, 9, 14, 0.45)';
      ctx.fillRect(0, 0, w, h);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = compactMode ? 28 : 38;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Explosive Shockwave Blast Rings and Core Flash on breakdown
      if (effectiveBreakdown && elapsedBlast < 2200) {
        ctx.save();
        const blastRatio = Math.min(1, elapsedBlast / 1400);

        // Core white-hot flash (first 250ms)
        if (elapsedBlast < 250) {
          const flashAlpha = 0.9 * (1 - elapsedBlast / 250);
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);
        }

        // Primary outer shockwave blast ring
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, blastRatio * (Math.max(w, h) * 0.75), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 85, ${(1 - blastRatio) * 0.9})`;
        ctx.lineWidth = 8 * (1 - blastRatio);
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0055';
        ctx.stroke();

        // Secondary cyan plasma shockwave ring
        const blast2 = Math.min(1, elapsedBlast / 1000);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, blast2 * (Math.max(w, h) * 0.55), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - blast2) * 0.8})`;
        ctx.lineWidth = 5 * (1 - blast2);
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00f0ff';
        ctx.stroke();

        ctx.restore();
      }

      // RENDER PHYSICAL STRUCTURE (Fades and shatters away upon explosive blast!)
      const structureAlpha = effectiveBreakdown ? Math.max(0, 1 - elapsedBlast / 320) : 1;
      if (structureAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = structureAlpha;
        ctx.shadowBlur = compactMode ? 10 : 16;
        ctx.shadowColor = glowColor;

      const type = stage.structureType;

      if (type === 'bridge') {
        // ==========================================
        // 1. SUSPENSION BRIDGE (Tacoma Narrows Flutter)
        // ==========================================
        const baseY = h * 0.62;
        const tower1X = w * 0.22;
        const tower2X = w * 0.78;
        const towerTopY = h * 0.24;

        // Draw towers
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(tower1X - 9, towerTopY, 18, baseY + 45 - towerTopY);
        ctx.strokeRect(tower2X - 9, towerTopY, 18, baseY + 45 - towerTopY);

        // Water reflection river at bottom
        ctx.fillStyle = 'rgba(0, 30, 60, 0.4)';
        ctx.fillRect(0, baseY + 45, w, h - (baseY + 45));

        // Parabolic Main Suspension Cable
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.moveTo(0, baseY - 15);
        ctx.quadraticCurveTo(tower1X, towerTopY, (tower1X + tower2X) / 2, baseY - 35 + Math.sin(time * drivingSpeed) * (amp * 0.3));
        ctx.quadraticCurveTo(tower2X, towerTopY, w, baseY - 15);
        ctx.stroke();

        // Calculate vibrating deck points with standing wave + torsional twist
        const numSegments = 50;
        const deckPoints: Array<{ x: number; y: number; twist: number }> = [];
        for (let i = 0; i <= numSegments; i++) {
          const px = (w * i) / numSegments;
          const normX = i / numSegments;
          // Standing wave equation: y = A * sin(k*x) * sin(w*t)
          const standingWave = Math.sin(normX * Math.PI * 2) * Math.sin(time * drivingSpeed) * amp;
          // Torsional flutter twist: deck tilts on Z axis
          const twist = Math.sin(normX * Math.PI * 3 + time * drivingSpeed * 1.2) * (amp * 0.4);
          deckPoints.push({ x: px, y: baseY + standingWave, twist });
        }

        // Vertical Suspender Cables
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.5;
        for (let i = 3; i < numSegments - 3; i += 2) {
          const pt = deckPoints[i];
          ctx.beginPath();
          ctx.moveTo(pt.x, towerTopY + 25);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }

        // Torsional Road Deck with thickness & 3D perspective
        for (let i = 0; i < numSegments; i++) {
          const p1 = deckPoints[i];
          const p2 = deckPoints[i + 1];

          // Top edge
          ctx.beginPath();
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 4;
          ctx.moveTo(p1.x, p1.y - p1.twist * 0.5);
          ctx.lineTo(p2.x, p2.y - p2.twist * 0.5);
          ctx.stroke();

          // Bottom edge
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.moveTo(p1.x, p1.y + p1.twist * 0.5 + 8);
          ctx.lineTo(p2.x, p2.y + p2.twist * 0.5 + 8);
          ctx.stroke();
        }

      } else if (type === 'skyscraper') {
        // ==========================================
        // 2. CYBER SPIRE (First-Order Cantilever Sway)
        // ==========================================
        const baseX = w / 2;
        const baseY = h * 0.88;
        const towerHeight = h * 0.68;
        const numFloors = 20;

        const floors: Array<{ x: number; y: number; width: number }> = [];
        for (let i = 0; i <= numFloors; i++) {
          const ratio = i / numFloors;
          // First-order sway: deflection proportional to height^1.8
          const sway = Math.sin(time * drivingSpeed) * amp * Math.pow(ratio, 1.8);
          const floorY = baseY - towerHeight * ratio;
          const floorWidth = (compactMode ? 65 : 95) - ratio * 45;
          floors.push({ x: baseX + sway, y: floorY, width: floorWidth });
        }

        // Columns & Floors
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        floors.forEach((fl, idx) => {
          if (idx === 0) ctx.moveTo(fl.x - fl.width / 2, fl.y);
          else ctx.lineTo(fl.x - fl.width / 2, fl.y);
        });
        ctx.stroke();

        ctx.beginPath();
        floors.forEach((fl, idx) => {
          if (idx === 0) ctx.moveTo(fl.x + fl.width / 2, fl.y);
          else ctx.lineTo(fl.x + fl.width / 2, fl.y);
        });
        ctx.stroke();

        // Floor plates & glowing windows
        floors.forEach((fl, idx) => {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fl.x - fl.width / 2, fl.y);
          ctx.lineTo(fl.x + fl.width / 2, fl.y);
          ctx.stroke();

          // Illuminated window strips
          if (idx % 2 === 0) {
            ctx.fillStyle = Math.random() > 0.2 ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 170, 0, 0.6)';
            ctx.fillRect(fl.x - fl.width * 0.35, fl.y - 5, fl.width * 0.7, 3);
          }
        });

        // Tuned Mass Damper (Taipei 101 pendulum sphere swinging out of phase!)
        const damperFloor = floors[floors.length - 4];
        const damperOffset = -Math.sin(time * drivingSpeed) * (amp * 0.75); // 180 degrees out of phase
        ctx.beginPath();
        ctx.arc(damperFloor.x + damperOffset, damperFloor.y + 12, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ffb700';
        ctx.shadowColor = '#ffb700';
        ctx.shadowBlur = 12;
        ctx.fill();

        // Summit Spire & Beacon
        const crown = floors[floors.length - 1];
        ctx.beginPath();
        ctx.moveTo(crown.x, crown.y);
        ctx.lineTo(crown.x, crown.y - 40);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(crown.x, crown.y - 40, 4 + Math.sin(time * 8) * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0055';
        ctx.fill();

      } else if (type === 'cantilever') {
        // ==========================================
        // 3. CRYO-GLASS CANTILEVER / CRYSTAL CHALICE
        // ==========================================
        const cx = w / 2;
        const cy = h * 0.52;
        const glassRadius = compactMode ? 65 : 85;
        const rimY = cy - 60;

        // Acoustic sound wave emitter horn on left
        const emitterX = cx - glassRadius * 1.9;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(emitterX - 30, cy - 20);
        ctx.lineTo(emitterX, cy - 10);
        ctx.lineTo(emitterX, cy + 10);
        ctx.lineTo(emitterX - 30, cy + 20);
        ctx.closePath();
        ctx.stroke();

        // Sound wave pressure arcs radiating toward glass
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.arc(emitterX, cy, r * 22 + (time * 40) % 22, -Math.PI * 0.35, Math.PI * 0.35);
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Crystal chalice rim with acoustic harmonic standing nodes
        ctx.beginPath();
        const rimNodes = 48;
        for (let i = 0; i <= rimNodes; i++) {
          const theta = (i / rimNodes) * Math.PI * 2;
          // Harmonic wave on rim: sin(4*theta) is acoustic eigenmode
          const ripple = Math.sin(theta * 4 + time * drivingSpeed) * (amp * 0.45);
          const rx = cx + Math.cos(theta) * (glassRadius + ripple);
          const ry = rimY + Math.sin(theta) * (glassRadius * 0.32 + ripple * 0.3);
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Translucent glass bowl body
        ctx.beginPath();
        ctx.moveTo(cx - glassRadius, rimY);
        ctx.quadraticCurveTo(cx - glassRadius * 0.8, cy + 30, cx, cy + 45);
        ctx.quadraticCurveTo(cx + glassRadius * 0.8, cy + 30, cx + glassRadius, rimY);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stem and base
        ctx.beginPath();
        ctx.moveTo(cx, cy + 45);
        ctx.lineTo(cx, cy + 95);
        ctx.moveTo(cx - 35, cy + 95);
        ctx.lineTo(cx + 35, cy + 95);
        ctx.stroke();

        // Crystalline facet highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(cx - glassRadius * 0.5, rimY + 10);
        ctx.lineTo(cx, cy + 35);
        ctx.lineTo(cx + glassRadius * 0.5, rimY + 10);
        ctx.stroke();

      } else if (type === 'helicopter') {
        // ==========================================
        // 4. HELICOPTER AIRFRAME & ROTOR (GROUND RESONANCE)
        // ==========================================
        const cx = w / 2;
        const groundY = h * 0.82;
        const fuseY = h * 0.52;
        const mastTopY = fuseY - (compactMode ? 55 : 75);

        // Ground / Tarmac runway
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, groundY);
        ctx.lineTo(w * 0.92, groundY);
        ctx.stroke();

        // Tarmac hash marks
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1.5;
        for (let gx = w * 0.12; gx < w * 0.9; gx += 28) {
          ctx.beginPath();
          ctx.moveTo(gx, groundY);
          ctx.lineTo(gx - 12, groundY + 18);
          ctx.stroke();
        }

        // Fuselage lateral ground-resonance rocking oscillation
        const fuseRoll = Math.sin(time * drivingSpeed) * (amp * 0.04);
        const fuseShiftX = Math.sin(time * drivingSpeed) * (amp * 0.35);

        ctx.save();
        ctx.translate(cx + fuseShiftX, fuseY);
        ctx.rotate(fuseRoll);

        // Landing gear struts & skids (acting as spring-damper support)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        // Left & right oleo legs
        ctx.beginPath();
        ctx.moveTo(-35, 20);
        ctx.lineTo(-45, groundY - fuseY);
        ctx.lineTo(45, groundY - fuseY);
        ctx.moveTo(35, 20);
        ctx.lineTo(45, groundY - fuseY);
        ctx.stroke();

        // Skid pads on tarmac
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-65, groundY - fuseY);
        ctx.lineTo(65, groundY - fuseY);
        ctx.stroke();

        // Helicopter Fuselage Body (Aerodynamic pod)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, compactMode ? 55 : 70, compactMode ? 26 : 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cockpit canopy windshield
        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, -18);
        ctx.quadraticCurveTo(50, -10, 52, 6);
        ctx.lineTo(15, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail boom
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-45, -5);
        ctx.lineTo(-120, -12);
        // Vertical fin
        ctx.lineTo(-125, -35);
        ctx.stroke();

        // Tail rotor spinning
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 2;
        const tailAngle = time * drivingSpeed * 4;
        ctx.beginPath();
        ctx.moveTo(-125 + Math.cos(tailAngle) * 18, -30 + Math.sin(tailAngle) * 18);
        ctx.lineTo(-125 - Math.cos(tailAngle) * 18, -30 - Math.sin(tailAngle) * 18);
        ctx.stroke();

        // Main rotor mast
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -55);
        ctx.stroke();

        // Main rotor hub with lead-lag dampers
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(0, -55, 6, 0, Math.PI * 2);
        ctx.fill();

        // Spinning flexible rotor blades with lead-lag phase shift
        const numBlades = 3;
        const rotorSpan = compactMode ? 120 : 160;
        for (let b = 0; b < numBlades; b++) {
          // Asymmetrical lead-lag displacement creates centrifugal unbalance
          const lagShift = Math.sin(time * drivingSpeed + b * (Math.PI * 2 / numBlades)) * (amp * 0.15);
          const bladeAngle = (time * drivingSpeed * 1.5) + b * (Math.PI * 2 / numBlades) + lagShift;
          const bladeFlap = Math.sin(bladeAngle * 2) * (amp * 0.2);

          const bx = Math.cos(bladeAngle) * rotorSpan;
          const by = -55 + Math.sin(bladeAngle) * 18 + bladeFlap;

          ctx.strokeStyle = b === 0 ? '#ff0055' : glowColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -55);
          ctx.lineTo(bx, by);
          ctx.stroke();

          // Blade tip path vortex marker
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

      } else if (type === 'drill') {
        // ==========================================
        // 5. DEEPWATER DRILLSTRING & BIT (TORSIONAL STICK-SLIP)
        // ==========================================
        const cx = w / 2;
        const topY = h * 0.14;
        const btmY = h * 0.84;

        // Subterranean rock strata geological formations
        ctx.fillStyle = 'rgba(23, 30, 42, 0.6)';
        ctx.fillRect(cx - 100, topY, 200, btmY - topY);

        // Geologic bedding lines
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
        ctx.lineWidth = 1;
        for (let ly = topY + 30; ly < btmY; ly += 25) {
          ctx.beginPath();
          ctx.moveTo(cx - 100, ly);
          ctx.lineTo(cx + 100, ly);
          ctx.stroke();
        }

        // Wellbore casing walls
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 28, topY);
        ctx.lineTo(cx - 28, btmY - 30);
        ctx.moveTo(cx + 28, topY);
        ctx.lineTo(cx + 28, btmY - 30);
        ctx.stroke();

        // Vertical segmented titanium drillstring exhibiting torsional twist
        const drillSegments = 26;
        ctx.lineWidth = 3.5;
        for (let i = 0; i < drillSegments; i++) {
          const ratio = i / drillSegments;
          const sy = topY + (btmY - topY) * ratio;
          // Torsional stick-slip windup wave: top rotates steadily while bit sticks then slips
          const torsionalAngle = (ratio * Math.PI * 6) + Math.sin(ratio * Math.PI * 2 + time * drivingSpeed) * (amp * 0.4);
          const twist = Math.sin(torsionalAngle) * 16;

          ctx.strokeStyle = glowColor;
          ctx.beginPath();
          ctx.moveTo(cx - 15 + twist, sy);
          ctx.lineTo(cx + 15 - twist, sy + 10);
          ctx.stroke();

          // Joint collar bands
          if (i % 5 === 0) {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(cx - 18, sy - 2, 36, 5);
          }
        }

        // Heavy Drill Collars at bottom
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.fillRect(cx - 22, btmY - 45, 44, 25);
        ctx.strokeRect(cx - 22, btmY - 45, 44, 25);

        // Tri-cone / PDC diamond cutter drill bit
        const bitRot = time * drivingSpeed * 3;
        const bitShake = (Math.random() - 0.5) * (amp * 0.15);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(cx - 26 + bitShake, btmY - 20);
        ctx.lineTo(cx + 26 + bitShake, btmY - 20);
        ctx.lineTo(cx + bitShake, btmY + 16);
        ctx.closePath();
        ctx.fill();

        // Cutting teeth
        ctx.fillStyle = '#ffffff';
        for (let tIdx = -2; tIdx <= 2; tIdx++) {
          ctx.fillRect(cx + tIdx * 9 - 2 + bitShake, btmY - 14, 4, 8);
        }

        // High friction rock fracturing sparks and mud swirls
        ctx.fillStyle = '#ff0055';
        for (let s = 0; s < 7; s++) {
          ctx.beginPath();
          ctx.arc(cx + (Math.random() - 0.5) * 55, btmY + Math.random() * 16, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (type === 'turbine') {
        // ==========================================
        // 6. JET ENGINE TURBINE BLADES (AEROMECHANICAL FLUTTER)
        // ==========================================
        const cx = w / 2;
        const cy = h / 2;
        const hubRadius = compactMode ? 35 : 45;
        const bladeLength = compactMode ? 75 : 105;

        // Engine outer nacelle stator shroud
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius + bladeLength + 14, 0, Math.PI * 2);
        ctx.stroke();

        // Stator vanes in background
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 2;
        for (let v = 0; v < 24; v++) {
          const vAngle = (v / 24) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(vAngle) * (hubRadius + bladeLength + 4), cy + Math.sin(vAngle) * (hubRadius + bladeLength + 4));
          ctx.lineTo(cx + Math.cos(vAngle + 0.15) * (hubRadius + bladeLength + 14), cy + Math.sin(vAngle + 0.15) * (hubRadius + bladeLength + 14));
          ctx.stroke();
        }

        // Central rotating turbine disc hub
        const rotBase = time * drivingSpeed * 0.8;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 16 Titanium aerofoil turbine blades with Campbell flutter bending
        const bladeCount = 16;
        for (let i = 0; i < bladeCount; i++) {
          const baseTheta = (i / bladeCount) * Math.PI * 2 + rotBase;
          // Travelling wave flutter: neighboring blades vibrate with inter-blade phase angle (IBPA)
          const flutterPhase = i * (Math.PI * 2 / 4) + time * drivingSpeed * 2;
          const tipBending = Math.sin(flutterPhase) * (amp * 0.35);

          const rInner = hubRadius;
          const rOuter = hubRadius + bladeLength;

          const rootX = cx + Math.cos(baseTheta) * rInner;
          const rootY = cy + Math.sin(baseTheta) * rInner;

          // Tip deflects azimuthally and radially under flutter
          const tipTheta = baseTheta + 0.18 + (tipBending / rOuter);
          const tipX = cx + Math.cos(tipTheta) * rOuter;
          const tipY = cy + Math.sin(tipTheta) * rOuter;

          // Airfoil blade curve
          ctx.strokeStyle = i % 2 === 0 ? glowColor : 'rgba(0, 240, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(rootX, rootY);
          // Cambered aerodynamic profile curve
          const midTheta = (baseTheta + tipTheta) / 2 + 0.08;
          const midX = cx + Math.cos(midTheta) * (rInner + bladeLength * 0.55);
          const midY = cy + Math.sin(midTheta) * (rInner + bladeLength * 0.55);
          ctx.quadraticCurveTo(midX, midY, tipX, tipY);
          ctx.stroke();

          // Blade tip clearance gap indicator
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center spinner cone
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Aerodynamic swirl lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1.5;
        for (let s = 1; s <= 3; s++) {
          ctx.beginPath();
          ctx.arc(cx, cy, hubRadius + bladeLength * (s / 3.5), 0, Math.PI * 2);
          ctx.stroke();
        }

      } else if (type === 'footbridge') {
        // ==========================================
        // 7. LONDON MILLENNIUM PEDESTRIAN FOOTBRIDGE (LATERAL SYNCHRONY)
        // ==========================================
        const cx = w / 2;
        const centerY = h * 0.55;
        const leftX = w * 0.08;
        const rightX = w * 0.92;
        const bridgeSpan = rightX - leftX;

        // River Thames water reflection below
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(0, centerY + 50, w, h - (centerY + 50));

        // Lateral deck swaying (horizontal oscillation)
        const lateralSway = Math.sin(time * drivingSpeed) * (amp * 0.5);

        // Low-profile suspension cables (slender suspension)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftX, centerY - 25);
        ctx.quadraticCurveTo(cx, centerY + 15, rightX, centerY - 25);
        ctx.stroke();

        // Dynamic Walking Deck with lateral deflection
        const deckPoints: Array<{ x: number; y: number; swayX: number }> = [];
        const deckSteps = 36;
        for (let i = 0; i <= deckSteps; i++) {
          const norm = i / deckSteps;
          const px = leftX + norm * bridgeSpan;
          // Fundamental horizontal mode: half sine wave peak in center
          const modeShape = Math.sin(norm * Math.PI);
          const xOffset = modeShape * lateralSway;
          deckPoints.push({ x: px + xOffset, y: centerY + modeShape * 8, swayX: xOffset });
        }

        // Draw deck path
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        deckPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Deck handrails
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        deckPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y - 14);
          else ctx.lineTo(pt.x, pt.y - 14);
        });
        ctx.stroke();

        // Vertical deck hangers connecting deck to cables
        for (let i = 4; i < deckSteps; i += 4) {
          const pt = deckPoints[i];
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x, pt.y - 25);
          ctx.stroke();
        }

        // Walking Pedestrians swaying in synchronous lockstep
        const numPedestrians = 10;
        for (let p = 1; p < numPedestrians; p++) {
          const pNorm = p / numPedestrians;
          const ptIdx = Math.floor(pNorm * deckSteps);
          const pt = deckPoints[ptIdx];
          if (!pt) continue;

          // Pedestrian sway matches bridge sway (synchronous lateral excitation)
          const pedLean = (pt.swayX / 15);
          const pedY = pt.y - 14;

          // Body
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x + pedLean * 5, pedY);
          ctx.stroke();

          // Head
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(pt.x + pedLean * 7, pedY - 6, 3, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (type === 'railway') {
        // ==========================================
        // 8. HIGH-SPEED RAILWAY TRACK & RAILBED (PINNED-PINNED RESONANCE)
        // ==========================================
        const groundY = h * 0.72;
        const leftX = w * 0.08;
        const rightX = w * 0.92;
        const span = rightX - leftX;

        // Ballast gravel crushed rock bed
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.fillRect(leftX, groundY + 10, span, 45);

        // Gravel particles
        ctx.fillStyle = '#475569';
        for (let g = 0; g < 30; g++) {
          ctx.fillRect(leftX + (g * 29) % span, groundY + 16 + (g * 7) % 30, 4, 3);
        }

        // Concrete Sleepers / Ties spaced periodically
        const numSleepers = 9;
        const sleeperPositions: number[] = [];
        for (let s = 0; s < numSleepers; s++) {
          const sx = leftX + (s / (numSleepers - 1)) * span;
          sleeperPositions.push(sx);

          // Concrete sleeper block
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sx - 14, groundY - 4, 28, 18);

          // Rail fastener clip
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx - 6, groundY - 8, 12, 4);
        }

        // Continuous UIC60 steel rail vibrating in pinned-pinned mode between sleepers
        const railPoints: Array<{ x: number; y: number }> = [];
        const railSteps = 80;
        for (let r = 0; r <= railSteps; r++) {
          const norm = r / railSteps;
          const rx = leftX + norm * span;

          // Pinned-pinned mode: nodal zero-displacement points at sleepers, maximum flexure in between
          const sleeperPitch = span / (numSleepers - 1);
          const localPos = (rx - leftX) % sleeperPitch;
          const interSpanNorm = localPos / sleeperPitch;
          const pinnedPinnedDeflection = Math.sin(interSpanNorm * Math.PI) * Math.sin(time * drivingSpeed * 2) * (amp * 0.45);

          railPoints.push({ x: rx, y: groundY - 8 - pinnedPinnedDeflection });
        }

        // Draw Rail Head & Web
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        railPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // High-speed Train Wheel Axle traversing the rail
        const wheelNorm = (time * 0.25) % 1;
        const wheelX = leftX + wheelNorm * span;
        const wheelRadius = compactMode ? 28 : 36;
        const wheelCenterY = groundY - 8 - wheelRadius;

        // Train wheel
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3.5;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.arc(wheelX, wheelCenterY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wheel axle hub
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(wheelX, wheelCenterY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Wheel-rail contact impact spark sparks
        ctx.fillStyle = '#f59e0b';
        for (let sp = 0; sp < 4; sp++) {
          ctx.fillRect(wheelX + (Math.random() - 0.5) * 12, groundY - 8 + Math.random() * 4, 3, 2);
        }

      } else if (type === 'vehicle') {
        // ==========================================
        // 9. AUTOMOBILE SUSPENSION & CHASSIS (2-DOF WHEEL HOP & BODY BOUNCE)
        // ==========================================
        const cx = w / 2;
        const roadBaseY = h * 0.84;

        // Corrugated / Washboard sinusoidal road profile
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const roadPoints: Array<{ x: number; y: number }> = [];
        for (let rx = 0; rx <= w; rx += 8) {
          // Road wavelength harmonic excitation
          const roadHump = Math.sin((rx / 35) + time * drivingSpeed) * 8;
          roadPoints.push({ x: rx, y: roadBaseY + roadHump });
          if (rx === 0) ctx.moveTo(rx, roadBaseY + roadHump);
          else ctx.lineTo(rx, roadBaseY + roadHump);
        }
        ctx.stroke();

        // Unsprung Mass (Wheel Hub & Tire) - Wheel Hop Resonance Mode
        const wheelHopY = Math.sin(time * drivingSpeed * 1.8) * (amp * 0.4);
        const wheelRadius = compactMode ? 32 : 42;
        const wheelY = roadBaseY - wheelRadius - 10 + wheelHopY;

        // Sprung Mass (Chassis Vehicle Body) - Body Bounce Resonance Mode
        const bodyBounceY = Math.sin(time * drivingSpeed * 0.9) * (amp * 0.35);
        const bodyY = wheelY - (compactMode ? 90 : 120) + bodyBounceY;

        // Draw Coil Spring and Damper Strut connecting Wheel Hub to Chassis Body
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        const springTop = bodyY + 20;
        const springBtm = wheelY - wheelRadius;
        const springLen = springBtm - springTop;
        const coils = 7;
        for (let c = 0; c <= coils; c++) {
          const cy = springTop + (c / coils) * springLen;
          const cxOffset = c === 0 || c === coils ? 0 : (c % 2 === 1 ? -16 : 16);
          if (c === 0) ctx.moveTo(cx - 15, cy);
          else ctx.lineTo(cx - 15 + cxOffset, cy);
        }
        ctx.stroke();

        // Shock Absorber Damper Cylinder next to spring
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx + 18, springTop);
        ctx.lineTo(cx + 18, springTop + springLen * 0.55);
        ctx.stroke();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx + 18, springTop + springLen * 0.45);
        ctx.lineTo(cx + 18, springBtm);
        ctx.stroke();

        // Tire & Wheel Hub (Unsprung Mass m_u)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(cx, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Alloy wheel rim
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, wheelY, wheelRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // Wheel axle hub
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(cx, wheelY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Vehicle Chassis Body (Sprung Mass m_s)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        safeRoundRect(ctx, cx - (compactMode ? 75 : 95), bodyY - 25, compactMode ? 150 : 190, 45, 8);
        ctx.fill();
        ctx.stroke();

        // Chassis text label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('SPRUNG CHASSIS MASS (m_s)', cx - 68, bodyY);

      } else {
        // ==========================================
        // 10. INDUSTRIAL POWER PLANT PIPING (ACOUSTIC-STRUCTURAL COUPLING)
        // ==========================================
        const cx = w / 2;
        const startX = w * 0.12;
        const endX = w * 0.88;
        const pipeY = h * 0.48;
        const pipeDia = compactMode ? 40 : 55;

        // Pipe wall bending deflection
        const wallFlex = Math.sin(time * drivingSpeed) * (amp * 0.35);

        // Schedule 80 Alloy Pipe Cylindrical Outer Shell
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, pipeY - pipeDia / 2 - wallFlex);
        ctx.lineTo(endX, pipeY - pipeDia / 2 + wallFlex);
        ctx.moveTo(startX, pipeY + pipeDia / 2 - wallFlex);
        ctx.lineTo(endX, pipeY + pipeDia / 2 + wallFlex);
        ctx.stroke();

        // Flanged Bolted Joint Collars
        const flangeX1 = startX + (endX - startX) * 0.3;
        const flangeX2 = startX + (endX - startX) * 0.7;
        [flangeX1, flangeX2].forEach(fx => {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(fx - 6, pipeY - pipeDia / 2 - 12, 12, pipeDia + 24);
          // Bolts
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(fx - 3, pipeY - pipeDia / 2 - 8, 6, 4);
          ctx.fillRect(fx - 3, pipeY + pipeDia / 2 + 4, 6, 4);
        });

        // Fluid Cavity Acoustic Standing Pressure Waves inside pipe core
        const standingNodes = 5;
        for (let i = 1; i <= standingNodes; i++) {
          const nx = startX + (i / (standingNodes + 1)) * (endX - startX);
          // Standing pressure oscillation: alternating high and low pressure zones
          const pressureAmp = Math.sin((i * Math.PI) / 2) * Math.sin(time * drivingSpeed) * (amp * 0.4);
          const ellipseR = Math.max(4, 16 + pressureAmp);

          ctx.fillStyle = pressureAmp > 0 ? 'rgba(255, 0, 85, 0.45)' : 'rgba(0, 240, 255, 0.45)';
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(nx, pipeY, ellipseR, pipeDia * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Pipe Support Spring Hangers
        [startX + 40, endX - 40].forEach(hx => {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx, pipeY - pipeDia / 2 - 12);
          ctx.lineTo(hx, pipeY - pipeDia / 2 - 45);
          ctx.stroke();
          // Hanger box
          ctx.fillStyle = '#334155';
          ctx.fillRect(hx - 10, pipeY - pipeDia / 2 - 55, 20, 12);
        });

        // Steam pressure gauge
        const gaugeX = cx;
        const gaugeY = pipeY - pipeDia / 2 - 35;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gaugeX, gaugeY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Needle vibrating
        const needleAngle = -Math.PI * 0.75 + Math.sin(time * drivingSpeed * 3) * (amp * 0.05);
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gaugeX, gaugeY);
        ctx.lineTo(gaugeX + Math.cos(needleAngle) * 14, gaugeY + Math.sin(needleAngle) * 14);
        ctx.stroke();
      }

      ctx.restore();

      // Render Dynamic Surface Cracks
      if (cracksRef.current.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5;
        cracksRef.current.forEach(cr => {
          ctx.beginPath();
          ctx.moveTo(cr.x1, cr.y1);
          ctx.lineTo(cr.x2, cr.y2);
          ctx.stroke();
        });
        ctx.restore();
      }

      ctx.restore(); // Close the structureAlpha save block
      }

      // Update & Render Catastrophic Breakdown Debris
      if (debrisRef.current.length > 0) {
        for (let i = debrisRef.current.length - 1; i >= 0; i--) {
          const d = debrisRef.current[i];
          d.x += d.vx;
          d.y += d.vy;
          d.vy += 0.18; // gravity
          d.rot += d.vrot;

          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);

          if (d.points && d.points.length > 0) {
            // Polygon shard (glass/metal)
            ctx.beginPath();
            d.points.forEach((pt, idx) => {
              if (idx === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fillStyle = d.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = d.color;
            ctx.fill();
          } else {
            // Rectangular or round debris
            ctx.fillStyle = d.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = d.color;
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
          }
          ctx.restore();
        }
      }

      // Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // DYNAMIC RESONANCE FREQUENCY SPECTRUM HUD (Revealed only upon breakdown/clearing as post-analysis)
      if (!compactMode && (isBreakdownAchieved || structuralIntegrity === 0)) {
        const hudW = 180;
        const hudH = 52;
        const hudX = w - hudW - 12;
        const hudY = h - hudH - 12;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        safeRoundRect(ctx, hudX, hudY, hudW, hudH, 6);
        ctx.fill();
        ctx.stroke();

        // Resonance Bell Curve
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.5;
        for (let bx = 0; bx < hudW - 16; bx += 2) {
          const normBx = bx / (hudW - 16); // 0 to 1
          const bell = Math.exp(-Math.pow((normBx - 0.5) / 0.18, 2));
          const by = hudY + hudH - 8 - bell * (hudH - 18);
          if (bx === 0) ctx.moveTo(hudX + 8 + bx, by);
          else ctx.lineTo(hudX + 8 + bx, by);
        }
        ctx.stroke();

        // Peak marker
        const peakX = hudX + 8 + 0.5 * (hudW - 16);
        const peakY = hudY + 12;
        ctx.beginPath();
        ctx.arc(peakX, peakY + 4, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        // Mini text label on HUD
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`POST-MORTEM SPECTRUM`, hudX + 8, hudY + 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`f₀ = ${stage.targetFrequency} ${stage.unit}`, hudX + hudW - 74, hudY + 12);

        ctx.restore();
      }

      ctx.restore(); // restore screen shake

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stage, structuralIntegrity, teamHarmonicCoherence, isBreakdownAchieved, peakAmplitude, activeFreq, resonanceFactor, compactMode]);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-xl border border-cyan-500/20 bg-[#06090e] shadow-2xl flex items-center justify-center ${
      compactMode ? 'min-h-[220px] max-h-[260px]' : 'min-h-[360px] md:min-h-[460px]'
    }`}>
      <canvas
        ref={canvasRef}
        width={compactMode ? 500 : 800}
        height={compactMode ? 280 : 500}
        className="w-full h-full object-cover"
      />

      {/* Real-time Status Overlay */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none max-w-[85%] z-10">
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-cyan-500/40 shadow-lg">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isBreakdownAchieved || structuralIntegrity === 0 ? 'bg-red-500 shadow-[0_0_10px_#ff0055]' : 
            structuralIntegrity < 40 ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]'
          }`} />
          <span className="text-[10px] font-mono-tech text-cyan-200 uppercase tracking-wider font-bold">
            {isBreakdownAchieved || structuralIntegrity === 0 ? 'CRITICAL STRUCTURAL FAILURE' :
             structuralIntegrity < 100 ? `FATIGUE DAMAGE ${Math.round(100 - structuralIntegrity)}%` : 'ACOUSTIC TRANSDUCER ARMED'}
          </span>
        </div>

        {/* In desktop/projector mode show full object details, but HIDE in compactMode so mobile canvas is 100% unobstructed */}
        {!compactMode && (
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/25 text-[10px] font-mono-tech text-slate-200 shadow-md">
            <div className="font-bold text-cyan-300">
              {stage.mechanicalObject}
            </div>
            <div className="text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Mode: {stage.vibrationMode}</span>
              <span>•</span>
              <span className="text-amber-300">f₀ = {stage.targetFrequency} {stage.unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Replay Button (Allows user/presenter to re-experience the destruction sequence) */}
      {(isBreakdownAchieved || structuralIntegrity === 0) && (
        <button
          onClick={() => {
            setLocalReplayTrigger(prev => prev + 1);
            if (onReplayBreakdown) onReplayBreakdown();
          }}
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-mono-tech text-xs transition-all shadow-[0_0_15px_rgba(255,0,85,0.4)]"
          title="Replay Structural Breakdown"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Replay Collapse
        </button>
      )}

      {/* Catastrophic Structural Breakdown Alert Overlay */}
      {(isBreakdownAchieved || structuralIntegrity === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none p-4 z-30">
          <div className="text-center p-4 md:p-6 border-2 border-red-500/90 bg-red-950/80 rounded-2xl shadow-[0_0_80px_rgba(255,0,85,0.7)] animate-pulse max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-400 mx-auto flex items-center justify-center text-red-300 mb-2">
              <span className="text-2xl">💥</span>
            </div>
            <h2 className="text-xl md:text-2xl font-orbitron font-black text-red-300 tracking-wider uppercase drop-shadow-[0_0_12px_#ff0055]">
              RESONANT BLAST!
            </h2>
            <p className="text-sm font-bold text-amber-300 mt-1 font-mono-tech">
              OBJECT DESTROYED AT {stage.targetFrequency} {stage.unit}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-cyan-500/50 text-[11px] font-mono-tech text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Auto-advancing to Next Question...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
