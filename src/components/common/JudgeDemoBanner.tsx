import React from 'react';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

export const JudgeDemoBanner: React.FC = () => {
  const {
    demoStep,
    isDemoMode,
    startDemoScenario,
    nextDemoStep,
    prevDemoStep,
    exitDemoScenario,
    jumpToDemoStep,
    resetToSeedData,
    lang,
    setRole,
  } = useQueueFlow();

  const demoSteps = [
    {
      num: 1,
      title: 'Patient Dashboard',
      titleTa: 'நோயாளி போர்டல்',
      role: 'patient',
      desc: 'Anitha Kumar (GH-2026-004281, Token OP-047) checks General Medicine queue position.',
    },
    {
      num: 2,
      title: 'Live Queue & Audio',
      titleTa: 'நேரடி வரிசை & குரல் வழிகாட்டி',
      role: 'patient',
      desc: 'Simulated voice navigation guides patient to Room 204 via Blue Path.',
    },
    {
      num: 3,
      title: 'Doctor OPD Queue',
      titleTa: 'மருத்துவர் OPD வரிசை',
      role: 'doctor',
      desc: 'Dr. Priya Kumar calls next patient from the OPD queue in Room 204.',
    },
    {
      num: 4,
      title: 'Doctor Consultation',
      titleTa: 'மருத்துவர் ஆலோசனை',
      role: 'doctor',
      desc: 'Structured clinical exam records vitals, symptoms, and clinical findings.',
    },
    {
      num: 5,
      title: 'Doctor Orders Lab Tests',
      titleTa: 'ஆய்வக பரிசோதனை ஆணை',
      role: 'doctor',
      desc: 'Doctor orders Fasting Blood Sugar, PPBS, and CBC panel for diabetes assessment.',
    },
    {
      num: 6,
      title: 'Lab Sample Collection',
      titleTa: 'ஆய்வக மாதிரி சேகரிப்பு',
      role: 'lab',
      desc: 'Biochemistry Lab Staff receives order and collects blood sample in Room 101.',
    },
    {
      num: 7,
      title: 'Lab Results Transmitted',
      titleTa: 'ஆய்வக முடிவுகள் அனுப்புதல்',
      role: 'lab',
      desc: 'Numerical results (FBS: 154 mg/dL) entered and sent for doctor interpretation.',
    },
    {
      num: 8,
      title: 'Doctor Review & Rx',
      titleTa: 'மருத்துவர் மருந்து சீட்டு',
      role: 'doctor',
      desc: 'Doctor reviews lab report, confirms diagnosis, and issues digital prescription.',
    },
    {
      num: 9,
      title: 'Pharmacy Prep',
      titleTa: 'மருந்தக தயாரிப்பு',
      role: 'pharmacy',
      desc: 'Pharmacy staff verifies prescription and marks Counter 03 ready for pickup.',
    },
    {
      num: 10,
      title: 'Medicine Dispensed',
      titleTa: 'மருந்துகள் வழங்கல்',
      role: 'pharmacy',
      desc: 'Subsidized medicines dispensed and unified hospital visit marked completed.',
    },
    {
      num: 11,
      title: 'Patient Journey Summary',
      titleTa: 'நோயாளி நிறைவு சுருக்கம்',
      role: 'patient',
      desc: 'Patient receives digital discharge instructions and revisit appointment.',
    },
    {
      num: 12,
      title: 'Admin Intelligence',
      titleTa: 'நிர்வாக பகுப்பாய்வு மையம்',
      role: 'admin',
      desc: 'Admin views Live Hospital Flow Map and resolves X-Ray bottleneck with 1 click.',
    },
  ];

  if (!isDemoMode) {
    return (
      <div className="bg-slate-900 border-b border-slate-700 text-slate-200 px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <span className="p-1 rounded bg-teal-500/20 text-teal-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 inline" />
          </span>
          <span className="font-semibold text-white">Evaluator / Demo Mode Available:</span>
          <span className="text-slate-400 hidden sm:inline">
            Demonstrate Anitha Kumar's complete interconnected hospital journey across all 7 departments.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startDemoScenario}
            className="px-3 py-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch End-to-End Walkthrough</span>
          </button>

          <button
            onClick={resetToSeedData}
            title="Reset all states to initial mock state"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const currentStepObj = demoSteps.find((s) => s.num === demoStep) || demoSteps[0];

  return (
    <div className="bg-[#0f172a] border-b-2 border-teal-500 text-white px-4 py-2.5 shadow-xl sticky top-[49px] z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Step Indicator & Narrative */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded text-xs font-bold tracking-wide flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>STEP {demoStep} OF 12</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs sm:text-sm text-white">
                {lang === 'ta' ? currentStepObj.titleTa : currentStepObj.title}
              </h4>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                Role: {currentStepObj.role.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1">{currentStepObj.desc}</p>
          </div>
        </div>

        {/* Stepper Progress Dots */}
        <div className="hidden lg:flex items-center gap-1">
          {demoSteps.map((s) => (
            <button
              key={s.num}
              onClick={() => {
                jumpToDemoStep(s.num);
                setRole(s.role as any);
              }}
              title={`Step ${s.num}: ${s.title}`}
              className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                demoStep === s.num
                  ? 'bg-teal-500 text-slate-950 scale-110 shadow'
                  : demoStep > s.num
                  ? 'bg-blue-800 text-slate-200'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {demoStep > s.num ? '✓' : s.num}
            </button>
          ))}
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={prevDemoStep}
            disabled={demoStep <= 1}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-xs font-medium flex items-center gap-1 border border-slate-700"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {demoStep < 12 ? (
            <button
              onClick={nextDemoStep}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-md animate-pulse-subtle"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                exitDemoScenario();
                resetToSeedData();
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Restart Flow</span>
            </button>
          )}

          <button
            onClick={exitDemoScenario}
            title="Exit Demo Guide"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
