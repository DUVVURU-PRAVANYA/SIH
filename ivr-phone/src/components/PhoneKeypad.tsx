import React from 'react';
import { Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface PhoneKeypadProps {
  onKeyPress: (digit: string) => void;
  isInCall: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onRepeatVoice?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isSpeaking: boolean;
  activeDigit: string | null;
}

const KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export const PhoneKeypad: React.FC<PhoneKeypadProps> = ({
  onKeyPress,
  isInCall,
  onStartCall,
  onEndCall,
  onRepeatVoice,
  isMuted,
  onToggleMute,
  isSpeaking,
  activeDigit,
}) => {
  const handleKeyClick = (digit: string) => {
    // Play real DTMF audio feedback
    audioEngine.playDtmf(digit);
    if (isInCall) {
      onKeyPress(digit);
    }
  };

  return (
    <div className="w-full px-4 pt-2 pb-4 flex flex-col items-center">
      {/* 3x4 DTMF Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[280px]">
        {KEYS.map((k) => {
          const isPressed = activeDigit === k.digit;
          return (
            <button
              key={k.digit}
              onClick={() => handleKeyClick(k.digit)}
              disabled={!isInCall}
              className={`h-12 sm:h-13 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none relative overflow-hidden active:scale-95 ${
                isPressed
                  ? 'bg-teal-500 text-slate-950 font-bold scale-95 ring-2 ring-teal-300 shadow-lg'
                  : isInCall
                  ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80 active:bg-slate-600 shadow-sm'
                  : 'bg-slate-900/40 text-slate-500 border border-slate-800/60 cursor-not-allowed opacity-60'
              }`}
            >
              <span className="text-lg sm:text-xl font-bold font-mono leading-none">{k.digit}</span>
              {k.letters && (
                <span className="text-[9px] font-semibold tracking-wider text-slate-400 leading-none mt-0.5">
                  {k.letters}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Call Action Buttons */}
      <div className="w-full max-w-[280px] mt-4 flex items-center justify-center gap-3">
        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
            isMuted
              ? 'bg-amber-950/80 text-amber-300 border-amber-700'
              : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Center Primary Action: CALL or END CALL */}
        {!isInCall ? (
          <button
            onClick={onStartCall}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-950/60 border border-teal-400/40 transition-all cursor-pointer"
          >
            <Phone className="w-5 h-5 fill-current" />
            <span className="tracking-wide text-sm font-semibold">START CALL</span>
          </button>
        ) : (
          <button
            onClick={onEndCall}
            className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 border border-red-400/40 transition-all cursor-pointer"
          >
            <PhoneOff className="w-5 h-5 fill-current" />
            <span className="tracking-wide text-sm font-semibold">END CALL</span>
          </button>
        )}
      </div>
    </div>
  );
};
