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
import { apiClient } from '../../services/api';

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

interface QuickMedicinePreset {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

const DEPARTMENT_PRESETS: Record<string, QuickMedicinePreset[]> = {
  'dept-derma': [
    { name: 'Tab Cetirizine IP', dosage: '10 mg', frequency: '0-0-1 (Night - After Food)', duration: '7 Days', instructions: 'Take 1 tablet at night after food', quantity: 7 },
    { name: 'Calamine Lotion Topical', dosage: '100 ml', frequency: '1-0-1 (Apply Twice Daily)', duration: '14 Days', instructions: 'Shake bottle well and apply gently on skin', quantity: 1 },
    { name: 'Oint Mupirocin IP 2% w/w', dosage: '5 gm', frequency: '1-0-1 (Local Application)', duration: '7 Days', instructions: 'Clean affected area and apply thin layer', quantity: 1 },
    { name: 'Permethrin Cream 5% w/w', dosage: '30 gm', frequency: 'Single Application', duration: '1 Day', instructions: 'Apply neck down, wash off after 8-12 hours', quantity: 1 },
    { name: 'Cap Doxycycline Hyclate', dosage: '100 mg', frequency: '1-0-1 (After Food)', duration: '10 Days', instructions: 'Take after meals with plenty of water', quantity: 20 },
    { name: 'Tab Hydroxyzine Hydrochloride', dosage: '25 mg', frequency: '0-0-1 (Night - After Food)', duration: '5 Days', instructions: 'Bedtime dose for severe pruritus / itching', quantity: 5 },
  ],
  'dept-genmed': [
    { name: 'Tab Paracetamol IP', dosage: '650 mg', frequency: '1-0-1 (After Food)', duration: '3 Days', instructions: 'Take after meals for fever/bodyache', quantity: 6 },
    { name: 'Cap Amoxicillin IP', dosage: '500 mg', frequency: '1-0-1 (After Food)', duration: '5 Days', instructions: 'Complete full 5-day antibiotic course', quantity: 10 },
    { name: 'Tab Pantoprazole Gastro-resistant', dosage: '40 mg', frequency: '1-0-0 (Morning - Before Food)', duration: '10 Days', instructions: 'Take on empty stomach 30 mins before breakfast', quantity: 10 },
    { name: 'Oral Rehydration Salts (ORS) WHO Formula', dosage: '21.8 gm Sachet', frequency: 'As needed', duration: '3 Days', instructions: 'Dissolve 1 packet in 1 litre clean drinking water', quantity: 3 },
    { name: 'Tab Cetirizine IP', dosage: '10 mg', frequency: '0-0-1 (Night - After Food)', duration: '5 Days', instructions: 'Take at night after food', quantity: 5 },
  ],
  'dept-cardio': [
    { name: 'Tab Telmisartan IP', dosage: '40 mg', frequency: '1-0-0 (Morning - After Food)', duration: '30 Days', instructions: 'Take once daily in the morning', quantity: 30 },
    { name: 'Tab Atorvastatin IP', dosage: '20 mg', frequency: '0-0-1 (Night - After Food)', duration: '30 Days', instructions: 'Take at night after dinner', quantity: 30 },
    { name: 'Tab Amlodipine IP', dosage: '5 mg', frequency: '1-0-0 (Morning - After Food)', duration: '30 Days', instructions: 'Morning dose with water', quantity: 30 },
    { name: 'Tab Clopidogrel IP', dosage: '75 mg', frequency: '1-0-0 (After Food)', duration: '30 Days', instructions: 'Take with breakfast daily', quantity: 30 },
  ],
  'dept-ortho': [
    { name: 'Tab Aceclofenac + Paracetamol', dosage: '100mg/325mg', frequency: '1-0-1 (After Food)', duration: '5 Days', instructions: 'Take after meals for joint/muscle pain', quantity: 10 },
    { name: 'Tab Calcium + Vitamin D3', dosage: '500mg/250IU', frequency: '0-1-0 (Afternoon - After Food)', duration: '30 Days', instructions: 'Take after lunch daily', quantity: 30 },
    { name: 'Diclofenac Diethylamine Gel 1.16%', dosage: '30 gm', frequency: '1-0-1 (Local Application)', duration: '7 Days', instructions: 'Gently massage onto painful area', quantity: 1 },
    { name: 'Tab Tramadol + Paracetamol', dosage: '37.5mg/325mg', frequency: '1-0-1 (SOS / Pain)', duration: '3 Days', instructions: 'Take only when severe pain occurs', quantity: 6 },
  ],
};

export const DIAGNOSTIC_IMAGING_CATALOG: Record<
  'x-ray' | 'ultrasound' | 'ct' | 'mri' | 'specialty',
  { label: string; procedures: string[] }
> = {
  'x-ray': {
    label: 'Digital X-Ray',
    procedures: [
      'Chest Digital X-Ray (PA View)',
      'Digital X-Ray KUB (Kidneys, Ureters, Bladder)',
      'Spine X-Ray (Lumbosacral AP & Lateral)',
      'Cervical Spine X-Ray (AP & Lateral)',
      'Extremity X-Ray (Knee Joint AP & Lateral)',
      'Extremity X-Ray (Ankle / Foot AP & Lateral)',
      'Pelvis X-Ray (AP View)',
      'Abdomen Erect X-Ray',
    ],
  },
  'ultrasound': {
    label: 'Ultrasound (USG)',
    procedures: [
      'USG Whole Abdomen & Pelvis',
      'USG KUB (Kidney, Ureter, Bladder)',
      'USG Thyroid & Soft Tissue Neck',
      'USG Scrotal Doppler',
      'USG Obstetric & Fetal Well-being',
      'USG Venous / Arterial Doppler (Lower Limb)',
      'USG Musculoskeletal & Soft Tissue',
    ],
  },
  'ct': {
    label: 'CT Scan',
    procedures: [
      'CT Brain Plain (Non-Contrast)',
      'HRCT Chest (High-Resolution Chest CT)',
      'CECT Abdomen & Pelvis (Contrast Enhanced)',
      'CT Cervical / Lumbar Spine',
      'CT Angiography (Coronary / Cerebral / Peripheral)',
    ],
  },
  'mri': {
    label: 'MRI Scan',
    procedures: [
      'MRI Brain Plain & Contrast',
      'MRI Lumbar Spine (LS Spine)',
      'MRI Cervical Spine',
      'MRI Knee Joint',
      'MRI Shoulder Joint',
    ],
  },
  'specialty': {
    label: 'Specialty / Dermatology Diagnostic',
    procedures: [
      'Dermoscopy Skin Lesion Assessment',
      'Skin Punch Biopsy (4mm Diagnostic)',
      'Wood’s Lamp Fluorescence Examination',
      'Skin Scraping KOH Mount for Fungal/Mites',
    ],
  },
};

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
    currentUser,
    lang,
    refreshDoctorQueue,
    refreshLabOrders,
  } = useQueueFlow();

  // Dynamic doctor identity from authenticated user
  const doctorId = currentUser?.id || 'usr-doc-1';
  const doctorName = currentUser?.fullName || 'Doctor';
  const doctorDeptId = currentUser?.departmentId || 'dept-genmed';
  const doctorDeptName = doctorDeptId === 'dept-cardio'
    ? 'Cardiology'
    : doctorDeptId === 'dept-ortho'
    ? 'Orthopedics'
    : doctorDeptId === 'dept-derma'
    ? 'Dermatology'
    : 'General Medicine';

  // Real database fetch on mount & when doctorId or department changes
  React.useEffect(() => {
    refreshDoctorQueue(doctorDeptId, doctorId);
    refreshLabOrders();
  }, [doctorId, doctorDeptId, refreshDoctorQueue, refreshLabOrders]);

  // OPD patients strictly belonging to this doctor and department
  const opdPatients = patients.filter((p) => {
    const matchesDept = !p.departmentId || p.departmentId === doctorDeptId;
    const matchesDoctor = !p.doctorId || p.doctorId === doctorId;
    const matchesStage = !p.currentStage || p.currentStage === 'doctor' || p.currentStage === 'registration';
    return matchesDept && matchesDoctor && matchesStage;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    opdPatients[0]?.id || ''
  );

  React.useEffect(() => {
    if ((!selectedPatientId || !opdPatients.some((p) => p.id === selectedPatientId)) && opdPatients.length > 0) {
      setSelectedPatientId(opdPatients[0].id);
    }
  }, [opdPatients, selectedPatientId]);

  const [activeTab, setActiveTab] = useState<'consultation' | 'queue' | 'profile' | 'reviews' | 'revisits'>('consultation');
  const [profileSubTab, setProfileSubTab] = useState<'overview' | 'history' | 'visits' | 'labs' | 'diagnostics' | 'rx'>('overview');

  const currentPat =
    opdPatients.find((p) => p.id === selectedPatientId) ||
    opdPatients[0] ||
    null;

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState(
    currentPat?.symptoms || 'Routine medical evaluation'
  );
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState('72');
  const [temp, setTemp] = useState('98.4');
  const [weight, setWeight] = useState('65');
  const [doctorDiagnosis, setDoctorDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Real patient records fetched by patient ID from database
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [patientReports, setPatientReports] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingConsultation, setSubmittingConsultation] = useState(false);
  const [consultationSuccessNotice, setConsultationSuccessNotice] = useState('');

  // Review & Revisits specific to this doctor (or doctor's OPD patients)
  const doctorLabOrders = labOrders.filter(
    (o) => !o.doctorId || o.doctorId === doctorId || doctorId === 'usr-doc-1' || opdPatients.some((p) => p.id === o.patientId)
  );
  const doctorRevisits = revisits.filter((r) => !r.doctorId || (r as any).doctorId === doctorId || doctorId === 'usr-doc-1' || opdPatients.some((p) => p.id === r.patientId));

  // Consolidated review groups: groups all returned lab & scan results by patient to avoid duplicate review cards
  const groupedReviewPatients = React.useMemo(() => {
    const readyOrders = doctorLabOrders.filter((o) => o.status === 'result_ready');
    const map = new Map<
      string,
      {
        patientId: string;
        patientName: string;
        patientToken: string;
        orders: typeof doctorLabOrders;
        allTests: string[];
        allResults: any[];
      }
    >();

    for (const ord of readyOrders) {
      const existing = map.get(ord.patientId);
      if (existing) {
        existing.orders.push(ord);
        existing.allTests.push(...ord.tests);
        if (ord.results) existing.allResults.push(...ord.results);
      } else {
        map.set(ord.patientId, {
          patientId: ord.patientId,
          patientName: ord.patientName,
          patientToken: ord.patientToken,
          orders: [ord],
          allTests: [...ord.tests],
          allResults: ord.results ? [...ord.results] : [],
        });
      }
    }
    return Array.from(map.values());
  }, [doctorLabOrders]);

  React.useEffect(() => {
    let mounted = true;
    if (!currentPat?.id) {
      setPatientHistory([]);
      setPatientReports([]);
      setPatientPrescriptions([]);
      return;
    }

    async function loadPatientClinicalRecords() {
      try {
        setLoadingHistory(true);
        const [histRes, repRes, rxRes] = await Promise.all([
          apiClient.getPatientHistory(currentPat.id).catch(() => ({ success: false, data: [] })),
          apiClient.getPatientReports(currentPat.id).catch(() => ({ success: false, data: [] })),
          apiClient.getPatientPrescriptions(currentPat.id).catch(() => ({ success: false, data: [] })),
        ]);
        if (mounted) {
          setPatientHistory(histRes?.success && Array.isArray(histRes.data) ? histRes.data : []);
          setPatientReports(repRes?.success && Array.isArray(repRes.data) ? repRes.data : []);
          setPatientPrescriptions(rxRes?.success && Array.isArray(rxRes.data) ? rxRes.data : []);
        }
      } catch (e) {
        console.error('Error fetching patient records:', e);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    }
    loadPatientClinicalRecords();
    return () => {
      mounted = false;
    };
  }, [currentPat?.id]);

  React.useEffect(() => {
    if (activePatient?.id && activePatient.id !== selectedPatientId) {
      if (opdPatients.some((p) => p.id === activePatient.id)) {
        setSelectedPatientId(activePatient.id);
      }
    }
  }, [activePatient?.id, opdPatients]);

  React.useEffect(() => {
    if (currentPat) {
      setChiefComplaint(currentPat.symptoms || currentPat.chiefComplaint || 'Routine medical evaluation');
      setDoctorDiagnosis('');
      setClinicalNotes('');
      setPrescriptions([]);
    }
    if (currentPat?.vitals) {
      if (currentPat.vitals.bp) setBp(currentPat.vitals.bp);
      if (currentPat.vitals.pulse) setPulse(currentPat.vitals.pulse);
      if (currentPat.vitals.temp) setTemp(currentPat.vitals.temp);
      if (currentPat.vitals.weight) setWeight(currentPat.vitals.weight);
    }
  }, [currentPat?.id]);

  // Prescriptions List (empty by default for newly attending patient)
  const [prescriptions, setPrescriptions] = useState<MedicationItem[]>([]);

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

  const handleAddPresetMedicine = (preset: QuickMedicinePreset) => {
    const item: MedicationItem = {
      id: `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: preset.name,
      dosage: preset.dosage,
      frequency: preset.frequency,
      duration: preset.duration,
      instructions: preset.instructions,
      quantity: preset.quantity,
    };
    setPrescriptions((prev) => [...prev, item]);
  };

  const handleRemoveMedicine = (id: string) => {
    setPrescriptions(prescriptions.filter((m) => m.id !== id));
  };

  // Diagnostic Investigations & Scans (empty by default unless ordered by doctor)
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [labPriority, setLabPriority] = useState<'routine' | 'urgent'>('routine');
  const [labSchedule, setLabSchedule] = useState<'today' | 'next_day'>('today');

  const [requestDiagnostic, setRequestDiagnostic] = useState(false);
  const [diagnosticModality, setDiagnosticModality] = useState<'x-ray' | 'ultrasound' | 'ct' | 'mri' | 'specialty'>('x-ray');
  const [diagnosticTestName, setDiagnosticTestName] = useState('Chest Digital X-Ray (PA View)');

  const handleModalityChange = (mod: 'x-ray' | 'ultrasound' | 'ct' | 'mri' | 'specialty') => {
    setDiagnosticModality(mod);
    const defaultProc = DIAGNOSTIC_IMAGING_CATALOG[mod]?.procedures[0] || '';
    setDiagnosticTestName(defaultProc);
  };

  // Review & Revisit Tab State
  const [selectedReviewPatientId, setSelectedReviewPatientId] = useState('');
  const [doctorInterpretation, setDoctorInterpretation] = useState('');

  const handleStartConsultation = (pId: string) => {
    setSelectedPatientId(pId);
    setActivePatientId(pId);
    startConsultation(pId);
    setActiveTab('consultation');
  };

  const handleSubmitConsultation = async () => {
    const patientToSubmit = currentPat?.id || selectedPatientId;
    if (!patientToSubmit) return;

    setSubmittingConsultation(true);
    setConsultationSuccessNotice('');

    // Auto-include medicine if doctor typed into the input field without clicking "+ Add Medicine"
    let finalPrescriptions = [...prescriptions];
    if (newMed.name.trim()) {
      const timings: string[] = [];
      if (newMed.morning) timings.push('Morning');
      if (newMed.afternoon) timings.push('Afternoon');
      if (newMed.night) timings.push('Night');
      const timingStr = timings.length > 0 ? timings.join(', ') : 'Once daily';

      let foodStr = 'After Food';
      if (newMed.foodTiming === 'before_food') foodStr = 'Before Food';
      if (newMed.foodTiming === 'with_food') foodStr = 'With Food';

      const freqSummary = `${newMed.morning ? '1' : '0'}-${newMed.afternoon ? '1' : '0'}-${newMed.night ? '1' : '0'} (${timingStr} - ${foodStr})`;

      const autoItem: MedicationItem = {
        id: `med-${Date.now()}`,
        name: newMed.name.trim(),
        dosage: newMed.dosage || '500 mg',
        frequency: freqSummary,
        duration: newMed.durationDays.includes('Day') ? newMed.durationDays : `${newMed.durationDays} Days`,
        instructions: newMed.instructions ? `${newMed.instructions} (${foodStr})` : foodStr,
        quantity: parseInt(newMed.quantity) || 10,
      };

      finalPrescriptions.push(autoItem);
      setPrescriptions(finalPrescriptions);
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
    }

    // Unified routing: auto-detect prescriptions, lab tests, and scans
    const hasLabs = selectedLabTests.length > 0;
    const hasDiag = requestDiagnostic && Boolean(diagnosticTestName);
    const hasMeds = finalPrescriptions.length > 0;

    const notes: DoctorNotes = {
      chiefComplaint,
      vitals: { bp, pulse, temp, weight },
      provisionalDiagnosis: doctorDiagnosis || 'Clinical OPD Assessment',
      diagnosis: doctorDiagnosis || 'Clinical OPD Assessment',
      clinicalNotes,
      medications: hasMeds ? finalPrescriptions : [],
      investigations: [
        ...(hasLabs ? selectedLabTests : []),
        ...(hasDiag ? [diagnosticTestName] : []),
      ],
      followUpDays: 14,
    };

    try {
      await submitDoctorConsultation(patientToSubmit, notes, {
        labTests: hasLabs ? selectedLabTests : undefined,
        labPriority,
        labSchedule,
        diagnosticModality: hasDiag ? diagnosticModality : undefined,
        diagnosticTestName: hasDiag ? diagnosticTestName : undefined,
        diagnosticPriority: 'routine',
        prescriptions: hasMeds ? finalPrescriptions : undefined,
      });

      setConsultationSuccessNotice(
        hasMeds && (hasLabs || hasDiag)
          ? `✓ Consultation completed! Prescriptions transmitted to Pharmacy (${finalPrescriptions.length} items) and investigations routed to Diagnostic Lab.`
          : hasMeds
          ? `✓ Prescriptions transmitted to Central Pharmacy (${finalPrescriptions.length} items). Patient routed to Pharmacy.`
          : (hasLabs || hasDiag)
          ? `✓ Diagnostic investigations ordered. Patient routed to Diagnostic Station.`
          : '✓ Consultation completed and clinical records saved.'
      );

      // Advance to next patient if available
      const remaining = opdPatients.filter((p) => p.id !== patientToSubmit);
      if (remaining.length > 0) {
        setSelectedPatientId(remaining[0].id);
      }
    } catch (err: any) {
      console.error('Error submitting consultation:', err);
    } finally {
      setSubmittingConsultation(false);
    }
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
                <h1 className="text-xl font-bold font-serif text-white">{doctorName}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40">
                  {lang === 'ta' ? doctorDeptName : doctorDeptName}
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
              onClick={() => callNextOPDPatient(doctorDeptId, doctorId)}
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
            ...(groupedReviewPatients.length > 0
              ? [{
                  id: 'reviews',
                  label: lang === 'ta'
                    ? `பரிசீலனை முடிவுகள் (${groupedReviewPatients.length})`
                    : `Results Requiring Review (${groupedReviewPatients.length})`,
                  icon: <FlaskConical className="w-3.5 h-3.5" />,
                }]
              : []),
            ...(doctorRevisits.length > 0
              ? [{
                  id: 'revisits',
                  label: lang === 'ta' ? `மறு வருகைகள் (${doctorRevisits.length})` : `Scheduled Revisits (${doctorRevisits.length})`,
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
        {groupedReviewPatients.length > 0 && activeTab !== 'reviews' && (
          <div className="bg-amber-50 border-2 border-amber-400 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs mb-6">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-950 uppercase tracking-wider">
                  {lang === 'ta' ? 'பரிசோதனை முடிவு வந்துள்ளது:' : 'RESULT AVAILABLE FOR REVIEW:'}
                </span>{' '}
                <span className="text-slate-800 font-medium">
                  {groupedReviewPatients[0]?.patientName} ({groupedReviewPatients[0]?.patientToken}) — {groupedReviewPatients[0]?.allTests.join(', ')} Ready
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
              {currentPat ? (
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
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{lang === 'ta' ? 'முழு மருத்துவ வரலாற்றைக் காண்க' : 'View Full Clinical Record'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center space-y-2">
                  <User className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">
                    {lang === 'ta' ? 'நோயாளி எதுவும் வரிசையில் இல்லை' : 'No Patient in Consultation'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'ta' ? 'அடுத்த நோயாளியை அழைக்கவும் அல்லது புதிய நோயாளி டோக்கனை எதிர்பார்க்கவும்.' : 'Click "Call Next Patient" above or wait for incoming patient tokens.'}
                  </p>
                </div>
              )}

              {/* Next Waiting Patients in Doctor's Queue */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
                  <span>{lang === 'ta' ? 'அடுத்த நோயாளிகள்' : "Today's Queue List"}</span>
                  <span className="text-blue-900 font-mono font-bold">{opdPatients.length} Waiting</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {opdPatients.length > 0 ? (
                    opdPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleStartConsultation(p.id)}
                        className={`py-2.5 px-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                          p.id === currentPat?.id
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
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      {lang === 'ta' ? 'தற்போது காத்திருப்போர் இல்லை' : 'Zero patients currently waiting in this queue.'}
                    </div>
                  )}
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

              {/* EMERGENCY CONSULTATION IN PROGRESS BANNER */}
              {currentPat?.priority === 'emergency' && (
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-red-950 uppercase tracking-wider text-[11px] bg-red-200 px-2 py-0.5 rounded">
                        🚨 EMERGENCY CONSULTATION IN PROGRESS
                      </span>
                      <span className="text-xs font-mono font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                        Token: {currentPat.token}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-red-950 mt-1">
                      Priority Revisit Consultation for {currentPat.name} (Age: {currentPat.age})
                    </h3>
                    <p className="text-xs text-red-800 mt-0.5">
                      Doctor prioritized this patient immediately from diagnostic review. Prescribe medications below to transmit to Pharmacy.
                    </p>
                  </div>
                </div>
              )}

              {/* COMPLETED INVESTIGATION RESULTS REVIEW BANNER */}
              {(() => {
                const patLabOrders = labOrders.filter((o) => o.patientId === currentPat?.id);
                const completedPatOrders = patLabOrders.filter(
                  (o) => o.status === 'result_ready' || o.status === 'reviewed' || (o.results && o.results.length > 0)
                );
                if (completedPatOrders.length === 0) return null;
                return (
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-emerald-700" />
                        <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-xs">
                          {lang === 'ta'
                            ? 'பரிசோதனை முடிவுகள் வந்துள்ளன (மதிப்பாய்வு செய்து மருந்துகள் வழங்கவும்)'
                            : 'COMPLETED INVESTIGATION RESULTS (DOCTOR REVIEW)'}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[11px]">
                        {completedPatOrders.length} Test Result(s) Ready
                      </span>
                    </div>

                    <div className="space-y-2">
                      {completedPatOrders.map((ord, idx) => (
                        <div key={ord.id || idx} className="bg-white p-3 rounded-lg border border-emerald-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                              <span>{ord.tests?.join(', ')}</span>
                            </strong>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              Verified ✓
                            </span>
                          </div>

                          {ord.results && ord.results.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                              {ord.results.map((r, rIdx) => (
                                <div key={rIdx} className="bg-slate-50 p-2 rounded border border-slate-100">
                                  <span className="text-slate-500 text-[10px] block">{r.testName}:</span>
                                  <span
                                    className={`font-mono font-bold text-xs ${
                                      r.isAbnormal ? 'text-red-700' : 'text-slate-900'
                                    }`}
                                  >
                                    {r.value} {r.unit}
                                  </span>
                                  {r.referenceRange && (
                                    <span className="text-[9px] text-slate-400 block truncate">Ref: {r.referenceRange}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-700 font-mono text-[11px] bg-slate-50 p-2 rounded">
                              {ord.results?.[0]?.remarks || 'Investigation processed by diagnostic technician.'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

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

              {/* Clinical Orders Section (Prescriptions & Diagnostics) */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-blue-950">
                    {lang === 'ta' ? 'சிகிச்சை & பரிசோதனை உத்தரவுகள்' : 'Treatment & Clinical Orders'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ta'
                      ? 'மருந்துகள் அல்லது ஆய்வக/ஸ்கேன் பரிசோதனைகளை நேரடியாகச் சேர்க்கலாம். தானாகவே உரிய பிரிவுக்கு செல்லும்.'
                      : 'Prescribe medications and/or order diagnostic scans & tests. Orders transmit automatically to Pharmacy & Lab upon submission.'}
                  </p>
                </div>

                {/* PRESCRIPTION BUILDER (CENTRAL PHARMACY) */}
                <div className="p-4 bg-purple-50/60 border border-purple-300 rounded-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-purple-700" />
                        <span>{lang === 'ta' ? 'மருந்துகள் பரிந்துரை (பார்மசி)' : 'PRESCRIPTION / MEDICATIONS (Pharmacy Order)'}</span>
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

                    {/* Quick Suggested Presets for Department */}
                    <div className="bg-purple-50/80 p-3.5 rounded-lg border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-purple-700" />
                          <span>Suggested Fast Prescriptions ({doctorDeptName})</span>
                        </span>
                        <span className="text-[10px] text-purple-700 font-semibold bg-purple-200/60 px-2 py-0.5 rounded">1-Click Fast Add</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(DEPARTMENT_PRESETS[doctorDeptId] || DEPARTMENT_PRESETS['dept-genmed']).map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleAddPresetMedicine(preset)}
                            className="px-2.5 py-1.5 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                          >
                            <Plus className="w-3 h-3 text-purple-600 group-hover:scale-125 transition-transform" />
                            <span>{preset.name}</span>
                            <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1 py-0.5 rounded">{preset.dosage}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add Medicine Sub-Form (Strict Specifications) */}
                    <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-purple-950 uppercase tracking-wider">
                          Custom Medicine Entry
                        </div>
                        <span className="text-[11px] text-slate-500 italic">
                          (Click "+ Add Medicine" or directly submit — typed medicines are auto-included)
                        </span>
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

                {/* DIAGNOSTIC INVESTIGATIONS & SCANS */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-emerald-700" />
                      <span>DIAGNOSTIC INVESTIGATIONS & SCANS</span>
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

                  {/* Radiology / Scan Selection with full modalities & procedures */}
                  <div className="pt-2 border-t border-emerald-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
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
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-900 font-bold">Modality:</span>
                          <select
                            value={diagnosticModality}
                            onChange={(e) => handleModalityChange(e.target.value as any)}
                            className="px-2.5 py-1 bg-white border border-emerald-300 rounded text-xs font-semibold text-emerald-950"
                          >
                            <option value="x-ray">Digital X-Ray</option>
                            <option value="ultrasound">Ultrasound (USG)</option>
                            <option value="ct">CT Scan</option>
                            <option value="mri">MRI Scan</option>
                            <option value="specialty">Specialty / Dermatology Diagnostic</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {requestDiagnostic && (
                      <div className="space-y-3 mt-2 bg-white p-3.5 rounded-lg border border-emerald-200">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                            Select Scan / Procedure ({DIAGNOSTIC_IMAGING_CATALOG[diagnosticModality]?.label}):
                          </label>
                          <select
                            value={diagnosticTestName}
                            onChange={(e) => setDiagnosticTestName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded text-xs font-medium text-slate-900"
                          >
                            {(DIAGNOSTIC_IMAGING_CATALOG[diagnosticModality]?.procedures || []).map((proc) => (
                              <option key={proc} value={proc}>{proc}</option>
                            ))}
                          </select>
                        </div>

                        {/* Quick Chips for fast 1-click selection */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Available Procedures (1-Click Select):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(DIAGNOSTIC_IMAGING_CATALOG[diagnosticModality]?.procedures || []).map((proc) => (
                              <button
                                key={proc}
                                type="button"
                                onClick={() => setDiagnosticTestName(proc)}
                                className={`px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                  diagnosticTestName === proc
                                    ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-2xs'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {proc}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Custom Scan Procedure / Specific Clinical View:
                          </label>
                          <input
                            type="text"
                            value={diagnosticTestName}
                            onChange={(e) => setDiagnosticTestName(e.target.value)}
                            placeholder="e.g. Chest Digital X-Ray (PA View)"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
                  {consultationSuccessNotice ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{consultationSuccessNotice}</span>
                    </div>
                  ) : <div />}

                  <button
                    onClick={handleSubmitConsultation}
                    disabled={submittingConsultation}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs rounded-md shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {submittingConsultation ? (
                      <span>{lang === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Transmitting to Pharmacy...'}</span>
                    ) : (
                      <>
                        <span>{lang === 'ta' ? 'ஆலோசனையை சேமித்து உத்தரவுகளை அனுப்பவும்' : 'Submit Consultation & Transmit Orders'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
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
                  {doctorName} • {doctorDeptName} OPD Queue
                </p>
              </div>

              <button
                onClick={() => callNextOPDPatient(doctorDeptId, doctorId)}
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
                  {nowServingPatient ? nowServingPatient.token : 'None'}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1">
                  {nowServingPatient ? `Patient: ${nowServingPatient.name} (ID: ${nowServingPatient.id})` : 'Waiting for next patient to be called'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 font-bold rounded text-xs border ${nowServingPatient ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {nowServingPatient ? 'Status: In Consultation' : 'Status: Ready for Consultation'}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
                              {p.status}
                            </span>
                            {p.priority === 'emergency' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 uppercase border border-red-200">
                                EMERGENCY
                              </span>
                            )}
                            {p.stagesHistory?.some((s) => s.stage === 'doctor_review') && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase border border-blue-200">
                                REVISIT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleStartConsultation(p.id)}
                            className={`px-3 py-1 text-white rounded text-xs font-bold cursor-pointer transition-all ${
                              p.status === 'in_consultation' || p.priority === 'emergency'
                                ? 'bg-red-700 hover:bg-red-600'
                                : 'bg-blue-900 hover:bg-blue-800'
                            }`}
                          >
                            {p.status === 'in_consultation' ? 'Resume Exam' : p.priority === 'emergency' ? 'Consult Now (Emergency)' : 'Start Exam'}
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
            {currentPat ? (
              <>
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
                    { id: 'history', label: `Previous Consultations (${patientHistory.length})` },
                    { id: 'labs', label: `Previous Lab Reports (${patientReports.filter((r) => r.serviceType === 'lab' || !r.serviceType).length})` },
                    { id: 'diagnostics', label: `Previous Scan Reports (${patientReports.filter((r) => r.serviceType === 'radiology' || r.serviceType === 'scan').length})` },
                    { id: 'rx', label: `Previous Prescriptions (${patientPrescriptions.length})` },
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
                      <strong className="block text-amber-700 font-bold">{currentPat.allergies?.join(', ') || 'None'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Chronic Conditions:</span>
                      <strong className="block text-slate-900 font-bold">{currentPat.existingConditions?.join(', ') || currentPat.chronicConditions?.join(', ') || 'None'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Mobile Phone:</span>
                      <strong className="block text-slate-900 font-bold">{currentPat.phone}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Address:</span>
                      <strong className="block text-slate-900 font-bold">{currentPat.address || 'District Hospital Catchment, Tamil Nadu'}</strong>
                    </div>
                  </div>
                )}

            {/* Sub-Tab 2: Previous Consultations */}
            {profileSubTab === 'history' && (
              <div className="space-y-3 text-xs">
                {loadingHistory ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <p className="font-bold">Loading patient clinical history...</p>
                  </div>
                ) : patientHistory.length > 0 ? (
                  patientHistory.map((c: any) => (
                    <div key={c.id || c.consultationId} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-bold">
                        <span className="text-blue-900">
                          {c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : 'Past Visit')} • {c.departmentName || 'OPD'}
                        </span>
                        <span className="text-slate-600">Consultant: {c.doctorName || doctorName}</span>
                      </div>
                      <div><strong>Chief Complaint:</strong> {c.chiefComplaint || 'Routine medical evaluation'}</div>
                      <div><strong>Diagnosis:</strong> {c.diagnosis || c.provisionalDiagnosis || 'Clinical consultation completed'}</div>
                      {c.prescriptions && c.prescriptions.length > 0 && (
                        <div>
                          <strong>Prescription:</strong>{' '}
                          {c.prescriptions.map((p: any) => `${p.name} (${p.dosage || ''} ${p.frequency || ''})`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No Past Consultations on File</p>
                    <p className="text-slate-400 mt-1">
                      {lang === 'ta'
                        ? 'புதிய நோயாளி — முந்தைய ஆலோசனை பதிவுகள் எதுவும் இல்லை.'
                        : 'New patient registration — Zero prior consultations on file.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Lab Results */}
            {profileSubTab === 'labs' && (
              <div className="text-xs">
                {loadingHistory ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <p className="font-bold">Loading lab reports...</p>
                  </div>
                ) : patientReports.filter((r) => r.serviceType === 'lab' || !r.serviceType).length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Investigation</th>
                          <th className="p-2.5">Findings / Result</th>
                          <th className="p-2.5">Consultant</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientReports
                          .filter((r) => r.serviceType === 'lab' || !r.serviceType)
                          .map((rep) => (
                            <tr key={rep.id}>
                              <td className="p-2.5">{rep.orderedAt ? new Date(rep.orderedAt).toLocaleDateString('en-GB') : 'Today'}</td>
                              <td className="p-2.5 font-bold">{rep.testName}</td>
                              <td className="p-2.5 font-mono text-slate-800">{rep.findingsSummary || rep.resultDetails || 'Processing'}</td>
                              <td className="p-2.5 text-slate-600">{rep.doctorName || doctorName}</td>
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${rep.status === 'result_ready' || rep.status === 'completed' || rep.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {rep.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No Previous Lab Reports on File</p>
                    <p className="text-slate-400 mt-1">
                      {lang === 'ta'
                        ? 'இந்த நோயாளிக்கு முந்தைய ஆய்வக அறிக்கைகள் எதுவும் இல்லை.'
                        : 'No pathology or laboratory test reports on file for this patient ID.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 4: Diagnostics */}
            {profileSubTab === 'diagnostics' && (
              <div className="text-xs">
                {loadingHistory ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <p className="font-bold">Loading scan reports...</p>
                  </div>
                ) : patientReports.filter((r) => r.serviceType === 'radiology' || r.serviceType === 'scan').length > 0 ? (
                  <div className="space-y-3">
                    {patientReports
                      .filter((r) => r.serviceType === 'radiology' || r.serviceType === 'scan')
                      .map((scan) => (
                        <div key={scan.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-bold">
                            <span className="text-blue-900">{scan.testName}</span>
                            <span className="text-slate-600">Ordered by: {scan.doctorName || doctorName}</span>
                          </div>
                          <div><strong>Findings:</strong> {scan.findingsSummary || 'Imaging processed without acute anomalies.'}</div>
                          <div>
                            <strong>Status:</strong>{' '}
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">{scan.status}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No Previous Scan Reports on File</p>
                    <p className="text-slate-400 mt-1">
                      {lang === 'ta'
                        ? 'இந்த நோயாளிக்கு ஸ்கேன் அல்லது எக்ஸ்ரே அறிக்கைகள் எதுவும் இல்லை.'
                        : 'No diagnostic imaging or scan reports on file for this patient ID.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 5: Previous Prescriptions */}
            {profileSubTab === 'rx' && (
              <div className="text-xs">
                {loadingHistory ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <p className="font-bold">Loading prescriptions...</p>
                  </div>
                ) : patientPrescriptions.length > 0 ? (
                  <div className="divide-y divide-slate-200 text-xs">
                    {patientPrescriptions.flatMap((po: any) =>
                      (po.items || []).map((item: any, idx: number) => (
                        <div key={`${po.id}-${idx}`} className="py-2.5 flex justify-between items-center">
                          <div>
                            <strong className="text-slate-900">{item.name} {item.dosage || ''}</strong>
                            <div className="text-slate-500">
                              {item.frequency || 'Daily'} • {item.duration || ''} • Qty: {item.quantity || ''}
                            </div>
                            <div className="text-[10px] text-slate-400">Prescribed by {po.doctorName || doctorName}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {po.status === 'dispensed' ? 'Dispensed' : 'Active Rx'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                    <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No Previous Prescriptions on File</p>
                    <p className="text-slate-400 mt-1">
                      {lang === 'ta'
                        ? 'முந்தைய மருந்துச் சீட்டுகள் எதுவும் இல்லை.'
                        : 'Zero prior prescription records on file for this patient.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">
              {lang === 'ta' ? 'நோயாளி எதுவும் தேர்ந்தெடுக்கப்படவில்லை' : 'No Patient Selected'}
            </p>
            <p className="text-slate-400 mt-1">
              {lang === 'ta'
                ? 'மருத்துவ வரலாற்றைப் பார்க்க வரிசையிலிருந்து ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்.'
                : 'Select an attending patient from the queue to review their complete clinical history.'}
            </p>
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

            {groupedReviewPatients.length > 0 ? (
              <div className="space-y-6">
                {groupedReviewPatients.map((group, idx) => (
                  <div key={group.patientId || idx} className="p-5 bg-blue-50 border border-blue-200 rounded-lg space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <strong className="text-sm text-blue-950 font-bold">
                          Patient: {group.patientName} (ID: {group.patientId})
                        </strong>
                        <div className="text-slate-600">
                          Investigations: <span className="font-semibold text-slate-900">{group.allTests.join(', ')}</span> • Token: <span className="font-mono font-bold text-blue-900">{group.patientToken}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-xs self-start sm:self-auto border border-emerald-200">
                        {group.orders.length} Investigation(s) Ready
                      </span>
                    </div>

                    {/* Consolidated Lab & Scan Values / Findings Grid */}
                    {group.allResults && group.allResults.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Consolidated Laboratory & Scan Findings:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-white p-3.5 rounded border border-slate-200">
                          {group.allResults.map((r, rIdx) => (
                            <div key={rIdx} className="p-2.5 bg-slate-50 rounded border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[11px]">{r.testName}:</span>
                              <strong className={`block font-mono text-sm font-bold ${r.isAbnormal ? 'text-red-700' : 'text-slate-900'}`}>
                                {r.value || 'Report Ready'} {r.unit || ''}
                              </strong>
                              {r.remarks && (
                                <span className="text-[10px] text-slate-600 block italic mt-0.5">{r.remarks}</span>
                              )}
                              {r.referenceRange && (
                                <span className="text-[10px] text-slate-400 block">Ref: {r.referenceRange}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-3.5 rounded border border-slate-200">
                        <span className="text-slate-500 font-bold block mb-1">Diagnostic Findings:</span>
                        <p className="text-slate-800 font-mono">
                          {group.orders[0]?.results?.[0]?.remarks || 'Diagnostic investigations verified by diagnostic workstation.'}
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
                              Creates a new queue entry for patient under {doctorName}. Generates a new revisit token and recalculates queue waiting time.
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              await doctorRevisitDecision(group.patientId, 'normal', {
                                doctorRemarks: doctorInterpretation,
                                doctorId,
                              });
                              await refreshDoctorQueue(doctorDeptId, doctorId);
                              await refreshLabOrders();
                              setActiveTab('queue');
                            }}
                            className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer mt-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to OPD Queue (Normal Revisit)</span>
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
                              Patient proceeds directly to doctor without normal queue waiting. Begins active consultation immediately.
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              await doctorRevisitDecision(group.patientId, 'emergency', {
                                doctorRemarks: doctorInterpretation,
                                doctorId,
                              });
                              setSelectedPatientId(group.patientId);
                              setActivePatientId(group.patientId);
                              startConsultation(group.patientId);
                              setClinicalNotes(`[Diagnostic Findings Reviewed - EMERGENCY]: ${doctorInterpretation}`);
                              await refreshDoctorQueue(doctorDeptId, doctorId);
                              await refreshLabOrders();
                              setActiveTab('consultation');
                            }}
                            className="w-full py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer mt-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Consult Patient Now (Emergency Access)</span>
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
              {doctorRevisits.length > 0 ? (
                doctorRevisits.map((rev) => (
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
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No Scheduled Revisits</p>
                  <p className="text-slate-400 mt-1">Patients returning with delayed diagnostic results will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
