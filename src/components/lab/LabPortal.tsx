import React, { useState } from 'react';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Send,
  Plus,
  Search,
  Calendar,
  Filter,
  Check,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { LabOrder, LabResultItem } from '../../types';

export const LabPortal: React.FC = () => {
  const { labOrders, updateLabOrderStatus, lang } = useQueueFlow();

  const [activeTab, setActiveTab] = useState<'queue' | 'entry' | 'sugar_workflow' | 'completed'>('queue');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(labOrders[0]?.id || 'LAB-ORD-101');

  // Result Entry State
  const selectedOrder = labOrders.find((o) => o.id === selectedOrderId) || labOrders[0];

  const [fbsVal, setFbsVal] = useState('154');
  const [ppbsVal, setPpbsVal] = useState('210');
  const [hba1cVal, setHba1cVal] = useState('7.8');
  const [hbVal, setHbVal] = useState('12.4');
  const [wbcVal, setWbcVal] = useState('7400');
  const [technicianRemarks, setTechnicianRemarks] = useState('Samples analyzed via automated clinical biochemistry analyzer.');

  const handleStartAnalysis = (orderId: string) => {
    updateLabOrderStatus(orderId, 'sample_collected');
  };

  const handleCompleteAndSend = () => {
    if (!selectedOrder) return;

    const results: LabResultItem[] = [
      {
        testName: 'Fasting Blood Sugar (FBS)',
        value: fbsVal,
        unit: 'mg/dL',
        referenceRange: '70 - 99 mg/dL',
        isAbnormal: Number(fbsVal) > 99,
        remarks: Number(fbsVal) > 99 ? 'Elevated fasting glycemia' : 'Normal',
      },
      {
        testName: 'Postprandial Blood Sugar (PPBS)',
        value: ppbsVal,
        unit: 'mg/dL',
        referenceRange: '< 140 mg/dL',
        isAbnormal: Number(ppbsVal) > 140,
        remarks: Number(ppbsVal) > 140 ? 'Impaired glucose tolerance' : 'Normal',
      },
      {
        testName: 'HbA1c Glycated Hemoglobin',
        value: hba1cVal,
        unit: '%',
        referenceRange: '< 5.7 %',
        isAbnormal: Number(hba1cVal) > 5.7,
        remarks: Number(hba1cVal) > 5.7 ? 'Suboptimal glycemic control' : 'Normal',
      },
      {
        testName: 'Hemoglobin (Hb)',
        value: hbVal,
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5 g/dL',
        isAbnormal: false,
        remarks: 'Normal',
      },
      {
        testName: 'Total WBC Count',
        value: wbcVal,
        unit: '/cu.mm',
        referenceRange: '4,000 - 11,000 /cu.mm',
        isAbnormal: false,
        remarks: 'Normal',
      },
    ];

    updateLabOrderStatus(selectedOrder.id, 'result_ready', results);
  };

  const pendingOrders = labOrders.filter((o) => o.status === 'pending' || o.status === 'sample_collected' || o.status === 'processing');
  const completedOrders = labOrders.filter((o) => o.status === 'result_ready' || o.status === 'reviewed');

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Header Banner */}
      <div className="bg-[#064e3b] text-white px-4 py-4 border-b border-emerald-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-700/50 border border-emerald-400/40 flex items-center justify-center text-emerald-200">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">
                  Central Pathology & Biochemistry Laboratory
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold border border-emerald-400/40">
                  Room 101 • Block C
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Automated Clinical Chemistry, Hematology & Fasting Sugar Testing Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-emerald-900/80 px-3 py-1.5 rounded border border-emerald-700 text-emerald-100">
              <span>Active Batch Load: </span>
              <strong className="font-mono text-white">{pendingOrders.length} Orders</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex gap-3 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'queue', label: `Today's Lab Queue (${pendingOrders.length})`, icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'entry', label: 'Numerical Result Entry', icon: <FlaskConical className="w-3.5 h-3.5" /> },
            { id: 'sugar_workflow', label: 'Fasting Sugar Protocol & Scheduler', icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: 'completed', label: `Completed & Sent to Doctor (${completedOrders.length})`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
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
        {/* TAB 1: LAB QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active Test Requisitions</h2>
                  <p className="text-xs text-slate-500">Collect samples and process automated laboratory analyzers</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Patient Token</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Requested Tests</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{ord.id}</td>
                        <td className="p-3 font-mono font-extrabold text-blue-900">{ord.patientToken}</td>
                        <td className="p-3 font-bold text-slate-900">{ord.patientName}</td>
                        <td className="p-3 text-slate-700 font-medium">{ord.tests.join(', ')}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ord.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'result_ready'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'sample_collected'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ord.status === 'pending' ? (
                            <button
                              onClick={() => handleStartAnalysis(ord.id)}
                              className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold"
                            >
                              Collect Sample
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedOrderId(ord.id);
                                setActiveTab('entry');
                              }}
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                            >
                              Enter Values
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NUMERICAL RESULT ENTRY */}
        {activeTab === 'entry' && selectedOrder && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Laboratory Test Value Entry: {selectedOrder.patientName} ({selectedOrder.patientToken})
                </h2>
                <div className="text-xs text-slate-500 font-mono">
                  Order ID: {selectedOrder.id} • Requested by: {selectedOrder.requestedByDoctor}
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-900">
                Automated Reference Checking Active
              </span>
            </div>

            {/* Numerical Inputs Table with Reference Ranges */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Investigation Name</th>
                    <th className="p-3">Input Observed Value</th>
                    <th className="p-3">Units</th>
                    <th className="p-3">Standard Reference Range</th>
                    <th className="p-3">Automated Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Fasting Blood Sugar (FBS)</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={fbsVal}
                        onChange={(e) => setFbsVal(e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-500">mg/dL</td>
                    <td className="p-3 font-mono text-slate-600">70 - 99 mg/dL</td>
                    <td className="p-3">
                      {Number(fbsVal) > 99 ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                          ELEVATED ({fbsVal} mg/dL)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">NORMAL</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-slate-900">Postprandial Blood Sugar (PPBS)</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={ppbsVal}
                        onChange={(e) => setPpbsVal(e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-500">mg/dL</td>
                    <td className="p-3 font-mono text-slate-600">&lt; 140 mg/dL</td>
                    <td className="p-3">
                      {Number(ppbsVal) > 140 ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                          ELEVATED ({ppbsVal} mg/dL)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">NORMAL</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-slate-900">HbA1c Glycated Hemoglobin</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={hba1cVal}
                        onChange={(e) => setHba1cVal(e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-500">%</td>
                    <td className="p-3 font-mono text-slate-600">&lt; 5.7 %</td>
                    <td className="p-3">
                      {Number(hba1cVal) > 5.7 ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                          SUBOPTIMAL ({hba1cVal}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">NORMAL</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold text-slate-900">Hemoglobin (Hb)</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={hbVal}
                        onChange={(e) => setHbVal(e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-500">g/dL</td>
                    <td className="p-3 font-mono text-slate-600">12.0 - 15.5 g/dL</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">NORMAL</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technician / Biochemist Verification Notes
              </label>
              <textarea
                rows={2}
                value={technicianRemarks}
                onChange={(e) => setTechnicianRemarks(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCompleteAndSend}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Certify Results & Send Directly to Doctor Review</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SUGAR WORKFLOW PROTOCOL */}
        {activeTab === 'sugar_workflow' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Fasting Blood Sugar Standard Operating Protocol</h2>
            <p className="text-xs text-slate-500">
              For patients requiring 8-hour fasting window, next-available morning slot scheduling is supported.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-950 text-sm">Today's Fasting Sample Window</div>
                <p className="text-emerald-900">Active between 07:30 AM – 11:30 AM (Room 101 Suite A).</p>
                <div className="text-slate-600">Average Turnaround: <strong>25 - 35 minutes</strong></div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <div className="font-bold text-blue-950 text-sm">Next Available Scheduled Fasting Slot</div>
                <p className="text-blue-900"><strong>05 September 2026 at 08:00 AM</strong></p>
                <div className="text-slate-600">Pre-assigned Token: <strong>LAB-FAST-012</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
