import React, { useState } from 'react';
import {
  Users,
  PhoneCall,
  UserPlus,
  Search,
  Printer,
  QrCode,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { PatientEntryModal } from '../patient/PatientEntryModal';
import { PatientTokenModal } from '../patient/PatientTokenModal';

export const ReceptionPortal: React.FC = () => {
  const {
    patients,
    callRequests,
    departments,
    logCallAssistanceRequest,
    convertCallToRegistration,
    lang,
  } = useQueueFlow();

  const [activeTab, setActiveTab] = useState<'walkins' | 'hotline' | 'emergency' | 'search'>('walkins');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [selectedTokenPatient, setSelectedTokenPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Hotline Logging Form State
  const [callerPhone, setCallerPhone] = useState('98401 99882');
  const [callerName, setCallerName] = useState('P. Muthuvel');
  const [callerAge, setCallerAge] = useState('67');
  const [callerGender, setCallerGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [callerReason, setCallerReason] = useState('Chronic knee pain and difficulty walking.');
  const [callerDept, setCallerDept] = useState('dept-ortho');
  const [callerIsEmergency, setCallerIsEmergency] = useState(false);

  const handleHotlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logCallAssistanceRequest({
      callerPhone,
      patientName: callerName,
      age: Number(callerAge) || 60,
      gender: callerGender,
      reasonForVisit: callerReason,
      departmentId: callerDept,
      isEmergency: callerIsEmergency,
    });
    setCallerName('');
    setCallerPhone('');
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.token.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0369a1] text-white px-4 py-4 border-b border-sky-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-sky-700/50 border border-sky-400/40 flex items-center justify-center text-sky-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">
                  Central Reception & Patient Assistance Helpdesk
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/30 text-sky-100 font-bold border border-sky-400/40">
                  Entrance Counter 1-4 • Block A
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Assisted Walk-in Registration, 1800 Hotline Logging & Emergency Triage Queue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEntryModalOpen(true)}
              className="px-4 py-2 bg-white text-sky-950 hover:bg-sky-50 rounded text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <UserPlus className="w-4 h-4 text-sky-700" />
              <span>+ Quick Register Walk-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex gap-3 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'walkins', label: `Today's Registrations (${patients.length})`, icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'hotline', label: `1800 Hotline Queue (${callRequests.length})`, icon: <PhoneCall className="w-3.5 h-3.5" /> },
            { id: 'emergency', label: 'Emergency Cases Triage', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
            { id: 'search', label: 'Universal Patient Search', icon: <Search className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-900 text-white shadow-xs'
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
        {/* TAB 1: TODAY'S REGISTRATIONS */}
        {activeTab === 'walkins' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Today's Patient Registrations</h2>
                <p className="text-xs text-slate-500">Generate printed tokens and QR check-in badges for patients</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient ID</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Age / Gender</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Queue Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-extrabold text-blue-900">{p.token}</td>
                      <td className="p-3 font-mono text-slate-600">{p.id}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.age} yrs / {p.gender}</td>
                      <td className="p-3 font-medium text-slate-800">{p.departmentName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedTokenPatient(p)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Token</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: 1800 HOTLINE CALL QUEUE */}
        {activeTab === 'hotline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Log Incoming Call Form */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-200 pb-2 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Log 1800-425-4444 Hotline Call</h3>
              </div>

              <form onSubmit={handleHotlineSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Caller Phone Number</label>
                  <input
                    type="text"
                    required
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={callerAge}
                      onChange={(e) => setCallerAge(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={callerGender}
                      onChange={(e) => setCallerGender(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Visit / Symptoms</label>
                  <input
                    type="text"
                    value={callerReason}
                    onChange={(e) => setCallerReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recommended Department</label>
                  <select
                    value={callerDept}
                    onChange={(e) => setCallerDept(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-700 pt-1">
                  <input
                    type="checkbox"
                    checked={callerIsEmergency}
                    onChange={(e) => setCallerIsEmergency(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Mark as Emergency Triage Case</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-900 hover:bg-sky-800 text-white font-bold rounded shadow flex items-center justify-center gap-1.5"
                >
                  <span>Log Assistance Request</span>
                </button>
              </form>
            </div>

            {/* Right: Hotline Requests Table */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Recorded Hotline Requests</h3>

              <div className="divide-y divide-slate-100 text-xs">
                {callRequests.map((req) => (
                  <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{req.patientName}</span>
                        <span className="font-mono text-slate-500 font-normal">({req.callerPhone})</span>
                        {req.isEmergency && (
                          <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 mt-0.5">{req.reasonForVisit}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{req.createdAt}</div>
                    </div>

                    <div>
                      {req.status === 'registered' ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          ✓ Assigned: {req.assignedToken}
                        </span>
                      ) : (
                        <button
                          onClick={() => convertCallToRegistration(req.id)}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold text-xs"
                        >
                          Convert to Live Token
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMERGENCY TRIAGE */}
        {activeTab === 'emergency' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Emergency Red-Code Triage Queue</h2>
            <p className="text-xs text-slate-500">
              Immediate bypass for acute cardiac, stroke, and poly-trauma presentations
            </p>

            <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-red-950 text-sm">Emergency Department Status: 6 Active Resuscitation Bays</div>
                <div className="text-red-800 mt-0.5">Average Triage Time: &lt; 2 minutes • 24x7 Consultant on Duty</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UNIVERSAL SEARCH */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Patient Name, ID (GH-2026-XXXX) or Token (OP-047)..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-900">{p.token}</td>
                      <td className="p-3 font-mono text-slate-600">{p.id}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-700">{p.departmentName}</td>
                      <td className="p-3 font-semibold text-teal-800">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PatientEntryModal isOpen={entryModalOpen} onClose={() => setEntryModalOpen(false)} />
      {selectedTokenPatient && (
        <PatientTokenModal
          isOpen={!!selectedTokenPatient}
          onClose={() => setSelectedTokenPatient(null)}
          patient={selectedTokenPatient}
        />
      )}
    </div>
  );
};
