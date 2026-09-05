import React from 'react';
import {
  X,
  Printer,
  Volume2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  QrCode,
  MapPin,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { Patient } from '../../types';

interface PatientTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
}

export const PatientTokenModal: React.FC<PatientTokenModalProps> = ({ isOpen, onClose, patient }) => {
  const { activePatient, lang, speakPatientGuidance } = useQueueFlow();

  const p = patient || activePatient;

  if (!isOpen || !p) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg">
              {lang === 'ta' ? 'அரசு மருத்துவமனை டிஜிட்டல் டோக்கன்' : 'Govt Hospital Digital Token & QR Pass'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Card / Printable Slip */}
        <div className="p-6 space-y-4 bg-slate-50">
          {/* Official Govt Slip Box */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-sm space-y-4">
            <div className="text-center border-b pb-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                GOVERNMENT HOSPITAL PATIENT FLOW INFRASTRUCTURE
              </span>
              <div className="font-extrabold text-sm text-[#0B2545]">
                District Government Headquarter Hospital, Madurai
              </div>
              <div className="text-xs text-slate-500">
                Patient ID: <strong className="font-mono text-slate-800">{p.id}</strong> • ABHA: <span className="font-mono text-slate-700">{p.abhaId}</span>
              </div>
            </div>

            {/* Giant Token Display */}
            <div className="text-center py-3 bg-blue-50/70 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                {lang === 'ta' ? 'உங்கள் டோக்கன் எண்' : 'ACTIVE QUEUE TOKEN'}
              </span>
              <div className="text-4xl sm:text-5xl font-black text-[#0B2545] font-mono tracking-tight my-1">
                {p.token}
              </div>
              <div className="text-xs font-bold text-blue-950">
                {p.name} • {p.age} Yrs / {p.gender} • {p.phone}
              </div>
            </div>

            {/* Current Stage & Location */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="font-bold text-slate-500">ROOM / COUNTER:</span>
                <div className="font-extrabold text-slate-900 text-sm">{p.location.room}</div>
                <div className="text-slate-600">{p.location.block}, {p.location.floor}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                <span className="font-bold text-teal-800">ESTIMATED WAIT:</span>
                <div className="font-extrabold text-teal-950 text-sm">
                  {p.currentStage === 'completed' ? '0 min' : `~${p.estimatedWaitMinutes} min`}
                </div>
                <div className="text-teal-700">
                  {p.currentStage === 'completed' ? 'Visit Complete' : `${p.queuePosition} Ahead`}
                </div>
              </div>
            </div>

            {/* Simulated QR Code for Scan */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-200">
              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Digital Handoff QR Pass</span>
                </div>
                <p className="text-[11px] text-slate-500">Show to Doctor, Lab & Pharmacy for instant scanning</p>
              </div>
              <div className="w-12 h-12 bg-white border border-slate-300 rounded p-1 flex items-center justify-center font-mono text-[9px] text-center font-bold text-slate-800 shadow-inner">
                [QR-{p.token.slice(-3)}]
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 no-print">
            <button
              onClick={() => speakPatientGuidance(p)}
              className="py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === 'ta' ? 'குரல் வழிகாட்டி' : 'Hear Audio'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-lg bg-[#0B2545] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>{lang === 'ta' ? 'அச்சிடுக' : 'Print Slip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
