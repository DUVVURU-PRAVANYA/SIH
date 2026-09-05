import { Language } from '../types';

class VoiceSynthesizer {
  private isMuted: boolean = false;
  private speechRate: number = 0.95; // slightly slower for maximum clarity in public hospitals

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setRate(rate: number) {
    this.speechRate = Math.max(0.6, Math.min(1.5, rate));
  }

  public playChime(type: 'turn' | 'alert' | 'success' | 'click' = 'alert') {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'turn') {
        // High alert chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext might be blocked until user interaction
    }
  }

  public speak(text: string, lang: Language = 'ta', onEnd?: () => void) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    // Cancel current speech before new one
    window.speechSynthesis.cancel();

    // Play pleasant alert chime first
    this.playChime('turn');

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;

      // Try to find a matching Tamil or Indian English voice
      const voices = window.speechSynthesis.getVoices();
      if (lang === 'ta') {
        utterance.lang = 'ta-IN';
        const taVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('Tamil') || v.name.includes('Tamil'));
        if (taVoice) {
          utterance.voice = taVoice;
        } else {
          // Fallback to Indian English if Tamil voice isn't installed in the OS
          const inVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India'));
          if (inVoice) utterance.voice = inVoice;
        }
      } else {
        utterance.lang = 'en-IN';
        const inVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India'));
        if (inVoice) {
          utterance.voice = inVoice;
        }
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    }, 200);
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceService = new VoiceSynthesizer();
