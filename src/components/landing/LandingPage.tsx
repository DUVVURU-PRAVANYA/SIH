import React, { useState } from 'react';
import {
  Building2,
  PhoneCall,
  User,
  Stethoscope,
  FlaskConical,
  Scan,
  Pill,
  Users,
  Activity,
  Smartphone,
  Tv,
  ArrowRight,
  ShieldCheck,
  Clock,
  QrCode,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { UserRole } from '../../types';

export const LandingPage: React.FC = () => {
  const { setRole, lang, startDemoScenario } = useQueueFlow();
  const [mobileInput, setMobileInput] = useState('');
  const [staffIdInput, setStaffIdInput] = useState('');
  const [loginTab, setLoginTab] = useState<'patient' | 'staff'>('patient');

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setRole('patient');
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setRole('doctor');
  };

  const roleProfiles: {
    id: UserRole;
    title: string;
    titleTa: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    tag: string;
  }[] = [
    {
      id: 'patient' as UserRole,
      title: 'Patient Portal',
      titleTa: 'நோயாளி போர்டல்',
      subtitle: 'Self registration, doctor recommendation, live queue tracking, consultation history.',
      icon: <User className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-300 hover:border-blue-600 bg-blue-50/40',
      tag: 'Token: GM-038',
    },
    {
      id: 'doctor' as UserRole,
      title: 'Doctor OPD Portal',
      titleTa: 'மருத்துவர் போர்டல்',
      subtitle: 'OPD queue callout, patient profile, examination, lab/scan orders, revisit decision.',
      icon: <Stethoscope className="w-5 h-5 text-teal-600" />,
      color: 'border-teal-300 hover:border-teal-600 bg-teal-50/40',
      tag: 'Dr. Priya Kumar (Room 204)',
    },
    {
      id: 'scan_lab' as UserRole,
      title: 'Scan & Diagnostic Lab',
      titleTa: 'ஆய்வகம் & ஸ்கேன் பிரிவு',
      subtitle: 'Biochemistry, Pathology & Radiology test processing, numerical results, and reports.',
      icon: <FlaskConical className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-300 hover:border-emerald-600 bg-emerald-50/40',
      tag: 'Room 101 Diagnostic Suite',
    },
    {
      id: 'pharmacy' as UserRole,
      title: 'Central Pharmacy',
      titleTa: 'மைய மருந்தகம்',
      subtitle: 'Doctor prescription preparation, Counter 03 dispensing, and visit completion.',
      icon: <Pill className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-300 hover:border-purple-600 bg-purple-50/40',
      tag: 'Counter 03 Active',
    },
  ];

  return (
    <div className="bg-[#f8fafc] flex-1">
      {/* Top Hero Banner - Institutional & Professional */}
      <section className="bg-gradient-to-b from-[#0b2545] to-[#134074] text-white py-12 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Government Digital Health Infrastructure</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-white leading-tight">
                GH QueueFlow
              </h1>
              <p className="text-base sm:text-lg text-slate-200 font-medium">
                Government Hospital Patient Flow & Queue Management System
              </p>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                A unified, role-based patient journey platform engineered for government district and medical college hospitals. 
                Eliminates fragmented department re-registrations, provides real-time multi-stage token tracking, 
                and integrates accessible audio/Tamil navigation with hospital operational intelligence.
              </p>

              {/* Quick Actions */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={startDemoScenario}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-md shadow-md flex items-center gap-2 transition-transform active:scale-95"
                >
                  <span>Start Complete Demo Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setRole('patient')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-md border border-slate-600 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-teal-400" />
                  <span>Enter Patient Portal</span>
                </button>

                <button
                  onClick={() => setRole('doctor')}
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-md border border-slate-600 flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <span>Doctor OPD Portal</span>
                </button>
              </div>

              {/* Hotline Highlight Card */}
              <div className="mt-4 p-3.5 bg-slate-900/80 border border-slate-700 rounded-lg flex items-center justify-between text-xs max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Need help registering over phone?</span>
                    <p className="text-slate-400 text-[11px]">Toll-Free Hospital Assistance Hotline for non-smartphone users</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-300 font-bold text-sm">1800-425-4444</span>
                  <div className="text-[10px] text-slate-400">24x7 Staff Assisted</div>
                </div>
              </div>
            </div>

            {/* Right Quick Login Card */}
            <div className="lg:col-span-5 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-6">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setLoginTab('patient')}
                    className={`flex-1 py-2 text-xs font-bold rounded text-center transition-colors ${
                      loginTab === 'patient'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Patient Quick Access
                  </button>
                  <button
                    onClick={() => setLoginTab('staff')}
                    className={`flex-1 py-2 text-xs font-bold rounded text-center transition-colors ${
                      loginTab === 'staff'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hospital Staff Access
                  </button>
                </div>
              </div>

              {loginTab === 'patient' ? (
                <form onSubmit={handlePatientLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Patient Mobile Number / Patient ID
                    </label>
                    <input
                      type="text"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      placeholder="e.g. 98401 23456 or GH-2026-004281"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Demo Account: <span className="font-mono text-blue-700 font-semibold">Anitha Kumar (OP-047)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded transition-colors shadow flex items-center justify-center gap-1.5"
                  >
                    <span>Login & View My Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleStaffLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Staff ID / Employee Code
                    </label>
                    <input
                      type="text"
                      value={staffIdInput}
                      onChange={(e) => setStaffIdInput(e.target.value)}
                      placeholder="e.g. DOC-GENMED-04 or LAB-TECH-01"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department PIN / OTP</label>
                    <input
                      type="password"
                      placeholder="••••••"
                      defaultValue="123456"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded transition-colors shadow flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize Staff Login</span>
                  </button>
                </form>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 text-center">
                Hospital Network Protected • Confidential Patient Records Access
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Role Portals Matrix - 1-Click Access for Evaluation */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Hospital Operational Modules & Roles
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Select any department role below to evaluate its dedicated workflow and real-time state synchronization.
            </p>
          </div>
          <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-semibold hidden sm:inline">
            9 Interactive Views
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleProfiles.map((p) => (
            <div
              key={p.id}
              onClick={() => setRole(p.id)}
              className={`p-4 rounded-lg border transition-all cursor-pointer shadow-sm hover:shadow-md ${p.color} flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white rounded-md shadow-xs border border-slate-200">
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-slate-700 font-mono">
                    {p.tag}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                  {lang === 'ta' ? p.titleTa : p.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.subtitle}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-blue-900">
                <span>Launch Portal</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Patient Journey Flow Diagram */}
      <section className="bg-white border-y border-slate-200 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl font-extrabold text-slate-900">One Unified Patient Journey</h2>
            <p className="text-xs text-slate-600 mt-1">
              Patients register once. The digital state machine automatically routes and updates tokens across every care department without manual queue re-registration.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            {[
              { step: '1. Registration', sub: 'OP-047 Issued', icon: <FileText className="w-4 h-4 text-amber-600" /> },
              { step: '2. OPD Queue', sub: 'Room 204 Wait', icon: <Clock className="w-4 h-4 text-blue-600" /> },
              { step: '3. Doctor Exam', sub: 'Dr. Priya Kumar', icon: <Stethoscope className="w-4 h-4 text-teal-600" /> },
              { step: '4. Lab / Scan', sub: 'Room 101 / 108', icon: <FlaskConical className="w-4 h-4 text-emerald-600" /> },
              { step: '5. Test Results', sub: 'Numerical Entry', icon: <Activity className="w-4 h-4 text-indigo-600" /> },
              { step: '6. Doctor Review', sub: 'Rx Generated', icon: <CheckCircle2 className="w-4 h-4 text-teal-700" /> },
              { step: '7. Pharmacy', sub: 'Counter 03 Ready', icon: <Pill className="w-4 h-4 text-purple-600" /> },
              { step: '8. Completion', sub: 'Discharge & Revisit', icon: <CheckCircle2 className="w-4 h-4 text-green-700" /> },
            ].map((st, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center">
                <div className="p-2 rounded-full bg-white border border-slate-200 mb-2">{st.icon}</div>
                <div className="text-xs font-bold text-slate-900">{st.step}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{st.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-[#0b2545] text-slate-300 py-6 px-4 text-xs border-t border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-white">GH QueueFlow</span>
            <span className="text-slate-500">|</span>
            <span>Government Hospital Patient Flow Digital Platform</span>
          </div>

          <div className="text-slate-400 text-center sm:text-right">
            District Government Headquarter Hospital • Health & Family Welfare Digital Infrastructure
          </div>
        </div>
      </footer>
    </div>
  );
};
