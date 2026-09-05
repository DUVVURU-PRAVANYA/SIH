import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Ticket,
  Stethoscope,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface PatientEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DoctorRecommendation {
  deptId: string;
  deptName: string;
  deptNameTa: string;
  doctorName: string;
  doctorSpecialty: string;
  reason: string;
  reasonTa: string;
}

export const PatientEntryModal: React.FC<PatientEntryModalProps> = ({ isOpen, onClose }) => {
  const {
    registerPatient,
    lang,
    patients,
    setActivePatientId,
  } = useQueueFlow();

  // Mode: 'register' | 'returning'
  const [entryMode, setEntryMode] = useState<'register' | 'returning'>('register');

  // Profile Fields
  const [name, setName] = useState('Anitha Kumar');
  const [age, setAge] = useState('46');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [phone, setPhone] = useState('98401 23456');
  const [address, setAddress] = useState('14/B, West Masi Street, Madurai');
  const [bloodGroup, setBloodGroup] = useState('O+ve');
  const [allergies, setAllergies] = useState('Penicillin');
  const [existingConditions, setExistingConditions] = useState('Type 2 Diabetes (5 yrs), Mild HTN');
  const [priority, setPriority] = useState<'normal' | 'senior' | 'urgent'>('normal');

  // Doctor Choice Flow: 'select' | 'recommend'
  const [doctorChoiceMode, setDoctorChoiceMode] = useState<'select' | 'recommend'>('recommend');
  const [selectedDeptId, setSelectedDeptId] = useState('dept-genmed');
  const [symptomText, setSymptomText] = useState('Cough and fever');
  const [recommendation, setRecommendation] = useState<DoctorRecommendation | null>({
    deptId: 'dept-genmed',
    deptName: 'General Medicine',
    deptNameTa: 'பொது மருத்துவ பிரிவு',
    doctorName: 'Dr. Priya Kumar (MD)',
    doctorSpecialty: 'Internal & General Medicine',
    reason: 'Symptoms of fever, cough, and general fatigue are best evaluated by General Medicine.',
    reasonTa: 'காய்ச்சல் மற்றும் இருமல் அறிகுறிகளுக்கு பொது மருத்துவ நிபுணர் பரிந்துரைக்கப்படுகிறார்.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Symptom Classifier Engine (Doctor Recommendation - Not a Diagnosis)
  const handleSymptomAnalysis = (input: string) => {
    setSymptomText(input);
    const text = input.toLowerCase();

    if (text.includes('chest') || text.includes('heart') || text.includes('palpitation') || text.includes('breathless')) {
      setRecommendation({
        deptId: 'dept-cardio',
        deptName: 'Cardiology',
        deptNameTa: 'இதயவியல் பிரிவு',
        doctorName: 'Dr. Arun Kumar (DM)',
        doctorSpecialty: 'Cardiology & Vascular Care',
        reason: 'Symptoms related to chest discomfort or heart issues require Cardiology evaluation.',
        reasonTa: 'மார்பு வலி மற்றும் இதய பாதிப்பு அறிகுறிகளுக்கு இதயவியல் பிரிவு பரிந்துரைக்கப்படுகிறது.',
      });
      setSelectedDeptId('dept-cardio');
    } else if (text.includes('joint') || text.includes('bone') || text.includes('fracture') || text.includes('knee') || text.includes('back pain')) {
      setRecommendation({
        deptId: 'dept-ortho',
        deptName: 'Orthopedics',
        deptNameTa: 'எலும்பியல் பிரிவு',
        doctorName: 'Dr. Kumar V. (MS Ortho)',
        doctorSpecialty: 'Orthopedics & Joint Care',
        reason: 'Musculoskeletal and joint symptoms are handled by Orthopedics.',
        reasonTa: 'எலும்பு மற்றும் மூட்டு வலிகளுக்கு எலும்பியல் பிரிவு பரிந்துரைக்கப்படுகிறது.',
      });
      setSelectedDeptId('dept-ortho');
    } else {
      setRecommendation({
        deptId: 'dept-genmed',
        deptName: 'General Medicine',
        deptNameTa: 'பொது மருத்துவ பிரிவு',
        doctorName: 'Dr. Priya Kumar (MD)',
        doctorSpecialty: 'Internal & General Medicine',
        reason: 'Symptoms of fever, cough, cold, or general health issues are evaluated by General Medicine.',
        reasonTa: 'காய்ச்சல், இருமல் அல்லது பொதுவான உடல்நலக் குறைகளுக்கு பொது மருத்துவ பிரிவு பரிந்துரைக்கப்படுகிறது.',
      });
      setSelectedDeptId('dept-genmed');
    }
  };

  const handleRegisterAndGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalDeptId = doctorChoiceMode === 'recommend' && recommendation ? recommendation.deptId : selectedDeptId;

      await registerPatient({
        name,
        nameTa: name === 'Anitha Kumar' ? 'அனிதா குமார்' : name,
        age: parseInt(age) || 35,
        gender,
        phone,
        departmentId: finalDeptId,
        bloodGroup,
        allergies: allergies ? allergies.split(',').map((a) => a.trim()) : [],
        existingConditions: existingConditions ? existingConditions.split(',').map((c) => c.trim()) : [],
        priority,
        address,
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="bg-[#0b2545] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">
                {lang === 'ta' ? 'நோயாளி பதிவு & டோக்கன் உருவாக்கம்' : 'Patient Registration & Doctor Token'}
              </h2>
              <p className="text-[11px] text-slate-300">
                {lang === 'ta' ? 'அரசு தலைமை பொது மருத்துவமனை' : 'Government Hospital QueueFlow System'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleRegisterAndGenerateToken} className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Patient Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-blue-950">
              <UserPlus className="w-4 h-4 text-blue-700" />
              <span>{lang === 'ta' ? '1. நோயாளி சுயவிவரம்' : '1. Patient Demographics'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ta' ? 'முழு பெயர்' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ta' ? 'மொபைல் எண்' : 'Mobile Number'} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'வயது' : 'Age'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'பாலினம்' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ta' ? 'இரத்த வகை' : 'Blood Group'}
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none"
                >
                  <option value="O+ve">O+ve</option>
                  <option value="A+ve">A+ve</option>
                  <option value="B+ve">B+ve</option>
                  <option value="AB+ve">AB+ve</option>
                  <option value="O-ve">O-ve</option>
                  <option value="A-ve">A-ve</option>
                  <option value="B-ve">B-ve</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ta' ? 'ஒவ்வாமை (Allergies)' : 'Known Allergies'}
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ta' ? 'நாள்பட்ட பாதிப்புகள்' : 'Chronic Conditions'}
                </label>
                <input
                  type="text"
                  value={existingConditions}
                  onChange={(e) => setExistingConditions(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Doctor Selection / Recommendation Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-blue-950">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>{lang === 'ta' ? '2. மருத்துவர் / துறை தேர்வு' : '2. Doctor & Department Selection'}</span>
            </h3>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setDoctorChoiceMode('recommend')}
                className={`py-2 px-3 rounded-md font-bold transition-all ${
                  doctorChoiceMode === 'recommend'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lang === 'ta' ? 'நான் எனது குறைகளை விவரிக்கிறேன்' : "I don't know my doctor (Enter Symptoms)"}
              </button>
              <button
                type="button"
                onClick={() => setDoctorChoiceMode('select')}
                className={`py-2 px-3 rounded-md font-bold transition-all ${
                  doctorChoiceMode === 'select'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lang === 'ta' ? 'எனக்கு மருத்துவர் தெரியும்' : 'I know which doctor to consult'}
              </button>
            </div>

            {/* Mode A: Describe Symptoms for Recommendation */}
            {doctorChoiceMode === 'recommend' && (
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-lg space-y-3">
                <div>
                  <label className="block font-bold text-teal-950 mb-1">
                    {lang === 'ta' ? 'உங்கள் உடல்நலக் குறைகளை உள்ளிடவும்:' : 'Describe your health problem / symptoms:'}
                  </label>
                  <input
                    type="text"
                    value={symptomText}
                    onChange={(e) => handleSymptomAnalysis(e.target.value)}
                    placeholder="e.g. Cough and fever, Chest discomfort, Knee joint pain..."
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded focus:ring-2 focus:ring-teal-600 outline-none font-medium"
                  />
                </div>

                {recommendation && (
                  <div className="bg-white p-3.5 rounded border border-teal-300 space-y-2">
                    <div className="flex items-center justify-between border-b border-teal-100 pb-1.5">
                      <div className="font-bold text-teal-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>Recommended: {recommendation.deptName}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{recommendation.doctorName}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{recommendation.reason}</p>
                    <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      * <strong>Notice:</strong> This is a recommendation/classification feature to help select the appropriate department. It is NOT a medical diagnosis.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode B: Direct Selection */}
            {doctorChoiceMode === 'select' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ta' ? 'மருத்துவத் துறையைத் தேர்ந்தெடுக்கவும்:' : 'Select Department & Doctor:'}
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:border-blue-800 outline-none font-medium"
                  >
                    <option value="dept-genmed">General Medicine — Dr. Priya Kumar (MD)</option>
                    <option value="dept-cardio">Cardiology — Dr. Arun Kumar (DM)</option>
                    <option value="dept-ortho">Orthopedics — Dr. Kumar V. (MS)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition-colors"
            >
              {lang === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>{isSubmitting ? 'Generating Token...' : 'Confirm Doctor & Generate Token'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
