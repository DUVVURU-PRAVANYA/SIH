/**
 * Audio Engine for IVR Phone Demo
 * - Web Speech API Text-to-Speech (TTS) for English & Tamil
 * - Web Audio API Dual-Tone Multi-Frequency (DTMF) telephone keypad sound synthesizer
 * - Ringback & call beep tone generator
 */

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private onSpeakingChangeCallbacks: Set<(speaking: boolean) => void> = new Set();
  private isSpeaking: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public onSpeakingChange(cb: (speaking: boolean) => void) {
    this.onSpeakingChangeCallbacks.add(cb);
    return () => this.onSpeakingChangeCallbacks.delete(cb);
  }

  private notifySpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    this.onSpeakingChangeCallbacks.forEach((cb) => cb(speaking));
  }

  /**
   * Play realistic DTMF telephone tones on keypress
   */
  public playDtmf(digit: string, durationMs: number = 160) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Standard DTMF Dual Frequencies
    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209],
      '2': [697, 1336],
      '3': [697, 1477],
      '4': [770, 1209],
      '5': [770, 1336],
      '6': [770, 1477],
      '7': [852, 1209],
      '8': [852, 1336],
      '9': [852, 1477],
      '*': [941, 1209],
      '0': [941, 1336],
      '#': [941, 1477],
    };

    const freqs = dtmfFreqs[digit] || [700, 1200];
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    // Smooth envelope to prevent audio clicking
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gainNode.gain.setValueAtTime(0.18, now + durationMs / 1000 - 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationMs / 1000);
    osc2.stop(now + durationMs / 1000);
  }

  /**
   * Play telephone ringback tone when dialing
   */
  public playRingbackTone(): () => void {
    if (this.isMuted) return () => {};
    const ctx = this.getAudioContext();
    if (!ctx) return () => {};

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.frequency.value = 440;
    osc2.frequency.value = 480;

    gainNode.gain.setValueAtTime(0.08, now);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    return () => {
      try {
        osc1.stop();
        osc2.stop();
      } catch {}
    };
  }

  /**
   * Play single alert beep for microphone prompt
   */
  public playPromptBeep() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(950, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Web Speech API Text-to-Speech (TTS)
   * Supports English ('en-IN', 'en-US') and Tamil ('ta-IN')
   */
  public speak(text: string, language: 'en' | 'ta' = 'en', onDone?: () => void) {
    if (this.isMuted || typeof window === 'undefined' || !window.speechSynthesis) {
      if (onDone) onDone();
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const cleanText = text.trim();
    if (!cleanText) {
      if (onDone) onDone();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = language === 'ta' ? 0.92 : 0.98;
    utterance.pitch = 1.0;

    // Pick best available matching voice
    const voices = window.speechSynthesis.getVoices();
    if (language === 'ta') {
      const tamilVoice = voices.find((v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
      if (tamilVoice) utterance.voice = tamilVoice;
    } else {
      const indianEnVoice = voices.find((v) => v.lang === 'en-IN' || v.name.includes('India'));
      const generalEnVoice = voices.find((v) => v.lang.startsWith('en'));
      if (indianEnVoice) {
        utterance.voice = indianEnVoice;
      } else if (generalEnVoice) {
        utterance.voice = generalEnVoice;
      }
    }

    this.notifySpeaking(true);

    utterance.onend = () => {
      this.notifySpeaking(false);
      if (onDone) onDone();
    };

    utterance.onerror = () => {
      this.notifySpeaking(false);
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.notifySpeaking(false);
  }
}

export const audioEngine = new AudioEngine();
