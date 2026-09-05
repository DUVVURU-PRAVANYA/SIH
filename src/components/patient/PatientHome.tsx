import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Pill,
  Activity,
  ArrowRight,
  ChevronRight,
  User,
  Ticket,
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  Building2,
  Plus,
  Info,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { DoctorDepartmentSelection } from './DoctorDepartmentSelection';

export const PatientHome: React.FC = () => {
  const {
    activePatient,
    currentPatient,
    hasActiveVisit,
    activeVisitData,
    loadActiveVisit,
    lang,
    logout,
  } = useQueueFlow();

  const [activeSection, setActiveSection] = useState<
    'queue' | 'journey' | 'history' | 'reports' | 'prescriptions' | 'profile'
  >('queue');

  const [showDoctorSelection, setShowDoctorSelection] = useState(false);

  // If patient has no active visit OR clicked "Start New Visit", render Doctor & Department Selection
  if (!hasActiveVisit || showDoctorSelection) {
    const patientId = activePatient?.id || currentPatient?.id || 'GH-P-00127';
    const patientName = activePatient?.name || currentPatient?.name || 'Patient';

    return (
      <div className="bg-[#f8fafc] flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ta' ? 'அரசு பொது மருத்துவமனை' : 'Government Headquarter Hospital'}
              </span>
              <h1 className="text-xl font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'புதிய மருத்துவ ஆலோசனை தொடங்கவும்' : 'Start New OPD Consultation Visit'}
              </h1>
            </div>
            {hasActiveVisit && (
              <button
                type="button"
                onClick={() => setShowDoctorSelection(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === 'ta' ? 'தற்போதைய வரிசைக்குத் திரும்பு' : 'Back to Active Queue'}
              </button>
            )}
          </div>

          <DoctorDepartmentSelection
            patientId={patientId}
            patientName={patientName}
            onVisitCreated={async (visitData) => {
              setShowDoctorSelection(false);
              await loadActiveVisit(patientId);
            }}
            onCancel={hasActiveVisit ? () => setShowDoctorSelection(false) : undefined}
          />
        </div>
      </div>
    );
  }

  // Database-Derived Values for Active Visit
  const currentPat = activePatient || currentPatient;
  const realToken =
    activeVisitData?.journey?.currentToken ||
    activeVisitData?.queueMetrics?.tokenNumber ||
    currentPat?.token ||
    '-';
  const realDoctorName =
    activeVisitData?.doctor?.fullName ||
    activeVisitData?.queueMetrics?.doctorName ||
    'Dr. Priya Kumar, MD, DM';
  const realDeptName =
    activeVisitData?.department?.name ||
    activeVisitData?.queueMetrics?.departmentName ||
    'General Medicine (OPD)';
  const realDeptRoom = activeVisitData?.department?.roomNumber || 'Rooms 4-8';
  const realDeptBlock = activeVisitData?.department?.blockName || 'Block B';
  const realNowServing = activeVisitData?.queueMetrics?.nowServingToken || '-';
  const realPatientsAhead =
    activeVisitData?.queueMetrics?.peopleAhead !== undefined
      ? activeVisitData.queueMetrics.peopleAhead
      : 0;
  const realEstimatedWait =
    activeVisitData?.queueMetrics?.estimatedWaitMinutes !== undefined
      ? activeVisitData.queueMetrics.estimatedWaitMinutes
      : 0;
  const realQueueStatus =
    activeVisitData?.queueMetrics?.queueStatus ||
    activeVisitData?.journey?.status ||
    'waiting';

  const diagnosticOrder = activeVisitData?.diagnosticOrder;
  const pharmacyOrder = activeVisitData?.pharmacyOrder;
  const consultation = activeVisitData?.consultation;

  // Dynamic Journey Stepper (Only displays steps that exist for that patient's actual visit)
  const isDoctorDone =
    activeVisitData?.journey?.currentStage !== 'doctor' &&
    (Boolean(diagnosticOrder) || Boolean(pharmacyOrder) || activeVisitData?.journey?.status === 'completed');

  const journeySteps: {
    id: string;
    title: string;
    titleTa: string;
    desc: string;
    status: 'completed' | 'current' | 'pending';
  }[] = [
    {
      id: 'doctor',
      title: '1. Doctor Consultation',
      titleTa: '1. மருத்துவர் ஆலோசனை',
      desc: `${realDoctorName} • ${realDeptName}`,
      status: isDoctorDone
        ? 'completed'
        : realQueueStatus === 'in_service' || realQueueStatus === 'called' || realQueueStatus === 'waiting'
        ? 'current'
        : 'completed',
    },
  ];

  if (diagnosticOrder) {
    const isLabDone = diagnosticOrder.status === 'completed';
    journeySteps.push({
      id: 'scan_lab',
      title: `${journeySteps.length + 1}. Scan / Diagnostic Lab`,
      titleTa: `${journeySteps.length + 1}. ஆய்வகம் / ஸ்கேன் பரிசோதனை`,
      desc: diagnosticOrder.testName || 'Diagnostic Investigation',
      status: isLabDone
        ? 'completed'
        : activeVisitData?.journey?.currentStage === 'diagnostic'
        ? 'current'
        : 'pending',
    });

    const isReviewDone =
      isLabDone &&
      (Boolean(pharmacyOrder) || activeVisitData?.journey?.status === 'completed');

    journeySteps.push({
      id: 'doctor_review',
      title: `${journeySteps.length + 1}. Doctor Results Review`,
      titleTa: `${journeySteps.length + 1}. மருத்துவர் முடிவுகள் மறுஆய்வு`,
      desc: 'Doctor reviews investigation results and finalizes treatment plan',
      status: isReviewDone
        ? 'completed'
        : isLabDone && activeVisitData?.journey?.currentStage === 'doctor'
        ? 'current'
        : 'pending',
    });
  }

  if (pharmacyOrder || (consultation?.medications && consultation.medications.length > 0)) {
    const isPharmDone = pharmacyOrder?.status === 'dispensed';
    const medCount = pharmacyOrder?.medications?.length || consultation?.medications?.length || 1;
    journeySteps.push({
      id: 'pharmacy',
      title: `${journeySteps.length + 1}. Central Pharmacy Dispensing`,
      titleTa: `${journeySteps.length + 1}. மருந்தகத்தில் மருந்துகள் பெறுதல்`,
      desc: `Prescription (${medCount} medication items)`,
      status: isPharmDone
        ? 'completed'
        : activeVisitData?.journey?.currentStage === 'pharmacy'
        ? 'current'
        : 'pending',
    });
  }

  const isAllComplete = activeVisitData?.journey?.status === 'completed' || pharmacyOrder?.status === 'dispensed';
  journeySteps.push({
    id: 'completed',
    title: `${journeySteps.length + 1}. Hospital Journey Completed`,
    titleTa: `${journeySteps.length + 1}. மருத்துவமனை வருகை நிறைவு`,
    desc: 'All hospital steps fulfilled',
    status: isAllComplete ? 'completed' : 'pending',
  });

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Top Patient Header Banner */}
      <div className="bg-[#0b2545] text-white px-4 py-4 sm:py-5 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-300 font-medium mb-1">
              <span>{lang === 'ta' ? 'அரசு தலைமை மருத்துவமனை' : 'Government Hospital Patient Portal'}</span>
              <span>•</span>
              <span>{lang === 'ta' ? 'நேரடி தரவுத்தள இணைப்பு' : 'Real Database Connected'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white flex items-center gap-2">
              <span>
                {lang === 'ta' ? 'நோயாளி:' : 'Patient:'} {lang === 'ta' ? currentPat?.nameTa : currentPat?.name}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/80 border border-blue-400/40 text-blue-200">
                {currentPat?.id}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1.5">
              <span>
                Age: <strong className="text-white">{currentPat?.age} yrs</strong> ({currentPat?.gender})
              </span>
              <span>•</span>
              <span>
                Blood Group: <strong className="text-white">{currentPat?.bloodGroup || 'O+ve'}</strong>
              </span>
              <span>•</span>
              <span>
                Mobile: <strong className="text-white">+91 {currentPat?.phone}</strong>
              </span>
              <span>•</span>
              <span>
                Allergies: <strong className="text-amber-300">{currentPat?.allergies?.join(', ') || 'None Reported'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDoctorSelection(true)}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 border border-blue-400/40 rounded text-xs font-bold text-white flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'புதிய டோக்கன் / மருத்துவர்' : 'Start New Visit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (ONE Single Dashboard) */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-2 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'queue', label: lang === 'ta' ? 'எனது வரிசை (My Queue)' : 'My Queue', icon: <Ticket className="w-3.5 h-3.5" /> },
            { id: 'journey', label: lang === 'ta' ? 'எனது பணிப்பாதை (My Journey)' : 'My Journey', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'reports', label: lang === 'ta' ? 'ஆய்வக / ஸ்கேன் அறிக்கைகள்' : 'Lab / Scan Reports', icon: <FlaskConical className="w-3.5 h-3.5" /> },
            { id: 'prescriptions', label: lang === 'ta' ? 'மருந்து சீட்டு (Prescription)' : 'Prescriptions / Pharmacy', icon: <Pill className="w-3.5 h-3.5" /> },
            { id: 'history', label: lang === 'ta' ? 'மருத்துவ வரலாறு' : 'Consultation History', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'profile', label: lang === 'ta' ? 'சுயவிவரம் (Profile)' : 'Patient Profile', icon: <User className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ========================================================= */}
        {/* SECTION 1: LIVE QUEUE (MY QUEUE) */}
        {/* ========================================================= */}
        {activeSection === 'queue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border-2 border-blue-900/40 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-1 rounded">
                    {lang === 'ta' ? 'நேரடி OPD வரிசை கண்காணிப்பு' : 'LIVE OPD QUEUE STATUS'}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 font-serif mt-2">
                    {lang === 'ta' ? 'மருத்துவர்:' : 'Doctor:'} {realDoctorName}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {lang === 'ta' ? 'துறை:' : 'Department:'} {realDeptName} • {realDeptRoom} ({realDeptBlock})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{lang === 'ta' ? 'வரிசை நிலை' : 'Queue Status'}</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-bold text-xs mt-1 border ${
                    realQueueStatus === 'called'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : realQueueStatus === 'in_service'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : realQueueStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      realQueueStatus === 'called'
                        ? 'bg-amber-500 animate-ping'
                        : realQueueStatus === 'in_service'
                        ? 'bg-blue-500 animate-pulse'
                        : realQueueStatus === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'
                    }`}></span>
                    <span>
                      {realQueueStatus === 'in_service'
                        ? 'IN CONSULTATION'
                        : realQueueStatus === 'called'
                        ? 'CALLED'
                        : realQueueStatus === 'completed'
                        ? 'COMPLETED'
                        : 'WAITING IN QUEUE'}
                    </span>
                  </span>
                </div>
              </div>

              {/* 4 Core Queue Metrics Grid (Calculated directly from Database) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Your Token */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-xl shadow-inner space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-blue-300 font-bold">
                    {lang === 'ta' ? 'உங்கள் டோக்கன்' : 'YOUR TOKEN'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                    {realToken}
                  </div>
                  <div className="text-[11px] text-blue-200 font-medium">
                    {currentPat?.name}
                  </div>
                </div>

                {/* 2. Currently Serving */}
                <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                    {lang === 'ta' ? 'தற்போது பார்ப்பது' : 'NOW SERVING'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-950">
                    {realNowServing}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Doctor in OPD Consultation
                  </div>
                </div>

                {/* 3. Patients Ahead */}
                <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-amber-800 font-bold">
                    {lang === 'ta' ? 'முன்னுள்ள நோயாளிகள்' : 'PATIENTS AHEAD'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-950">
                    {realPatientsAhead}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    {realPatientsAhead === 0 ? 'Your turn next!' : `${realPatientsAhead} patient(s) ahead`}
                  </div>
                </div>

                {/* 4. Estimated Wait Time */}
                <div className="p-4 sm:p-5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-purple-800 font-bold">
                    {lang === 'ta' ? 'எதிர்பார்க்கப்படும் நேரம்' : 'ESTIMATED WAIT'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-purple-950">
                    {realEstimatedWait} <span className="text-base font-normal">mins</span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium">
                    {realPatientsAhead} ahead × 3m avg
                  </div>
                </div>
              </div>

              {/* =================================================== */}
              {/* QUEUE AHEAD OF YOU (LIVE REAL-TIME DATABASE QUEUE) */}
              {/* =================================================== */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-serif flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-800" />
                      <span>{lang === 'ta' ? 'உங்களுக்கு முன்னுள்ள வரிசை' : 'QUEUE AHEAD OF YOU'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'ta'
                        ? 'நேரடி தரவுத்தள வரிசை நிலவரம் • தனிப்பட்ட விவரங்கள் பாதுகாக்கப்படுகின்றன'
                        : 'Live entries currently ahead of your token in this department. Privacy-protected.'}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    <span>Position: </span>
                    <strong className="text-blue-900 font-mono text-sm">#{realPatientsAhead + 1}</strong>
                    <span> in Queue</span>
                  </div>
                </div>

                {/* Queue List */}
                <div className="space-y-2">
                  {((activeVisitData?.queueMetrics?.queueAhead || []) as Array<{ tokenNumber: string; status: string }>).length > 0 ? (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                      {((activeVisitData?.queueMetrics?.queueAhead || []) as Array<{ tokenNumber: string; status: string }>).map((entry, index) => (
                        <div
                          key={entry.tokenNumber || index}
                          className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold font-mono text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-mono font-bold text-base text-slate-900">
                              {entry.tokenNumber}
                            </span>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                            entry.status === 'In Consultation'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : entry.status === 'Called'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 text-center font-medium">
                      {realQueueStatus === 'called'
                        ? '🔔 Your token is currently CALLED! Please enter the consultation room.'
                        : realQueueStatus === 'in_service'
                        ? '🩺 You are currently in consultation with the doctor.'
                        : realQueueStatus === 'completed'
                        ? '✓ Consultation completed.'
                        : 'You are next in queue! Please proceed near the doctor consultation door.'}
                    </div>
                  )}

                  {/* Current Patient's Own Token (Highlighted at Bottom) */}
                  <div className="p-4 bg-blue-900 text-white rounded-xl flex items-center justify-between shadow-sm border border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-800 border border-blue-600 flex items-center justify-center text-white">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                          {lang === 'ta' ? 'உங்கள் டோக்கன்' : 'YOUR TOKEN'}
                        </div>
                        <div className="text-xl sm:text-2xl font-mono font-extrabold tracking-tight">
                          {realToken}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-teal-400 text-slate-950 font-bold text-xs rounded-full uppercase tracking-wider">
                      {realQueueStatus === 'in_service'
                        ? 'IN CONSULTATION'
                        : realQueueStatus === 'called'
                        ? 'CALLED'
                        : realQueueStatus === 'completed'
                        ? 'COMPLETED'
                        : 'WAITING IN QUEUE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    🔒 Strict Patient Privacy: Only queue tokens and waiting statuses are shown.
                  </span>
                  <span>
                    Doctor Avg Consult: <strong>3-5 mins</strong>
                  </span>
                </div>
              </div>

              {/* Real-Time Sync Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  {lang === 'ta'
                    ? 'மருத்துவர் அடுத்த நோயாளியை அழைக்கும் போது அல்லது பரிசோதனை முடிக்கும் போது இந்த வரிசை நிலை தானாகவே புதுப்பிக்கப்படும்.'
                    : 'This live queue automatically updates as the doctor calls patients and completes consultations in the database.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: MY JOURNEY (Dynamically Generated Steps) */}
        {/* ========================================================= */}
        {activeSection === 'journey' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'மருத்துவமனை வருகை பணிப்பாதை' : 'Hospital Patient Journey Tracker'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'உங்கள் தற்போதைய மருத்துவமனை வருகை நிலைகளின்படி மட்டுமே காட்டப்படுகிறது'
                  : 'Dynamically generated from your actual database visit. Only assigned stages are displayed.'}
              </p>
            </div>

            {/* Stepper */}
            <div className="space-y-4">
              {journeySteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border flex items-start justify-between gap-4 text-xs transition-colors ${
                    step.status === 'completed'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : step.status === 'current'
                      ? 'bg-blue-50 border-2 border-blue-900 text-blue-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : step.status === 'current' ? (
                        <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-300 text-slate-400 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <strong className="text-sm font-bold block text-slate-900">
                        {lang === 'ta' ? step.titleTa : step.title}
                      </strong>
                      <div className="text-slate-600 mt-0.5">{step.desc}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                      step.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : step.status === 'current'
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step.status === 'completed'
                      ? '✓ Completed'
                      : step.status === 'current'
                      ? '● In Progress'
                      : '○ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: LAB / SCAN REPORTS */}
        {/* ========================================================= */}
        {activeSection === 'reports' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'ஆய்வக & ஸ்கேன் அறிக்கைகள்' : 'Laboratory & Diagnostic Reports'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'மருத்துவரால் பரிந்துரைக்கப்பட்ட பரிசோதனைகளின் நேரடி முடிவுகள்'
                  : 'Diagnostic test requests, statuses, and clinical reports from the hospital database'}
              </p>
            </div>

            {diagnosticOrder ? (
              <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-blue-200 pb-3">
                  <div>
                    <strong className="text-sm text-blue-950 font-bold">
                      {diagnosticOrder.testName} (Token: {diagnosticOrder.tokenNumber || realToken})
                    </strong>
                    <div className="text-slate-600 mt-0.5">
                      Modality: {diagnosticOrder.modality?.toUpperCase()} • Room: {diagnosticOrder.roomNumber || 'Radiology Room 18'}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 font-bold rounded text-xs border self-start sm:self-auto ${
                      diagnosticOrder.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {diagnosticOrder.status === 'completed'
                      ? 'Result Ready / Reviewed by Doctor'
                      : 'Test In Progress / Waiting'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Diagnostic Findings Summary:</div>
                  <p className="text-xs text-slate-800 font-mono bg-slate-50 p-3 rounded border border-slate-200">
                    {diagnosticOrder.findingsSummary || 'Sample collected. Radiology suite is processing the scan imaging.'}
                  </p>
                  {diagnosticOrder.completedAt && (
                    <div className="text-[11px] text-slate-500">
                      Report Finalized: {new Date(diagnosticOrder.completedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                <FlaskConical className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Lab or Scan Orders for Current Visit</p>
                <p className="text-slate-500 mt-1">
                  If the consulting doctor requests an X-Ray, Scan, or Blood Test, the request and results will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: PRESCRIPTIONS / PHARMACY */}
        {/* ========================================================= */}
        {activeSection === 'prescriptions' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif">
                  {lang === 'ta' ? 'மருத்துவர் மருந்து சீட்டு & மருந்தகம்' : 'Prescription & Pharmacy Status'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ta'
                    ? 'மருத்துவரால் பரிந்துரைக்கப்பட்ட மருந்துகள் மற்றும் மருந்தக விநியோக நிலை'
                    : 'Medications prescribed by the consulting doctor and pharmacy fulfillment status'}
                </p>
              </div>

              {pharmacyOrder && (
                <span
                  className={`px-3 py-1 font-bold rounded text-xs border self-start sm:self-auto ${
                    pharmacyOrder.status === 'dispensed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}
                >
                  Pharmacy Status: {pharmacyOrder.status?.toUpperCase()}
                </span>
              )}
            </div>

            {pharmacyOrder && pharmacyOrder.medications && pharmacyOrder.medications.length > 0 ? (
              <div className="space-y-3 text-xs">
                {pharmacyOrder.medications.map((med: any, idx: number) => (
                  <div key={idx} className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-sm font-bold text-purple-950">{med.name}</strong>
                      <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                        {med.dosage}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-purple-100 text-slate-700">
                      <div>
                        <span className="text-slate-500">Timing:</span>
                        <div className="font-bold text-purple-950">{med.frequency || med.timing || '1-0-1'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Food Instruction:</span>
                        <div className="font-bold text-purple-950">{med.instructions || 'After Food'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Duration:</span>
                        <div className="font-bold text-purple-950">{med.duration || '5 Days'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Quantity:</span>
                        <div className="font-bold text-purple-950">{med.quantity || '10 tablets'}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-purple-100/60 rounded-lg text-[11px] text-purple-900 flex items-center justify-between">
                  <span>Dispensing Counter: <strong>Counter 3 (Central Pharmacy, Block A)</strong></span>
                  <span>TNMSC Free Medicine Scheme Applicable</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Prescriptions Issued for Current Visit</p>
                <p className="text-slate-500 mt-1">
                  Once the doctor completes the consultation and prescribes medicines, they will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: CONSULTATION HISTORY */}
        {/* ========================================================= */}
        {activeSection === 'history' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'மருத்துவ ஆலோசனைகள் வரலாறு' : 'Consultation History'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'மருத்துவர் பதிவு செய்த மருத்துவ குறிப்புகள் மற்றும் நோயறிதல்'
                  : 'Clinical notes and diagnosis recorded by the consulting doctor'}
              </p>
            </div>

            {consultation ? (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <div className="font-bold text-sm text-blue-950 font-serif">
                    Doctor: {consultation.doctorName}
                  </div>
                  <span className="text-slate-500">
                    {new Date(consultation.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-bold">Chief Complaint:</span>
                    <p className="text-slate-800 mt-0.5">{consultation.symptoms}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Doctor Diagnosis:</span>
                    <p className="text-slate-900 font-bold mt-0.5 text-sm">{consultation.diagnosis}</p>
                  </div>
                </div>

                {consultation.clinicalNotes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold block mb-1">Clinical Notes:</span>
                    <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200">
                      {consultation.clinicalNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Consultation Completed Yet</p>
                <p className="text-slate-500 mt-1">
                  When the doctor conducts your consultation, the diagnosis and clinical observations will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 6: PATIENT PROFILE */}
        {/* ========================================================= */}
        {activeSection === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif">
                  {lang === 'ta' ? 'நோயாளி சுயவிவரம்' : 'Patient Profile'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட நோயாளி விவரங்கள்' : 'Persistent hospital patient record'}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === 'ta' ? 'வெளியேறு' : 'Logout'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold">Patient Name:</span>
                <div className="text-sm font-bold text-slate-900">{currentPat?.name}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold">Patient ID:</span>
                <div className="text-sm font-mono font-bold text-blue-900">{currentPat?.id}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold">Mobile Number (Login Identifier):</span>
                <div className="text-sm font-mono font-bold text-slate-900">+91 {currentPat?.phone}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold">Age & Gender:</span>
                <div className="text-sm font-bold text-slate-900">{currentPat?.age} yrs • {currentPat?.gender}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold">Blood Group:</span>
                <div className="text-sm font-bold text-slate-900">{currentPat?.bloodGroup || 'O+ve'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold">Known Allergies:</span>
                <div className="text-sm font-bold text-amber-700">{currentPat?.allergies?.join(', ') || 'None Reported'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
