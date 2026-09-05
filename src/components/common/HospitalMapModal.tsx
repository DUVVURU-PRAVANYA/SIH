import React, { useState } from 'react';
import { X, MapPin, Layers, Navigation, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface HospitalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HospitalMapModal: React.FC<HospitalMapModalProps> = ({ isOpen, onClose }) => {
  const { lang, departments, activePatient } = useQueueFlow();
  const [selectedBlock, setSelectedBlock] = useState<'A' | 'B' | 'C' | 'all'>('all');

  if (!isOpen) return null;

  const getDeptStatusBadge = (load: number) => {
    if (load >= 90) {
      return { color: 'bg-red-500 text-white', label: '🔴 91% Critical', ring: 'ring-red-400' };
    } else if (load >= 80) {
      return { color: 'bg-amber-500 text-white', label: '🟠 82% Busy', ring: 'ring-amber-400' };
    } else {
      return { color: 'bg-emerald-600 text-white', label: '🟢 Normal', ring: 'ring-emerald-400' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-xl">
                {lang === 'ta' ? 'அரசு பொது மருத்துவமனை வரைபடம்' : 'Hospital Interactive Navigation & Congestion Map'}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === 'ta'
                  ? 'வண்ண வழித்தடங்கள் மற்றும் நேரடி நெரிசல் நிலவரம்'
                  : 'Live Department Heatmap & Universal Color-Coded Pathways'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Patient Current Location Tag */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {lang === 'ta' ? 'பிளாக் தேர்வு:' : 'Filter Block:'}
            </span>
            {(['all', 'A', 'B', 'C'] as const).map((blk) => (
              <button
                key={blk}
                onClick={() => setSelectedBlock(blk)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  selectedBlock === blk
                    ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {blk === 'all'
                  ? lang === 'ta' ? 'அனைத்து பிளாக்குகள்' : 'All Blocks'
                  : `Block ${blk}`}
              </button>
            ))}
          </div>

          {activePatient && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>
                {lang === 'ta'
                  ? `நோயாளி இடம்: ${activePatient.location.room} (${activePatient.location.block})`
                  : `Patient Destination: ${activePatient.location.room} (${activePatient.location.block})`}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Map Visual */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Color Navigation Legend */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              {lang === 'ta' ? 'வண்ண வழித்தடக் குறியீடு (Universal Color Paths)' : 'Universal Wayfinding Color Legend'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-bold">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0" />
                <span>Cardiology / OPD</span>
              </div>
              <div className="p-2 rounded-xl bg-green-50 border border-green-300 text-green-900 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-green-600 shrink-0" />
                <span>Central Lab</span>
              </div>
              <div className="p-2 rounded-xl bg-orange-50 border border-orange-300 text-orange-900 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-600 shrink-0" />
                <span>X-Ray / CT Scan</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-300 text-purple-900 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 shrink-0" />
                <span>Pharmacy</span>
              </div>
              <div className="p-2 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 shrink-0" />
                <span>Emergency 24x7</span>
              </div>
              <div className="p-2 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-900 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 shrink-0" />
                <span>Registration</span>
              </div>
            </div>
          </div>

          {/* Hospital Blocks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Block A */}
            {(selectedBlock === 'all' || selectedBlock === 'A') && (
              <div className="rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-900">BLOCK A</h3>
                      <p className="text-xs text-slate-500 font-medium">Main Entrance & Emergency Wing</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                      Ground Floor
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Central Registration */}
                    <div className="p-3 rounded-xl bg-yellow-50 border-2 border-yellow-400">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-yellow-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          Registration & Kiosks
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-200 text-yellow-900">
                          🟢 74% Load
                        </span>
                      </div>
                      <div className="text-xs text-yellow-800 font-medium mt-1">Counters 1–6 • Follow Yellow Path</div>
                    </div>

                    {/* Central Pharmacy */}
                    <div className="p-3 rounded-xl bg-purple-50 border-2 border-purple-400">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                          Central Pharmacy
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-200 text-purple-900">
                          🟢 68% Normal
                        </span>
                      </div>
                      <div className="text-xs text-purple-800 font-medium mt-1">Counter 3 • Follow Purple Path</div>
                    </div>

                    {/* 24x7 Emergency */}
                    <div className="p-3 rounded-xl bg-red-50 border-2 border-red-400">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                          Emergency & Trauma (24x7)
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-200 text-red-900">
                          🟢 62% Capacity
                        </span>
                      </div>
                      <div className="text-xs text-red-800 font-medium mt-1">Triage 1–4 • 8 Beds Available</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t text-xs text-slate-400 text-center font-medium">
                  Main Security & Helpdesk at entrance
                </div>
              </div>
            )}

            {/* Block B */}
            {(selectedBlock === 'all' || selectedBlock === 'B') && (
              <div className="rounded-2xl border-2 border-blue-400 bg-white p-5 shadow-md flex flex-col justify-between ring-2 ring-blue-100">
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div>
                      <h3 className="font-black text-lg text-blue-950">BLOCK B</h3>
                      <p className="text-xs text-blue-700 font-medium">Outpatient Specialty Block</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs">
                      1st & 2nd Floors
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Cardiology OPD */}
                    <div className="p-3 rounded-xl bg-blue-50 border-2 border-blue-500 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                          Cardiology (Room 12)
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-200 text-blue-900">
                          🟢 72% Load
                        </span>
                      </div>
                      <div className="text-xs text-blue-800 font-medium mt-1">
                        Dr. Priya Kumar • 1st Floor • Follow Blue Path
                      </div>
                    </div>

                    {/* General Medicine */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          General Medicine (Rooms 4–8)
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                          🟠 82% Busy
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-1">Ground Floor • 46 Waiting</div>
                    </div>

                    {/* Orthopedics */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          Orthopedics (Rooms 14–16)
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900">
                          🟢 79% Normal
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-1">1st Floor • 28 Waiting</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t text-xs text-blue-600 text-center font-bold">
                  Elevator & Ramp access available
                </div>
              </div>
            )}

            {/* Block C */}
            {(selectedBlock === 'all' || selectedBlock === 'C') && (
              <div className="rounded-2xl border-2 border-red-300 bg-white p-5 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-900">BLOCK C</h3>
                      <p className="text-xs text-slate-500 font-medium">Diagnostic & Imaging Wing</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 font-bold text-xs">
                      Diagnostic Wing
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Digital X-Ray (Critical Bottleneck) */}
                    <div className="p-3 rounded-xl bg-red-50 border-2 border-red-500 shadow-sm animate-pulse-subtle">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                          Digital X-Ray (Room 18)
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-600 text-white">
                          🔴 91% Critical
                        </span>
                      </div>
                      <div className="text-xs text-red-800 font-semibold mt-1">
                        67 Waiting • ETA: 95m • Follow Orange Path
                      </div>
                    </div>

                    {/* Central Biochemistry Lab */}
                    <div className="p-3 rounded-xl bg-green-50 border-2 border-green-400">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-green-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                          Central Lab 101
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                          🟠 84% Busy
                        </span>
                      </div>
                      <div className="text-xs text-green-800 font-medium mt-1">1st Floor • Follow Green Path</div>
                    </div>

                    {/* 128-Slice CT Scan */}
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-300">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-orange-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                          CT Suite 2
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900">
                          🟢 75% Normal
                        </span>
                      </div>
                      <div className="text-xs text-orange-800 font-medium mt-1">Ground Floor • 18 Waiting</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t text-xs text-red-600 text-center font-bold">
                  Radiation safety zone active
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            {lang === 'ta'
              ? 'அனைத்து வழித்தடங்களும் தரைப்பகுதியில் வண்ணக் கோடுகளாக வரையப்பட்டுள்ளன.'
              : 'Physical colored floor tracks match the visual pathways on this digital map.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0B2545] text-white font-bold text-sm hover:bg-slate-800"
          >
            {lang === 'ta' ? 'வரைபடத்தை மூடுக' : 'Close Map'}
          </button>
        </div>
      </div>
    </div>
  );
};
