import React from 'react';
import {
  ExternalLink,
  Phone,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import { DemoCaller } from '../types';

interface JudgeDemoHelperProps {
  callerPhone: string;
  onSelectCallerPhone: (phone: string) => void;
  demoCallers: DemoCaller[];
  isInCall: boolean;
}

export const JudgeDemoHelper: React.FC<JudgeDemoHelperProps> = ({
  callerPhone,
  onSelectCallerPhone,
  demoCallers,
  isInCall,
}) => {
  return (
    <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white font-serif">GH-QueueFlow Phone IVR</h3>
            <span className="text-[10px] uppercase font-bold text-teal-400">Hackathon Real-Time Demo</span>
          </div>
        </div>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
        >
          <span>Open Doctor Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Recommended 2-Screen Test Instruction */}
      <div className="bg-teal-950/40 border border-teal-500/30 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-teal-300 font-bold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>The Live Demonstration Flow:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
          <li>
            Open <strong className="text-white">Doctor OPD (Cardiology)</strong> at{' '}
            <code className="text-teal-300 font-mono">http://localhost:5173</code> in a side window (login:{' '}
            <span className="font-mono text-teal-200">dr_arun</span> / <span className="font-mono text-teal-200">password123</span>).
          </li>
          <li>
            On this phone, press <strong className="text-emerald-400">START CALL</strong>.
          </li>
          <li>
            Hear the voice prompt aloud through laptop speakers.
          </li>
          <li>
            Press <strong className="text-white font-mono">[ 1 ]</strong> (English) ➔{' '}
            <strong className="text-white font-mono">[ 1 ]</strong> (New Token) ➔{' '}
            <strong className="text-white font-mono">[ 2 ]</strong> (Cardiology) ➔{' '}
            <strong className="text-white font-mono">[ 1 ]</strong> (Confirm).
          </li>
          <li>
            <strong className="text-emerald-300">Watch the Doctor dashboard update instantly</strong> in real time via WebSockets with the new phone patient!
          </li>
        </ol>
      </div>

      {/* Caller Identity Selector */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Simulated Caller Phone Number:
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={callerPhone}
            onChange={(e) => onSelectCallerPhone(e.target.value)}
            disabled={isInCall}
            maxLength={10}
            placeholder="10-digit mobile"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
          />
          <button
            onClick={() => onSelectCallerPhone(`98765${Math.floor(10000 + Math.random() * 90000)}`)}
            disabled={isInCall}
            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
            title="Generate New Random Mobile Number"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Random</span>
          </button>
        </div>

        {demoCallers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {demoCallers.map((c, idx) => (
              <button
                key={idx}
                onClick={() => onSelectCallerPhone(c.phone)}
                disabled={isInCall}
                className={`text-[10px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                  callerPhone === c.phone
                    ? 'bg-teal-900/80 border-teal-500 text-teal-200 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                } disabled:opacity-50`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Architectural Guarantee Box */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Architecture Guarantee</span>
        </div>
        <p>
          This telephone dialer directly invokes the <code className="font-mono text-teal-300">/api/ivr</code> service and existing <code className="font-mono text-teal-300">db.json</code> visit creation engine. The resulting token is 100% genuine and synced live across the hospital network.
        </p>
      </div>
    </div>
  );
};
