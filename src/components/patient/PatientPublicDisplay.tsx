import React, { useState, useEffect } from 'react';
import {
  Tv,
  Volume2,
  Building2,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { voiceService } from '../../utils/voice';

export const PatientPublicDisplay: React.FC = () => {
  const { lang, setRole } = useQueueFlow();
  const [currentServing, setCurrentServing] = useState('OP-035');
  const [nextTokens, setNextTokens] = useState(['OP-036', 'OP-037', 'OP-038', 'OP-047']);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const playChimeAndVoice = () => {
    voiceService.playChime('turn');
    voiceService.speak(
      `Attention please. Token OP-035. Please enter Room 204 for General Medicine consultation.`,
      'en'
    );
  };

  return (
    <div className="min-h-screen bg-[#061426] text-white flex flex-col justify-between p-4 sm:p-8 select-none font-sans">
      {/* Top TV Screen Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-700 flex items-center justify-center border-2 border-blue-400 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
              DISTRICT GOVERNMENT HEADQUARTER HOSPITAL
            </div>
            <div className="text-sm font-semibold text-teal-400">
              Department of Health & Family Welfare Digital Queue System
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black font-mono text-amber-300">{currentTime}</div>
            <div className="text-xs text-slate-400">Live Waiting Hall Display Mode</div>
          </div>

          <button
            onClick={() => setRole('patient')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 font-bold"
          >
            Exit Fullscreen
          </button>
        </div>
      </div>

      {/* Main Waiting Room Display Area */}
      <div className="my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Big Serving Callout */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#0c2e59] via-[#0e3b73] to-[#082040] rounded-2xl border-4 border-blue-500/80 p-8 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <button
              onClick={playChimeAndVoice}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span>Simulate Voice Callout Chime</span>
            </button>
          </div>

          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-teal-400/20 text-teal-300 font-extrabold text-sm sm:text-base tracking-widest uppercase border border-teal-400/40">
              GENERAL MEDICINE OPD • ROOM 204
            </span>

            <div className="text-sm sm:text-lg font-bold text-slate-300 mt-4 uppercase tracking-wider">
              {lang === 'ta' ? 'இப்போது பரிசோதிக்கப்படும் டோக்கன் எண்' : 'NOW SERVING PATIENT TOKEN'}
            </div>

            <div className="text-7xl sm:text-9xl font-black font-mono text-white tracking-tight my-4 drop-shadow-lg text-emerald-300">
              {currentServing}
            </div>

            <div className="text-xl sm:text-2xl font-bold text-slate-200">
              Please Proceed Directly to <span className="text-amber-300 font-extrabold">Room 204</span> (2nd Floor)
            </div>
            <div className="text-sm text-slate-400 mt-1">Attending Physician: <strong>Dr. Priya Kumar (MD)</strong></div>
          </div>

          <div className="pt-6 border-t border-blue-400/30 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-300 gap-2">
            <span className="font-semibold">Follow Blue Path on Floor Tile Arrows</span>
            <span className="text-teal-300 font-bold">Please have your printed token slip ready.</span>
          </div>
        </div>

        {/* Right Next In Queue List */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border-2 border-slate-700 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-700 pb-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>PLEASE BE READY (NEXT)</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">OPD Queue</span>
            </div>

            <div className="space-y-3">
              {nextTokens.map((tok, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl flex items-center justify-between border ${
                    idx === 0
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-500/30'
                      : idx === 3
                      ? 'bg-blue-900/30 border-blue-500/40 text-blue-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-2xl font-black font-mono">{tok}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {idx === 0 ? 'Wait at Door' : idx === 3 ? 'Anitha Kumar' : 'In Waiting Hall'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-800/80 rounded-lg text-xs text-slate-300 text-center border border-slate-700">
            Emergency patients bypass normal waiting order via Red Priority Protocol.
          </div>
        </div>
      </div>

      {/* Bottom Ticker Notice */}
      <div className="bg-slate-900 border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Central Digital Hospital Queue System • Room 204 OPD Screen</span>
        </div>
        <div>Free Generic Medications provided at Pharmacy Counter 03 • TNMSC Scheme</div>
      </div>
    </div>
  );
};
