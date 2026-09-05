import React, { useState } from 'react';
import {
  Building2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  Shield,
  Sparkles,
  ArrowRight,
  Heart,
  PlusCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

export const PHCPortal: React.FC = () => {
  const {
    referrals,
    createPHCReferral,
    hospitalComparisons,
    lang,
  } = useQueueFlow();

  const [patientName, setPatientName] = useState('Kuppusamy M.');
  const [patientAge, setPatientAge] = useState('62');
  const [patientGender, setPatientGender] = useState('Male');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [clinicalReason, setClinicalReason] = useState('Acute severe retrosternal chest pain radiating to left shoulder. ST elevation in Lead II, III, aVF. Suspected Acute Inferior Wall MI.');
  const [requiredService, setRequiredService] = useState('Emergency Primary Angioplasty / Cath Lab / ICU');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('emergency');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-grh');
  const [referralSentSuccess, setReferralSentSuccess] = useState(false);

  const recommendedHospital = hospitalComparisons.find((h) => h.isRecommended) || hospitalComparisons[0];

  const handleSendReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const targetHosp = hospitalComparisons.find((h) => h.id === selectedHospitalId) || recommendedHospital;

    createPHCReferral({
      patientId: `P-PHC-${Math.floor(100 + Math.random() * 900)}`,
      patientName: patientName.trim(),
      patientAge: parseInt(patientAge) || 60,
      patientGender,
      fromPhcName: 'Alanganallur Primary Health Centre (PHC)',
      targetHospitalId: targetHosp.id,
      targetHospitalName: targetHosp.name,
      specialty,
      clinicalReason,
      requiredService,
      urgency,
    });

    setReferralSentSuccess(true);
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* PHC Header */}
      <div className="bg-[#0B2545] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                PRIMARY HEALTH CENTRE (PHC) NETWORK • MADURAI DISTRICT
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                PHC CODE: ALN-204
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Alanganallur 24x7 Upgraded PHC
            </h1>
            <p className="text-xs text-slate-300">
              Government Hospital Intelligent Digital Referral & Triage Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-center">
          <div className="bg-[#13315C] px-4 py-2.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase">ACTIVE REFERRALS</span>
            <div className="text-xl sm:text-2xl font-black text-cyan-300">{referrals.length}</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Referral Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Digital Referral + Intelligent Hospital Comparator (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-black text-[#0B2545] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-teal-600" />
                Create New Government Hospital Digital Referral
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-900 animate-pulse">
                EMERGENCY PRIORITY ACTIVE
              </span>
            </div>

            <form onSubmit={handleSendReferral} className="space-y-5">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age & Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-900 outline-none"
                    />
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Required Specialty *
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-900 outline-none"
                  >
                    <option value="Cardiology">Cardiology / Cath Lab</option>
                    <option value="Orthopedics">Orthopedics / Trauma</option>
                    <option value="Neurology">Neurology / Stroke Care</option>
                    <option value="Pediatrics">Pediatrics / Neonatology</option>
                  </select>
                </div>
              </div>

              {/* Clinical Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Diagnosis & Reason for Referral
                </label>
                <textarea
                  rows={2}
                  required
                  value={clinicalReason}
                  onChange={(e) => setClinicalReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Urgency Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Triage Urgency Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: '🟢 Normal OPD Referral', color: 'border-emerald-500 bg-emerald-50 text-emerald-950' },
                    { id: 'urgent', label: '🟠 Urgent (< 6 Hours)', color: 'border-amber-500 bg-amber-50 text-amber-950' },
                    { id: 'emergency', label: '🔴 Immediate Emergency (Golden Hour)', color: 'border-red-500 bg-red-50 text-red-950' },
                  ].map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => setUrgency(u.id as 'normal' | 'urgent' | 'emergency')}
                      className={`p-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                        urgency === u.id
                          ? `${u.color} ring-2 ring-red-400 shadow-sm`
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* INTELLIGENT GOVERNMENT HOSPITAL COMPARISON ENGINE */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Intelligent Multi-Hospital Capacity Comparison (AI Routing)
                  </label>
                  <span className="text-[11px] text-slate-500">Live Telemetry Data</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {hospitalComparisons.map((hosp) => {
                    const isSelected = selectedHospitalId === hosp.id;
                    return (
                      <div
                        key={hosp.id}
                        onClick={() => setSelectedHospitalId(hosp.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          hosp.isRecommended
                            ? 'bg-gradient-to-b from-teal-50 to-emerald-50/80 border-teal-500 shadow-md ring-2 ring-teal-400'
                            : isSelected
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="space-y-2">
                          {hosp.isRecommended && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-black text-[10px] uppercase tracking-wider shadow">
                              ⭐ RECOMMENDED DESTINATION
                            </span>
                          )}

                          <h3 className="font-black text-sm text-[#0B2545]">{hosp.name}</h3>

                          <div className="space-y-1 text-xs font-bold text-slate-700">
                            <div className="flex justify-between">
                              <span className="text-slate-500">ICU Beds:</span>
                              <span className={hosp.icuBedsAvailable > 0 ? 'text-emerald-700' : 'text-red-600'}>
                                {hosp.icuBedsAvailable} Available
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Distance & ETA:</span>
                              <span>{hosp.distanceKm} km • ~{hosp.travelMinutes}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Current Load:</span>
                              <span className={hosp.currentLoadPercent > 85 ? 'text-red-600' : 'text-teal-700'}>
                                {hosp.currentLoadPercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-medium">
                          {hosp.recommendationReason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Digital Referral Button */}
              <div className="pt-3 border-t">
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Send className="w-5 h-5 text-teal-200" />
                  <span>TRANSMIT DIGITAL REFERRAL TO RECEIVING HOSPITAL</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Referral Tracking Stepper (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-black text-base text-slate-900">Active Referral Tracker</h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {referrals.map((ref) => (
                <div key={ref.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-teal-900">{ref.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase">
                      {ref.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="font-black text-sm text-slate-900">{ref.patientName}</div>
                  <div className="text-xs text-slate-600">{ref.specialty} • {ref.targetHospitalName}</div>

                  {/* Stepper */}
                  <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-200 text-[9px] text-center font-bold">
                    <div className="text-emerald-700">✓ Sent</div>
                    <div className="text-emerald-700">✓ Accepted</div>
                    <div className="text-blue-700 animate-pulse">● En Route</div>
                    <div className="text-slate-400">○ Triage</div>
                    <div className="text-slate-400">○ Done</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
