import React from 'react';
import { PhoneScreen } from './PhoneScreen';
import { PhoneKeypad } from './PhoneKeypad';
import { IVRSession, IVRCallState } from '../types';

interface PhoneChassisProps {
  session: IVRSession | null;
  callState: IVRCallState;
  callDuration: number;
  isSpeaking: boolean;
  activeDigit: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onKeyPress: (digit: string) => void;
  onStartCall: () => void;
  onEndCall: () => void;
  onRepeatVoice: () => void;
  onSymptomSubmit: (transcript: string) => void;
  callerPhone: string;
}

export const PhoneChassis: React.FC<PhoneChassisProps> = ({
  session,
  callState,
  callDuration,
  isSpeaking,
  activeDigit,
  isMuted,
  onToggleMute,
  onKeyPress,
  onStartCall,
  onEndCall,
  onRepeatVoice,
  onSymptomSubmit,
  callerPhone,
}) => {
  const isInCall = callState !== 'IDLE' && callState !== 'CALL_ENDED';

  return (
    <div className="relative mx-auto my-2 w-full max-w-[350px] sm:max-w-[370px] aspect-[9/18.5] max-h-[770px] bg-slate-900 rounded-[48px] p-3.5 shadow-2xl shadow-slate-400/40 border-4 border-slate-800 ring-1 ring-slate-700/70 flex flex-col justify-between select-none">
      {/* Outer Metallic Edge Highlight */}
      <div className="absolute inset-0 rounded-[44px] border border-white/15 pointer-events-none"></div>

      {/* Top Ear Speaker & Front Camera Dot */}
      <div className="w-full flex items-center justify-center gap-3 pt-0.5 pb-2 shrink-0">
        <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700"></div>
      </div>

      {/* Inner Screen Display */}
      <div className="w-full flex-1 rounded-[26px] overflow-hidden border border-slate-800/90 shadow-inner bg-[#040e1b] flex flex-col">
        <PhoneScreen
          session={session}
          callState={callState}
          callDuration={callDuration}
          isSpeaking={isSpeaking}
          activeDigit={activeDigit}
          onSymptomSubmit={onSymptomSubmit}
          callerPhone={callerPhone}
        />
      </div>

      {/* Lower Keypad & Action Row */}
      <div className="shrink-0 pt-2">
        <PhoneKeypad
          onKeyPress={onKeyPress}
          isInCall={isInCall}
          onStartCall={onStartCall}
          onEndCall={onEndCall}
          onRepeatVoice={onRepeatVoice}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          isSpeaking={isSpeaking}
          activeDigit={activeDigit}
        />
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="w-full flex justify-center pb-1 pt-0.5 shrink-0">
        <div className="w-28 h-1 bg-slate-700/60 rounded-full"></div>
      </div>
    </div>
  );
};
