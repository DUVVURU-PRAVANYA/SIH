import React, { useState } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FlaskConical,
  Scan,
  Pill,
  Calendar,
  ArrowRight,
  Plus,
  Trash2,
  Play,
  Search,
  ChevronRight,
  Activity,
  AlertTriangle,
  User,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { Patient, DoctorNotes, MedicationItem } from '../../types';

interface NewMedicineForm {
  name: string;
  dosage: string;
  quantity: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  foodTiming: 'before_food' | 'after_food' | 'with_food';
  durationDays: string;
  instructions: string;
}

export const DoctorPortal: React.FC = () => {
  const {
    patients,
    activePatient,
    setActivePatientId,
    callNextOPDPatient,
    startConsultation,
    submitDoctorConsultation,
    reviewAndCompleteResults,
    doctorRevisitDecision,
    labOrders,
    diagnosticOrders,
    revisits,
    lang,
  } = useQueueFlow();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    activePatient?.id || 'GH-2026-004281'
  );
  const [activeTab, setActiveTab] = useState<'consultation' | 'queue' | 'profile' | 'reviews' | 'revisits'>('consultation');
  const [profileSubTab, setProfileSubTab] = useState<'overview' | 'history' | 'visits' | 'labs' | 'diagnostics' | 'rx'>('overview');

  // Active Doctor's Patients (General Medicine - Dr. Priya Kumar)
  const doctorDeptId = 'dept-genmed';
  const opdPatients = patients.filter((p) => p.departmentId === doctorDeptId);
  const currentPat = patients.find((p) => p.id === selectedPatientId) || opdPatients[0] || patients[0];

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState(
    'Generalized fatigue, polydipsia, and postprandial dizziness for 2 weeks.'
  );
  const [bp, setBp] = useState('138/88');
  const [pulse, setPulse] = useState('78');
  const [temp, setTemp] = useState('98.4');
  const [weight, setWeight] = useState('64');
  const [doctorDiagnosis, setDoctorDiagnosis] = useState('Type 2 Diabetes Mellitus with Mild Hypertension');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient has 5-year history of Type 2 DM. Fasting blood sugar check required to assess current glycemic index before medication adjustment.'
  );

  // Path Selection: Medicine vs Scan/Lab
  const [activePath, setActivePath] = useState<'both' | 'medicine' | 'scan_lab'>('both');

  // Path A: Medicine Prescriptions (Multi-Medicine Builder)
  const [prescriptions, setPrescriptions] = useState<MedicationItem[]>([
    {
      id: 'm-1',
      name: 'Tab Metformin Hydrochloride IP',
      dosage: '500 mg',
      frequency: '1-0-1 (After Food)',
      duration: '30 Days',
      instructions: 'Take twice daily after food with water',
      quantity: 60,
    },
    {
      id: 'm-2',
      name: 'Tab Telmisartan IP',
      dosage: '40 mg',
      frequency: '1-0-0 (Morning - After Food)',
      duration: '30 Days',
      instructions: 'Take once daily in the morning',
      quantity: 30,
    },
  ]);

  // Form state to add new medicine
  const [newMed, setNewMed] = useState<NewMedicineForm>({
    name: '',
    dosage: '500 mg',
    quantity: '10 tablets',
    morning: true,
    afternoon: false,
    night: true,
    foodTiming: 'after_food',
    durationDays: '5 Days',
    instructions: 'Take with water',
  });

  const handleAddMedicine = () => {
    if (!newMed.name.trim()) return;

    const timings: string[] = [];
    if (newMed.morning) timings.push('Morning');
    if (newMed.afternoon) timings.push('Afternoon');
    if (newMed.night) timings.push('Night');
    const timingStr = timings.length > 0 ? timings.join(', ') : 'Once daily';

    let foodStr = 'After Food';
    if (newMed.foodTiming === 'before_food') foodStr = 'Before Food';
    if (newMed.foodTiming === 'with_food') foodStr = 'With Food';

    const freqSummary = `${newMed.morning ? '1' : '0'}-${newMed.afternoon ? '1' : '0'}-${newMed.night ? '1' : '0'} (${timingStr} - ${foodStr})`;

    const item: MedicationItem = {
      id: `med-${Date.now()}`,
      name: newMed.name.trim(),
      dosage: newMed.dosage || '500 mg',
      frequency: freqSummary,
      duration: newMed.durationDays.includes('Day') ? newMed.durationDays : `${newMed.durationDays} Days`,
      instructions: newMed.instructions ? `${newMed.instructions} (${foodStr})` : foodStr,
      quantity: parseInt(newMed.quantity) || 10,
    };

    setPrescriptions([...prescriptions, item]);
    setNewMed({
      name: '',
      dosage: '500 mg',
      quantity: '10 tablets',
      morning: true,
      afternoon: false,
      night: true,
      foodTiming: 'after_food',
      durationDays: '5 Days',
      instructions: 'Take with water',
    });
  };

  const handleRemoveMedicine = (id: string) => {
    setPrescriptions(prescriptions.filter((m) => m.id !== id));
  };

  // Path B: Scan / Lab Orders
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([
    'Fasting Blood Sugar (FBS)',
    'Postprandial Blood Sugar (PPBS)',
    'HbA1c Glycated Hemoglobin',
    'Complete Blood Count (CBC)',
  ]);
  const [labPriority, setLabPriority] = useState<'routine' | 'urgent'>('routine');
  const [labSchedule, setLabSchedule] = useState<'today' | 'next_day'>('today');

  const [requestDiagnostic, setRequestDiagnostic] = useState(false);
  const [diagnosticModality, setDiagnosticModality] = useState<'x-ray' | 'ultrasound' | 'ct' | 'mri'>('x-ray');
  const [diagnosticTestName, setDiagnosticTestName] = useState('Chest Digital X-Ray (PA View)');

  // Review & Revisit Tab State
  const [selectedReviewPatientId, setSelectedReviewPatientId] = useState('GH-2026-004281');
  const [doctorInterpretation, setDoctorInterpretation] = useState(
    'FBS 154 mg/dL and HbA1c 7.8% confirms inadequate glycemic control. Adjusted Metformin dosage.'
  );

  const handleStartConsultation = (pId: string) => {
    setSelectedPatientId(pId);
    setActivePatientId(pId);
    startConsultation(pId);
    setActiveTab('consultation');
  };

  const handleSubmitConsultation = () => {
    const notes: DoctorNotes = {
      chiefComplaint,
      vitals: { bp, pulse, temp, weight },
      provisionalDiagnosis: doctorDiagnosis,
      diagnosis: doctorDiagnosis,
      clinicalNotes,
      medications: prescriptions,
      investigations: selectedLabTests,
      followUpDays: 14,
    };

    submitDoctorConsultation(selectedPatientId, notes, {
      labTests: (activePath === 'both' || activePath === 'scan_lab') && selectedLabTests.length > 0 ? selectedLabTests : undefined,
      labPriority,
      labSchedule,
      diagnosticModality: (activePath === 'both' || activePath === 'scan_lab') && requestDiagnostic ? diagnosticModality : undefined,
      diagnosticTestName: (activePath === 'both' || activePath === 'scan_lab') && requestDiagnostic ? diagnosticTestName : undefined,
      diagnosticPriority: 'routine',
      prescriptions: (activePath === 'both' || activePath === 'medicine') && prescriptions.length > 0 ? prescriptions : undefined,
    });
  };

  // Find currently serving patient
  const nowServingPatient = opdPatients.find((p) => p.status === 'in_consultation') || opdPatients[0];

  return (
    <div className="bg-[#f8fafc] flex-1 pb-16">
      {/* Top Doctor Bar (No Room/Location info) */}
      <div className="bg-[#0b2545] text-white px-4 py-3.5 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-teal-600/30 border border-teal-400/50 flex items-center justify-center text-teal-300">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white">Dr. Priya Kumar (MD)</h1>
                <span className="text-xs px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40">
                  {lang === 'ta' ? 'பொது மருத்துவம்' : 'General Medicine'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'ta' ? 'அரசு தலைமை பொது மருத்துவமனை • OPD மருத்துவர் பணிப்பிரிவு' : 'District Headquarter Government Hospital • Doctor OPD Consultation'}
              </p>
            </div>
          </div>

          {/* Quick Doctor Action: Call Next Patient */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => callNextOPDPatient(doctorDeptId)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{lang === 'ta' ? 'அடுத்த நோயாளியை அழைக்கவும்' : 'Call Next Patient'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Tabs (Only Real Tabs with Genuine Database Content) */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[48px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-2 py-2 text-xs font-bold text-slate-600">
          {[
            { id: 'consultation', label: lang === 'ta' ? 'மருத்துவ ஆலோசனை' : 'Active Consultation', icon: <Stethoscope className="w-3.5 h-3.5" /> },
            { id: 'queue', label: lang === 'ta' ? `இன்றைய வரிசை (${opdPatients.length})` : `Today's Queue (${opdPatients.length})`, icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'profile', label: lang === 'ta' ? 'நோயாளி மருத்துவ வரலாறு' : 'Patient Clinical History', icon: <FileText className="w-3.5 h-3.5" /> },
            ...(labOrders.filter((o) => o.status === 'result_ready').length > 0
              ? [{
                  id: 'reviews',
                  label: lang === 'ta'
                    ? `பரிசீலனை முடிவுகள் (${labOrders.filter((o) => o.status === 'result_ready').length})`
                    : `Results Requiring Review (${labOrders.filter((o) => o.status === 'result_ready').length})`,
                  icon: <FlaskConical className="w-3.5 h-3.5" />,
                }]
              : []),
            ...(revisits.length > 0
              ? [{
                  id: 'revisits',
                  label: lang === 'ta' ? `மறு வருகைகள் (${revisits.length})` : `Scheduled Revisits (${revisits.length})`,
                  icon: <Calendar className="w-3.5 h-3.5" />,
                }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === tab.id
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

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dynamic Alert Banner when Result arrives while on another tab */}
        {labOrders.filter((o) => o.status === 'result_ready').length > 0 && activeTab !== 'reviews' && (
          <div className="bg-amber-50 border-2 border-amber-400 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs mb-6">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-950 uppercase tracking-wider">
                  {lang === 'ta' ? 'பரிசோதனை முடிவு வந்துள்ளது:' : 'RESULT AVAILABLE FOR REVIEW:'}
                </span>{' '}
                <span className="text-slate-800 font-medium">
                  {labOrders.filter((o) => o.status === 'result_ready')[0]?.patientName} ({labOrders.filter((o) => o.status === 'result_ready')[0]?.patientToken}) — Blood Test Results Available
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('reviews')}
              className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded font-bold self-start sm:self-auto cursor-pointer shadow-xs"
            >
              {lang === 'ta' ? 'முடிவை மதிப்பாய்வு செய்க' : 'View Result & Decide Revisit'}
            </button>
          </div>
        )}
        {/* ========================================================= */}
        {/* TAB 1: ACTIVE CONSULTATION & ORDERS */}
        {/* ========================================================= */}
        {activeTab === 'consultation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Current Attending Patient & Next In Line */}
            <div className="lg:col-span-4 space-y-4">
              {/* CURRENT ATTENDING PATIENT CARD */}
              <div className="bg-white rounded-xl border-2 border-blue-900/40 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-950">
                    {lang === 'ta' ? 'தற்போது ஆலோசனையில் உள்ள நோயாளி' : 'CURRENT ATTENDING PATIENT'}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    {currentPat.token}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentPat.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">Patient ID: {currentPat.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500">{lang === 'ta' ? 'வயது / பாலினம்:' : 'Age / Gender:'}</span>
                    <div className="font-bold text-slate-800">{currentPat.age} yrs / {currentPat.gender}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{lang === 'ta' ? 'இரத்த வகை:' : 'Blood Group:'}</span>
                    <div className="font-bold text-slate-800">{currentPat.bloodGroup || 'O+'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{lang === 'ta' ? 'ஒவ்வாமைகள்:' : 'Allergies:'}</span>
                    <div className="font-bold text-amber-700">{currentPat.allergies?.join(', ') || 'None'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{lang === 'ta' ? 'நாள்பட்ட பாதிப்புகள்:' : 'Chronic Cond:'}</span>
                    <div className="font-bold text-slate-800">{currentPat.existingConditions?.join(', ') || 'None'}</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'முழு மருத்துவ வரலாற்றைக் காண்க' : 'View Full Clinical Record'}</span>
                </button>
              </div>

              {/* Next Waiting Patients in Doctor's Queue */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
                  <span>{lang === 'ta' ? 'அடுத்த நோயாளிகள்' : "Today's Queue List"}</span>
                  <span className="text-blue-900 font-mono font-bold">{opdPatients.length} Waiting</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {opdPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleStartConsultation(p.id)}
                      className={`py-2.5 px-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                        p.id === currentPat.id
                          ? 'bg-blue-50 border-l-4 border-blue-900 font-bold text-blue-950'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                          {p.token}
                        </span>
                        <span>{p.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {p.status === 'in_consultation' ? 'Attending' : `Position #${p.queuePosition}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Consultation Form (Text-Based) */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === 'ta' ? 'மருத்துவ ஆலோசனை & பரிசோதனை படிவம்' : 'Clinical Consultation Form'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ta'
                    ? 'நோயாளியின் குறைகள், மருத்துவரின் உறுதிப்படுத்தப்பட்ட நோய் கண்டறிதல் மற்றும் சிகிச்சை வழியை பதிவு செய்யவும்'
                    : 'Record chief complaints, confirmed diagnosis, and select treatment path'}
                </p>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-blue-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-blue-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Temperature (°F)</label>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-blue-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-blue-800 outline-none"
                  />
                </div>
              </div>

              {/* Chief Complaints, Confirmed Diagnosis & Doctor Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'முக்கிய புகார்கள் & அறிகுறிகள்' : 'Chief Complaint & Symptoms'}
                  </label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-800 outline-none"
                    placeholder="Enter patient symptoms and complaints..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? "மருத்துவரின் நோய் கண்டறிதல் (Doctor's Confirmed Diagnosis)" : "Doctor's Diagnosis"}
                  </label>
                  <input
                    type="text"
                    value={doctorDiagnosis}
                    onChange={(e) => setDoctorDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-blue-300 bg-blue-50/40 rounded focus:ring-2 focus:ring-blue-800 outline-none font-semibold text-slate-900"
                    placeholder="Confirmed clinical diagnosis entered by doctor..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'மருத்துவக் குறிப்புகள் (Clinical Observations & Notes)' : 'Clinical Observations / Doctor Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-800 outline-none"
                    placeholder="Enter detailed clinical findings and observations..."
                  ></textarea>
                </div>
              </div>

              {/* Consultation Paths Selector */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-blue-950">
                    {lang === 'ta' ? 'சிகிச்சை வழியைத் தேர்ந்தெடுக்கவும்' : 'Select Treatment Path'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActivePath('medicine')}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                        activePath === 'medicine' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      A. Medicine / Injection
                    </button>
                    <button
                      onClick={() => setActivePath('scan_lab')}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                        activePath === 'scan_lab' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      B. Scan / Lab
                    </button>
                    <button
                      onClick={() => setActivePath('both')}
                      className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                        activePath === 'both' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Both Paths
                    </button>
                  </div>
                </div>

                {/* PATH A: MEDICINE / INJECTION (PRESCRIPTION BUILDER) */}
                {(activePath === 'both' || activePath === 'medicine') && (
                  <div className="p-4 bg-purple-50/60 border border-purple-300 rounded-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                      <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-purple-700" />
                        <span>PATH A: MEDICINE / INJECTION (Prescription Section)</span>
                      </span>
                      <span className="text-[11px] font-semibold text-purple-800">
                        {prescriptions.length} Medicine(s) Added
                      </span>
                    </div>

                    {/* Prescriptions List */}
                    {prescriptions.length > 0 && (
                      <div className="space-y-2">
                        {prescriptions.map((m) => (
                          <div
                            key={m.id}
                            className="bg-white p-3 rounded border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <strong className="text-slate-900">{m.name}</strong> • <span className="font-mono text-purple-900 font-bold">{m.dosage}</span> • <span className="text-slate-600">Qty: {m.quantity}</span>
                              <div className="text-[11px] text-purple-950 font-medium mt-0.5">
                                Timing: {m.frequency} | Duration: {m.duration}
                              </div>
                              {m.instructions && (
                                <div className="text-[11px] text-slate-600 italic">Instructions: {m.instructions}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveMedicine(m.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Medicine Sub-Form (Strict Specifications) */}
                    <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-3">
                      <div className="font-bold text-xs text-purple-950 uppercase tracking-wider">
                        Add Medicine to Prescription
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Medicine Name</label>
                          <input
                            type="text"
                            value={newMed.name}
                            onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                            placeholder="e.g. Paracetamol"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-purple-800 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Strength / Dosage</label>
                          <input
                            type="text"
                            value={newMed.dosage}
                            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                            placeholder="e.g. 500 mg"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-purple-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantity</label>
                          <input
                            type="text"
                            value={newMed.quantity}
                            onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })}
                            placeholder="e.g. 10 tablets"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-purple-800"
                          />
                        </div>
                      </div>

                      {/* Timing & Food Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Timing</label>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMed.morning}
                                onChange={(e) => setNewMed({ ...newMed, morning: e.target.checked })}
                                className="rounded text-purple-700"
                              />
                              <span>Morning</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMed.afternoon}
                                onChange={(e) => setNewMed({ ...newMed, afternoon: e.target.checked })}
                                className="rounded text-purple-700"
                              />
                              <span>Afternoon</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-800">
                              <input
                                type="checkbox"
                                checked={newMed.night}
                                onChange={(e) => setNewMed({ ...newMed, night: e.target.checked })}
                                className="rounded text-purple-700"
                              />
                              <span>Night</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Food Timing</label>
                          <div className="flex items-center gap-3 text-xs">
                            <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                              <input
                                type="radio"
                                name="foodTiming"
                                value="before_food"
                                checked={newMed.foodTiming === 'before_food'}
                                onChange={() => setNewMed({ ...newMed, foodTiming: 'before_food' })}
                              />
                              <span>Before Food</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                              <input
                                type="radio"
                                name="foodTiming"
                                value="after_food"
                                checked={newMed.foodTiming === 'after_food'}
                                onChange={() => setNewMed({ ...newMed, foodTiming: 'after_food' })}
                              />
                              <span>After Food</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                              <input
                                type="radio"
                                name="foodTiming"
                                value="with_food"
                                checked={newMed.foodTiming === 'with_food'}
                                onChange={() => setNewMed({ ...newMed, foodTiming: 'with_food' })}
                              />
                              <span>With Food</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Duration & Instructions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration (Number of Days)</label>
                          <input
                            type="text"
                            value={newMed.durationDays}
                            onChange={(e) => setNewMed({ ...newMed, durationDays: e.target.value })}
                            placeholder="e.g. 5 Days"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-purple-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Additional Instructions</label>
                          <input
                            type="text"
                            value={newMed.instructions}
                            onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                            placeholder="e.g. Take with water"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-purple-800"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleAddMedicine}
                          className="px-4 py-1.5 bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Medicine</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PATH B: SCAN / LAB ORDERS */}
                {(activePath === 'both' || activePath === 'scan_lab') && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-emerald-700" />
                        <span>PATH B: SCAN / LAB (Diagnostic Orders)</span>
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <select
                          value={labPriority}
                          onChange={(e) => setLabPriority(e.target.value as any)}
                          className="px-2 py-1 bg-white border border-emerald-300 rounded text-xs"
                        >
                          <option value="routine">Routine Priority</option>
                          <option value="urgent">Urgent Priority</option>
                        </select>
                        <select
                          value={labSchedule}
                          onChange={(e) => setLabSchedule(e.target.value as any)}
                          className="px-2 py-1 bg-white border border-emerald-300 rounded text-xs"
                        >
                          <option value="today">Perform Today</option>
                          <option value="next_day">Schedule Next Day</option>
                        </select>
                      </div>
                    </div>

                    {/* Lab Test Checkboxes */}
                    <div>
                      <div className="text-[11px] font-bold text-emerald-950 mb-2">Select Pathology & Biochemistry Tests:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {[
                          'Fasting Blood Sugar (FBS)',
                          'Postprandial Blood Sugar (PPBS)',
                          'HbA1c Glycated Hemoglobin',
                          'Complete Blood Count (CBC)',
                          'Serum Electrolytes',
                          'Routine Urine Analysis',
                        ].map((tName) => (
                          <label key={tName} className="flex items-center gap-2 cursor-pointer text-slate-800">
                            <input
                              type="checkbox"
                              checked={selectedLabTests.includes(tName)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLabTests([...selectedLabTests, tName]);
                                } else {
                                  setSelectedLabTests(selectedLabTests.filter((x) => x !== tName));
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{tName}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Radiology / Scan Selection */}
                    <div className="pt-2 border-t border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-emerald-950 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requestDiagnostic}
                            onChange={(e) => setRequestDiagnostic(e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span>Order Diagnostic Scan / Imaging</span>
                        </label>

                        {requestDiagnostic && (
                          <select
                            value={diagnosticModality}
                            onChange={(e) => setDiagnosticModality(e.target.value as any)}
                            className="px-2 py-1 bg-white border border-emerald-300 rounded text-xs"
                          >
                            <option value="x-ray">Digital X-Ray</option>
                            <option value="ultrasound">Ultrasound (USG)</option>
                            <option value="ct">CT Scan</option>
                            <option value="mri">MRI Scan</option>
                          </select>
                        )}
                      </div>

                      {requestDiagnostic && (
                        <input
                          type="text"
                          value={diagnosticTestName}
                          onChange={(e) => setDiagnosticTestName(e.target.value)}
                          placeholder="e.g. Chest Digital X-Ray (PA View)"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded font-medium"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={handleSubmitConsultation}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-md shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>{lang === 'ta' ? 'ஆலோசனையை சேமித்து உத்தரவுகளை அனுப்பவும்' : 'Submit Consultation & Transmit Orders'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TODAY'S DOCTOR QUEUE */}
        {/* ========================================================= */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === 'ta' ? "இன்றைய மருத்துவர் வரிசை (Today's Queue)" : "TODAY'S QUEUE"}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ta' ? 'டாக்டர் பிரியா குமார் • பொது மருத்துவம்' : 'Dr. Priya Kumar • General Medicine OPD Queue'}
                </p>
              </div>

              <button
                onClick={() => callNextOPDPatient(doctorDeptId)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center gap-2 shadow cursor-pointer self-start sm:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{lang === 'ta' ? 'அடுத்த நோயாளியை அழைக்கவும்' : 'Call Next Patient'}</span>
              </button>
            </div>

            {/* NOW SERVING STATUS BOX */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                  {lang === 'ta' ? 'தற்போது கவனிக்கப்படும் டோக்கன்' : 'NOW SERVING'}
                </div>
                <div className="text-2xl font-extrabold text-blue-950 font-mono mt-0.5">
                  {nowServingPatient ? nowServingPatient.token : 'GM-021'}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1">
                  Patient: {nowServingPatient ? nowServingPatient.name : 'Ravi Prakash'} (ID: {nowServingPatient ? nowServingPatient.id : 'GH-2026-004278'})
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold rounded text-xs border border-blue-200">
                  Status: In Consultation
                </span>
              </div>
            </div>

            {/* WAITING QUEUE TABLE */}
            <div>
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                {lang === 'ta' ? 'காத்திருக்கும் நோயாளிகள் (Waiting List)' : 'WAITING PATIENTS IN QUEUE'}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Position</th>
                      <th className="p-3">Token</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Age / Gender</th>
                      <th className="p-3">Vitals (BP/Pulse)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opdPatients.map((p) => (
                      <tr key={p.id} className={p.id === currentPat.id ? 'bg-blue-50/70' : 'hover:bg-slate-50'}>
                        <td className="p-3 font-mono font-bold">#{p.queuePosition}</td>
                        <td className="p-3 font-mono font-extrabold text-blue-900">{p.token}</td>
                        <td className="p-3 font-bold text-slate-900">{p.name}</td>
                        <td className="p-3 text-slate-600">{p.age} yrs / {p.gender}</td>
                        <td className="p-3 font-mono text-slate-700">{p.vitals.bp} • {p.vitals.pulse}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleStartConsultation(p.id)}
                            className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Start Exam
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PATIENT CLINICAL HISTORY */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'ta' ? 'முழுமையான மருத்துவ வரலாறு:' : 'Comprehensive Patient Clinical History:'} {currentPat.name} ({currentPat.id})
              </h2>
              <div className="text-xs text-slate-500">Government Electronic Health Record (EHR) & Historical Consultations</div>
            </div>

            {/* Profile Sub-Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold text-slate-600">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'history', label: 'Previous Consultations (3)' },
                { id: 'labs', label: 'Previous Lab Reports' },
                { id: 'diagnostics', label: 'Previous Scan Reports' },
                { id: 'rx', label: 'Previous Prescriptions' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setProfileSubTab(st.id as any)}
                  className={`px-3 py-1 rounded cursor-pointer ${
                    profileSubTab === st.id ? 'bg-blue-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Sub-Tab 1: Overview */}
            {profileSubTab === 'overview' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Full Name:</span>
                  <strong className="block text-slate-900 font-bold">{currentPat.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Age / Gender:</span>
                  <strong className="block text-slate-900 font-bold">{currentPat.age} yrs ({currentPat.gender})</strong>
                </div>
                <div>
                  <span className="text-slate-500">Blood Group:</span>
                  <strong className="block text-slate-900 font-bold">{currentPat.bloodGroup || 'O+'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Known Allergies:</span>
                  <strong className="block text-amber-700 font-bold">{currentPat.allergies?.join(', ') || 'Penicillin'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Chronic Conditions:</span>
                  <strong className="block text-slate-900 font-bold">Type 2 Diabetes (5 yrs), Mild HTN</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mobile Phone:</span>
                  <strong className="block text-slate-900 font-bold">{currentPat.phone}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Address:</span>
                  <strong className="block text-slate-900 font-bold">{currentPat.address || 'Madurai, Tamil Nadu'}</strong>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Previous Consultations */}
            {profileSubTab === 'history' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-bold">
                    <span className="text-blue-900">10 August 2026 • General Medicine</span>
                    <span className="text-slate-600">Consultant: Dr. Priya Kumar</span>
                  </div>
                  <div><strong>Chief Complaint:</strong> Recurring evening fatigue and elevated thirst.</div>
                  <div><strong>Diagnosis:</strong> Type 2 Diabetes Mellitus - Early Glycemic Fluctuation.</div>
                  <div><strong>Prescription:</strong> Tab Metformin 500mg (1-0-1 After Food) for 30 Days.</div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-bold">
                    <span className="text-blue-900">14 June 2026 • General Medicine</span>
                    <span className="text-slate-600">Consultant: Dr. Priya Kumar</span>
                  </div>
                  <div><strong>Chief Complaint:</strong> Mild dizziness on standing.</div>
                  <div><strong>Diagnosis:</strong> Mild Essential Hypertension.</div>
                  <div><strong>Prescription:</strong> Tab Telmisartan 40mg (1-0-0 Morning) for 30 Days.</div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Lab Results */}
            {profileSubTab === 'labs' && (
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Investigation</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5">Reference Range</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5">04 Sep 2026</td>
                      <td className="p-2.5 font-bold">Fasting Blood Sugar (FBS)</td>
                      <td className="p-2.5 font-mono text-red-700 font-bold">154 mg/dL</td>
                      <td className="p-2.5">70 - 99 mg/dL</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">Elevated</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5">04 Sep 2026</td>
                      <td className="p-2.5 font-bold">Postprandial Blood Sugar (PPBS)</td>
                      <td className="p-2.5 font-mono text-red-700 font-bold">210 mg/dL</td>
                      <td className="p-2.5">&lt; 140 mg/dL</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">Elevated</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5">04 Sep 2026</td>
                      <td className="p-2.5 font-bold">HbA1c Glycated Hemoglobin</td>
                      <td className="p-2.5 font-mono text-red-700 font-bold">7.8 %</td>
                      <td className="p-2.5">&lt; 5.7 %</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">Suboptimal</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub-Tab 4: Diagnostics */}
            {profileSubTab === 'diagnostics' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-bold">
                  <span className="text-blue-900">Chest Digital X-Ray (PA View)</span>
                  <span className="text-slate-600">Performed: 10 August 2026</span>
                </div>
                <div><strong>Findings:</strong> Bilateral lung fields clear. Normal cardiac shadow. No active pulmonary parenchymal lesions.</div>
                <div><strong>Impression:</strong> Normal baseline chest radiograph.</div>
              </div>
            )}

            {/* Sub-Tab 5: Previous Prescriptions */}
            {profileSubTab === 'rx' && (
              <div className="divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900">Tab Metformin Hydrochloride IP 500mg</strong>
                    <div className="text-slate-500">1-0-1 (After Food) • 30 Days • Qty: 60</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Dispensed</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900">Tab Telmisartan IP 40mg</strong>
                    <div className="text-slate-500">1-0-0 (Morning) • 30 Days • Qty: 30</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Dispensed</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RESULTS REQUIRING REVIEW (EMERGENCY VS NORMAL) */}
        {/* ========================================================= */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'ta' ? 'மருத்துவர் மறுஆய்வுக்கு வந்துள்ள பரிசோதனை முடிவுகள்' : 'Results Requiring Doctor Review'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'முடிவுகளைப் பரிசீலித்து EMERGENCY அல்லது NORMAL REVISIT வழியைத் தேர்ந்தெடுக்கவும்'
                  : 'Review returned pathology/scan results and choose revisit decision'}
              </p>
            </div>

            {labOrders.filter((o) => o.status === 'result_ready').length > 0 ? (
              <div className="space-y-6">
                {labOrders.filter((o) => o.status === 'result_ready').map((order, idx) => (
                  <div key={order.id || idx} className="p-5 bg-blue-50 border border-blue-200 rounded-lg space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <strong className="text-sm text-blue-950 font-bold">
                          Patient: {order.patientName} (ID: {order.patientId})
                        </strong>
                        <div className="text-slate-600">
                          Test: {order.tests.join(', ')} • Token: {order.patientToken}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-xs self-start sm:self-auto border border-emerald-200">
                        Status: Result Available
                      </span>
                    </div>

                    {/* Lab Values / Findings Grid */}
                    {order.results && order.results.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3.5 rounded border border-slate-200">
                        {order.results.map((r, rIdx) => (
                          <div key={rIdx}>
                            <span className="text-slate-500">{r.testName}:</span>
                            <strong className={`block font-mono text-sm font-bold ${r.isAbnormal ? 'text-red-700' : 'text-slate-900'}`}>
                              {r.value} {r.unit}
                            </strong>
                            <span className="text-[10px] text-slate-400">Ref: {r.referenceRange || 'Standard'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-3.5 rounded border border-slate-200">
                        <span className="text-slate-500 font-bold block mb-1">Laboratory Findings:</span>
                        <p className="text-slate-800 font-mono">
                          {order.results?.[0]?.remarks || 'Test completed by diagnostic technician.'}
                        </p>
                      </div>
                    )}

                    {/* Doctor Clinical Interpretation */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Doctor Clinical Assessment & Review Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={doctorInterpretation}
                        onChange={(e) => setDoctorInterpretation(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded text-xs outline-none focus:border-blue-900"
                      ></textarea>
                    </div>

                    {/* TWO STRICT OPTIONS: EMERGENCY VS NORMAL REVISIT */}
                    <div className="border-t border-blue-200 pt-3 space-y-3">
                      <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        Select Clinical Revisit Decision:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: NORMAL REVISIT (New Queue Entry) */}
                        <div className="p-4 bg-white border-2 border-blue-300 rounded-lg space-y-2 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                              <Users className="w-4 h-4 text-blue-700" />
                              <span>NORMAL REVISIT</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Creates a new queue entry for patient under Dr. Priya Kumar. Generates a new revisit token and recalculates queue waiting time.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              doctorRevisitDecision(order.patientId, 'normal', {
                                doctorRemarks: doctorInterpretation,
                              });
                              setActiveTab('queue');
                            }}
                            className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer mt-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Normal Revisit</span>
                          </button>
                        </div>

                        {/* Option 2: EMERGENCY (Direct Doctor Bypass) */}
                        <div className="p-4 bg-white border-2 border-red-300 rounded-lg space-y-2 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="font-bold text-red-950 flex items-center gap-1.5 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span>EMERGENCY ACCESS</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Patient proceeds directly to doctor without normal queue waiting. Prioritized immediately in the queue.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              doctorRevisitDecision(order.patientId, 'emergency', {
                                doctorRemarks: doctorInterpretation,
                              });
                              setActiveTab('queue');
                            }}
                            className="w-full py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer mt-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Priority Emergency Access (Direct)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                <FlaskConical className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Results Currently Requiring Review</p>
                <p className="text-slate-500 mt-1">
                  When diagnostic laboratory or scan findings are submitted by the technician, they will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SCHEDULED REVISITS (LATE RESULT WORKFLOW) */}
        {/* ========================================================= */}
        {activeTab === 'revisits' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'ta' ? 'திட்டமிடப்பட்ட மறு வருகைகள் (Late Scan/Lab Results)' : 'Scheduled Patient Revisits'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'நீண்ட நேரம் எடுக்கும் பரிசோதனை முடிவுகளுக்குப் பின் திரும்ப வரும் நோயாளிகள்'
                  : 'Patients returning after late test results (Expected result time & return schedule)'}
              </p>
            </div>

            <div className="space-y-3">
              {/* Example Late Result Record */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm">Anitha Kumar</strong>
                    <span className="font-mono text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded">
                      GM-038
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Doctor: <strong>Dr. Priya Kumar (General Medicine)</strong>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Expected Result Time: <strong className="text-slate-800">4:00 PM</strong> | Return to Doctor: <strong className="text-blue-900">4:15 PM</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded text-xs border border-amber-200">
                    Result Processing
                  </span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    View Result
                  </button>
                </div>
              </div>

              {revisits.length > 0 &&
                revisits.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm">{rev.patientName}</strong>
                        <span className="font-mono text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded">
                          {rev.assignedToken}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">Doctor: {rev.doctor} ({rev.department})</div>
                      <div className="text-slate-500 mt-0.5">
                        Scheduled Date & Time: <strong>{rev.date} at {rev.time}</strong>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold rounded text-xs">
                      Revisit Scheduled
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
