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
import { PatientEntryModal } from './PatientEntryModal';

export const PatientHome: React.FC = () => {
  const {
    activePatient,
    lang,
    pharmacyOrders,
    labOrders,
    diagnosticOrders,
    patients,
  } = useQueueFlow();

  const [activeSection, setActiveSection] = useState<
    'queue' | 'journey' | 'history' | 'reports' | 'prescriptions' | 'profile'
  >('queue');

  const [entryModalOpen, setEntryModalOpen] = useState(false);

  if (!activePatient) {
    return (
      <div className="p-8 text-center text-slate-600 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">No Active Patient Profile</h2>
        <p className="text-xs text-slate-500 mb-4">Register your profile or select your doctor to join the OPD queue.</p>
        <button
          onClick={() => setEntryModalOpen(true)}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold shadow cursor-pointer transition-colors"
        >
          Register Visit & Get Doctor Token
        </button>
        <PatientEntryModal isOpen={entryModalOpen} onClose={() => setEntryModalOpen(false)} />
      </div>
    );
  }

  // Related Patient Data
  const patientPharmacy = pharmacyOrders.find((p) => p.patientId === activePatient.id) || pharmacyOrders[0];
  const patientLab = labOrders.find((p) => p.patientId === activePatient.id) || labOrders[0];
  const patientDiag = diagnosticOrders.find((p) => p.patientId === activePatient.id);

  // General Medicine OPD queue calculation
  const deptPatients = patients.filter((p) => p.departmentId === activePatient.departmentId);
  const nowServing = deptPatients.find((p) => p.status === 'in_consultation') || { token: 'GM-021', name: 'Ravi Prakash' };
  const patientsAhead = Math.max(0, activePatient.queuePosition);
  const estimatedWait = Math.max(2, activePatient.estimatedWaitMinutes);

  // Historical consultations record for Anitha Kumar
  const pastConsultations = [
    {
      date: '10 August 2026',
      doctor: 'Dr. Priya Kumar (MD)',
      department: 'General Medicine',
      complaint: 'Generalized fatigue, evening tiredness, and elevated thirst.',
      diagnosis: 'Type 2 Diabetes Mellitus & Mild Hypertension',
      prescription: [
        { name: 'Tab Metformin 500mg', dosage: '500 mg', timing: 'Morning + Night', food: 'After Food', duration: '30 Days', quantity: '60 tablets' },
        { name: 'Tab Telmisartan 40mg', dosage: '40 mg', timing: 'Morning', food: 'After Food', duration: '30 Days', quantity: '30 tablets' },
      ],
      labReports: 'Fasting Blood Sugar (FBS): 154 mg/dL, HbA1c: 7.8%, CBC: 12.4 g/dL',
      diagnosticReports: 'Chest X-Ray: Clear lung fields, Normal cardiac silhouette',
    },
    {
      date: '24 May 2026',
      doctor: 'Dr. Priya Kumar (MD)',
      department: 'General Medicine',
      complaint: 'Seasonal viral fever, dry cough, and mild headache for 3 days.',
      diagnosis: 'Acute Upper Respiratory Tract Viral Infection',
      prescription: [
        { name: 'Tab Paracetamol 650mg', dosage: '650 mg', timing: 'Morning + Afternoon + Night', food: 'After Food', duration: '5 Days', quantity: '15 tablets' },
        { name: 'Syp Ambroxol', dosage: '10 ml', timing: 'Night', food: 'After Food', duration: '5 Days', quantity: '1 bottle' },
      ],
      labReports: 'CBC: Normal, Hb: 12.6 g/dL',
      diagnosticReports: 'Chest X-Ray: Normal baseline',
    },
  ];

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Top Patient Header Banner (No location/room info) */}
      <div className="bg-[#0b2545] text-white px-4 py-4 sm:py-5 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-300 font-medium mb-1">
              <span>{lang === 'ta' ? 'அரசு தலைமை மருத்துவமனை' : 'Government Hospital Patient Portal'}</span>
              <span>•</span>
              <span>{lang === 'ta' ? 'நோயாளி வரிசை & பணிப்பாதை' : 'GH QueueFlow Journey'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white flex items-center gap-2">
              <span>
                {lang === 'ta' ? 'வணக்கம்,' : 'Patient:'} {lang === 'ta' ? activePatient.nameTa : activePatient.name}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/80 border border-blue-400/40 text-blue-200">
                {activePatient.id}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1.5">
              <span>Age: <strong className="text-white">{activePatient.age} yrs</strong> ({activePatient.gender})</span>
              <span>•</span>
              <span>Blood Group: <strong className="text-white">{activePatient.bloodGroup || 'O+'}</strong></span>
              <span>•</span>
              <span>Allergies: <strong className="text-amber-300">{activePatient.allergies?.join(', ') || 'None'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEntryModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'புதிய டோக்கன் / மருத்துவர் தேர்வு' : 'New Doctor / Token'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (ONE Single Dashboard) */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-2 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'queue', label: lang === 'ta' ? 'எனது வரிசை (My Queue)' : 'My Queue', icon: <Ticket className="w-3.5 h-3.5" /> },
            { id: 'journey', label: lang === 'ta' ? 'எனது பணிப்பாதை (My Journey)' : 'My Journey', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'history', label: lang === 'ta' ? 'மருத்துவ வரலாறு (History)' : 'Consultation History', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'reports', label: lang === 'ta' ? 'ஆய்வக / ஸ்கேன் அறிக்கைகள்' : 'Lab / Scan Reports', icon: <FlaskConical className="w-3.5 h-3.5" /> },
            { id: 'prescriptions', label: lang === 'ta' ? 'மருந்து சீட்டு (Prescription)' : 'Prescriptions / Pharmacy', icon: <Pill className="w-3.5 h-3.5" /> },
            { id: 'profile', label: lang === 'ta' ? 'சுயவிவரம் (Profile)' : 'Patient Profile', icon: <User className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
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
        {/* SECTION 1: LIVE QUEUE PAGE (MY QUEUE) */}
        {/* ========================================================= */}
        {activeSection === 'queue' && (
          <div className="space-y-6">
            {/* Live Queue Hero Card */}
            <div className="bg-white rounded-xl border-2 border-blue-900/40 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-1 rounded">
                    {lang === 'ta' ? 'நேரடி OPD வரிசை கண்காணிப்பு' : 'LIVE OPD QUEUE STATUS'}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 font-serif mt-2">
                    {lang === 'ta' ? 'மருத்துவர்:' : 'Doctor:'} Dr. Priya Kumar (MD)
                  </h2>
                  <p className="text-xs text-slate-600">
                    {lang === 'ta' ? 'துறை:' : 'Department:'} General Medicine
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{lang === 'ta' ? 'தற்போதைய நிலை' : 'Queue Status'}</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs mt-1 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{activePatient.status === 'in_consultation' ? 'Inside Consultation' : 'Waiting in Queue'}</span>
                  </span>
                </div>
              </div>

              {/* 4 Core Queue Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Your Token */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-xl shadow-inner space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-blue-300 font-bold">
                    {lang === 'ta' ? 'உங்கள் டோக்கன்' : 'YOUR TOKEN'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                    {activePatient.token}
                  </div>
                  <div className="text-[11px] text-blue-200 font-medium">
                    {activePatient.name}
                  </div>
                </div>

                {/* 2. Currently Serving */}
                <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                    {lang === 'ta' ? 'தற்போது பார்ப்பது' : 'NOW SERVING'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-950">
                    {nowServing.token}
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
                    {patientsAhead}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    {patientsAhead === 0 ? 'Your turn next!' : `${patientsAhead} patient(s) in line`}
                  </div>
                </div>

                {/* 4. Estimated Wait Time */}
                <div className="p-4 sm:p-5 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-purple-800 font-bold">
                    {lang === 'ta' ? 'எதிர்பார்க்கப்படும் நேரம்' : 'ESTIMATED WAIT'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-purple-950">
                    {estimatedWait} <span className="text-base font-normal">mins</span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium">
                    Live dynamic calculation
                  </div>
                </div>
              </div>

              {/* Real-Time Sync Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  {lang === 'ta'
                    ? 'மருத்துவர் அடுத்த நோயாளியை அழைக்கும் போது இந்த வரிசை நிலை தானாகவே புதுப்பிக்கப்படும்.'
                    : 'This queue updates in real-time as the doctor calls patients and completes consultations.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: MY JOURNEY */}
        {/* ========================================================= */}
        {activeSection === 'journey' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'மருத்துவமனை வருகை பணிப்பாதை' : 'Hospital Patient Journey Tracker'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'உங்கள் தற்போதைய மருத்துவமனை பயணம் நிலைகளின்படி தானாகவே மாறும்'
                  : 'Real-time progression of your clinical journey based on doctor and department actions'}
              </p>
            </div>

            {/* Visual Journey Stepper */}
            <div className="space-y-4">
              {[
                {
                  id: 'doctor',
                  title: '1. Doctor Consultation',
                  titleTa: '1. மருத்துவர் ஆலோசனை',
                  desc: 'Dr. Priya Kumar (MD) • General Medicine',
                  status: activePatient.currentStage === 'doctor' ? 'current' : 'completed',
                },
                {
                  id: 'scan_lab',
                  title: '2. Scan / Diagnostic Lab',
                  titleTa: '2. ஆய்வகம் / ஸ்கேன் பரிசோதனை',
                  desc: patientLab ? `Blood Test (${patientLab.tests.join(', ')})` : 'Diagnostic Investigations',
                  status: activePatient.currentStage === 'lab' || activePatient.currentStage === 'diagnostic'
                    ? 'current'
                    : patientLab?.status === 'reviewed' || patientLab?.status === 'result_ready'
                    ? 'completed'
                    : 'pending',
                },
                {
                  id: 'doctor_review',
                  title: '3. Doctor Results Review',
                  titleTa: '3. மருத்துவர் பரிசோதனை முடிவுகள் மறுஆய்வு',
                  desc: 'Review diagnostic reports & decide treatment plan',
                  status: activePatient.currentStage === 'doctor_review'
                    ? 'current'
                    : patientLab?.status === 'reviewed'
                    ? 'completed'
                    : 'pending',
                },
                {
                  id: 'pharmacy',
                  title: '4. Central Pharmacy Dispensing',
                  titleTa: '4. மருந்தகத்தில் மருந்துகள் பெறுதல்',
                  desc: patientPharmacy ? `Prescription (${patientPharmacy.medications.length} items)` : 'Medication Dispensing',
                  status: activePatient.currentStage === 'pharmacy'
                    ? 'current'
                    : patientPharmacy?.status === 'dispensed'
                    ? 'completed'
                    : 'pending',
                },
                {
                  id: 'completed',
                  title: '5. Journey Completed',
                  titleTa: '5. மருத்துவமனை வருகை நிறைவு',
                  desc: 'All hospital steps completed',
                  status: activePatient.currentStage === 'completed' || patientPharmacy?.status === 'dispensed'
                    ? 'completed'
                    : 'pending',
                },
              ].map((step, idx) => (
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
                    {step.status === 'completed' ? '✓ Completed' : step.status === 'current' ? '● In Progress' : '○ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: CONSULTATION HISTORY */}
        {/* ========================================================= */}
        {activeSection === 'history' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'முந்தைய மருத்துவ ஆலோசனைகள் வரலாறு' : 'Previous Consultation History'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'உங்கள் முந்தைய ஆலோசனைகள், மருந்து சீட்டுகள் மற்றும் பரிசோதனை அறிக்கைகள்'
                  : 'Historical medical visits and doctor records for known patient'}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {pastConsultations.map((c, idx) => (
                <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                    <div className="font-bold text-sm text-blue-950 font-serif">
                      Date: {c.date} • {c.department}
                    </div>
                    <span className="font-semibold text-slate-700">Doctor: {c.doctor}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 font-bold">Chief Complaint:</span>
                      <p className="text-slate-800 mt-0.5">{c.complaint}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Clinical Diagnosis:</span>
                      <p className="text-slate-800 font-semibold mt-0.5">{c.diagnosis}</p>
                    </div>
                  </div>

                  {/* Prescribed medicines */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold block mb-1">Prescription:</span>
                    <div className="space-y-1 bg-white p-2.5 rounded border border-slate-200">
                      {c.prescription.map((rx, rIdx) => (
                        <div key={rIdx} className="text-slate-800">
                          • <strong>{rx.name}</strong> ({rx.dosage}) — {rx.timing} | {rx.duration}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                    <div><strong>Diagnostic Reports:</strong> {c.labReports}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: LAB / SCAN REPORTS */}
        {/* ========================================================= */}
        {activeSection === 'reports' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'ஆய்வக & ஸ்கேன் அறிக்கைகள்' : 'Laboratory & Diagnostic Reports'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'மருத்துவர் கோரிய பரிசோதனைகள் மற்றும் முடிவுகள்'
                  : 'Diagnostic test requests, statuses, numerical values, and reference ranges'}
              </p>
            </div>

            {/* Current Visit Lab Report */}
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-blue-200 pb-3">
                <div>
                  <strong className="text-sm text-blue-950 font-bold">Blood Sugar & Pathology Panel (Token: {activePatient.token})</strong>
                  <div className="text-slate-600 mt-0.5">Ordered by: Dr. Priya Kumar (MD)</div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-xs border border-emerald-300 self-start sm:self-auto">
                  Result Available & Sent to Doctor
                </span>
              </div>

              {/* Numerical Values Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold">Fasting Blood Sugar (FBS):</span>
                  <div className="text-red-700 font-mono text-base font-extrabold mt-1">154 mg/dL</div>
                  <div className="text-[10px] text-slate-500">Ref: 70 - 99 mg/dL (High)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold">Postprandial (PPBS):</span>
                  <div className="text-red-700 font-mono text-base font-extrabold mt-1">210 mg/dL</div>
                  <div className="text-[10px] text-slate-500">Ref: &lt; 140 mg/dL (High)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold">HbA1c Glycated Hb:</span>
                  <div className="text-red-700 font-mono text-base font-extrabold mt-1">7.8 %</div>
                  <div className="text-[10px] text-slate-500">Ref: &lt; 5.7 % (Suboptimal)</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold">Hemoglobin (Hb):</span>
                  <div className="text-emerald-700 font-mono text-base font-extrabold mt-1">12.4 g/dL</div>
                  <div className="text-[10px] text-slate-500">Ref: 12.0 - 15.5 (Normal)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: PRESCRIPTIONS / PHARMACY */}
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
                    : 'Medications prescribed by doctor and fulfillment status'}
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-xs border border-emerald-300 self-start sm:self-auto">
                Prescription Status: Ready / Dispensed
              </span>
            </div>

            {/* Prescribed Items List */}
            <div className="space-y-3 text-xs">
              {[
                {
                  name: 'Tab Metformin Hydrochloride IP',
                  dosage: '500 mg',
                  timing: 'Morning + Night (1-0-1)',
                  food: 'After Food',
                  duration: '30 Days',
                  quantity: '60 tablets',
                  instructions: 'Take twice daily with warm water after food',
                },
                {
                  name: 'Tab Telmisartan IP',
                  dosage: '40 mg',
                  timing: 'Morning (1-0-0)',
                  food: 'After Food',
                  duration: '30 Days',
                  quantity: '30 tablets',
                  instructions: 'Take once daily in the morning',
                },
              ].map((med, idx) => (
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
                      <div className="font-bold text-purple-950">{med.timing}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Food:</span>
                      <div className="font-bold text-purple-950">{med.food}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Duration:</span>
                      <div className="font-bold text-purple-950">{med.duration}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Quantity:</span>
                      <div className="font-bold text-purple-950">{med.quantity}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-purple-100">
                    Instructions: {med.instructions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 6: PATIENT PROFILE */}
        {/* ========================================================= */}
        {activeSection === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {lang === 'ta' ? 'நோயாளி பதிவு சுயவிவரம்' : 'Patient Registered Profile'}
              </h2>
              <div className="text-xs text-slate-500">Government Hospital Patient Digital Record</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Full Name:</span>
                <strong className="text-sm font-bold text-slate-900">{activePatient.name}</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Patient ID:</span>
                <strong className="text-sm font-bold font-mono text-blue-900">{activePatient.id}</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Age / Gender:</span>
                <strong className="text-sm font-bold text-slate-900">{activePatient.age} yrs ({activePatient.gender})</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Blood Group:</span>
                <strong className="text-sm font-bold text-slate-900">{activePatient.bloodGroup || 'O+'}</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Known Allergies:</span>
                <strong className="text-sm font-bold text-amber-700">{activePatient.allergies?.join(', ') || 'Penicillin'}</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Chronic Conditions:</span>
                <strong className="text-sm font-bold text-slate-900">{activePatient.existingConditions?.join(', ') || 'Type 2 Diabetes, HTN'}</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Mobile Phone:</span>
                <strong className="text-sm font-bold text-slate-900">{activePatient.phone}</strong>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-500 block">Registered Address:</span>
                <strong className="text-sm font-bold text-slate-900">{activePatient.address || 'Madurai, Tamil Nadu'}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Registering / Selecting Doctor */}
      <PatientEntryModal isOpen={entryModalOpen} onClose={() => setEntryModalOpen(false)} />
    </div>
  );
};
