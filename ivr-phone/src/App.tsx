import React, { useState, useEffect, useRef } from 'react';
import { PhoneChassis } from './components/PhoneChassis';
import { IVRSession, IVRCallState } from './types';
import { ivrClient } from './services/ivrClient';
import { audioEngine } from './utils/audio';

export const App: React.FC = () => {
  const [session, setSession] = useState<IVRSession | null>(null);
  const [callState, setCallState] = useState<IVRCallState>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [callerPhone] = useState('9876543210');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeDigit, setActiveDigit] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const ringbackCancelRef = useRef<any>(null);
  const languageRepeatTimeoutRef = useRef<any>(null);
  const callStateRef = useRef<IVRCallState>(callState);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

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
          const tamilPrompt = 'அரசு தலைமை மருத்துவமனைக்கு நல்வரவு. தமிழுக்கு 2-ஐ அழுத்தவும்.';
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
      ws = new WebSocket('ws://localhost:4000/ws');
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
            const statusInfo = await ivrClient.checkStatus(callerPhone, session?.language || 'en');
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
  }, [callerPhone, session?.language]);

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
      alert(`Could not connect to IVR server on port 4000: ${err.message}`);
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
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Clean Minimal Top Header */}
      <header className="pt-6 pb-2 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold tracking-tight text-white font-serif">
          GH-QueueFlow
        </h1>
        <p className="text-xs text-teal-400 font-medium tracking-wide mt-0.5">
          Telephone IVR Service
        </p>
      </header>

      {/* Main Stage: Center Phone Device as Hero Element */}
      <main className="flex-1 flex items-center justify-center px-4 py-2">
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

      {/* Subtle Clean Minimal Footer */}
      <footer className="pb-4 pt-1 text-center text-[11px] text-slate-600">
        Government Hospital Queue Management System • Telephone IVR Service
      </footer>
    </div>
  );
};
