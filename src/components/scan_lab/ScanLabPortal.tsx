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
  ChevronDown,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { LabResultItem, LabOrder } from '../../types';

export const ScanLabPortal: React.FC = () => {
  const {
    labOrders,
    updateLabOrderStatus,
    doctorRevisitDecision,
    refreshLabOrders,
  } = useQueueFlow();

  // Auto-refresh orders every 3 seconds so incoming doctor requests appear immediately
  React.useEffect(() => {
    refreshLabOrders?.();
    const interval = setInterval(() => {
      refreshLabOrders?.();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshLabOrders]);

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

  // Test categorization for selected order
  const testTitleStr = (selectedLabOrder?.tests?.join(' ') || '').toLowerCase();
  const isCbcOrder = testTitleStr.includes('cbc') || testTitleStr.includes('complete blood count') || testTitleStr.includes('blood count');
  const isElectrolyteOrder = testTitleStr.includes('electrolyte') || testTitleStr.includes('sodium') || testTitleStr.includes('potassium');
  const isScanOrXrayOrder =
    testTitleStr.includes('x-ray') ||
    testTitleStr.includes('scan') ||
    testTitleStr.includes('chest') ||
    testTitleStr.includes('usg') ||
    testTitleStr.includes('ultrasound') ||
    testTitleStr.includes('ct') ||
    testTitleStr.includes('mri') ||
    testTitleStr.includes('biopsy') ||
    testTitleStr.includes('dermoscopy') ||
    testTitleStr.includes('scraping');

  // Track all orders belonging to the selected patient to handle multi-investigations together
  const patientOrders = selectedLabOrder ? labOrders.filter((o) => o.patientId === selectedLabOrder.patientId) : [];
  const patientPendingOrders = patientOrders.filter((o) => o.status !== 'result_ready' && o.status !== 'reviewed');

  // Numerical Result Form State - Complete Blood Count (CBC)
  const [cbcHbValue, setCbcHbValue] = useState('13.8');
  const [cbcWbcValue, setCbcWbcValue] = useState('7,200');
  const [cbcPlateletsValue, setCbcPlateletsValue] = useState('2.45');

  // Numerical Result Form State - Blood Chemistry
  const [fbsValue, setFbsValue] = useState('154');
  const [ppbsValue, setPpbsValue] = useState('210');
  const [hba1cValue, setHba1cValue] = useState('7.8');
  const [hbValue, setHbValue] = useState('12.4');

  // Numerical Result Form State - Serum Electrolytes
  const [naValue, setNaValue] = useState('138');
  const [kValue, setKValue] = useState('4.2');
  const [clValue, setClValue] = useState('102');
  const [bicarbValue, setBicarbValue] = useState('24');

  // Radiology / Scan Report State
  const [scanFindings, setScanFindings] = useState('Bilateral lung fields clear. Cardiac silhouette normal size. Costophrenic sulci sharp. No focal consolidations or pleural effusion.');
  const [scanImpression, setScanImpression] = useState('Normal chest radiograph (No acute cardiopulmonary disease).');

  // General remarks
  const [labRemarks, setLabRemarks] = useState('Findings reviewed and verified by laboratory technician.');

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
        `Late test turnaround registered. Patient notified to return at ${returnTime} (Expected result: ${expectedTime}).`
      );
      return;
    }

    let numericalResults: LabResultItem[] = [];

    if (isCbcOrder) {
      numericalResults = [
        {
          testName: 'Hemoglobin (Hb)',
          value: cbcHbValue,
          unit: 'g/dL',
          referenceRange: '13.0 - 17.0 g/dL',
          isAbnormal: false,
          remarks: 'Normal adult range',
        },
        {
          testName: 'Total WBC Count',
          value: cbcWbcValue,
          unit: '/µL',
          referenceRange: '4,000 - 11,000 /µL',
          isAbnormal: false,
          remarks: 'Normal range',
        },
        {
          testName: 'Platelet Count',
          value: `${cbcPlateletsValue} lakh`,
          unit: '/µL',
          referenceRange: '1.5 - 4.5 lakh /µL',
          isAbnormal: false,
          remarks: 'Adequate',
        },
      ];
    } else if (isElectrolyteOrder) {
      numericalResults = [
        {
          testName: 'Serum Sodium (Na+)',
          value: naValue,
          unit: 'mEq/L',
          referenceRange: '135 - 145 mEq/L',
          isAbnormal: parseFloat(naValue) < 135 || parseFloat(naValue) > 145,
          remarks: parseFloat(naValue) < 135 ? 'Hyponatremia' : parseFloat(naValue) > 145 ? 'Hypernatremia' : 'Normal',
        },
        {
          testName: 'Serum Potassium (K+)',
          value: kValue,
          unit: 'mEq/L',
          referenceRange: '3.5 - 5.0 mEq/L',
          isAbnormal: parseFloat(kValue) < 3.5 || parseFloat(kValue) > 5.0,
          remarks: parseFloat(kValue) < 3.5 ? 'Hypokalemia' : parseFloat(kValue) > 5.0 ? 'Hyperkalemia' : 'Normal',
        },
        {
          testName: 'Serum Chloride (Cl-)',
          value: clValue,
          unit: 'mEq/L',
          referenceRange: '96 - 106 mEq/L',
          isAbnormal: parseFloat(clValue) < 96 || parseFloat(clValue) > 106,
          remarks: 'Normal',
        },
        {
          testName: 'Bicarbonate (HCO3-)',
          value: bicarbValue,
          unit: 'mEq/L',
          referenceRange: '22 - 29 mEq/L',
          isAbnormal: parseFloat(bicarbValue) < 22 || parseFloat(bicarbValue) > 29,
          remarks: 'Normal',
        },
      ];
    } else if (isScanOrXrayOrder) {
      numericalResults = [
        {
          testName: selectedLabOrder.tests[0] || 'Diagnostic Scan & Imaging Report',
          value: scanImpression,
          unit: '',
          referenceRange: 'Standard Anatomical Study',
          isAbnormal: false,
          remarks: scanFindings,
        },
      ];
    } else {
      numericalResults = [
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
    }

    updateLabOrderStatus(selectedLabOrder.id, 'result_ready', numericalResults);
    setStatusFilter('completed');
  };

  // Action: Batch submit all pending investigations for this patient at once
  const handleBatchSubmitAllPatientOrders = () => {
    if (!selectedLabOrder) return;
    const pOrders = labOrders.filter((o) => o.patientId === selectedLabOrder.patientId);
    for (const ord of pOrders) {
      if (ord.status !== 'result_ready' && ord.status !== 'reviewed') {
        const titleStr = (ord.tests?.join(' ') || '').toLowerCase();
        const isScan =
          titleStr.includes('x-ray') ||
          titleStr.includes('scan') ||
          titleStr.includes('chest') ||
          titleStr.includes('usg') ||
          titleStr.includes('ultrasound') ||
          titleStr.includes('ct') ||
          titleStr.includes('mri') ||
          titleStr.includes('biopsy') ||
          titleStr.includes('dermoscopy');
        let resItems: LabResultItem[] = [];
        if (isScan) {
          resItems = [
            {
              testName: ord.tests[0] || 'Diagnostic Scan & Imaging Report',
              value: scanImpression,
              unit: '',
              referenceRange: 'Standard Anatomical Study',
              isAbnormal: false,
              remarks: scanFindings,
            },
          ];
        } else {
          resItems = [
            {
              testName: ord.tests[0] || 'Pathology Test Report',
              value: fbsValue,
              unit: 'mg/dL',
              referenceRange: '70 - 99 mg/dL',
              isAbnormal: parseFloat(fbsValue) > 100,
              remarks: 'Findings verified by lab technician',
            },
          ];
        }
        updateLabOrderStatus(ord.id, 'result_ready', resItems);
      }
    }
    setStatusFilter('completed');
  };

  // Real database counts
  const pendingCount = labOrders.filter((o) => o.status === 'pending').length;
  const inProgressCount = labOrders.filter((o) => o.status === 'sample_collected' || o.status === 'processing').length;
  const completedCount = labOrders.filter((o) => o.status === 'result_ready' || o.status === 'reviewed').length;

  return (
    <div className="bg-transparent flex-1 pb-16 relative z-10">
      {/* Top Banner (CareNexus Institutional Style) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C3AED] shadow-2xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-[#0A2342] tracking-tight">
                  Central Pathology & Diagnostic Laboratory
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] font-bold border border-[#7C3AED]/20">
                  Clinical Pathology
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Laboratory investigation requests, specimen processing, and doctor report transmission
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 shadow-2xs">
              <span className="text-slate-500 font-medium">Active Requests: </span>
              <strong className="font-mono text-[#0066FF] font-bold">{labOrders.length} Total</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Simple Segmented Status Filter */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex flex-wrap bg-slate-100/90 p-1 rounded-xl gap-1 text-xs font-semibold shadow-2xs border border-slate-200/60">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'all'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests ({labOrders.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'pending'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'in_progress'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({inProgressCount})
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'completed'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Orders Table & Result Entry Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Orders Queue Table (7 cols for ample investigation name width) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Laboratory & Scan Requests
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {filteredOrders.length} request(s)
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No orders matching the selected status ({statusFilter.replace('_', ' ')}).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 w-20">Token</th>
                      <th className="py-3 px-3.5 w-36">Patient Name</th>
                      <th className="py-3 px-3.5">Investigation / Test</th>
                      <th className="py-3 px-3.5 w-28">Status</th>
                      <th className="py-3 px-3.5 w-32 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`cursor-pointer transition-colors ${
                          ord.id === selectedLabOrder?.id
                            ? 'bg-purple-50/70 font-semibold'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono font-bold text-purple-950 whitespace-nowrap">
                          {ord.patientToken}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {ord.patientName}
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 font-medium break-words leading-relaxed">
                          {ord.tests.join(', ')}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'result_ready' || ord.status === 'reviewed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'sample_collected' || ord.status === 'processing'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status === 'pending'
                              ? 'Pending'
                              : ord.status === 'sample_collected' || ord.status === 'processing'
                              ? 'In Progress'
                              : ord.status === 'result_ready' || ord.status === 'reviewed'
                              ? 'Completed'
                              : String(ord.status).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          {ord.status === 'pending' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartProcessing(ord.id);
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                            >
                              Start Test
                            </button>
                          )}
                          {(ord.status === 'sample_collected' || ord.status === 'processing') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                            >
                              Enter Result
                            </button>
                          )}
                          {(ord.status === 'result_ready' || ord.status === 'reviewed') && (
                            <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                              <span>Sent to Doctor</span>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Result Entry Form (5 cols) */}
          {selectedLabOrder && (
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Diagnostic Result Entry
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong className="text-slate-900">{selectedLabOrder.patientName}</strong> • Token: <strong className="font-mono text-purple-900">{selectedLabOrder.patientToken}</strong>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {selectedLabOrder.requestedByDoctor || 'OPD Doctor'}
                </span>
              </div>

              {/* Ordered Investigations Selector Tabs */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
                    <span>Ordered Investigations:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Click to enter result
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(patientOrders.length > 0 ? patientOrders : [selectedLabOrder]).map((po) => {
                    const isSelected = po.id === selectedLabOrder.id;
                    const isDone = po.status === 'result_ready' || po.status === 'reviewed';
                    const testLabel = po.tests[0] || 'Investigation';
                    return (
                      <button
                        key={po.id}
                        type="button"
                        onClick={() => setSelectedOrderId(po.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        title={isSelected ? 'Currently entering result' : 'Click to select this investigation'}
                      >
                        <span>{testLabel}</span>
                        {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/80">
                  Selected: <strong className="text-slate-900 font-bold">{selectedLabOrder.tests.join(', ')}</strong>
                </div>
              </div>

              {/* Fast Result Numerical / Imaging Entry Form */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                {isCbcOrder ? (
                  <>
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                      Complete Blood Count (CBC) Panel
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Hemoglobin (Hb)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={cbcHbValue}
                            onChange={(e) => setCbcHbValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">g/dL</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 13.0 - 17.0</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Total WBC Count
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={cbcWbcValue}
                            onChange={(e) => setCbcWbcValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">/µL</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 4,000 - 11,000</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Platelet Count
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={cbcPlateletsValue}
                            onChange={(e) => setCbcPlateletsValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">lakh/µL</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 1.5 - 4.5 lakh</span>
                      </div>
                    </div>
                  </>
                ) : isElectrolyteOrder ? (
                  <>
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                      Serum Electrolytes Panel
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Sodium (Na+)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={naValue}
                            onChange={(e) => setNaValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">mEq/L</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 135 - 145 mEq/L</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Potassium (K+)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={kValue}
                            onChange={(e) => setKValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">mEq/L</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 3.5 - 5.0 mEq/L</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Chloride (Cl-)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={clValue}
                            onChange={(e) => setClValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">mEq/L</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 96 - 106 mEq/L</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bicarbonate (HCO3-)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={bicarbValue}
                            onChange={(e) => setBicarbValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">mEq/L</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ref: 22 - 29 mEq/L</span>
                      </div>
                    </div>
                  </>
                ) : isScanOrXrayOrder ? (
                  <>
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                      Diagnostic Imaging & Scan Report
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Imaging Findings Summary
                        </label>
                        <textarea
                          rows={3}
                          value={scanFindings}
                          onChange={(e) => setScanFindings(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none focus:border-purple-700 font-mono"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Radiologist / Technician Impression
                        </label>
                        <input
                          type="text"
                          value={scanImpression}
                          onChange={(e) => setScanImpression(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold font-mono outline-none focus:border-purple-700"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                      Fasting Blood Sugar & Chemistry Profile
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
                  </>
                )}

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pathologist / Technician Observations
                  </label>
                  <textarea
                    rows={2}
                    value={labRemarks}
                    onChange={(e) => setLabRemarks(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none focus:border-purple-700"
                  ></textarea>
                </div>
              </div>

              {/* Late Turnaround Scheduling (Only when applicable) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
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
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                {patientPendingOrders.length > 1 && (
                  <button
                    type="button"
                    onClick={handleBatchSubmitAllPatientOrders}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                    <span>Submit All ({patientOrders.length}) Tests for Patient</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmitLabResults}
                  className="w-full sm:w-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isLateResult
                      ? 'Register Late Turnaround & Schedule Return'
                      : patientPendingOrders.length > 1
                      ? `Submit This Investigation (${selectedLabOrder.tests[0] || 'Selected'})`
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
