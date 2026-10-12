/**
 * MonkeyType-inspired Web Audio API sound generator for Typing Test.
 * Synthesizes realistic mechanical keyboard sounds and switches with zero external audio assets.
 */

export type SoundTheme = "off" | "click" | "thock" | "typewriter" | "beep";

class TypingSoundEngine {
  private ctx: AudioContext | null = null;
  private soundTheme: SoundTheme = "thock";
  private volume: number = 0.6; // 0.0 to 1.0
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setTheme(theme: SoundTheme) {
    this.soundTheme = theme;
    if (typeof window !== "undefined") {
      localStorage.setItem("ts_typing_sound_theme", theme);
    }
  }

  public getTheme(): SoundTheme {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ts_typing_sound_theme") as SoundTheme;
      if (saved) return saved;
    }
    return this.soundTheme;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("ts_typing_volume", String(this.volume));
    }
  }

  public getVolume(): number {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ts_typing_volume");
      if (saved) return parseFloat(saved);
    }
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted || this.soundTheme === "off";
  }

  /**
   * Play keypress sound based on current theme and whether the key was an error.
   */
  public playKey(isError: boolean = false, isSpaceOrEnter: boolean = false) {
    if (this.isSoundMuted()) return;
    this.initContext();
    if (!this.ctx) return;

    const theme = this.getTheme();
    if (theme === "off") return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(this.ctx.destination);

    if (isError) {
      this.playErrorSound(now, masterGain);
      return;
    }

    switch (theme) {
      case "click":
        this.playClickSound(now, masterGain, isSpaceOrEnter);
        break;
      case "thock":
        this.playThockSound(now, masterGain, isSpaceOrEnter);
        break;
      case "typewriter":
        this.playTypewriterSound(now, masterGain, isSpaceOrEnter);
        break;
      case "beep":
        this.playBeepSound(now, masterGain);
        break;
    }
  }

  /**
   * Crisp Cherry Blue style click
   */
  private playClickSound(now: number, master: GainNode, isSpace: boolean) {
    if (!this.ctx) return;

    // High snap click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const baseFreq = isSpace ? 1400 : 1800 + Math.random() * 400;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.02);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.025);

    // Subtle bottom-out thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(isSpace ? 120 : 160, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.03);

    subGain.gain.setValueAtTime(0.15, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    subOsc.connect(subGain);
    subGain.connect(master);

    subOsc.start(now);
    subOsc.stop(now + 0.03);
  }

  /**
   * Deep satisfying lubed mechanical "thock" (Gateron/Cream switches)
   */
  private playThockSound(now: number, master: GainNode, isSpace: boolean) {
    if (!this.ctx) return;

    // Low wooden/marble snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitch = isSpace ? 340 : 420 + Math.random() * 60;

    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    // Add gentle noise burst for tactile bottom-out
    const bufferSize = this.ctx.sampleRate * 0.015;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isSpace ? 800 : 1100, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.045);
    whiteNoise.start(now);
    whiteNoise.stop(now + 0.015);
  }

  /**
   * Vintage Typewriter mechanical strike
   */
  private playTypewriterSound(now: number, master: GainNode, isSpace: boolean) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = isSpace ? 800 : 1200 + Math.random() * 200;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.035);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Retro soft beep
   */
  private playBeepSound(now: number, master: GainNode) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(660 + Math.random() * 80, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Distinct soft error thud
   */
  private playErrorSound(now: number, master: GainNode) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const typingSoundEngine = new TypingSoundEngine();
