// Royalty-Free, Zero-Copyright Ambient Tech Groove Synthesizer for GumShop Product Demo
// Uses Web Audio API for 100% reliable, zero-latency, lightweight background music

class DemoSoundtrackEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.3;
  private timerId: number | null = null;
  private step: number = 0;

  // Pentatonic notes in Hz (C Major / A Minor upbeat tech sequence)
  private bassNotes = [130.81, 146.83, 164.81, 196.00, 220.00, 174.61]; // C3, D3, E3, G3, A3, F3
  private melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
  private chordFrequencies = [
    [261.63, 329.63, 392.00], // C Maj
    [220.00, 261.63, 329.63], // A Min
    [174.61, 220.00, 261.63], // F Maj
    [196.00, 246.94, 293.66], // G Maj
  ];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    const ctx = this.getContext();

    // BPM: 110 (Tick every 136ms for 16th notes)
    const tickIntervalMs = 136;
    this.step = 0;

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying || this.isMuted) return;
      this.tick(ctx);
      this.step = (this.step + 1) % 32;
    }, tickIntervalMs);
  }

  private tick(ctx: AudioContext) {
    const now = ctx.currentTime;
    const masterVol = this.isMuted ? 0 : this.volume;

    // 1. Kick on steps 0, 8, 16, 24
    if (this.step % 8 === 0) {
      this.playKick(ctx, now, masterVol);
    }

    // 2. Hi-hat on every odd 8th note
    if (this.step % 2 === 1) {
      this.playHiHat(ctx, now, masterVol * 0.4);
    }

    // 3. Snare / Clap on steps 4, 12, 20, 28
    if (this.step % 8 === 4) {
      this.playSnare(ctx, now, masterVol * 0.5);
    }

    // 4. Bassline
    if (this.step % 4 === 0) {
      const bassNote = this.bassNotes[(Math.floor(this.step / 4)) % this.bassNotes.length];
      this.playBass(ctx, now, bassNote, masterVol * 0.6);
    }

    // 5. Soft Melody Pluck
    if (this.step % 3 === 0 || this.step % 7 === 0) {
      const melodyNote = this.melodyNotes[(this.step * 2) % this.melodyNotes.length];
      this.playPluck(ctx, now, melodyNote, masterVol * 0.35);
    }

    // 6. Ambient Pad on every 16 steps
    if (this.step % 16 === 0) {
      const chordIdx = Math.floor(this.step / 16) % this.chordFrequencies.length;
      this.playPad(ctx, now, this.chordFrequencies[chordIdx], masterVol * 0.25);
    }
  }

  private playKick(ctx: AudioContext, time: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
    gain.gain.setValueAtTime(vol * 1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playSnare(ctx: AudioContext, time: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);
    gain.gain.setValueAtTime(vol * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playHiHat(ctx: AudioContext, time: number, vol: number) {
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.035);
  }

  private playBass(ctx: AudioContext, time: number, freq: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    gain.gain.setValueAtTime(vol * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  private playPluck(ctx: AudioContext, time: number, freq: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(vol * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  private playPad(ctx: AudioContext, time: number, chord: number[], vol: number) {
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol * 0.3, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 1.9);
    });
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public stop() {
    this.pause();
    this.step = 0;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const demoSoundtrack = new DemoSoundtrackEngine();
