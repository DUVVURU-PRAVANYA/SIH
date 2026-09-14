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
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Warm up voice list
      window.speechSynthesis.getVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

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

  private activeSequenceId: number = 0;

  /**
   * Split text by script (English vs Tamil) and sentence lengths for natural IVR speech
   * Supports [PAUSE_3S] and transition delays
   */
  private segmentSpeechText(
    text: string,
    defaultLang: 'en' | 'ta' = 'en'
  ): Array<{ text: string; lang: 'en' | 'ta'; delayBeforeMs?: number }> {
    // If text contains explicit pause indicator like [PAUSE_3S]
    if (text.includes('[PAUSE_3S]')) {
      const halves = text.split('[PAUSE_3S]');
      const part1 = halves[0].trim();
      const part2 = halves[1].trim();
      return [
        { text: part1, lang: /[\u0B80-\u0BFF]/.test(part1) ? 'ta' : 'en' },
        { text: part2, lang: /[\u0B80-\u0BFF]/.test(part2) ? 'ta' : 'en', delayBeforeMs: 3000 },
      ];
    }

    const parts: Array<{ text: string; lang: 'en' | 'ta'; delayBeforeMs?: number }> = [];
    const lines = text.split(/(?<=[.?!,;:\n])\s+/);

    for (const part of lines) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const isTamil = /[\u0B80-\u0BFF]/.test(trimmed);
      const lang: 'en' | 'ta' = isTamil ? 'ta' : defaultLang;

      // If transitioning from English to Tamil, insert 3-second pause
      const isTransition = parts.length > 0 && parts[parts.length - 1].lang === 'en' && lang === 'ta';

      if (
        !isTransition &&
        parts.length > 0 &&
        parts[parts.length - 1].lang === lang &&
        (parts[parts.length - 1].text + ' ' + trimmed).length <= 140
      ) {
        parts[parts.length - 1].text += ' ' + trimmed;
      } else {
        parts.push({
          text: trimmed,
          lang,
          delayBeforeMs: isTransition ? 3000 : 0,
        });
      }
    }

    return parts.length > 0 ? parts : [{ text, lang: defaultLang }];
  }

  /**
   * High-Fidelity Text-to-Speech (TTS)
   * Streams crystal-clear natural telephone voice for both English and Tamil
   */
  public speak(text: string, language: 'en' | 'ta' = 'en', onDone?: () => void) {
    if (this.isMuted) {
      if (onDone) onDone();
      return;
    }

    this.stopSpeaking();

    const cleanText = text.trim();
    if (!cleanText) {
      if (onDone) onDone();
      return;
    }

    const seqId = ++this.activeSequenceId;
    const segments = this.segmentSpeechText(cleanText, language);
    let segIdx = 0;

    this.notifySpeaking(true);

    const playNext = () => {
      if (seqId !== this.activeSequenceId) return;

      if (segIdx >= segments.length) {
        this.notifySpeaking(false);
        this.currentAudio = null;
        if (onDone) onDone();
        return;
      }

      const segment = segments[segIdx++];
      const runSegment = () => {
        if (seqId !== this.activeSequenceId) return;
        this.notifySpeaking(true);
        this.playSegment(segment.text, segment.lang, () => {
          if (seqId === this.activeSequenceId) {
            playNext();
          }
        });
      };

      if (segment.delayBeforeMs && segment.delayBeforeMs > 0) {
        // Pause between languages (e.g. 3-second delay after English before speaking Tamil)
        this.notifySpeaking(false);
        setTimeout(runSegment, segment.delayBeforeMs);
      } else {
        runSegment();
      }
    };

    playNext();
  }

  private playSegment(text: string, lang: 'en' | 'ta', onEnded: () => void) {
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`;
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    let fallbackUsed = false;
    const triggerFallback = () => {
      if (fallbackUsed) return;
      fallbackUsed = true;

      // Direct upstream fallback with no-referrer
      const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
      const directAudio = new Audio(directUrl);
      this.currentAudio = directAudio;

      directAudio.onended = () => onEnded();
      directAudio.onerror = () => {
        this.fallbackSpeechSynthesis(text, lang, onEnded);
      };

      directAudio.play().catch(() => {
        this.fallbackSpeechSynthesis(text, lang, onEnded);
      });
    };

    audio.onended = () => {
      onEnded();
    };

    audio.onerror = () => {
      triggerFallback();
    };

    audio.play().catch(() => {
      triggerFallback();
    });
  }

  private fallbackSpeechSynthesis(text: string, lang: 'en' | 'ta', onEnded: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnded();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = lang === 'ta' ? 0.92 : 0.98;

      const voices = window.speechSynthesis.getVoices();
      if (lang === 'ta') {
        const taVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('ta') ||
            v.name.toLowerCase().includes('tamil') ||
            v.name.toLowerCase().includes('valluvar')
        );
        if (taVoice) utterance.voice = taVoice;
      } else {
        const enVoice =
          voices.find((v) => v.lang === 'en-IN' || v.name.includes('India')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.onend = () => onEnded();
      utterance.onerror = () => onEnded();
      window.speechSynthesis.speak(utterance);
    } catch {
      onEnded();
    }
  }

  public stopSpeaking() {
    this.activeSequenceId++;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.notifySpeaking(false);
  }
}

export const audioEngine = new AudioEngine();
