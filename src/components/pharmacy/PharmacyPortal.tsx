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
  RefreshCw,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { PharmacyOrder } from '../../types';

export const PharmacyPortal: React.FC = () => {
  const { pharmacyOrders, updatePharmacyStatus, refreshPharmacyOrders, lang } = useQueueFlow();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status Filter for ONE Dashboard: 'all' | 'pending' | 'preparing' | 'ready' | 'dispensed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'dispensed'>('all');

  // Fetch real database orders on mount and background interval
  React.useEffect(() => {
    refreshPharmacyOrders();
    const interval = setInterval(() => {
      refreshPharmacyOrders();
    }, 2500);
    return () => clearInterval(interval);
  }, [refreshPharmacyOrders]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshPharmacyOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
    pharmacyOrders[0]?.id || ''
  );

  React.useEffect(() => {
    if (pharmacyOrders.length > 0 && (!selectedOrderId || !pharmacyOrders.some((o) => o.id === selectedOrderId))) {
      setSelectedOrderId(pharmacyOrders[0].id);
    }
  }, [pharmacyOrders, selectedOrderId]);

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
    <div className="bg-transparent flex-1 pb-16 relative z-10">
      {/* Header Banner (CareNexus Institutional Style) */}
      <div className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-[#DB2777] shadow-2xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0A2342] tracking-tight">
                Central Pharmacy & Medicine Dispensing
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh Pharmacy Orders from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0066FF] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
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
              All ({pharmacyOrders.length})
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
              onClick={() => setStatusFilter('preparing')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'preparing'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preparing ({preparingCount})
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'ready'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ready ({readyCount})
            </button>

            <button
              onClick={() => setStatusFilter('dispensed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                statusFilter === 'dispensed'
                  ? 'bg-white text-blue-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispensed ({dispensedCount})
            </button>
          </div>
        </div>

        {/* Prescription Queue & Medication Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Orders Queue Table */}
          <div className="lg:col-span-7 bg-white/88 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
              <span>Active Prescriptions Queue</span>
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
                          {ord.medications.length} {ord.medications.length === 1 ? 'medicine' : 'medicines'}
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
            <div className="lg:col-span-5 bg-white/88 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedOrder.patientName}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedOrder.tokenNumber} · {selectedOrder.doctorName}
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
                {selectedOrder.medications.map((m, idx) => {
                  const isTablet =
                    m.name.toLowerCase().includes('tab') ||
                    m.dosage.toLowerCase().includes('tab') ||
                    (m.instructions && m.instructions.toLowerCase().includes('tablet'));
                  const unitWord = isTablet
                    ? (m.quantity === 1 ? 'tablet' : 'tablets')
                    : (m.quantity === 1 ? 'unit' : 'units');
                  const timingClean = m.frequency
                    ? m.frequency.replace(/\s*\(\s*/g, ' · ').replace(/\s*\)\s*/g, '').replace(/-/g, ' · ')
                    : '';

                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 text-xs font-bold">{m.name}</strong>
                        <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                          {m.dosage}
                        </span>
                      </div>

                      <div className="text-purple-950 font-medium text-[11px]">
                        Timing: {timingClean || m.frequency}
                      </div>

                      <div className="text-slate-700 font-medium text-[11px]">
                        Duration: {m.duration}
                      </div>

                      {m.instructions && (
                        <div className="text-slate-600 text-[11px] bg-white p-1.5 rounded border border-slate-200">
                          Instructions: {m.instructions}
                        </div>
                      )}

                      <div className="text-slate-700 font-medium text-[11px] pt-1 border-t border-slate-200">
                        Quantity: {m.quantity || 7} {unitWord}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                {selectedOrder.status === 'waiting' && (
                  <button
                    onClick={() => handlePrepare(selectedOrder.id)}
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Package className="w-4 h-4" />
                    <span>Start Dispensing</span>
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
                    <span>Dispense Medicine</span>
                  </button>
                )}

                {selectedOrder.status === 'dispensed' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Dispensed ✓</span>
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
