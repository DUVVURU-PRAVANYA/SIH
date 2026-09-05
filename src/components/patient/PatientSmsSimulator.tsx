import React from 'react';
import { X, Smartphone, MessageSquare, Clock, ArrowRight, Bell } from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface PatientSmsSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientSmsSimulator: React.FC<PatientSmsSimulatorProps> = ({ isOpen, onClose }) => {
  const { activePatient, lang } = useQueueFlow();

  if (!isOpen) return null;

  const p = activePatient;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full shadow-2xl border-4 border-slate-700 overflow-hidden flex flex-col">
        {/* Phone Notch & Header */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-slate-300">
              {lang === 'ta' ? 'SMS செய்தி முன்னோட்டம்' : 'SMS Notification Preview'}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulated Phone Message Screen */}
        <div className="p-4 bg-slate-900 space-y-3">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Today • TN-GOV-HEALTH
            </span>
          </div>

          {/* SMS Message Bubble 1: Registration */}
          <div className="bg-slate-800 rounded-2xl p-3.5 border border-slate-700 space-y-1.5 text-xs text-slate-200">
            <div className="font-bold text-teal-300 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              GH-QueueFlow: {p?.token || 'CARDIO-042'}
            </div>
            <p className="text-[11px] leading-relaxed">
              வணக்கம். உங்கள் அரசு மருத்துவமனை டோக்கன் எண் <strong className="text-white font-mono">{p?.token || 'CARDIO-042'}</strong>.
            </p>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 font-mono text-[11px] text-teal-200 space-y-0.5">
              <div>• {p?.queuePosition || 5} Patients ahead</div>
              <div>• Approx Turn: ~{p?.estimatedWaitMinutes || 18} Mins</div>
              <div>• Next: {p?.location.room} ({p?.location.block})</div>
              <div>• Follow: {p?.location.pathName.split('→')[0]}</div>
            </div>
            <div className="text-[9px] text-slate-500 text-right">09:15 AM • Delivered</div>
          </div>

          {/* SMS Message Bubble 2: Approaching Turn */}
          <div className="bg-slate-800 rounded-2xl p-3.5 border border-amber-500/40 space-y-1.5 text-xs text-slate-200">
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              GH-QueueFlow ALERT: {p?.token || 'CARDIO-042'}
            </div>
            <p className="text-[11px] leading-relaxed">
              உங்கள் முறை விரைவில் வருகிறது. தயவுசெய்து <strong className="text-white">{p?.location.room}</strong> அருகில் காத்திருக்கவும்.
            </p>
            <div className="text-[9px] text-slate-500 text-right">Just now • Delivered</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            {lang === 'ta'
              ? 'ஸ்மார்ட்போன் இல்லாத முதியோருக்கும் தானியங்கி SMS சென்றடையும்.'
              : 'Works with basic feature phones via automated SMS gateway.'}
          </p>
        </div>
      </div>
    </div>
  );
};
