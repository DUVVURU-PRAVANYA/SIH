import React, { useState, useEffect, useRef } from 'react';
import { Phone } from 'lucide-react';
import { PhoneChassis } from './components/PhoneChassis';
import { IVRSession, IVRCallState } from './types';
import { ivrClient } from './services/ivrClient';
import { audioEngine } from './utils/audio';

export const App: React.FC = () => {
  const [session, setSession] = useState<IVRSession | null>(null);
  const [callState, setCallState] = useState<IVRCallState>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [callerPhone, setCallerPhone] = useState('9876543210');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeDigit, setActiveDigit] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const ringbackCancelRef = useRef<any>(null);
  const languageRepeatTimeoutRef = useRef<any>(null);
  const callStateRef = useRef<IVRCallState>(callState);

  const sessionRef = useRef<IVRSession | null>(session);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const clearLanguageRepeat = () => {
    if (languageRepeatTimeoutRef.current) {
      clearTimeout(languageRepeatTimeoutRef.current);
      languageRepeatTimeoutRef.current = null;
    }
  };

  const scheduleLanguageRepeat = () => {
    clearLanguageRepeat();
    if (callStateRef.current === 'LANGUAGE_MENU') {
      languageRepeatTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === 'LANGUAGE_MENU') {
          // Repeat asking in Tamil after 3 seconds
          const tamilPrompt = 'அரசு தலைமை மருத்துவமனைக்கு நல்வரவு. தமிழுக்கு எண் இரண்டை அழுத்தவும்.';
          audioEngine.speak(tamilPrompt, 'ta', () => {
            scheduleLanguageRepeat();
          });
        }
      }, 3000);
    }
  };

  // Connect WebSocket on mount for real-time consultation completion & stage updates
  useEffect(() => {
    const unsubSpeaking = audioEngine.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });

    // Realtime WebSocket listener for doctor consultation completion & stage updates
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const wsUrl = isLocal ? `${protocol}//${window.location.hostname}:4000/ws` : `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          const relevantEvents = [
            'CONSULTATION_COMPLETED',
            'CONSULTATION_STARTED',
            'PATIENT_CALLED',
            'DIAGNOSTIC_COMPLETED',
            'PHARMACY_COMPLETED',
            'PHARMACY_UPDATED',
            'QUEUE_UPDATED',
          ];

          if (data.event && relevantEvents.includes(data.event)) {
            const currentLang = sessionRef.current?.language || 'en';
            const statusInfo = await ivrClient.checkStatus(callerPhone, currentLang);
            if (statusInfo && statusInfo.hasToken) {
              setSession((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  currentStage: statusInfo.currentStage,
                  isCompleted: statusInfo.isCompleted,
                  stageTitle: statusInfo.stageTitle,
                  diagnosis: statusInfo.diagnosis,
                  doctorName: statusInfo.doctorName,
                  queueStatus: statusInfo.queueStatus,
                  generatedToken: statusInfo.token,
                  peopleAhead: statusInfo.peopleAhead,
                  estimatedWaitMinutes: statusInfo.waitMinutes,
                  lastSpokenText: (prev.state === 'CHECK_STATUS' || prev.state === 'REPEAT_TOKEN') ? statusInfo.message : prev.lastSpokenText,
                };
              });
            }
          }
        } catch {}
      };
    } catch (wsErr) {
      console.warn('Phone WebSocket sync init warning:', wsErr);
    }

    return () => {
      unsubSpeaking();
      if (ws) ws.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (ringbackCancelRef.current) ringbackCancelRef.current();
      clearLanguageRepeat();
      audioEngine.stopSpeaking();
    };
  }, [callerPhone]);

  // Handle call timer ticking
  useEffect(() => {
    const isInCall = callState !== 'IDLE' && callState !== 'CALLING' && callState !== 'CALL_ENDED';
    if (isInCall) {
      if (!timerRef.current) {
        setCallDuration(0);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [callState]);

  // Action: Start Call
  const handleStartCall = async () => {
    try {
      clearLanguageRepeat();
      setCallState('CALLING');
      callStateRef.current = 'CALLING';
      setCallDuration(0);

      // Play ringing sound
      const stopRinging = audioEngine.playRingbackTone();
      ringbackCancelRef.current = stopRinging;

      // Make API call
      const res = await ivrClient.startCall(callerPhone, 'en');

      // Simulate 1.2s connection delay for realism
      setTimeout(() => {
        if (ringbackCancelRef.current) {
          ringbackCancelRef.current();
          ringbackCancelRef.current = null;
        }

        setSession(res.session);
        setCallState(res.state);
        callStateRef.current = res.state;

        clearLanguageRepeat();

        if (res.state === 'CALL_ENDED') {
          // Unregistered caller prompt: speak rejection announcement
          audioEngine.speak(res.spokenText, 'en');
          return;
        }

        // Speak aloud: English prompt -> [3-second pause] -> Tamil prompt
        // Once completed, if user has not pressed a key, repeat asking in Tamil after 3 seconds
        audioEngine.speak(res.spokenText, res.language, () => {
          scheduleLanguageRepeat();
        });
      }, 1200);
    } catch (err: any) {
      console.error('Failed to start call:', err);
      if (ringbackCancelRef.current) ringbackCancelRef.current();
      setCallState('IDLE');
      callStateRef.current = 'IDLE';
      alert(`Could not connect to IVR telephony service: ${err.message}`);
    }
  };

  // Action: Keypress DTMF
  const handleKeyPress = async (digit: string) => {
    if (!session) return;

    // Immediately stop pending language repeat and ongoing speech on keypress
    clearLanguageRepeat();
    audioEngine.stopSpeaking();

    // Visual Flash
    setActiveDigit(digit);
    setTimeout(() => setActiveDigit(null), 350);

    try {
      const res = await ivrClient.sendDtmf(session.sessionId, digit);
      if (res.success) {
        setSession(res.session);
        setCallState(res.state);
        callStateRef.current = res.state;

        // Speak response aloud
        audioEngine.speak(res.spokenText, res.language);
      }
    } catch (err) {
      console.error('Keypress error:', err);
    }
  };

  // Action: Symptom Speech Submission
  const handleSymptomSubmit = async (transcript: string) => {
    if (!session) return;

    try {
      const res = await ivrClient.sendSymptom(session.sessionId, transcript);
      if (res.success) {
        setSession(res.session);
        setCallState(res.state);
        callStateRef.current = res.state;

        // Speak response aloud
        audioEngine.speak(res.spokenText, res.language);
      }
    } catch (err) {
      console.error('Symptom submit error:', err);
    }
  };

  // Action: End Call
  const handleEndCall = async () => {
    clearLanguageRepeat();
    audioEngine.stopSpeaking();
    if (ringbackCancelRef.current) {
      ringbackCancelRef.current();
      ringbackCancelRef.current = null;
    }

    if (session) {
      try {
        await ivrClient.endCall(session.sessionId);
      } catch {}
    }

    setCallState('CALL_ENDED');
    callStateRef.current = 'CALL_ENDED';
  };

  // Action: Repeat Voice Prompt
  const handleRepeatVoice = () => {
    if (session?.lastSpokenText) {
      clearLanguageRepeat();
      const textToSpeak = session.state === 'LANGUAGE_MENU'
        ? `${session.lastPromptTextEn || ''} [PAUSE_3S] ${session.lastPromptTextTa || ''}`.trim()
        : session.lastSpokenText;
      audioEngine.speak(textToSpeak, session.language, () => {
        if (callStateRef.current === 'LANGUAGE_MENU') {
          scheduleLanguageRepeat();
        }
      });
    }
  };

  // Action: Toggle Audio Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 text-slate-800 flex flex-col justify-between selection:bg-[#12B8A6] selection:text-white relative overflow-x-hidden">
      {/* Clean Institutional Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs select-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Service Title */}
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.endsWith('/carenexus-emblem.png')) {
                  target.src = '/carenexus-emblem.png';
                }
              }}
              alt="CareNexus Emblem"
              className="h-10 w-10 object-contain shrink-0"
            />
            <img
              src={`${import.meta.env.BASE_URL}carenexus-wordmark.png`}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.endsWith('/carenexus-wordmark.png')) {
                  target.src = '/carenexus-wordmark.png';
                }
              }}
              alt="CareNexus"
              className="h-6 w-auto object-contain shrink-0"
            />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-[#00A272] border border-emerald-200/60 hidden sm:inline-block">
              OPD IVR Telephony
            </span>
          </div>

          {/* Contact Helpline */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="hidden sm:inline text-slate-500">Toll-Free Helpline:</span>
            <strong className="font-mono text-[#00A272] font-bold text-sm">1800-425-4474</strong>
          </div>
        </div>
      </header>

      {/* Main Stage: Center Phone Device as Hero Element */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative z-10 gap-2">
        {/* Caller SIM Switcher */}
        <div className="w-full max-w-[350px] sm:max-w-[370px] px-3.5 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between gap-2 text-xs select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-500 text-[11px] shrink-0">Caller SIM:</span>
            <input
              type="text"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="10-digit phone"
              className="w-24 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-teal-500"
              disabled={callState !== 'IDLE'}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCallerPhone('9876543210')}
              disabled={callState !== 'IDLE'}
              title="Registered Patient (Arun Kumar)"
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${callerPhone === '9876543210' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Registered
            </button>
            <button
              onClick={() => setCallerPhone('9999900000')}
              disabled={callState !== 'IDLE'}
              title="Unregistered Number"
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${callerPhone === '9999900000' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Unregistered
            </button>
          </div>
        </div>

        <PhoneChassis
          session={session}
          callState={callState}
          callDuration={callDuration}
          isSpeaking={isSpeaking}
          activeDigit={activeDigit}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onKeyPress={handleKeyPress}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onRepeatVoice={handleRepeatVoice}
          onSymptomSubmit={handleSymptomSubmit}
          callerPhone={callerPhone}
        />
      </main>

      {/* Institutional CareNexus Footer */}
      <footer className="py-2.5 px-4 text-center text-xs text-slate-400 bg-white/80 border-t border-slate-200/60 select-none">
        CareNexus™ • District Headquarters Government Hospital • OPD Telephony Service
      </footer>
    </div>
  );
};
