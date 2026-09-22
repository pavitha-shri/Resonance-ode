// Web Audio API Synthesizer for Resonance: Structural Breakdown

class ResonanceSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }

        // One-time gesture listener to unlock audio on iOS Safari
        const unlock = () => {
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
        };
        window.addEventListener('touchstart', unlock, { passive: true, once: true });
        window.addEventListener('touchend', unlock, { passive: true, once: true });
        window.addEventListener('click', unlock, { passive: true, once: true });
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable or restricted on this device
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play neutral acoustic pitch feedback corresponding to generator setting
  public playFrequencyTone(frequency: number, _targetFrequency?: number, _tolerance?: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Map input frequency smoothly into pleasant audible range (140Hz - 750Hz)
      let audioFreq = frequency;
      if (audioFreq < 30) {
        audioFreq = 140 + frequency * 16;
      } else if (audioFreq > 1000) {
        audioFreq = 350 + (audioFreq / 1200) * 400;
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(audioFreq, now);

      // Clean, neutral volume
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Audio context might be restricted
    }
  }

  // Play a sonic pulse matching user's selected frequency
  public playPulse(frequency: number, accuracy: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Map input frequency to pleasant audible range (100Hz - 900Hz)
      let audioFreq = frequency;
      if (audioFreq < 40) audioFreq = frequency * 25 + 80;
      else if (audioFreq > 1200) audioFreq = 1200;

      // Primary oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Resonance harmonic overtone oscillator
      const harmonicOsc = this.ctx.createOscillator();
      const harmonicGain = this.ctx.createGain();

      // Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(audioFreq * 2 + 300, now);

      osc.type = accuracy > 0.8 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(audioFreq, now);

      // If high accuracy, add detuned harmonic overtone for rich resonance chord
      if (accuracy > 0.6) {
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(audioFreq * 1.5, now);
        harmonicGain.gain.setValueAtTime(0.12 * accuracy, now);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        harmonicOsc.connect(filter);
        harmonicOsc.start(now);
        harmonicOsc.stop(now + 0.36);
      }

      const volume = Math.min(0.25, 0.08 + accuracy * 0.15);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (accuracy > 0.8 ? 0.5 : 0.25));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (accuracy > 0.8 ? 0.51 : 0.26));
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  // Play structural breakdown explosion / catastrophic failure sound
  public playBreakdown() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Noise buffer for metal fatigue / shatter
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 1.2);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);

      // Deep sub-bass rumble drop
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.5);

      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 1.5);
    } catch {
      // Ignore audio error
    }
  }

  // Play timer warning beep
  public playWarning() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  // Play UI tap blip
  public playBlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new ResonanceSynth();
