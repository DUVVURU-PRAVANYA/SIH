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
  private currentBufferSource: AudioBufferSourceNode | null = null;

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

    // Prompts under 185 chars in a single language should play as one continuous natural sentence
    const isFullTamil = /[\u0B80-\u0BFF]/.test(text);
    if (text.length <= 185) {
      return [{ text: text.trim(), lang: isFullTamil ? 'ta' : defaultLang }];
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

  /**
   * Sanitize text string for crystal-clear natural speech synthesis
   * Removes awkward bracket tokens, replaces Tamil suffixes/hyphens with spoken words,
   * expands doctor prefixes and numbers cleanly so TTS never stumbles or crashes.
   */
  public sanitizeVoiceText(rawText: string, lang: 'en' | 'ta'): string {
    let t = rawText
      .replace(/\[PAUSE_[^\]]+\]/gi, ' ')
      .replace(/\[[^\]]+\]/g, ' ')
      .trim();

    if (lang === 'ta') {
      // Clean up numeral suffixes: 1-ஐ -> எண் ஒன்றை
      t = t
        .replace(/1\s*-\s*ஐ/g, 'எண் ஒன்றை')
        .replace(/2\s*-\s*ஐ/g, 'எண் இரண்டை')
        .replace(/3\s*-\s*ஐ/g, 'எண் மூன்றை')
        .replace(/4\s*-\s*ஐ/g, 'எண் நான்கை')
        .replace(/5\s*-\s*ஐ/g, 'எண் ஐந்தை')
        .replace(/0\s*-\s*ஐ/g, 'எண் பூஜ்ஜியத்தை')
        .replace(/(\b[A-Z-]+-\d+)-க்கான/gi, '$1 க்கான')
        .replace(/-க்கான/g, ' க்கான');

      // Convert common token department prefixes to Tamil phonetics if encountered in raw strings
      t = t
        .replace(/\bGENMED\s*-\s*(\d+)/gi, 'பொது மருத்துவம் $1')
        .replace(/\bCARDIO\s*-\s*(\d+)/gi, 'கார்டியோ $1')
        .replace(/\bORTHO\s*-\s*(\d+)/gi, 'எலும்பியல் $1')
        .replace(/\bDERMA\s*-\s*(\d+)/gi, 'தோல் மருத்துவம் $1')
        .replace(/\bX-RAY\s*-\s*(\d+)/gi, 'எக்ஸ்-ரே $1')
        .replace(/\bPHARM\s*-\s*(\d+)/gi, 'மருந்தகம் $1')
        .replace(/\bLAB\s*-\s*(\d+)/gi, 'ஆய்வகம் $1');
    } else {
      // English cleanup
      t = t
        .replace(/\bDr\.?\s+/gi, 'Doctor ')
        .replace(/\bGENMED\s*-\s*(\d+)/gi, 'General Medicine $1')
        .replace(/\bCARDIO\s*-\s*(\d+)/gi, 'Cardiology $1')
        .replace(/\bORTHO\s*-\s*(\d+)/gi, 'Orthopedics $1')
        .replace(/\bDERMA\s*-\s*(\d+)/gi, 'Dermatology $1')
        .replace(/\bX-RAY\s*-\s*(\d+)/gi, 'X-Ray $1')
        .replace(/\bPHARM\s*-\s*(\d+)/gi, 'Pharmacy $1')
        .replace(/\bLAB\s*-\s*(\d+)/gi, 'Laboratory $1');
    }

    // Clean up extra hyphens and double spaces
    t = t.replace(/\s*-\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return t;
  }

  private async playSegment(text: string, lang: 'en' | 'ta', onEnded: () => void) {
    const seqId = this.activeSequenceId;
    const sanitizedText = this.sanitizeVoiceText(text, lang);
    if (!sanitizedText) {
      onEnded();
      return;
    }

    let finished = false;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

    const safeEnd = () => {
      if (finished) return;
      finished = true;
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      if (seqId === this.activeSequenceId) {
        onEnded();
      }
    };

    // Watchdog timer: estimated duration based on text length + 3.5s buffer
    // Guarantees speech engine NEVER freezes or crashes even on stream or audio hardware stalls
    const expectedDurationMs = Math.max(4000, Math.min(22000, sanitizedText.length * 105 + 3500));
    watchdogTimer = setTimeout(() => {
      safeEnd();
    }, expectedDurationMs);

    // 1. Primary: Stream natural telephone audio via unlocked Web Audio Context
    // Bypasses browser autoplay restrictions even after async pauses
    const ctx = this.getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {}
      }

      const candidates: string[] = [];
      if (typeof window !== 'undefined') {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        candidates.push(`/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
        candidates.push(`/api/ivr/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
        candidates.push(`https://sih-tisd.onrender.com/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
        candidates.push(`https://sih-tisd.onrender.com/api/ivr/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
        if (isLocal) {
          const host = window.location.hostname || 'localhost';
          candidates.push(`http://${host}:4000/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
          candidates.push(`http://${host}:4000/api/ivr/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
          candidates.push(`http://localhost:4000/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
        }
      } else {
        candidates.push(`https://sih-tisd.onrender.com/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
        candidates.push(`http://localhost:4000/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`);
      }

      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            if (seqId !== this.activeSequenceId) {
              safeEnd();
              return;
            }
            const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
            if (seqId !== this.activeSequenceId) {
              safeEnd();
              return;
            }

            if (ctx.state === 'suspended') {
              try {
                await ctx.resume();
              } catch {}
            }

            const source = ctx.createBufferSource();
            source.buffer = audioBuf;
            source.connect(ctx.destination);
            this.currentBufferSource = source;

            source.onended = () => {
              this.currentBufferSource = null;
              safeEnd();
            };

            source.start(0);
            return;
          }
        } catch (fetchErr) {
          console.warn('[IVR TTS] candidate fetch failed:', url, fetchErr);
        }
      }
    }

    if (seqId !== this.activeSequenceId) {
      safeEnd();
      return;
    }

    // 2. Secondary: Fallback to HTMLAudio element
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(sanitizedText)}&lang=${lang}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        safeEnd();
      };
      audio.onerror = () => {
        this.currentAudio = null;
        this.fallbackSpeechSynthesis(sanitizedText, lang, safeEnd);
      };

      await audio.play();
    } catch {
      this.currentAudio = null;
      this.fallbackSpeechSynthesis(sanitizedText, lang, safeEnd);
    }
  }

  private fallbackSpeechSynthesis(text: string, lang: 'en' | 'ta', onEnded: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnded();
      return;
    }

    try {
      window.speechSynthesis.cancel();
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

      let ended = false;
      const done = () => {
        if (!ended) {
          ended = true;
          onEnded();
        }
      };

      utterance.onend = done;
      utterance.onerror = done;

      // Chrome SpeechSynthesis safety timeout:
      const timeoutMs = Math.max(3000, text.length * 110);
      setTimeout(done, timeoutMs);

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnded();
    }
  }

  public stopSpeaking() {
    this.activeSequenceId++;
    if (this.currentBufferSource) {
      try {
        this.currentBufferSource.stop();
        this.currentBufferSource.disconnect();
      } catch {}
      this.currentBufferSource = null;
    }
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
