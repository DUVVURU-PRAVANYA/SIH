import React from 'react';
import {
  X,
  MapPin,
  ArrowRight,
  ArrowUp,
  Volume2,
  Navigation,
  Compass,
  Building,
  Layers,
  Sparkles
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface PatientWayfindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientWayfindingModal: React.FC<PatientWayfindingModalProps> = ({ isOpen, onClose }) => {
  const { activePatient, lang, speakPatientGuidance } = useQueueFlow();

  if (!isOpen || !activePatient) return null;

  const p = activePatient;

  const colorThemes = {
    blue: {
      bg: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-900',
      title: lang === 'ta' ? 'நீல வழித்தடத்தை பின்தொடரவும்' : 'FOLLOW BLUE PATH →',
    },
    green: {
      bg: 'bg-emerald-600',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-500',
      text: 'text-emerald-900',
      title: lang === 'ta' ? 'பச்சை வழித்தடத்தை பின்தொடரவும்' : 'FOLLOW GREEN PATH →',
    },
    orange: {
      bg: 'bg-orange-600',
      lightBg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      title: lang === 'ta' ? 'ஆரஞ்சு வழித்தடத்தை பின்தொடரவும்' : 'FOLLOW ORANGE PATH →',
    },
    purple: {
      bg: 'bg-purple-600',
      lightBg: 'bg-purple-50',
      border: 'border-purple-500',
      text: 'text-purple-900',
      title: lang === 'ta' ? 'ஊதா வழித்தடத்தை பின்தொடரவும்' : 'FOLLOW PURPLE PATH →',
    },
    red: {
      bg: 'bg-red-600',
      lightBg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      title: lang === 'ta' ? 'சிவப்பு வழித்தடத்தை பின்தொடரவும்' : 'FOLLOW RED PATH (EMERGENCY) →',
    },
    yellow: {
      bg: 'bg-yellow-500',
      lightBg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-950',
      title: lang === 'ta' ? 'மஞ்சள் வழித்தடத்தை பின்தொடரவும்' : 'FOLLOW YELLOW PATH →',
    },
  }[p.location.pathColor || 'blue'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border-4 border-blue-500 overflow-hidden flex flex-col">
        {/* Header with High-Contrast Path Banner */}
        <div className={`${colorThemes.bg} text-white px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white animate-pulse">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-black text-xl sm:text-2xl tracking-tight">
                {colorThemes.title}
              </h2>
              <p className="text-xs text-white/90 font-medium">
                {lang === 'ta'
                  ? 'தரைப்பகுதியில் வரையப்பட்ட வண்ணக் கோடுகளை பின்தொடரவும்'
                  : 'Follow the colored painted floor track line directly to room'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Big Visual Step-by-Step Directions */}
        <div className="p-6 space-y-6 bg-slate-50">
          {/* Step 1: BLOCK */}
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shadow">
                {p.location.block.includes('Block A') ? 'A' : p.location.block.includes('Block B') ? 'B' : 'C'}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ta' ? 'கட்டிட பிரிவு' : 'HOSPITAL BLOCK'}
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {p.location.block}
                </div>
              </div>
            </div>
            <ArrowRight className="w-7 h-7 text-blue-600 animate-pulse" />
          </div>

          {/* Step 2: FLOOR */}
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ta' ? 'தளம் / மாடி' : 'ELEVATOR / FLOOR'}
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {p.location.floor}
                </div>
              </div>
            </div>
            <ArrowUp className="w-7 h-7 text-teal-600 animate-bounce" />
          </div>

          {/* Step 3: ROOM NUMBER (Giant Target) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg border-2 border-blue-400 text-center space-y-1">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">
              {lang === 'ta' ? 'இலக்கு அறை எண்' : 'TARGET DESTINATION ROOM'}
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {p.location.room}
            </div>
            <div className="text-sm font-bold text-blue-100 mt-1">
              {p.currentStage === 'doctor' && (lang === 'ta' ? 'மருத்துவர் பிரியா குமார்' : 'Dr. Priya Kumar (Cardiology)')}
              {p.currentStage === 'diagnostic' && (lang === 'ta' ? 'டிஜிட்டல் எக்ஸ்-ரே பிரிவு' : 'Digital Chest X-Ray Suite')}
              {p.currentStage === 'pharmacy' && (lang === 'ta' ? 'மைய மருந்தக கவுண்டர்' : 'Medicine Dispensing Counter')}
            </div>
          </div>

          {/* Audio Replay Button */}
          <button
            onClick={() => speakPatientGuidance()}
            className="w-full py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Volume2 className="w-6 h-6 animate-pulse" />
            <span>
              {lang === 'ta' ? 'வழிகாட்டுதலை குரலில் கேட்க' : 'Hear Voice Directions in Tamil / English'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#0B2545] text-white font-bold text-sm shadow hover:bg-slate-800"
          >
            {lang === 'ta' ? 'சரி, புரிந்தது' : 'Understood, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
