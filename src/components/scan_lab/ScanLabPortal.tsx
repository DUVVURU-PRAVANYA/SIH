import React, { useState } from 'react';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  Send,
  Activity,
  Calendar,
  Check,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { LabResultItem, LabOrder } from '../../types';

export const ScanLabPortal: React.FC = () => {
  const {
    labOrders,
    updateLabOrderStatus,
    doctorRevisitDecision,
    lang,
  } = useQueueFlow();

  // Status Filter for ONE Dashboard: 'all' | 'pending' | 'in_progress' | 'completed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  // Filter actual database records based on real status
  const filteredOrders = labOrders.filter((ord) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return ord.status === 'pending';
    if (statusFilter === 'in_progress') return ord.status === 'sample_collected' || ord.status === 'processing';
    if (statusFilter === 'completed') return ord.status === 'result_ready' || ord.status === 'reviewed';
    return true;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    labOrders[0]?.id || 'LAB-ORD-101'
  );

  // Selected Order
  const selectedLabOrder = labOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || labOrders[0];

  // Numerical Result Form State
  const [fbsValue, setFbsValue] = useState('154');
  const [ppbsValue, setPpbsValue] = useState('210');
  const [hba1cValue, setHba1cValue] = useState('7.8');
  const [hbValue, setHbValue] = useState('12.4');
  const [labRemarks, setLabRemarks] = useState('Elevated fasting glucose & HbA1c indicative of poor glycemic regulation.');

  // Late turnaround state
  const [isLateResult, setIsLateResult] = useState(false);
  const [expectedTime, setExpectedTime] = useState('04:00 PM');
  const [returnTime, setReturnTime] = useState('04:15 PM');

  // Action: Start Test / Collect Sample (moves from pending -> in_progress)
  const handleStartProcessing = (orderId: string) => {
    updateLabOrderStatus(orderId, 'sample_collected');
  };

  // Action: Submit Lab Results (moves from in_progress -> result_ready / sent_to_doctor)
  const handleSubmitLabResults = () => {
    if (!selectedLabOrder) return;

    if (isLateResult) {
      doctorRevisitDecision(selectedLabOrder.patientId, 'late_result', {
        expectedResultTime: expectedTime,
        revisitTime: returnTime,
      });
      alert(
        lang === 'ta'
          ? `முடிவு எதிர்பார்க்கப்படும் நேரம்: ${expectedTime}. நோயாளி ${returnTime}-க்கு வர அறிவுறுத்தப்பட்டார்.`
          : `Late test turnaround registered. Patient notified to return at ${returnTime} (Expected result: ${expectedTime}).`
      );
      return;
    }

    const numericalResults: LabResultItem[] = [
      {
        testName: 'Fasting Blood Sugar (FBS)',
        value: fbsValue,
        unit: 'mg/dL',
        referenceRange: '70 - 99 mg/dL',
        isAbnormal: parseFloat(fbsValue) > 100,
        remarks: parseFloat(fbsValue) > 125 ? 'Diabetic range' : 'Normal',
      },
      {
        testName: 'Postprandial Blood Sugar (PPBS)',
        value: ppbsValue,
        unit: 'mg/dL',
        referenceRange: '< 140 mg/dL',
        isAbnormal: parseFloat(ppbsValue) > 140,
        remarks: 'Impaired glucose tolerance',
      },
      {
        testName: 'HbA1c Glycated Hemoglobin',
        value: hba1cValue,
        unit: '%',
        referenceRange: '< 5.7 %',
        isAbnormal: parseFloat(hba1cValue) >= 6.5,
        remarks: 'Suboptimal glycemic control',
      },
      {
        testName: 'Hemoglobin (Hb)',
        value: hbValue,
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5 g/dL',
        isAbnormal: false,
        remarks: 'Normal',
      },
    ];

    updateLabOrderStatus(selectedLabOrder.id, 'result_ready', numericalResults);
    setStatusFilter('completed');
  };

  // Real database counts
  const pendingCount = labOrders.filter((o) => o.status === 'pending').length;
  const inProgressCount = labOrders.filter((o) => o.status === 'sample_collected' || o.status === 'processing').length;
  const completedCount = labOrders.filter((o) => o.status === 'result_ready' || o.status === 'reviewed').length;

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Top Banner (No Location / Room Information) */}
      <div className="bg-[#064e3b] text-white px-4 py-4 border-b border-emerald-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-700/50 border border-emerald-400/40 flex items-center justify-center text-emerald-200">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">
                  {lang === 'ta' ? 'ஆய்வகம் & ஸ்கேன் பரிசோதனை மையம்' : 'Diagnostic Lab & Scan Workstation'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold border border-emerald-400/40">
                  {lang === 'ta' ? 'நோயியல் & கதிரியக்கவியல்' : 'Pathology & Radiology'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                {lang === 'ta'
                  ? 'பரிசோதனை கோரிக்கைகள், மாதிரி செயலாக்கம் மற்றும் மருத்துவர் மறுஆய்வு முடிவுகள்'
                  : 'Diagnostic requests, specimen processing, and doctor report transmission'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-emerald-950/80 px-3 py-1.5 rounded border border-emerald-700 text-emerald-100">
              <span>{lang === 'ta' ? 'செயலில் உள்ள கோரிக்கைகள்: ' : 'Active Requests: '}</span>
              <strong className="font-mono text-white">{labOrders.length} Total</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Real Working Status Filter */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {lang === 'ta' ? 'கோரிக்கை நிலை வடிகட்டி:' : 'Filter Requests by Status:'}
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({labOrders.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Pending / Incoming ({pendingCount})
            </button>

            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              In Progress ({inProgressCount})
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Completed / Sent to Doctor ({completedCount})
            </button>
          </div>
        </div>

        {/* Orders Table & Result Entry Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Orders Queue Table */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
              <span>{lang === 'ta' ? 'பரிசோதனை கோரிக்கைகள்' : 'Laboratory & Scan Requests'}</span>
              <span className="text-xs text-slate-500 font-normal">Showing {filteredOrders.length} of {labOrders.length}</span>
            </h2>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No orders matching the selected status ({statusFilter}).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Token</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Tests Requested</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`cursor-pointer transition-colors ${
                          ord.id === selectedLabOrder?.id ? 'bg-emerald-50 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-emerald-950">{ord.patientToken}</td>
                        <td className="p-3 font-bold text-slate-900">{ord.patientName}</td>
                        <td className="p-3 text-slate-600">
                          <span className="truncate block max-w-[140px]">{ord.tests.join(', ')}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'result_ready' || ord.status === 'reviewed'
                                ? 'bg-emerald-100 text-emerald-900'
                                : ord.status === 'sample_collected' || ord.status === 'processing'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {ord.status === 'pending'
                              ? 'PENDING'
                              : ord.status === 'sample_collected'
                              ? 'IN PROGRESS'
                              : ord.status === 'result_ready'
                              ? 'RESULT READY'
                              : ord.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ord.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartProcessing(ord.id);
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Start Test
                            </button>
                          )}
                          {(ord.status === 'sample_collected' || ord.status === 'processing') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-2.5 py-1 bg-blue-800 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Enter Result
                            </button>
                          )}
                          {(ord.status === 'result_ready' || ord.status === 'reviewed') && (
                            <span className="text-[11px] text-emerald-700 font-bold">Sent to Doctor ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Result Entry Form (Inline on SAME Dashboard) */}
          {selectedLabOrder && (
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'முடிவு உள்ளீடு & அறிக்கை தயாரிப்பு' : 'Diagnostic Result Entry & Transmission'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-900">{selectedLabOrder.patientName}</strong> • Token: <strong className="font-mono text-emerald-950">{selectedLabOrder.patientToken}</strong>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                  Ordered by: {selectedLabOrder.requestedByDoctor}
                </span>
              </div>

              {/* Fast Result Numerical Entry Form */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                  1. Fasting Blood Sugar & Chemistry Profile
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fasting Blood Sugar (FBS)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={fbsValue}
                        onChange={(e) => setFbsValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">mg/dL</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Ref: 70 - 99 mg/dL</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Postprandial Sugar (PPBS)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={ppbsValue}
                        onChange={(e) => setPpbsValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">mg/dL</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Ref: &lt; 140 mg/dL</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      HbA1c Glycated Hb
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={hba1cValue}
                        onChange={(e) => setHba1cValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Ref: &lt; 5.7 %</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hemoglobin (Hb)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={hbValue}
                        onChange={(e) => setHbValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">g/dL</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Ref: 12.0 - 15.5</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pathologist / Biochemist Observations
                  </label>
                  <textarea
                    rows={2}
                    value={labRemarks}
                    onChange={(e) => setLabRemarks(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none focus:border-emerald-800"
                  ></textarea>
                </div>
              </div>

              {/* Late Turnaround Scheduling (Only when applicable) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={isLateResult}
                    onChange={(e) => setIsLateResult(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Late Turnaround Test (Requires Return Schedule)</span>
                </label>

                {isLateResult && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200">
                    <div>
                      <span className="text-slate-600 font-bold block mb-1">Expected Result Time:</span>
                      <input
                        type="text"
                        value={expectedTime}
                        onChange={(e) => setExpectedTime(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 font-bold block mb-1">Advised Return Time:</span>
                      <input
                        type="text"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Result Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={handleSubmitLabResults}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isLateResult
                      ? 'Register Late Turnaround & Schedule Return'
                      : 'Submit Result & Transmit to Doctor'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
