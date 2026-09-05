import React, { useState } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Package,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { PharmacyOrder } from '../../types';

export const PharmacyPortal: React.FC = () => {
  const { pharmacyOrders, updatePharmacyStatus, lang } = useQueueFlow();

  // Status Filter for ONE Dashboard: 'all' | 'pending' | 'preparing' | 'ready' | 'dispensed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'dispensed'>('all');

  // Real filtering of database records
  const filteredOrders = pharmacyOrders.filter((ord) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return ord.status === 'waiting';
    if (statusFilter === 'preparing') return ord.status === 'preparing';
    if (statusFilter === 'ready') return ord.status === 'ready';
    if (statusFilter === 'dispensed') return ord.status === 'dispensed';
    return true;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    pharmacyOrders[0]?.id || 'PHARM-ORD-301'
  );

  const selectedOrder = pharmacyOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || pharmacyOrders[0];

  // Actions
  const handlePrepare = (orderId: string) => {
    updatePharmacyStatus(orderId, 'preparing');
  };

  const handleMarkReady = (orderId: string) => {
    updatePharmacyStatus(orderId, 'ready');
  };

  const handleDispense = (orderId: string) => {
    updatePharmacyStatus(orderId, 'dispensed');
  };

  // Real database counts
  const pendingCount = pharmacyOrders.filter((o) => o.status === 'waiting').length;
  const preparingCount = pharmacyOrders.filter((o) => o.status === 'preparing').length;
  const readyCount = pharmacyOrders.filter((o) => o.status === 'ready').length;
  const dispensedCount = pharmacyOrders.filter((o) => o.status === 'dispensed').length;

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Header Banner (No Location / Counter / Room Information) */}
      <div className="bg-[#581c87] text-white px-4 py-4 border-b border-purple-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-700/50 border border-purple-400/40 flex items-center justify-center text-purple-200">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">
                  {lang === 'ta' ? 'மைய மருந்தகம்' : 'Central Pharmacy & Medicine Dispensing'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded bg-purple-500/30 text-purple-200 font-bold border border-purple-400/40">
                  {lang === 'ta' ? 'அரசு மருந்தக சேவை' : 'Government Pharmacy'}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                {lang === 'ta'
                  ? 'மருத்துவர் மருந்து சீட்டு சரிபார்ப்பு மற்றும் நோயாளிகளுக்கு மருந்துகள் வழங்குதல்'
                  : 'Doctor prescription verification and patient medication fulfillment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-purple-950/80 px-3 py-1.5 rounded border border-purple-700 text-purple-100">
              <span>{lang === 'ta' ? 'மொத்த மருந்து சீட்டுகள்: ' : 'Total Prescriptions: '}</span>
              <strong className="font-mono text-white">{pharmacyOrders.length} Total</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Real Working Status Filter */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {lang === 'ta' ? 'மருந்து சீட்டு நிலை வடிகட்டி:' : 'Filter Prescriptions by Status:'}
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({pharmacyOrders.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'preparing'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Preparing ({preparingCount})
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'ready'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              Ready for Pickup ({readyCount})
            </button>

            <button
              onClick={() => setStatusFilter('dispensed')}
              className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                statusFilter === 'dispensed'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Dispensed ({dispensedCount})
            </button>
          </div>
        </div>

        {/* Prescription Queue & Medication Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Orders Queue Table */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
              <span>{lang === 'ta' ? 'மருந்து சீட்டுகள் பட்டியல்' : 'Active Prescriptions Queue'}</span>
              <span className="text-xs text-slate-500 font-normal">Showing {filteredOrders.length} of {pharmacyOrders.length}</span>
            </h2>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No prescriptions matching the selected status ({statusFilter}).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Token</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Medicines</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`cursor-pointer transition-colors ${
                          ord.id === selectedOrder?.id ? 'bg-purple-50 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-purple-950">{ord.tokenNumber}</td>
                        <td className="p-3 font-bold text-slate-900">{ord.patientName}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {ord.medications.length} {ord.medications.length === 1 ? 'Medication' : 'Medications'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'dispensed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'ready'
                                ? 'bg-purple-100 text-purple-900'
                                : ord.status === 'preparing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status === 'waiting' ? 'PENDING' : ord.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ord.status === 'waiting' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrepare(ord.id);
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-2.5 py-1 bg-blue-800 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Prepare
                            </button>
                          )}
                          {ord.status === 'preparing' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkReady(ord.id);
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-2.5 py-1 bg-purple-800 hover:bg-purple-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          )}
                          {ord.status === 'ready' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispense(ord.id);
                                setSelectedOrderId(ord.id);
                              }}
                              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Dispense
                            </button>
                          )}
                          {ord.status === 'dispensed' && (
                            <span className="text-[11px] text-emerald-700 font-bold">Dispensed ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Selected Prescription Details (Inline on SAME Dashboard) */}
          {selectedOrder && (
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Prescription: {selectedOrder.patientName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Token: <strong className="text-purple-950">{selectedOrder.tokenNumber}</strong> • Doctor: {selectedOrder.doctorName}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedOrder.status === 'dispensed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrder.status === 'ready'
                      ? 'bg-purple-100 text-purple-900'
                      : selectedOrder.status === 'preparing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedOrder.status === 'waiting' ? 'PENDING' : selectedOrder.status.toUpperCase()}
                </span>
              </div>

              {/* Exact Doctor Prescribed Medication Breakdown */}
              <div className="space-y-2.5 text-xs">
                {selectedOrder.medications.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 text-xs">{m.name}</strong>
                      <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                        {m.dosage}
                      </span>
                    </div>

                    <div className="text-purple-950 font-semibold text-[11px]">
                      Timing: {m.frequency} • Duration: {m.duration}
                    </div>

                    {m.instructions && (
                      <div className="text-slate-600 text-[11px] italic bg-white p-1.5 rounded border border-slate-200">
                        Instructions: {m.instructions}
                      </div>
                    )}

                    <div className="text-right font-mono font-bold text-slate-700 text-[11px] pt-1 border-t border-slate-200">
                      Quantity: {m.quantity || 30} units
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                {selectedOrder.status === 'waiting' && (
                  <button
                    onClick={() => handlePrepare(selectedOrder.id)}
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Package className="w-4 h-4" />
                    <span>Prepare Prescription</span>
                  </button>
                )}

                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => handleMarkReady(selectedOrder.id)}
                    className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Ready for Pickup</span>
                  </button>
                )}

                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => handleDispense(selectedOrder.id)}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Dispense Medicines & Complete Visit</span>
                  </button>
                )}

                {selectedOrder.status === 'dispensed' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Prescription Dispensed • Visit Completed</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
