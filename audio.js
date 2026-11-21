/** Small, entirely synthesized garden sounds. Call unlock() in a pointer gesture. */
export class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.disposed = false;
    this.voices = [];
    this.lastPlayed = new Map();
    this.maxVoices = 18;
    this.noise = null;
  }

  unlock() {
    if (this.disposed) return Promise.resolve(false);
    try {
      if (!this.context) {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) return Promise.resolve(false);
        this.context = new Context();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        // A soft limiter keeps overlapping impacts comfortable on phone speakers.
        this.limiter = this.context.createDynamicsCompressor();
        this.limiter.threshold.value = -12;
        this.limiter.knee.value = 16;
        this.limiter.ratio.value = 5;
        this.master.connect(this.limiter);
        this.limiter.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate * 0.5, this.context.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      // Starting a silent source within the gesture also unlocks older mobile Safari.
      const silent = this.context.createBufferSource();
      silent.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      silent.connect(this.master);
      silent.onended = () => silent.disconnect();
      silent.start();
      return this.context.resume().then(() => this.context.state === 'running').catch(() => false);
    } catch {
      return Promise.resolve(false);
    }
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.context && this.master && this.context.state !== 'closed') {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.28, now, 0.015);
    }
  }

  _voice(source, gain, filter, start, end) {
    while (this.voices.length >= this.maxVoices) {
      const oldest = this.voices.shift();
      try { oldest.source.stop(); } catch { /* Already ended. */ }
      oldest.source.disconnect();
      oldest.gain.disconnect();
      if (oldest.filter) oldest.filter.disconnect();
    }
    const voice = { source, gain, filter };
    this.voices.push(voice);
    source.onended = () => {
      const index = this.voices.indexOf(voice);
      if (index !== -1) this.voices.splice(index, 1);
      source.disconnect();
      gain.disconnect();
      if (filter) filter.disconnect();
    };
    source.start(start);
    source.stop(end);
  }

  _tone(frequency, duration = 0.12, volume = 0.4, type = 'sine', delay = 0, target = frequency) {
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, target), start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.008, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    this._voice(oscillator, gain, null, start, start + duration + 0.01);
  }

  _rustle(duration = 0.12, volume = 0.25, frequency = 1500, delay = 0) {
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.45), start + duration);
    filter.Q.value = 0.65;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    this._voice(source, gain, filter, start, start + duration + 0.01);
  }

  play(eventName) {
    const ctx = this.context;
    if (this.disposed || this.muted || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const cooldown = { stretch: 0.105, shot: 0.055, hit: 0.045, tap: 0.045, error: 0.15 }[eventName] || 0.025;
    if (now - (this.lastPlayed.get(eventName) ?? -Infinity) < cooldown) return;
    this.lastPlayed.set(eventName, now);
    switch (eventName) {
      case 'select':
        this._tone(520, 0.095, 0.3, 'sine', 0, 690);
        break;
      case 'tap':
        this._tone(400, 0.055, 0.23, 'sine', 0, 320);
        break;
      case 'stretch':
        this._tone(170, 0.11, 0.18, 'triangle', 0, 245);
        break;
      case 'launch':
        this._tone(320, 0.2, 0.42, 'triangle', 0, 95);
        this._rustle(0.15, 0.24, 2300);
        break;
      case 'plant':
        this._rustle(0.13, 0.35, 650);
        this._tone(330, 0.11, 0.33, 'sine', 0.025, 490);
        this._tone(660, 0.15, 0.22, 'sine', 0.1, 740);
        break;
      case 'explode':
        this._tone(145, 0.25, 0.64, 'triangle', 0, 42);
        this._rustle(0.28, 0.6, 1080);
        this._tone(480, 0.12, 0.15, 'sine', 0.06, 160);
        break;
      case 'shot':
        this._tone(680, 0.075, 0.25, 'sine', 0, 220);
        break;
      case 'hit':
        this._tone(150, 0.1, 0.42, 'triangle', 0, 65);
        this._rustle(0.065, 0.28, 950);
        break;
      case 'kill':
        this._tone(220, 0.13, 0.36, 'triangle', 0, 85);
        this._tone(560, 0.12, 0.22, 'sine', 0.035, 810);
        this._rustle(0.14, 0.3, 1200);
        break;
      case 'energy':
        this._tone(660, 0.14, 0.26, 'sine');
        this._tone(990, 0.23, 0.23, 'sine', 0.075);
        break;
      case 'wave':
        [330, 440, 587.33].forEach((note, i) => this._tone(note, 0.22, 0.27, 'triangle', i * 0.105));
        break;
      case 'breach':
        this._tone(180, 0.25, 0.43, 'triangle', 0, 90);
        this._tone(135, 0.25, 0.3, 'triangle', 0.14, 67.5);
        this._rustle(0.23, 0.28, 420);
        break;
      case 'win':
        [392, 493.88, 587.33, 783.99].forEach((note, i) => this._tone(note, i === 3 ? 0.55 : 0.25, 0.3, 'sine', i * 0.12));
        this._tone(392, 0.52, 0.14, 'triangle', 0.36);
        break;
      case 'lose':
        [330, 293.66, 220].forEach((note, i) => this._tone(note, 0.32, 0.26, 'triangle', i * 0.18, note * 0.96));
        break;
      case 'error':
        this._tone(190, 0.09, 0.2, 'triangle', 0, 160);
        this._tone(145, 0.1, 0.17, 'triangle', 0.085, 130);
        break;
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const voice of this.voices.splice(0)) {
      try { voice.source.stop(); } catch { /* Already ended. */ }
      voice.source.disconnect();
      voice.gain.disconnect();
      if (voice.filter) voice.filter.disconnect();
    }
    this.lastPlayed.clear();
    this.master?.disconnect();
    this.limiter?.disconnect();
    if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    this.noise = null;
  }
}
