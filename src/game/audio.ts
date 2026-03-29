type ToneType = OscillatorType;

interface ToneOptions {
  frequency: number;
  duration: number;
  type?: ToneType;
  gain?: number;
  slideTo?: number;
}

export class SynthJukebox {
  private context?: AudioContext;

  unlock(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioCtor = window.AudioContext;

    if (!AudioCtor) {
      return;
    }

    if (!this.context) {
      this.context = new AudioCtor();
    }

    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  private pulse({
    frequency,
    duration,
    type = 'triangle',
    gain = 0.06,
    slideTo,
  }: ToneOptions): void {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(envelope);
    envelope.connect(this.context.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  playLaunch(): void {
    this.unlock();
    this.pulse({ frequency: 420, slideTo: 180, duration: 0.24, type: 'sawtooth', gain: 0.045 });
    this.pulse({ frequency: 620, slideTo: 240, duration: 0.18, type: 'triangle', gain: 0.032 });
  }

  playImpact(intensity: number): void {
    if (intensity < 5) {
      return;
    }

    this.unlock();
    const base = Math.min(340, 120 + intensity * 12);
    this.pulse({ frequency: base, slideTo: base * 0.74, duration: 0.12, type: 'square', gain: 0.03 });
  }

  playBounce(): void {
    this.unlock();
    this.pulse({ frequency: 520, slideTo: 690, duration: 0.12, type: 'triangle', gain: 0.03 });
  }

  playExplosion(): void {
    this.unlock();
    this.pulse({ frequency: 140, slideTo: 60, duration: 0.3, type: 'sawtooth', gain: 0.05 });
    this.pulse({ frequency: 280, slideTo: 110, duration: 0.18, type: 'square', gain: 0.03 });
  }

  playWin(): void {
    this.unlock();
    this.pulse({ frequency: 392, duration: 0.12, gain: 0.04 });
    window.setTimeout(() => this.pulse({ frequency: 523, duration: 0.14, gain: 0.04 }), 90);
    window.setTimeout(() => this.pulse({ frequency: 659, duration: 0.18, gain: 0.045 }), 180);
  }

  playLose(): void {
    this.unlock();
    this.pulse({ frequency: 280, slideTo: 180, duration: 0.22, type: 'square', gain: 0.04 });
    window.setTimeout(() => this.pulse({ frequency: 190, slideTo: 120, duration: 0.28, type: 'square', gain: 0.04 }), 130);
  }
}

export const jukebox = new SynthJukebox();
