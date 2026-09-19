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
  Volume2,
  Activity,
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

  // Clean language tag
  const getLanguageLabel = () => {
    if (callState === 'LANGUAGE_MENU') return 'Select Language';
    return session?.language === 'ta' ? 'தமிழ்' : 'English';
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#081726] via-[#091e34] to-[#040e1b] text-white p-3 select-none relative overflow-hidden">
      {/* Keypad Digit Overlay Flash */}
      {activeDigit && (
        <div className="absolute top-12 right-4 z-30 bg-[#00A272] text-white px-2.5 py-1 rounded-lg text-sm font-mono font-bold shadow-lg shadow-teal-900/50 animate-bounce">
          Key: {activeDigit}
        </div>
      )}

      {/* Top Phone Status Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-1.5 shrink-0">
        <span className="font-mono font-medium">{currentTime}</span>
        <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-semibold">
          <img
            src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith('/carenexus-emblem.png')) {
                target.src = '/carenexus-emblem.png';
              }
            }}
            alt=""
            className="w-3.5 h-3.5 object-contain"
          />
          <span>CareNexus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3 h-3 text-slate-400" />
          <Wifi className="w-3 h-3 text-slate-400" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-mono">98%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Screen Content Body */}
      <div className="flex-1 flex flex-col justify-between py-2 overflow-hidden">
        {/* ================================================================ */}
        {/* 1. STATE: IDLE */}
        {/* ================================================================ */}
        {callState === 'IDLE' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/30 flex items-center justify-center shadow-xl relative">
              <img
                src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.endsWith('/carenexus-emblem.png')) {
                    target.src = '/carenexus-emblem.png';
                  }
                }}
                alt="CareNexus"
                className="w-10 h-10 object-contain drop-shadow"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00A272] border-2 border-slate-900 flex items-center justify-center text-[9px] text-white">
                <PhoneCall className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-wide">CareNexus IVR</h2>
              <p className="text-xs text-teal-300 font-mono font-semibold">1800-425-4474</p>
              <p className="text-[11px] text-slate-400">Caller: +91 {callerPhone}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300 space-y-1 w-full">
              <p className="text-[11px] text-slate-400">Press <strong className="text-emerald-400 font-semibold">START CALL</strong> below to connect</p>
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
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-teal-400/50 flex items-center justify-center relative z-10 shadow-lg">
                <img
                  src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.endsWith('/carenexus-emblem.png')) {
                      target.src = '/carenexus-emblem.png';
                    }
                  }}
                  alt="CareNexus"
                  className="w-9 h-9 object-contain animate-pulse"
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white">Calling CareNexus OPD...</p>
              <p className="text-xs text-teal-300 font-mono font-semibold">1800-425-4474</p>
            </div>
            <p className="text-[11px] text-emerald-400 animate-pulse font-medium">Connecting...</p>
          </div>
        )}

        {/* ================================================================ */}
        {/* 3. STATE: IN-CALL (CONNECTED / MENUS / TOKEN) */}
        {/* ================================================================ */}
        {callState !== 'IDLE' && callState !== 'CALLING' && callState !== 'CALL_ENDED' && (
          <div className="flex-1 flex flex-col justify-between space-y-2.5 text-xs">
            {/* Sleek Call Header Banner */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl px-3 py-2 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <span className="font-semibold text-slate-100 text-xs block leading-none">CareNexus OPD</span>
                  <span className="text-[10px] text-teal-300 font-medium">{getLanguageLabel()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <div className="flex items-end gap-0.5 h-3.5 px-1" title="IVR is speaking">
                    <span className="w-0.5 bg-teal-400 rounded-full wave-bar"></span>
                    <span className="w-0.5 bg-teal-400 rounded-full wave-bar"></span>
                    <span className="w-0.5 bg-teal-400 rounded-full wave-bar"></span>
                    <span className="w-0.5 bg-teal-400 rounded-full wave-bar"></span>
                  </div>
                )}
                <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {formatTimer(callDuration)}
                </span>
              </div>
            </div>

            {/* Contextual Visual Guidance per Step (Clean, Uncluttered) */}
            <div className="flex-1 flex flex-col justify-center">
              {/* STEP: LANGUAGE MENU */}
              {callState === 'LANGUAGE_MENU' && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div className="text-[11px] text-slate-300 font-semibold text-center">
                    Select Language / மொழி தேர்வு
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700/80 shadow-sm">
                      <span className="font-mono font-bold text-teal-300 text-sm block leading-none mb-1">[ 1 ]</span>
                      <span className="text-slate-200 font-medium">English</span>
                    </div>
                    <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700/80 shadow-sm">
                      <span className="font-mono font-bold text-teal-300 text-sm block leading-none mb-1">[ 2 ]</span>
                      <span className="text-slate-200 font-medium">தமிழ்</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: MAIN MENU */}
              {callState === 'MAIN_MENU' && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="text-[11px] text-slate-300 font-semibold text-center">
                    {session?.language === 'ta' ? 'முதன்மை மெனு' : 'Main Menu'}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                      <span className="text-slate-200 font-medium">{session?.language === 'ta' ? 'புதிய டோக்கன்' : 'New OPD Token'}</span>
                      <span className="font-mono font-bold text-teal-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/80">[ 1 ]</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                      <span className="text-slate-200 font-medium">{session?.language === 'ta' ? 'டோக்கன் நிலை' : 'Check Token Status'}</span>
                      <span className="font-mono font-bold text-teal-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/80">[ 2 ]</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                      <span className="text-slate-200 font-medium">{session?.language === 'ta' ? 'மீண்டும் கேட்க' : 'Repeat Token Details'}</span>
                      <span className="font-mono font-bold text-teal-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/80">[ 3 ]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: DEPARTMENT MENU */}
              {callState === 'DEPARTMENT_MENU' && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="text-[11px] text-slate-300 font-semibold text-center">
                    {session?.language === 'ta' ? 'பிரிவு தேர்வு' : 'Select Department'}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                      <span className="truncate text-slate-200">General Med</span>
                      <span className="font-mono font-bold text-teal-300">[ 1 ]</span>
                    </div>
                    <div className="bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                      <span className="truncate text-teal-200 font-medium">Cardiology</span>
                      <span className="font-mono font-bold text-teal-300">[ 2 ]</span>
                    </div>
                    <div className="bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                      <span className="truncate text-slate-200">Orthopedics</span>
                      <span className="font-mono font-bold text-teal-300">[ 3 ]</span>
                    </div>
                    <div className="bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                      <span className="truncate text-slate-200">Dermatology</span>
                      <span className="font-mono font-bold text-teal-300">[ 4 ]</span>
                    </div>
                    <div className="col-span-2 bg-teal-950/80 border border-teal-500/40 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-teal-200">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Mic className="w-3 h-3 text-teal-400" />
                        <span>Help Me Choose (Voice)</span>
                      </span>
                      <span className="font-mono font-bold text-teal-300">[ 5 ]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: SYMPTOM INPUT (VOICE / MIC) */}
              {callState === 'SYMPTOM_INPUT' && (
                <div className="bg-slate-950/90 border border-teal-500/40 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1.5">
                      <Mic className={`w-3.5 h-3.5 ${isListeningMic ? 'text-red-400 animate-pulse' : 'text-teal-400'}`} />
                      <span>{isListeningMic ? 'Listening...' : 'Speak Your Symptoms'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Microphone</span>
                  </div>

                  {micTranscript && (
                    <div className="bg-slate-900 p-1.5 rounded border border-teal-700/60 text-teal-200 text-xs font-mono">
                      "{micTranscript}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <button
                      onClick={() => handleManualSymptomChip('I have severe chest pain and palpitations')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1.5 rounded border border-slate-700 text-slate-200 truncate cursor-pointer transition-colors"
                    >
                      ❤️ Chest Pain
                    </button>
                    <button
                      onClick={() => handleManualSymptomChip('Severe knee joint pain and swelling')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1.5 rounded border border-slate-700 text-slate-200 truncate cursor-pointer transition-colors"
                    >
                      🦴 Knee Joint Pain
                    </button>
                    <button
                      onClick={() => handleManualSymptomChip('Skin allergy rash and severe itching')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1.5 rounded border border-slate-700 text-slate-200 truncate cursor-pointer transition-colors"
                    >
                      🧴 Skin Allergy
                    </button>
                    <button
                      onClick={() => handleManualSymptomChip('High fever and persistent cough')}
                      className="bg-slate-800 hover:bg-slate-700 text-left p-1.5 rounded border border-slate-700 text-slate-200 truncate cursor-pointer transition-colors"
                    >
                      🌡️ Fever & Cough
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: CONFIRMATION */}
              {callState === 'CONFIRMATION' && (
                <div className="bg-slate-950/90 border border-teal-500/40 rounded-xl p-3 text-center space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confirm Department</span>
                  <div className="text-sm font-bold text-white">
                    {session?.language === 'ta' ? session?.selectedDeptNameTa : session?.selectedDeptNameEn}
                  </div>
                  <div className="bg-teal-950/80 border border-teal-500/40 py-1.5 px-3 rounded-lg text-xs text-teal-200 font-medium">
                    Press <span className="font-mono text-white text-sm font-bold">[ 1 ]</span> to confirm
                  </div>
                </div>
              )}

              {/* STEP: TOKEN GENERATED */}
              {callState === 'TOKEN_GENERATED' && (
                <div className="bg-gradient-to-br from-teal-950/90 to-slate-900 border border-teal-400/60 rounded-2xl p-3 space-y-2 shadow-xl text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>OPD Token Generated</span>
                  </div>

                  <div className="text-2xl font-black font-mono text-white tracking-wider py-1 bg-teal-900/50 rounded-xl border border-teal-500/30">
                    {session?.generatedToken || 'GENMED-001'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200">
                      {session?.selectedDeptNameEn || 'General Medicine'}
                    </div>
                    {session?.doctorName && (
                      <div className="text-[11px] text-teal-300 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-teal-400" />
                        <span>Doctor: <strong className="text-white">{session.doctorName}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-300 pt-0.5 border-t border-teal-800/40">
                    <span className="font-semibold text-amber-300">{session?.peopleAhead ?? 0} ahead</span>
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
                    <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Consultation Completed</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-white bg-emerald-900/30 py-0.5 rounded border border-emerald-500/30">
                        {session?.generatedToken || 'CARDIO-001'}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Status: <strong className="text-emerald-300">Concluded by Attending Doctor</strong>
                      </div>
                      {session?.diagnosis && (
                        <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1 rounded border border-slate-800 text-left">
                          <span className="text-slate-300 font-semibold">Diagnosis: </span>
                          <span>{session.diagnosis}</span>
                        </div>
                      )}
                    </div>
                  ) : session?.currentStage === 'pharmacy' ? (
                    /* Case 2: Routed to Central Pharmacy */
                    <div className="bg-gradient-to-br from-purple-950/80 to-slate-900 border border-purple-500/50 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-center gap-1 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>Central Pharmacy</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-white bg-purple-900/30 py-0.5 rounded border border-purple-500/30">
                        {session?.generatedToken}
                      </div>
                      <div className="text-[11px] text-purple-200">
                        Prescription awaiting fulfillment
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {session?.peopleAhead ?? 0} ahead • ~{session?.estimatedWaitMinutes ?? 0} mins wait
                      </div>
                    </div>
                  ) : session?.currentStage === 'diagnostic' ? (
                    /* Case 3: Routed to Diagnostics (Lab / Scan) */
                    <div className="bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-500/50 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-center gap-1 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>Diagnostic Wing</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-white bg-amber-900/30 py-0.5 rounded border border-amber-500/30">
                        {session?.generatedToken}
                      </div>
                      <div className="text-[11px] text-amber-200">
                        Referred for Investigations
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {session?.peopleAhead ?? 0} ahead • ~{session?.estimatedWaitMinutes ?? 0} mins wait
                      </div>
                    </div>
                  ) : session?.queueStatus === 'in_service' || session?.queueStatus === 'called' ? (
                    /* Case 4: Currently called into consultation */
                    <div className="bg-gradient-to-br from-teal-950/80 to-slate-900 border border-teal-400 rounded-xl p-2.5 space-y-1.5 animate-pulse">
                      <div className="flex items-center justify-center gap-1 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>Your Turn Now!</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-white bg-teal-900/40 py-0.5 rounded border border-teal-500/40">
                        {session?.generatedToken}
                      </div>
                      <div className="text-[11px] text-teal-200">Called for Doctor Consultation</div>
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
                    <p className="text-xs text-slate-400 py-1">No active token found on this number</p>
                  )}

                  <div className="text-[10px] text-slate-500 pt-1">
                    Press <span className="font-mono text-teal-400">[ * ]</span> to return to main menu
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
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-300">
              <PhoneCall className="w-5 h-5 rotate-[135deg]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Call Ended</h3>
              <p className="text-xs text-slate-400 font-mono">Duration: {formatTimer(callDuration)}</p>
            </div>
            {session?.error && (
              <div className="bg-rose-950/70 border border-rose-500/40 rounded-lg p-2.5 w-full text-xs text-rose-200">
                <span className="font-semibold">{session.error}</span>
              </div>
            )}
            {session?.generatedToken && (
              <div className="bg-teal-950/60 border border-teal-500/30 rounded-lg p-2 w-full text-xs text-teal-200">
                <span>Active Token: </span>
                <strong className="font-mono text-white">{session.generatedToken}</strong>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Press <strong className="text-emerald-400 font-semibold">START CALL</strong> to dial again
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
