import React, { useState } from 'react';
import {
  X,
  Ticket,
  Search,
  MapPin,
  HelpCircle,
  Volume2,
  Tv,
  ArrowRight,
  CheckCircle2,
  Heart,
  Stethoscope,
  Activity,
  Printer,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface PatientKioskModeProps {
  onClose?: () => void;
}

export const PatientKioskMode: React.FC<PatientKioskModeProps> = ({ onClose }) => {
  const { lang, setLang, registerPatient, speakPatientGuidance, departments, setRole } = useQueueFlow();
  const [step, setStep] = useState<'welcome' | 'dept' | 'issued'>('welcome');
  const [issuedToken, setIssuedToken] = useState<string>('');
  const [targetRoom, setTargetRoom] = useState<string>('Room 204');
  const [targetPathColor, setTargetPathColor] = useState<string>('blue');

  const handleStart = () => {
    setStep('dept');
  };

  const handleSelectDept = async (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId) || departments[1];
    const newPat = await registerPatient({
      name: 'Kiosk Walk-in Patient',
      nameTa: 'கியோஸ்க் நோயாளி',
      age: 58,
      gender: 'Female',
      phone: '98401 99882',
      departmentId: dept.id,
      priority: 'senior',
    });

    setIssuedToken(newPat.token);
    setTargetRoom(dept.room || 'Room 204');
    setTargetPathColor(dept.color);
    setStep('issued');

    setTimeout(() => {
      speakPatientGuidance(newPat);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07182C] text-white flex flex-col p-4 sm:p-8 overflow-y-auto font-sans">
      {/* Top Kiosk Bar */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-500 text-slate-950 font-black text-2xl">
            <Tv className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
              DISTRICT GOVERNMENT HOSPITAL TOUCH KIOSK
            </h1>
            <p className="text-xs text-teal-300 font-semibold">
              Self-Service One-Touch Token Generation & Tamil / English Guidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switch */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex gap-1">
            <button
              onClick={() => setLang('ta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                lang === 'ta' ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                lang === 'en' ? 'bg-teal-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              ENGLISH
            </button>
          </div>

          {/* Close Kiosk */}
          <button
            onClick={() => {
              if (onClose) onClose();
              setRole('patient');
            }}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs font-bold"
            title="Exit Kiosk Mode"
          >
            Exit Kiosk
          </button>
        </div>
      </div>

      {/* STEP 1: WELCOME SCREEN */}
      {step === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 my-auto py-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold">
              ✨ One-Touch Fast OPD Token
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-serif">
              {lang === 'ta' ? 'அரசு மருத்துவமனைக்கு நல்வரவு' : 'WELCOME TO GOVERNMENT HOSPITAL'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              {lang === 'ta'
                ? 'டோக்கன் பெற கீழே உள்ள தொடங்கு பட்டனை அழுத்தவும்'
                : 'Touch the START button below to generate your hospital token'}
            </p>
          </div>

          {/* GIANT START BUTTON */}
          <button
            onClick={handleStart}
            className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-2xl sm:text-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-3 ring-8 ring-teal-500/30 animate-pulse-subtle"
          >
            <Ticket className="w-16 h-16 text-slate-950" />
            <span>{lang === 'ta' ? 'தொடங்கு (START)' : 'START'}</span>
          </button>

          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-teal-400" />
              {lang === 'ta' ? 'குரல் வழி வழிகாட்டுதல் உண்டு' : 'Voice audio guidance supported'}
            </span>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DEPARTMENT */}
      {step === 'dept' && (
        <div className="flex-1 max-w-4xl mx-auto w-full my-auto py-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
              {lang === 'ta' ? 'சிகிச்சை பிரிவு தேர்வு செய்க' : 'Select Treatment Department'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {lang === 'ta'
                ? 'நீங்கள் செல்ல வேண்டிய மருத்துவர் பிரிவை தொடுக'
                : 'Tap your required medical department'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* General Medicine */}
            <button
              onClick={() => handleSelectDept('dept-genmed')}
              className="p-5 rounded-2xl bg-[#0F2F54] hover:bg-teal-900/60 border-2 border-teal-500 text-white flex items-center gap-4 text-left transition-all active:scale-95 shadow-lg group"
            >
              <div className="w-16 h-16 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shrink-0 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-10 h-10" />
              </div>
              <div>
                <div className="text-xl font-bold text-teal-200">
                  {lang === 'ta' ? 'பொது மருத்துவம் (OPD)' : 'General Medicine (OPD)'}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  Block B • 2nd Floor • Room 204 • Dr. Priya Kumar
                </div>
                <div className="mt-1.5 text-[11px] font-bold text-teal-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  Follow Blue Path →
                </div>
              </div>
            </button>

            {/* Cardiology */}
            <button
              onClick={() => handleSelectDept('dept-cardio')}
              className="p-5 rounded-2xl bg-[#0F2F54] hover:bg-blue-900/60 border-2 border-blue-500 text-white flex items-center gap-4 text-left transition-all active:scale-95 shadow-lg group"
            >
              <div className="w-16 h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shrink-0 group-hover:scale-105 transition-transform">
                <Heart className="w-10 h-10" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-200">
                  {lang === 'ta' ? 'இதயவியல் பிரிவு' : 'Cardiology (OPD)'}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  Block B • 1st Floor • Rooms 104-106
                </div>
                <div className="mt-1.5 text-[11px] font-bold text-blue-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Follow Blue Path →
                </div>
              </div>
            </button>

            {/* Orthopedics */}
            <button
              onClick={() => handleSelectDept('dept-ortho')}
              className="p-5 rounded-2xl bg-[#0F2F54] hover:bg-indigo-900/60 border-2 border-indigo-500 text-white flex items-center gap-4 text-left transition-all active:scale-95 shadow-lg group"
            >
              <div className="w-16 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-10 h-10" />
              </div>
              <div>
                <div className="text-xl font-bold text-indigo-200">
                  {lang === 'ta' ? 'எலும்பு மூட்டு பிரிவு' : 'Orthopedics & Joint Care'}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  Block B • 1st Floor • Rooms 114-116
                </div>
                <div className="mt-1.5 text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Follow Blue Path →
                </div>
              </div>
            </button>

            {/* Emergency */}
            <button
              onClick={() => handleSelectDept('dept-emerg')}
              className="p-5 rounded-2xl bg-red-950/80 hover:bg-red-900 border-2 border-red-500 text-white flex items-center gap-4 text-left transition-all active:scale-95 shadow-lg group"
            >
              <div className="w-16 h-16 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shrink-0 group-hover:scale-105 transition-transform">
                🚨
              </div>
              <div>
                <div className="text-xl font-bold text-red-200">
                  {lang === 'ta' ? 'அவசர சிகிச்சை பிரிவு (24x7)' : 'Emergency & Trauma (24x7)'}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  Block A • Ground Floor • Immediate Triage
                </div>
                <div className="mt-1.5 text-[11px] font-bold text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Follow Red Path →
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: TOKEN ISSUED SLIP */}
      {step === 'issued' && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 my-auto py-6">
          <div className="w-full bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border-4 border-teal-500 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>TOKEN PRINTED</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                YOUR HOSPITAL TOKEN
              </div>
              <div className="text-5xl sm:text-6xl font-black text-[#0B2545] font-mono tracking-tight">
                {issuedToken || 'OP-048'}
              </div>
            </div>

            {/* Room & Path directions */}
            <div className="p-4 rounded-xl bg-blue-700 text-white text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-blue-200">PROCEED TO:</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-blue-900">
                  2nd Floor
                </span>
              </div>
              <div className="text-2xl font-black">{targetRoom}</div>
              <div className="text-xs font-bold text-blue-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>FOLLOW BLUE PATH ARROWS →</span>
              </div>
            </div>

            {/* Voice Prompt */}
            <button
              onClick={() => speakPatientGuidance()}
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>{lang === 'ta' ? 'குரல் வழி கேட்க' : 'Hear Tamil / English Voice Guidance'}</span>
            </button>
          </div>

          <button
            onClick={() => setStep('welcome')}
            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Done, Back to Start
          </button>
        </div>
      )}
    </div>
  );
};
