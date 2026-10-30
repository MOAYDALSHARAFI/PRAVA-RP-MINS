// Web Audio API Synthesizer for 15 Military & Interactive Announcement Sound Effects
// Completely client-side, zero external audio files, works instantly in all browsers

class AnnouncementAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // 1. Fireworks: Whistle ascending followed by bursting thuds & crackle
  playFireworks() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Launch whistle
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);

    // Explosive burst
    setTimeout(() => {
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.7);
      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.4, ctx.currentTime);
      burstGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      noise.connect(filter);
      filter.connect(burstGain);
      burstGain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    }, 380);
  }

  // 2. Military Cruiser Siren: Two-tone urgent wailing siren
  playMilitaryCarSiren() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    const t = ctx.currentTime;
    // Siren cycle: high-low-high-low
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.linearRampToValueAtTime(980, t + 0.35);
    osc.frequency.linearRampToValueAtTime(750, t + 0.7);
    osc.frequency.linearRampToValueAtTime(980, t + 1.05);
    osc.frequency.linearRampToValueAtTime(750, t + 1.4);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.1);
    gain.gain.setValueAtTime(0.18, t + 1.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 1.6);
  }

  // 3. Helicopter: Low-frequency rhythmic rotor chops (whup whup whup)
  playHelicopter() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const chopTime = t + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65, chopTime);
      osc.frequency.exponentialRampToValueAtTime(35, chopTime + 0.12);

      gain.gain.setValueAtTime(0.3, chopTime);
      gain.gain.exponentialRampToValueAtTime(0.01, chopTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(chopTime);
      osc.stop(chopTime + 0.13);
    }
  }

  // 4. Radar Sweep: Sonar ping with deep echo
  playRadarSweep() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.8);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  // 5. Jet Flyover: Ascending sonic whoosh & jet engine roar
  playJetFlyover() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3, t);
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.7);
    filter.frequency.exponentialRampToValueAtTime(300, t + 1.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 1.5);
  }

  // 6. Red Alert: Military klaxon warning horn
  playRedAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const alarmTime = t + i * 0.55;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, alarmTime);
      osc.frequency.linearRampToValueAtTime(620, alarmTime + 0.4);

      gain.gain.setValueAtTime(0.2, alarmTime);
      gain.gain.exponentialRampToValueAtTime(0.01, alarmTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(alarmTime);
      osc.stop(alarmTime + 0.45);
    }
  }

  // 7. Tank Convoy: Deep diesel engine rumble & track vibrations
  playTankConvoy() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(45, t + 1.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  // 8. Golden Stars: Shimmering magical crystal chime arpeggio
  playGoldenStars() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    const t = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  }

  // 9. Radio Dispatch: Static squawk followed by tactical roger beep
  playRadioDispatch() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Static click
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    // Roger Beep
    setTimeout(() => {
      if (!ctx) return;
      const beep = ctx.createOscillator();
      const beepGain = ctx.createGain();
      beep.type = 'sine';
      beep.frequency.setValueAtTime(1200, ctx.currentTime);
      beep.frequency.setValueAtTime(1500, ctx.currentTime + 0.08);
      beepGain.gain.setValueAtTime(0.2, ctx.currentTime);
      beepGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      beep.connect(beepGain);
      beepGain.connect(ctx.destination);
      beep.start(ctx.currentTime);
      beep.stop(ctx.currentTime + 0.18);
    }, 100);
  }

  // 10. Marching Drums: Snare cadence beats
  playMarchingDrums() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const rhythm = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
    rhythm.forEach((delay) => {
      const hitTime = t + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, hitTime);
      osc.frequency.exponentialRampToValueAtTime(60, hitTime + 0.08);

      gain.gain.setValueAtTime(0.3, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.01, hitTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(hitTime);
      osc.stop(hitTime + 0.09);
    });
  }

  // 11. Smoke Screen: Hissing pressurized canister
  playSmokeScreen() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.9;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.85);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  // 12. Breaking News: Teletype rapid urgent broadcast beeps
  playBreakingNews() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const beepTime = t + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, beepTime);

      gain.gain.setValueAtTime(0.2, beepTime);
      gain.gain.exponentialRampToValueAtTime(0.01, beepTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(beepTime);
      osc.stop(beepTime + 0.08);
    }
  }

  // 13. Camera Flashes: Shutter click with flash capacitor charge
  playCameraFlashes() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const clickTime = t + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, clickTime);
      osc.frequency.exponentialRampToValueAtTime(200, clickTime + 0.04);

      gain.gain.setValueAtTime(0.25, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.01, clickTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(clickTime);
      osc.stop(clickTime + 0.05);
    }
  }

  // 14. Laser Target: Electronic sweep lock-on pulse
  playLaserTarget() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(2200, t + 0.35);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // 15. Official Stamp: Heavy resonant thud of an official wax seal / brass stamp
  playWaxStamp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  private currentAudio: HTMLAudioElement | null = null;

  // Stop any currently playing audio
  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
  }

  // Play a custom audio URL (MP3, WAV, base64 data-URI, etc.)
  playCustomAudio(url: string, volume = 0.85): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.stop();
        const audio = new Audio(url);
        audio.volume = Math.max(0, Math.min(1, volume));
        this.currentAudio = audio;
        audio.onended = () => {
          this.currentAudio = null;
          resolve(true);
        };
        audio.onerror = () => {
          this.currentAudio = null;
          resolve(false);
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => resolve(true)).catch(() => resolve(false));
        }
      } catch {
        resolve(false);
      }
    });
  }

  // Master dispatcher with custom audio support
  playSoundForFx(fxType?: string, customSoundUrl?: string | null, volume = 0.85) {
    this.stop();
    // If a custom sound URL is provided, try playing it first!
    if (customSoundUrl && customSoundUrl.trim().length > 0) {
      this.playCustomAudio(customSoundUrl.trim(), volume).then((success) => {
        if (!success) {
          // Fallback to synthesizer if custom sound fails to load
          this.playSynthesizedFx(fxType);
        }
      });
      return;
    }

    // Otherwise play the synthesized sound
    this.playSynthesizedFx(fxType);
  }

  // Synthesizer dispatcher
  playSynthesizedFx(fxType?: string) {
    switch (fxType) {
      case 'fireworks':
        this.playFireworks();
        break;
      case 'military_car':
        this.playMilitaryCarSiren();
        break;
      case 'helicopter':
        this.playHelicopter();
        break;
      case 'radar_scan':
        this.playRadarSweep();
        break;
      case 'jet_flyover':
        this.playJetFlyover();
        break;
      case 'red_alert':
        this.playRedAlert();
        break;
      case 'tank_convoy':
        this.playTankConvoy();
        break;
      case 'golden_stars':
        this.playGoldenStars();
        break;
      case 'radio_dispatch':
        this.playRadioDispatch();
        break;
      case 'marching_drums':
        this.playMarchingDrums();
        break;
      case 'smoke_screen':
        this.playSmokeScreen();
        break;
      case 'breaking_news':
        this.playBreakingNews();
        break;
      case 'camera_flashes':
        this.playCameraFlashes();
        break;
      case 'laser_target':
        this.playLaserTarget();
        break;
      case 'wax_stamp':
        this.playWaxStamp();
        break;
      default:
        this.playGoldenStars();
        break;
    }
  }
}

export const announcementAudio = new AnnouncementAudioEngine();
