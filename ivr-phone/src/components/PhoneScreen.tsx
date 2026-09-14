import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  PhoneCall,
  Mic,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Volume2,
} from 'lucide-react';
import { IVRSession, IVRCallState } from '../types';
import { audioEngine } from '../utils/audio';

interface PhoneScreenProps {
  session: IVRSession | null;
  callState: IVRCallState;
  callDuration: number;
  isSpeaking: boolean;
  activeDigit: string | null;
  onSymptomSubmit: (transcript: string) => void;
  callerPhone: string;
}

export const PhoneScreen: React.FC<PhoneScreenProps> = ({
  session,
  callState,
  callDuration,
  isSpeaking,
  activeDigit,
  onSymptomSubmit,
  callerPhone,
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format call timer 00:00
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Browser Speech Recognition for "Help Me Choose"
  useEffect(() => {
    if (callState === 'SYMPTOM_INPUT') {
      audioEngine.playPromptBeep();
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = session?.language === 'ta' ? 'ta-IN' : 'en-IN';

          recognition.onstart = () => {
            setIsListeningMic(true);
            setMicTranscript('');
          };

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((res: any) => res[0].transcript)
              .join('');
            setMicTranscript(transcript);
          };

          recognition.onend = () => {
            setIsListeningMic(false);
          };

          recognition.onerror = (err: any) => {
            console.warn('[Mic] Speech recognition error:', err);
            setIsListeningMic(false);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('[Mic] SpeechRecognition init failed:', err);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setIsListeningMic(false);
      setMicTranscript('');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [callState, session?.language]);

  const handleManualSymptomChip = (text: string) => {
    setMicTranscript(text);
    onSymptomSubmit(text);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#061426] via-[#091e38] to-[#040e1b] text-white p-3 sm:p-4 select-none relative overflow-hidden">
      {/* Dynamic Keypad Digit Overlay Flash */}
      {activeDigit && (
        <div className="absolute top-12 right-4 z-30 bg-teal-500 text-slate-950 px-2.5 py-1 rounded-lg text-sm font-mono font-black shadow-lg animate-bounce">
          Key: {activeDigit}
        </div>
      )}

      {/* Top Mobile Status Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-300 border-b border-slate-800/80 pb-1.5 shrink-0">
        <span className="font-mono font-medium tracking-tight">{currentTime}</span>
        <div className="flex items-center gap-1 text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
          <span>GH-QueueFlow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3 h-3 text-slate-300" />
          <Wifi className="w-3 h-3 text-slate-300" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-mono">98%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Screen Content Body */}
      <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto">
        {/* ================================================================ */}
        {/* 1. STATE: IDLE */}
        {/* ================================================================ */}
        {callState === 'IDLE' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 px-2">
            <div className="w-14 h-14 rounded-full bg-teal-900/40 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-inner">
              <PhoneCall className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white font-serif">GH-QueueFlow</h2>
              <p className="text-xs text-teal-300 font-mono font-medium">1800-425-4474 (Toll-Free)</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 w-full text-xs text-slate-300 space-y-1.5">
              <p className="text-[11px] text-slate-400">
                Hospital Telephone IVR Service
              </p>
              <p className="text-xs text-slate-300">
                Press <strong className="text-emerald-400 font-semibold">START CALL</strong> below to begin.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 2. STATE: CALLING */}
        {/* ================================================================ */}
        {callState === 'CALLING' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 animate-ping absolute inset-0"></div>
              <div className="w-16 h-16 rounded-full bg-teal-600/40 border border-teal-400/50 flex items-center justify-center text-teal-300 relative z-10 shadow-lg">
                <PhoneCall className="w-7 h-7 animate-bounce" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Calling GH-QueueFlow...</p>
              <p className="text-xs text-teal-300 font-mono">1800-425-4474</p>
            </div>
            <p className="text-[11px] text-slate-400 animate-pulse">Connecting to hospital IVR exchange...</p>
          </div>
        )}

        {/* ================================================================ */}
        {/* 3. STATE: IN-CALL (CONNECTED / MENUS / TOKEN) */}
        {/* ================================================================ */}
        {callState !== 'IDLE' && callState !== 'CALLING' && callState !== 'CALL_ENDED' && (
          <div className="flex-1 flex flex-col justify-between space-y-2 text-xs">
            {/* Call Header with Timer & Speaking Indicator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <div>
                  <span className="font-semibold text-slate-200 text-xs block leading-tight">IVR Connected</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {session?.language === 'ta' ? 'தமிழ் சேவை' : 'English Line'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Soundwave Indicator */}
                {isSpeaking && (
                  <div className="flex items-end gap-0.5 h-4 px-1" title="IVR is speaking">
                    <span className="w-1 bg-teal-400 rounded-full wave-bar"></span>
                    <span className="w-1 bg-teal-400 rounded-full wave-bar"></span>
                    <span className="w-1 bg-teal-400 rounded-full wave-bar"></span>
                    <span className="w-1 bg-teal-400 rounded-full wave-bar"></span>
                  </div>
                )}
                <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {formatTimer(callDuration)}
                </span>
              </div>
            </div>

            {/* Spoken Text Transcript Box */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 space-y-1 relative">
              <div className="flex items-center justify-between text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-teal-400" />
                  <span>IVR Voice Prompt:</span>
                </span>
                {isSpeaking && <span className="text-[10px] text-teal-300 font-normal">Speaking aloud...</span>}
              </div>
              <p className="text-xs text-slate-100 italic leading-relaxed font-sans">
                "{(session?.lastSpokenText || 'Connecting...').replace(/\s*\[PAUSE_[^\]]+\]\s*/gi, ' ').trim()}"
              </p>
            </div>

            {/* Contextual Visual Guidance per Step */}
            <div className="flex-1 flex flex-col justify-center">
              {/* STEP: LANGUAGE MENU */}
              {callState === 'LANGUAGE_MENU' && (
                <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-2 space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-bold text-center">Press Key:</div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                      <span className="font-mono font-bold text-teal-300">[ 1 ]</span>
                      <span className="block text-slate-200">English</span>
                    </div>
                    <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                      <span className="font-mono font-bold text-teal-300">[ 2 ]</span>
                      <span className="block text-slate-200">தமிழ் (Tamil)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: MAIN MENU */}
              {callState === 'MAIN_MENU' && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold text-center">
                    {session?.language === 'ta' ? 'முதன்மை மெனு (விசை அழுத்தவும்):' : 'Main Menu (Press Key):'}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between bg-slate-800/80 px-2 py-1 rounded">
                      <span className="text-slate-200">{session?.language === 'ta' ? 'புதிய டோக்கன்' : 'New Token'}</span>
                      <span className="font-mono font-bold text-teal-300">[ 1 ]</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/80 px-2 py-1 rounded">
                      <span className="text-slate-200">{session?.language === 'ta' ? 'டோக்கன் நிலை' : 'Check Status'}</span>
                      <span className="font-mono font-bold text-teal-300">[ 2 ]</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/80 px-2 py-1 rounded">
                      <span className="text-slate-200">{session?.language === 'ta' ? 'மீண்டும் கேட்க' : 'Repeat Token'}</span>
                      <span className="font-mono font-bold text-teal-300">[ 3 ]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: DEPARTMENT MENU */}
              {callState === 'DEPARTMENT_MENU' && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold text-center">
                    {session?.language === 'ta' ? 'பிரிவு தேர்வு (விசை அழுத்தவும்):' : 'Select Department (Press Key):'}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className="bg-slate-800/80 px-1.5 py-1 rounded flex items-center justify-between">
                      <span className="truncate">General Med</span>
                      <span className="font-mono font-bold text-teal-300">[ 1 ]</span>
                    </div>
                    <div className="bg-slate-800/80 px-1.5 py-1 rounded flex items-center justify-between">
                      <span className="truncate text-teal-200 font-semibold">Cardiology</span>
                      <span className="font-mono font-bold text-teal-300">[ 2 ]</span>
                    </div>
                    <div className="bg-slate-800/80 px-1.5 py-1 rounded flex items-center justify-between">
                      <span className="truncate">Orthopedics</span>
                      <span className="font-mono font-bold text-teal-300">[ 3 ]</span>
                    </div>
                    <div className="bg-slate-800/80 px-1.5 py-1 rounded flex items-center justify-between">
                      <span className="truncate">Dermatology</span>
                      <span className="font-mono font-bold text-teal-300">[ 4 ]</span>
                    </div>
                    <div className="col-span-2 bg-teal-950/80 border border-teal-500/40 px-2 py-1 rounded flex items-center justify-between text-teal-200">
                      <span>🎤 Help me choose</span>
                      <span className="font-mono font-bold text-teal-300">[ 5 ]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: SYMPTOM INPUT (VOICE / MIC) */}
              {callState === 'SYMPTOM_INPUT' && (
                <div className="bg-slate-950/90 border border-teal-500/50 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                      <Mic className={`w-3.5 h-3.5 ${isListeningMic ? 'text-red-400 animate-pulse' : 'text-teal-400'}`} />
                      <span>{isListeningMic ? 'Listening to voice...' : 'Speak Symptoms'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Microphone</span>
                  </div>

                  {micTranscript && (
                    <div className="bg-slate-900 p-1.5 rounded border border-teal-700 text-teal-200 text-xs font-mono">
                      "{micTranscript}"
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">Or tap quick symptom for demo:</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <button
                      onClick={() => handleManualSymptomChip('I have severe chest pain and palpitations')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1 rounded border border-slate-700 text-slate-200 truncate cursor-pointer"
                    >
                      ❤️ Chest Pain
                    </button>
                    <button
                      onClick={() => handleManualSymptomChip('Severe knee joint pain and swelling')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1 rounded border border-slate-700 text-slate-200 truncate cursor-pointer"
                    >
                      🦴 Knee Joint Pain
                    </button>
                    <button
                      onClick={() => handleManualSymptomChip('Skin allergy rash and severe itching')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1 rounded border border-slate-700 text-slate-200 truncate cursor-pointer"
                    >
                      🧴 Skin Allergy
                    </button>
                    <button
                      onClick={() => handleManualSymptomChip('High fever and persistent cough')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1 rounded border border-slate-700 text-slate-200 truncate cursor-pointer"
                    >
                      🌡️ Fever & Cough
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: CONFIRMATION */}
              {callState === 'CONFIRMATION' && (
                <div className="bg-slate-950/90 border border-teal-500/50 rounded-xl p-2.5 text-center space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Confirmation Step</span>
                  <div className="text-sm font-bold text-white font-serif">
                    {session?.language === 'ta' ? session?.selectedDeptNameTa : session?.selectedDeptNameEn}
                  </div>
                  <div className="bg-teal-950/80 border border-teal-500/40 py-1.5 px-3 rounded-lg text-xs text-teal-200 font-semibold">
                    Press <span className="font-mono text-white text-sm font-bold">[ 1 ]</span> on keypad to confirm
                  </div>
                </div>
              )}

              {/* STEP: TOKEN GENERATED */}
              {callState === 'TOKEN_GENERATED' && (
                <div className="bg-gradient-to-br from-teal-950 to-slate-900 border-2 border-teal-400/80 rounded-2xl p-3 space-y-2 shadow-xl text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Token Generated</span>
                  </div>

                  <div className="text-3xl font-black font-mono text-white tracking-wider py-1.5 bg-teal-900/60 rounded-xl border border-teal-500/40 shadow-inner">
                    {session?.generatedToken || 'GENMED-001'}
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-100 font-serif">
                      {session?.selectedDeptNameEn || 'General Medicine'}
                    </div>
                    {session?.doctorName && (
                      <div className="text-xs font-semibold text-teal-300 flex items-center justify-center gap-1.5 bg-teal-950/60 py-1 px-2 rounded-lg border border-teal-500/30">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        <span>Doctor: <strong className="text-white">{session.doctorName}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-300 pt-0.5">
                    <span className="font-semibold text-amber-300">{session?.peopleAhead ?? 0} patients ahead</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-300">~{session?.estimatedWaitMinutes ?? 0} min wait</span>
                  </div>
                </div>
              )}

              {/* STEP: CHECK STATUS OR REPEAT TOKEN */}
              {(callState === 'CHECK_STATUS' || callState === 'REPEAT_TOKEN') && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-center space-y-2">
                  {/* Case 1: Consultation Completed by Doctor */}
                  {session?.isCompleted || session?.currentStage === 'completed' ? (
                    <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/60 rounded-xl p-2.5 space-y-1.5 shadow-md">
                      <div className="flex items-center justify-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Doctor Consultation Completed</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white tracking-wider py-0.5 bg-emerald-900/40 rounded border border-emerald-500/30">
                        {session?.generatedToken || 'CARDIO-001'}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span>Status: </span>
                        <strong className="text-emerald-300">Concluded by Attending Doctor</strong>
                      </div>
                      {session?.diagnosis && (
                        <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1 rounded border border-slate-800 text-left">
                          <span className="text-slate-300 font-semibold">Diagnosis: </span>
                          <span>{session.diagnosis}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-emerald-400 font-medium">✓ Visit Finished Successfully</div>
                    </div>
                  ) : session?.currentStage === 'pharmacy' ? (
                    /* Case 2: Routed to Central Pharmacy */
                    <div className="bg-gradient-to-br from-purple-950 to-slate-900 border border-purple-500/60 rounded-xl p-2.5 space-y-1.5 shadow-md">
                      <div className="flex items-center justify-center gap-1 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>💊 Doctor Done ➔ At Central Pharmacy</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white tracking-wider py-0.5 bg-purple-900/40 rounded border border-purple-500/30">
                        {session?.generatedToken}
                      </div>
                      <div className="text-[11px] text-purple-200">
                        Prescription awaiting fulfillment at Pharmacy Counter
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {session?.peopleAhead ?? 0} patients ahead • ~{session?.estimatedWaitMinutes ?? 0} mins wait
                      </div>
                    </div>
                  ) : session?.currentStage === 'diagnostic' ? (
                    /* Case 3: Routed to Diagnostics (Lab / Scan) */
                    <div className="bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-500/60 rounded-xl p-2.5 space-y-1.5 shadow-md">
                      <div className="flex items-center justify-center gap-1 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>🔬 Doctor Done ➔ Diagnostic Wing</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white tracking-wider py-0.5 bg-amber-900/40 rounded border border-amber-500/30">
                        {session?.generatedToken}
                      </div>
                      <div className="text-[11px] text-amber-200">
                        Referred for X-Ray / Lab Investigations
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {session?.peopleAhead ?? 0} patients ahead • ~{session?.estimatedWaitMinutes ?? 0} mins wait
                      </div>
                    </div>
                  ) : session?.queueStatus === 'in_service' || session?.queueStatus === 'called' ? (
                    /* Case 4: Currently called into consultation */
                    <div className="bg-gradient-to-br from-teal-950 to-slate-900 border border-teal-400 rounded-xl p-2.5 space-y-1.5 shadow-md animate-pulse">
                      <div className="flex items-center justify-center gap-1 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>🔔 Your Turn Now!</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white tracking-wider py-0.5 bg-teal-900/40 rounded border border-teal-500/40">
                        {session?.generatedToken}
                      </div>
                      <div className="text-[11px] text-teal-200">Currently called for Doctor Consultation</div>
                    </div>
                  ) : session?.generatedToken ? (
                    /* Case 5: Waiting for Doctor */
                    <div className="space-y-1">
                      <span className="text-[10px] text-teal-400 uppercase font-bold">OPD Token Status</span>
                      <div className="text-xl font-bold font-mono text-white">{session.generatedToken}</div>
                      <div className="text-[11px] text-slate-300">
                        {session.peopleAhead ?? 0} patients ahead • ~{session.estimatedWaitMinutes ?? 0} mins wait
                      </div>
                    </div>
                  ) : (
                    /* Case 6: No token found */
                    <p className="text-xs text-slate-400 py-1">No active or recent token on this phone number</p>
                  )}

                  <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-900">
                    Press <span className="font-mono text-teal-400">[ * ]</span> on keypad to return to main menu
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 4. STATE: CALL_ENDED */}
        {/* ================================================================ */}
        {callState === 'CALL_ENDED' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2.5 px-2">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-300">
              <PhoneCall className="w-6 h-6 rotate-[135deg]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Call Ended</h3>
              <p className="text-xs text-slate-400 font-mono">Duration: {formatTimer(callDuration)}</p>
            </div>
            {session?.generatedToken && (
              <div className="bg-teal-950/60 border border-teal-500/40 rounded-lg p-2 w-full text-xs text-teal-200">
                <span>Active Token: </span>
                <strong className="font-mono text-white">{session.generatedToken}</strong>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Press <strong className="text-emerald-400 font-semibold">START CALL</strong> to dial again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
