import React, { useState } from 'react';
import {
  Scan,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Send,
  Calendar,
  Activity,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { DiagnosticOrder } from '../../types';

export const DiagnosticPortal: React.FC = () => {
  const { diagnosticOrders, updateDiagnosticStatus, lang } = useQueueFlow();

  const [activeTab, setActiveTab] = useState<'queue' | 'report' | 'completed'>('queue');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    diagnosticOrders[0]?.id || 'DIAG-ORD-201'
  );

  const selectedOrder = diagnosticOrders.find((o) => o.id === selectedOrderId) || diagnosticOrders[0];

  const [findingsSummary, setFindingsSummary] = useState(
    'Normal bronchovascular markings. No active focal consolidation, pleural effusion, or pneumothorax.'
  );
  const [observations, setObservations] = useState(
    'Cardiothoracic ratio CTR < 0.50. Normal physiological silhouette. Visualized bony thorax intact.'
  );
  const [recommendations, setRecommendations] = useState(
    'No active cardiomegaly. Routine clinical follow-up as advised by attending physician.'
  );

  const handleStartScan = (orderId: string) => {
    updateDiagnosticStatus(orderId, 'in_progress');
  };

  const handleCompleteAndSend = () => {
    if (!selectedOrder) return;
    updateDiagnosticStatus(selectedOrder.id, 'completed', {
      findingsSummary,
      observations,
      recommendations,
    });
  };

  const pendingOrders = diagnosticOrders.filter((o) => o.status === 'waiting' || o.status === 'in_progress');
  const completedOrders = diagnosticOrders.filter((o) => o.status === 'completed');

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Header Banner */}
      <div className="bg-[#78350f] text-white px-4 py-4 border-b border-amber-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-700/50 border border-amber-400/40 flex items-center justify-center text-amber-200">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">
                  Digital Radiology & Imaging Department
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold border border-amber-400/40">
                  Rooms 108-112 • Block C
                </span>
              </div>
              <p className="text-xs text-amber-200 mt-0.5">
                Digital X-Ray, 2D Ultrasound, 128-Slice CT Scan & MRI Imaging Queues
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-amber-950/80 px-3 py-1.5 rounded border border-amber-700 text-amber-100">
              <span>Active Scan Queue: </span>
              <strong className="font-mono text-white">{pendingOrders.length} Patients</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex gap-3 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'queue', label: `Today's Scan Queue (${pendingOrders.length})`, icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'report', label: 'Radiology Report & Findings Entry', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'completed', label: `Completed Scans (${completedOrders.length})`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-800 text-white shadow-xs'
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
        {/* TAB 1: QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Imaging Requisitions</h2>
              <p className="text-xs text-slate-500 mb-6">Patient scan requests ordered from OPD consultations</p>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Token</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Requested Scan Modality</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {diagnosticOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{ord.id}</td>
                        <td className="p-3 font-mono font-extrabold text-blue-900">{ord.patientToken}</td>
                        <td className="p-3 font-bold text-slate-900">{ord.patientName}</td>
                        <td className="p-3 font-semibold text-amber-900">{ord.testName}</td>
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
                              ord.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ord.status === 'waiting' ? (
                            <button
                              onClick={() => handleStartScan(ord.id)}
                              className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded text-xs font-bold"
                            >
                              Start Scan
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedOrderId(ord.id);
                                setActiveTab('report');
                              }}
                              className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold"
                            >
                              Enter Findings
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

        {/* TAB 2: FINDINGS REPORT */}
        {activeTab === 'report' && selectedOrder && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Radiology Imaging Report: {selectedOrder.testName}
                </h2>
                <div className="text-xs text-slate-500">
                  Patient: <strong className="text-slate-900">{selectedOrder.patientName}</strong> ({selectedOrder.patientToken}) • Ordering Physician: {selectedOrder.requestedByDoctor}
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Findings Summary
                </label>
                <textarea
                  rows={2}
                  value={findingsSummary}
                  onChange={(e) => setFindingsSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Radiologist Clinical Observations & Measurements
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recommendations & Follow-up Note
                </label>
                <textarea
                  rows={2}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCompleteAndSend}
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded shadow flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Radiology Report to Doctor Review</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
