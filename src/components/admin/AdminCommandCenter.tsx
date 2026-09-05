import React, { useState } from 'react';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sliders,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  Pause,
  Play,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { DepartmentStats } from '../../types';

export const AdminCommandCenter: React.FC = () => {
  const {
    departments,
    kpiData,
    applyBottleneckAction,
    pauseDepartmentQueue,
    resumeDepartmentQueue,
    assignDepartmentCounters,
    isEmergencyMode,
    toggleEmergencyMode,
    lang,
  } = useQueueFlow();

  const [activeTab, setActiveTab] = useState<'map' | 'queues' | 'bottlenecks' | 'analytics'>('map');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-xray');

  const xrayDept = departments.find((d) => d.id === 'dept-xray');
  const labDept = departments.find((d) => d.id === 'dept-lab');

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Top Command Center Header */}
      <div className="bg-[#0f172a] text-white px-4 py-4 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-teal-300">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">
                  Hospital Operational Command & Intelligence Center
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-400/40">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                District Government Headquarter Hospital • Real-Time Patient Flow Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleEmergencyMode}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow transition-all ${
                isEmergencyMode
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isEmergencyMode ? 'EMERGENCY PROTOCOL ACTIVE' : 'Toggle Emergency Triage'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Bar */}
      <div className="bg-[#1e293b] text-white border-b border-slate-700 py-4 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Patients Today</span>
            <div className="text-xl font-black font-mono text-white mt-0.5">{kpiData.patientsToday}</div>
          </div>

          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Currently Waiting</span>
            <div className="text-xl font-black font-mono text-blue-300 mt-0.5">{kpiData.currentlyWaiting}</div>
          </div>

          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg Waiting Time</span>
            <div className="text-xl font-black font-mono text-amber-300 mt-0.5">~{kpiData.avgWaitingTimeMinutes} min</div>
          </div>

          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Completed Visits</span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">{kpiData.totalCompletedToday}</div>
          </div>

          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Doctors</span>
            <div className="text-xl font-black font-mono text-teal-300 mt-0.5">{kpiData.activeDoctors} On Duty</div>
          </div>

          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">ICU Beds Free</span>
            <div className="text-xl font-black font-mono text-emerald-300 mt-0.5">{kpiData.icuBedsAvailable} / 20 Beds</div>
          </div>

          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Hospital Load</span>
            <div className="text-xl font-black font-mono text-amber-400 mt-0.5">{kpiData.hospitalCapacityPercent}% Capacity</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex gap-3 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'map', label: 'Live Hospital Flow Map', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'bottlenecks', label: 'Bottleneck Detection & Resolution', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'queues', label: 'Department Counter Management', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'analytics', label: 'Operational Throughput Analytics', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TAB 1: LIVE HOSPITAL FLOW MAP */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Bottleneck Alert Banner if X-Ray is critical */}
            {xrayDept?.isBottleneck && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <strong className="text-red-950 font-bold text-sm">
                      Bottleneck Detected: Digital X-Ray Unit (Room 108)
                    </strong>
                    <p className="text-xs text-red-800">
                      Queue surged to 56 patients. Turnaround ~85 mins. Capacity utilization at 92%.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => applyBottleneckAction('dept-xray')}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-md shadow flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Zap className="w-4 h-4" />
                  <span>Activate Standby Counter 2 (1-Click Mitigation)</span>
                </button>
              </div>
            )}

            {/* Visual Hospital Flow Map Diagram */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Live Department Flow Telemetry</h2>
                  <p className="text-xs text-slate-500">Real-time queue load, active counters, and throughput capacity</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      dept.status === 'critical'
                        ? 'bg-red-50/70 border-red-400 ring-2 ring-red-400/40'
                        : dept.status === 'busy'
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                          {dept.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dept.status === 'critical'
                              ? 'bg-red-600 text-white'
                              : dept.status === 'busy'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {dept.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900">{dept.name}</h3>
                      <div className="text-xs text-slate-500">{dept.room} • {dept.block}</div>

                      <div className="grid grid-cols-2 gap-2 text-xs mt-4 pt-3 border-t border-slate-200">
                        <div>
                          <span className="text-slate-500">Waiting:</span>
                          <strong className="block font-mono text-slate-900 text-base">{dept.waitingCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Counters:</span>
                          <strong className="block font-mono text-slate-900 text-base">
                            {dept.activeCounters} / {dept.totalCounters}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Avg Wait:</span>
                          <strong className="block font-mono text-slate-900">{dept.avgServiceMinutes} min</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Load %:</span>
                          <strong className="block font-mono text-slate-900">{dept.loadPercentage}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      {dept.status === 'critical' ? (
                        <button
                          onClick={() => applyBottleneckAction(dept.id)}
                          className="w-full py-1.5 bg-red-700 hover:bg-red-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Open Counter 2</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Throughput: ~{dept.serviceVelocityPerHour} pts/hr
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOTTLENECKS */}
        {activeTab === 'bottlenecks' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Hospital Bottleneck Mitigation Engine</h2>
            <p className="text-xs text-slate-500">
              Automated operational alerts identifying queue stagnation across OPD, lab, imaging, and pharmacy wings.
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-slate-900 font-bold text-sm">Digital X-Ray & Imaging (Room 108)</strong>
                  <p className="text-slate-600 mt-0.5">
                    Surge: 56 patients waiting. Current capacity 92%. Standby Counter 2 is available.
                  </p>
                </div>
                <button
                  onClick={() => applyBottleneckAction('dept-xray')}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-bold self-start sm:self-auto"
                >
                  Allocate Extra Radiographer
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-slate-900 font-bold text-sm">Pathology & Fasting Blood Sugar Lab (Room 101)</strong>
                  <p className="text-slate-600 mt-0.5">
                    Load at 88%. Standby phlebotomist can reduce turnaround from 35 mins to 20 mins.
                  </p>
                </div>
                <button
                  onClick={() => applyBottleneckAction('dept-lab')}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold self-start sm:self-auto"
                >
                  Activate Sample Counter 4
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COUNTER MANAGEMENT */}
        {activeTab === 'queues' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Department Active Counters Allocation</h2>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Department</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Active Counters</th>
                    <th className="p-3">Waiting Count</th>
                    <th className="p-3">Queue Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{d.name}</td>
                      <td className="p-3 text-slate-500 uppercase">{d.category}</td>
                      <td className="p-3 font-mono font-bold">
                        {d.activeCounters} / {d.totalCounters}
                      </td>
                      <td className="p-3 font-mono font-bold">{d.waitingCount}</td>
                      <td className="p-3 font-semibold text-teal-800">{d.status}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => assignDepartmentCounters(d.id, Math.min(d.totalCounters, d.activeCounters + 1))}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                        >
                          + Add Counter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
