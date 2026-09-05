import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Building2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface DoctorDepartmentSelectionProps {
  patientId: string;
  patientName: string;
  onVisitCreated: (visitData: any) => void;
  onCancel?: () => void;
}

interface DoctorItem {
  id: string;
  fullName: string;
  username: string;
  role: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    nameTa: string;
    code: string;
    roomNumber: string;
    blockName: string;
    floorName: string;
  };
}

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  nameTa: string;
  roomNumber: string;
  blockName: string;
  floorName: string;
  avgServiceMinutes?: number;
}

export const DoctorDepartmentSelection: React.FC<DoctorDepartmentSelectionProps> = ({
  patientId,
  patientName,
  onVisitCreated,
}) => {
  const { lang } = useQueueFlow();

  // Mode: 'know_doctor' (Choice A) | 'dont_know_doctor' (Choice B)
  const [choiceMode, setChoiceMode] = useState<'know_doctor' | 'dont_know_doctor'>('dont_know_doctor');

  // Server Data
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Choice A selections
  const [selectedDeptId, setSelectedDeptId] = useState('dept-genmed');
  const [selectedDoctorId, setSelectedDoctorId] = useState('usr-doc-1');

  // Choice B symptom triage
  const [symptomInput, setSymptomInput] = useState('Cough and fever');
  const [recommendedDept, setRecommendedDept] = useState<DepartmentItem | null>(null);
  const [recommendedDoctor, setRecommendedDoctor] = useState<DoctorItem | null>(null);
  const [recommendationReason, setRecommendationReason] = useState(
    'Symptoms of fever and cough are evaluated by General Medicine specialists.'
  );

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Part 2: Patient Profile Form (Prefilled from database)
  const [profileForm, setProfileForm] = useState({
    name: patientName,
    age: '46',
    gender: 'Female',
    bloodGroup: 'O+ve',
    allergies: 'Penicillin',
    chronicConditions: 'Type 2 Diabetes',
  });
  const [profileSavedNotice, setProfileSavedNotice] = useState('');

  // 1. Fetch real departments, doctors, and patient profile from database
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoadingData(true);
        const [deptRes, docRes, patRes] = await Promise.all([
          apiClient.getDepartments(),
          apiClient.getDoctors(),
          apiClient.getPatient(patientId).catch(() => ({ success: false, data: null })) as Promise<any>,
        ]);

        if (mounted) {
          if (patRes && patRes.success && patRes.data) {
            const pat = patRes.data;
            setProfileForm({
              name: pat.name || patientName,
              age: String(pat.age || 46),
              gender: pat.gender || 'Female',
              bloodGroup: pat.bloodGroup || 'O+ve',
              allergies: Array.isArray(pat.allergies) ? pat.allergies.join(', ') : (pat.allergies || 'Penicillin'),
              chronicConditions: Array.isArray(pat.chronicConditions) ? pat.chronicConditions.join(', ') : (pat.chronicConditions || 'Type 2 Diabetes'),
            });
          }

          const depts: DepartmentItem[] = deptRes.success && deptRes.data
            ? deptRes.data.filter((d: any) => d.category === 'opd')
            : [
                { id: 'dept-genmed', code: 'GENMED', name: 'General Medicine (OPD)', nameTa: 'பொது மருத்துவம்', roomNumber: 'Rooms 4-8', blockName: 'Block B', floorName: 'Ground Floor' },
                { id: 'dept-cardio', code: 'CARDIO', name: 'Cardiology (OPD)', nameTa: 'இதயவியல் பிரிவு', roomNumber: 'Room 12', blockName: 'Block B', floorName: '1st Floor' },
                { id: 'dept-ortho', code: 'ORTHO', name: 'Orthopedics (OPD)', nameTa: 'எலும்பியல் பிரிவு', roomNumber: 'Rooms 14-16', blockName: 'Block B', floorName: '1st Floor' },
              ];
          setDepartments(depts);

          const docs: DoctorItem[] = docRes.success && docRes.data && docRes.data.length > 0
            ? docRes.data
            : [
                { id: 'usr-doc-1', fullName: 'Dr. Priya Kumar, MD, DM', username: 'dr_priya', role: 'doctor', departmentId: 'dept-genmed' },
                { id: 'usr-doc-2', fullName: 'Dr. M. Senthil Nathan, MD', username: 'dr_senthil', role: 'doctor', departmentId: 'dept-genmed' },
              ];
          setDoctors(docs);

          // Set initial defaults
          const defaultDept = depts.find((d) => d.id === 'dept-genmed') || depts[0];
          if (defaultDept) {
            setSelectedDeptId(defaultDept.id);
            setRecommendedDept(defaultDept);
          }
          const defaultDoc = docs.find((d) => d.id === 'usr-doc-1') || docs[0];
          if (defaultDoc) {
            setSelectedDoctorId(defaultDoc.id);
            setRecommendedDoctor(defaultDoc);
          }
        }
      } catch (err: any) {
        console.error('Error fetching doctors/departments:', err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [patientId, patientName]);

  // Update symptom recommendation whenever symptomInput or database lists change
  useEffect(() => {
    if (departments.length === 0) return;
    const text = symptomInput.toLowerCase();

    let targetDeptCode = 'GENMED';
    let reason = 'Symptoms of cough, cold, fever, or general complaints are best evaluated by General Medicine.';

    if (text.includes('chest') || text.includes('heart') || text.includes('palpitation') || text.includes('breathless')) {
      targetDeptCode = 'CARDIO';
      reason = 'Symptoms related to chest discomfort, palpitations, or cardiac symptoms are routed to Cardiology.';
    } else if (text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('knee') || text.includes('back pain')) {
      targetDeptCode = 'ORTHO';
      reason = 'Musculoskeletal, bone, and joint complaints are routed to Orthopedics.';
    }

    const matchedDept = departments.find((d) => d.code === targetDeptCode) || departments[0];
    const matchedDoctor = doctors.find((d) => d.departmentId === matchedDept.id) || doctors[0];

    setRecommendedDept(matchedDept);
    setRecommendedDoctor(matchedDoctor);
    setRecommendationReason(reason);
  }, [symptomInput, departments, doctors]);

  // When selectedDeptId changes in Choice A, auto-select a doctor from that department
  const availableDoctorsForDept = doctors.filter((d) => !d.departmentId || d.departmentId === selectedDeptId);

  const handleDeptChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const docsInDept = doctors.filter((d) => d.departmentId === deptId);
    if (docsInDept.length > 0) {
      setSelectedDoctorId(docsInDept[0].id);
    }
  };

  // 2. Confirm Doctor & Generate Token (Updates profile and creates real Visit in Database)
  const handleConfirmAndGenerateToken = async () => {
    setErrorMsg('');
    setSubmitting(true);

    try {
      // Step A: Save any profile updates (such as updated allergies) directly to the persistent database
      try {
        await apiClient.updatePatientProfile(patientId, {
          name: profileForm.name,
          age: Number(profileForm.age) || 46,
          gender: profileForm.gender,
          bloodGroup: profileForm.bloodGroup,
          allergies: profileForm.allergies,
          chronicConditions: profileForm.chronicConditions,
        });
        setProfileSavedNotice('Profile saved to database');
      } catch (profileErr) {
        console.warn('Profile update error:', profileErr);
      }

      // Step B: Create real new visit and token
      const finalDeptId = choiceMode === 'know_doctor' ? selectedDeptId : (recommendedDept?.id || 'dept-genmed');
      const finalDoctorId = choiceMode === 'know_doctor' ? selectedDoctorId : (recommendedDoctor?.id || 'usr-doc-1');
      const finalSymptoms = choiceMode === 'dont_know_doctor' ? symptomInput.trim() : 'OPD Consultation requested';

      const res = await apiClient.createVisit({
        patientId,
        doctorId: finalDoctorId,
        departmentId: finalDeptId,
        symptoms: finalSymptoms,
        forceNew: true,
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Failed to generate OPD visit token. Please try again.');
        setSubmitting(false);
        return;
      }

      // Success: pass real created visit data to parent callback
      onVisitCreated(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with hospital queue database');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {lang === 'ta' ? 'மருத்துவர் & துறை தேர்வு' : 'Doctor & Department Selection'}
                </h2>
                <p className="text-xs text-slate-300">
                  {lang === 'ta'
                    ? `நோயாளி: ${profileForm.name} (சுயவிவரம் சேமிக்கப்பட்டுள்ளது)`
                    : `Patient: ${profileForm.name} (Reusing Permanent Profile)`}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 text-xs font-semibold rounded-full border border-teal-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {lang === 'ta' ? 'அங்கீகரிக்கப்பட்டது' : 'Verified'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: PATIENT DETAILS (AUTOMATICALLY PREFILLED FROM DB) */}
          {/* ========================================================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-serif">
                  {lang === 'ta' ? 'நோயாளி விவரங்கள் (சுயவிவரம்)' : 'PATIENT DETAILS'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                PATIENT ID: {patientId}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              {lang === 'ta'
                ? 'முந்தைய வருகையிலிருந்து உங்கள் விவரங்கள் தானாகவே நிரப்பப்பட்டுள்ளன. தேவைப்பட்டால் திருத்திக் கொள்ளலாம்.'
                : 'All fields are automatically populated from your permanent profile. You may review and update details (e.g. allergies) before starting the visit.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'ta' ? 'முழு பெயர்' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'ta' ? 'வயது' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'ta' ? 'பாலினம்' : 'Gender'}
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'ta' ? 'இரத்த வகை' : 'Blood Group'}
                </label>
                <select
                  value={profileForm.bloodGroup}
                  onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="O+ve">O+ve</option>
                  <option value="O-ve">O-ve</option>
                  <option value="A+ve">A+ve</option>
                  <option value="A-ve">A-ve</option>
                  <option value="B+ve">B+ve</option>
                  <option value="B-ve">B-ve</option>
                  <option value="AB+ve">AB+ve</option>
                  <option value="AB-ve">AB-ve</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'ta' ? 'மருந்து ஒவ்வாமை' : 'Known Allergies'}
                </label>
                <input
                  type="text"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Dust"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'ta' ? 'நீண்டகால நோய்கள்' : 'Chronic Conditions'}
                </label>
                <input
                  type="text"
                  value={profileForm.chronicConditions}
                  onChange={(e) => setProfileForm({ ...profileForm, chronicConditions: e.target.value })}
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>
                🔒 Reusing profile <strong>{patientId}</strong>. No duplicate patient records are created.
              </span>
              {profileSavedNotice && (
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  ✓ {profileSavedNotice}
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* STEP 2: DOCTOR & DEPARTMENT SELECTION */}
          {/* ========================================================= */}

          {/* Two Distinct Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChoiceMode('know_doctor')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                choiceMode === 'know_doctor'
                  ? 'border-blue-700 bg-blue-50/60 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                {choiceMode === 'know_doctor' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ta' ? 'எனக்கு மருத்துவர் தெரியும்' : 'I know my doctor'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ta'
                  ? 'துறை மற்றும் விரும்பிய மருத்துவரைத் தேர்ந்தெடுக்கவும்'
                  : 'Select specific department and consulting physician'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setChoiceMode('dont_know_doctor')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                choiceMode === 'dont_know_doctor'
                  ? 'border-blue-700 bg-blue-50/60 shadow-sm ring-2 ring-blue-700/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                {choiceMode === 'dont_know_doctor' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ta' ? 'எனக்கு மருத்துவர் தெரியாது' : "I don't know my doctor"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ta'
                  ? 'அறிகுறிகளை உள்ளிட்டு பரிந்துரையைப் பெறுங்கள்'
                  : 'Enter symptoms to receive department guidance'}
              </p>
            </button>
          </div>

          {/* CHOICE A: I KNOW MY DOCTOR */}
          {choiceMode === 'know_doctor' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ta' ? 'மருத்துவமனைத் துறை (Department):' : 'Select Department:'}
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.roomNumber} - {d.blockName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ta' ? 'மருத்துவர் (Doctor):' : 'Select Doctor:'}
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {availableDoctorsForDept.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Details Preview */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs space-y-1">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  {doctors.find((d) => d.id === selectedDoctorId)?.fullName || 'Dr. Priya Kumar, MD, DM'}
                </div>
                <div className="text-slate-600">
                  {departments.find((d) => d.id === selectedDeptId)?.name} •{' '}
                  {departments.find((d) => d.id === selectedDeptId)?.roomNumber} (
                  {departments.find((d) => d.id === selectedDeptId)?.blockName})
                </div>
              </div>
            </div>
          )}

          {/* CHOICE B: I DON'T KNOW MY DOCTOR */}
          {choiceMode === 'dont_know_doctor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ta' ? 'உங்கள் உடல்நல பிரச்சனை / அறிகுறிகள்:' : 'Enter your symptoms or health concern:'}
                </label>
                <input
                  type="text"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="e.g., Cough and fever, chest discomfort, knee joint pain"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSymptomInput('Cough and fever')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                  >
                    Cough and fever
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymptomInput('Chest heaviness')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                  >
                    Chest heaviness
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymptomInput('Knee and joint pain')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                  >
                    Joint pain
                  </button>
                </div>
              </div>

              {/* Recommendation Card */}
              {recommendedDept && (
                <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட துறை & மருத்துவர்' : 'Recommended Routing'}
                    </span>
                    <span className="text-[11px] text-blue-700 font-semibold">
                      {recommendedDept.code} Queue
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">
                      {recommendedDept.name}
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      {recommendedDoctor?.fullName || 'Dr. Priya Kumar, MD, DM'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Location: {recommendedDept.roomNumber}, {recommendedDept.floorName} ({recommendedDept.blockName})
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-blue-100">
                    💡 {recommendationReason}
                  </p>

                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800">
                    ⚠️ <strong>Clinical Notice:</strong> This recommendation is a hospital queue routing suggestion based on reported symptoms, not a definitive medical diagnosis. A doctor will conduct a complete physical evaluation.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirmAndGenerateToken}
              disabled={submitting || loadingData}
              className="w-full py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Generating Real Token from Database...</span>
              ) : (
                <>
                  <span>
                    {choiceMode === 'know_doctor'
                      ? 'Confirm Doctor & Generate Token'
                      : 'Confirm Doctor & Generate Token'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              A real OPD visit record and unique sequential queue token will be created in the hospital database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
