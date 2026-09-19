import React, { useState } from 'react';
import {
  Building2,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Lock,
  UserPlus,
  ArrowLeft,
  Stethoscope,
  FlaskConical,
  Pill,
  ChevronDown,
  Clock,
  Info,
  Sparkles,
  Activity,
  Check,
  HeartPulse,
  Users,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { API_BASE_URL } from '../../services/api';

export const RoleAuthScreen: React.FC = () => {
  const {
    lang,
    setLang,
    authStatus,
    pendingOtpSession,
    currentPath,
    navigate,
    requestPatientOtp,
    cancelOtpSession,
    verifyPatientOtp,
    loginStaff,
    registerPatientWithPhone,
  } = useQueueFlow();

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [activeRoleTab, setActiveRoleTab] = useState<'patient' | 'doctor' | 'lab' | 'pharmacy'>('patient');

  // Active staff pending password
  const [detectedStaff, setDetectedStaff] = useState<{ username: string; fullName: string; role: string } | null>(null);

  // New Patient Registration state
  const [regForm, setRegForm] = useState({
    name: '',
    age: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    phone: '',
  });

  // UI status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Determine active view based on persistent authStatus, route, and staff selection
  const isOtpView = currentPath === '/verify-otp' || authStatus === 'OTP_PENDING';
  const isRegisterView = currentPath === '/patient/register' || currentPath === '/register';
  const isOtpExpired = isOtpView && (!pendingOtpSession || (pendingOtpSession.expiresAt && pendingOtpSession.expiresAt < Date.now()));

  const activeStep: 'identify' | 'patient_otp' | 'staff_password' | 'register' = isOtpView
    ? 'patient_otp'
    : detectedStaff
    ? 'staff_password'
    : isRegisterView
    ? 'register'
    : 'identify';

  const switchStep = (step: 'identify' | 'patient_otp' | 'staff_password' | 'register') => {
    setErrorMessage('');
    setSuccessMessage('');
    if (step === 'register') {
      navigate('/patient/register');
    } else if (step === 'identify') {
      setDetectedStaff(null);
      navigate('/login');
    } else if (step === 'patient_otp') {
      navigate('/verify-otp');
    }
  };

  // 5 Configured Doctors
  const CONFIGURED_DOCTORS = [
    { username: 'dr_priya', name: 'Dr. Priya Kumar', department: 'General Medicine' },
    { username: 'dr_senthil', name: 'Dr. M. Senthil Nathan', department: 'General Medicine' },
    { username: 'dr_arun', name: 'Dr. Arun Kumar', department: 'Cardiology' },
    { username: 'dr_meena', name: 'Dr. Meena Sharma', department: 'Orthopedics' },
    { username: 'dr_ravi', name: 'Dr. Ravi Kumar', department: 'Dermatology' },
  ];

  const [selectedDoctorUsername, setSelectedDoctorUsername] = useState('dr_priya');

  // Helper to select role tab and prefill demo credential
  const handleRoleTabSelect = (role: 'patient' | 'doctor' | 'lab' | 'pharmacy') => {
    setActiveRoleTab(role);
    setErrorMessage('');
    setSuccessMessage('');
    if (role === 'patient') setIdentifier('9876543210');
    if (role === 'doctor') setIdentifier(selectedDoctorUsername || 'dr_priya');
    if (role === 'lab') setIdentifier('tech_murugan');
    if (role === 'pharmacy') setIdentifier('pharm_radha');
  };

  // STEP 1: Handle Common Identifier Submission (Auto-detects Patient Mobile or Staff Username)
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMessage(lang === 'ta' ? 'மொபைல் எண் அல்லது பயனர்பெயரை உள்ளிடவும்' : 'Please enter your Mobile Number or Username');
      return;
    }

    setLoading(true);
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');

    // Case A: 10-digit mobile number -> Patient OTP Workflow
    if (cleanDigits.length >= 10) {
      const phoneToUse = cleanDigits.slice(-10);
      try {
        const res = await requestPatientOtp(phoneToUse);
        if (res.success) {
          setOtpDigits(['', '', '', '', '', '']);
          setSuccessMessage(
            lang === 'ta'
              ? `OTP +91 ${phoneToUse}-க்கு வெற்றிகரமாக அனுப்பப்பட்டது.`
              : `OTP sent successfully to +91 ${phoneToUse}.`
          );
        } else {
          setErrorMessage(res.error || 'Patient account not found. Please register as a new patient.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error communicating with server');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Case B: Staff Username -> Staff Password Workflow
    try {
      const res = await fetch(`${API_BASE_URL}/auth/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.type === 'staff') {
        setDetectedStaff({
          username: data.username,
          fullName: data.fullName,
          role: data.role,
        });
        setPassword('');
        switchStep('staff_password');
      } else {
        // Fallback for offline or local staff aliases
        const lower = cleanInput.toLowerCase();
        if (['doctor', 'dr_priya', 'priya'].includes(lower)) {
          setDetectedStaff({ username: 'dr_priya', fullName: 'Dr. Priya Kumar', role: 'doctor' });
          switchStep('staff_password');
        } else if (['dr_senthil', 'senthil'].includes(lower)) {
          setDetectedStaff({
            username: 'dr_senthil',
            fullName: 'Dr. M. Senthil Nathan',
            role: 'doctor',
          });
          switchStep('staff_password');
        } else if (['dr_arun', 'arun'].includes(lower)) {
          setDetectedStaff({ username: 'dr_arun', fullName: 'Dr. Arun Kumar', role: 'doctor' });
          switchStep('staff_password');
        } else if (['dr_meena', 'meena'].includes(lower)) {
          setDetectedStaff({ username: 'dr_meena', fullName: 'Dr. Meena Sharma', role: 'doctor' });
          switchStep('staff_password');
        } else if (['dr_ravi', 'ravi'].includes(lower)) {
          setDetectedStaff({ username: 'dr_ravi', fullName: 'Dr. Ravi Kumar', role: 'doctor' });
          switchStep('staff_password');
        } else if (['lab', 'scanlab', 'tech_murugan'].includes(lower)) {
          setDetectedStaff({ username: 'tech_murugan', fullName: 'K. Murugan (Lab)', role: 'scan_lab' });
          switchStep('staff_password');
        } else if (['pharmacy', 'pharm_radha', 'radha'].includes(lower)) {
          setDetectedStaff({ username: 'pharm_radha', fullName: 'S. Radha (Pharmacist)', role: 'pharmacy' });
          switchStep('staff_password');
        } else {
          setErrorMessage(
            lang === 'ta'
              ? 'பயனர்பெயர் அல்லது 10 இலக்க மொபைல் எண் கண்டறியப்படவில்லை.'
              : 'Identifier not recognized. Enter a 10-digit mobile number or staff username.'
          );
        }
      }
    } catch {
      // Offline fallback for known demo staff
      const lower = cleanInput.toLowerCase();
      if (['doctor', 'dr_priya', 'priya'].includes(lower)) {
        setDetectedStaff({ username: 'dr_priya', fullName: 'Dr. Priya Kumar', role: 'doctor' });
        switchStep('staff_password');
      } else if (['dr_senthil', 'senthil'].includes(lower)) {
        setDetectedStaff({
          username: 'dr_senthil',
          fullName: 'Dr. M. Senthil Nathan',
          role: 'doctor',
        });
        switchStep('staff_password');
      } else if (['dr_arun', 'arun'].includes(lower)) {
        setDetectedStaff({ username: 'dr_arun', fullName: 'Dr. Arun Kumar', role: 'doctor' });
        switchStep('staff_password');
      } else if (['dr_meena', 'meena'].includes(lower)) {
        setDetectedStaff({ username: 'dr_meena', fullName: 'Dr. Meena Sharma', role: 'doctor' });
        switchStep('staff_password');
      } else if (['dr_ravi', 'ravi'].includes(lower)) {
        setDetectedStaff({ username: 'dr_ravi', fullName: 'Dr. Ravi Kumar', role: 'doctor' });
        switchStep('staff_password');
      } else if (['lab', 'scanlab', 'tech_murugan'].includes(lower)) {
        setDetectedStaff({ username: 'tech_murugan', fullName: 'K. Murugan (Lab)', role: 'scan_lab' });
        switchStep('staff_password');
      } else if (['pharmacy', 'pharm_radha', 'radha'].includes(lower)) {
        setDetectedStaff({ username: 'pharm_radha', fullName: 'S. Radha (Pharmacist)', role: 'pharmacy' });
        switchStep('staff_password');
      } else {
        setErrorMessage('Unable to connect to verification server. Please check identifier.');
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2A: Verify Patient OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage(lang === 'ta' ? 'தயவுசெய்து 6 இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Please enter the 6-digit OTP code');
      return;
    }

    const phoneToVerify = pendingOtpSession?.phone;
    if (!phoneToVerify) {
      setErrorMessage(lang === 'ta' ? 'மொபைல் அமர்வு இல்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' : 'Mobile session not found. Please enter your mobile number again.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPatientOtp(phoneToVerify, enteredOtp);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2B: Verify Staff Password
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage(lang === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStaff(detectedStaff?.username || 'dr_priya', password);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Incorrect password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Staff login error');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Handle New Patient Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regForm.name.trim()) {
      setErrorMessage(lang === 'ta' ? 'முழு பெயரை உள்ளிடவும்' : 'Please enter patient full name');
      return;
    }

    const cleanPhone = regForm.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage(lang === 'ta' ? 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await registerPatientWithPhone({
        name: regForm.name.trim(),
        age: Number(regForm.age) > 0 ? Number(regForm.age) : 0,
        gender: regForm.gender,
        bloodGroup: regForm.bloodGroup || 'Not Specified',
        allergies: regForm.allergies ? [regForm.allergies.trim()] : [],
        chronicConditions: regForm.chronicConditions ? [regForm.chronicConditions.trim()] : [],
        phone: cleanPhone,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage(
        lang === 'ta'
          ? `பதிவு முடிந்தது. OTP அனுப்பப்பட்டது. மாதிரி OTP: ${res.demoOtp || '123456'}`
          : `Account created! OTP dispatched. Demo OTP: ${res.demoOtp || '123456'}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit paste or auto-focus
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[index] = val.slice(-1);
    setOtpDigits(next);

    // Auto-advance to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setOtpDigits(next);
      const focusIndex = Math.min(pasted.length, 5);
      document.getElementById(`otp-input-${focusIndex}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#F6FAFD] text-slate-800 flex flex-col justify-between selection:bg-[#12B8A6] selection:text-white relative overflow-x-hidden">
      
      {/* 1. REAL HOSPITAL BUILDING ARCHITECTURAL BACKDROP (SOFT FADED) */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}hospital-bg.jpg`}
          alt="District Hospital Background"
          className="w-full h-full object-cover object-center opacity-40 mix-blend-multiply"
        />
        {/* Soft daylight gradient overlay for high contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F0F7FD]/92 via-[#F0F7FD]/80 to-[#F0F7FD]/85" />
        
        {/* Decorative Cyan & Light Blue Wave Accents in Bottom-Left */}
        <svg className="absolute -bottom-10 -left-10 w-[600px] h-[440px] opacity-70 pointer-events-none" viewBox="0 0 600 440" fill="none">
          <path d="M-50,440 C140,410 260,290 190,170 C120,70 330,130 590,20 L-50,-20 Z" fill="url(#cyan-grad-1)" />
          <path d="M-50,440 C190,390 350,220 290,100 C230,30 430,40 630,0 L-50,-20 Z" fill="url(#cyan-grad-2)" opacity="0.6" />
          <defs>
            <linearGradient id="cyan-grad-1" x1="0" y1="440" x2="590" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67E8F9" stopOpacity="0.45" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="cyan-grad-2" x1="0" y1="440" x2="630" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A5F3FC" stopOpacity="0.4" />
              <stop offset="1" stopColor="#E0F2FE" stopOpacity="0.08" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 2. PROMINENT INSTITUTIONAL HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 sm:px-10 py-2.5 sm:py-3 flex items-center justify-between relative z-20 shadow-xs shrink-0">
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Official Emblem Logo & Wordmark (Prominent visual presence with exact custom font) */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <img
              src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.endsWith('/carenexus-emblem.png')) {
                  target.src = '/carenexus-emblem.png';
                }
              }}
              alt="CareNexus Emblem"
              className="h-12 w-12 sm:h-[52px] sm:w-[52px] object-contain shrink-0"
            />
            <img
              src={`${import.meta.env.BASE_URL}carenexus-wordmark.png`}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.endsWith('/carenexus-wordmark.png')) {
                  target.src = '/carenexus-wordmark.png';
                }
              }}
              alt="CareNexus"
              className="h-7 sm:h-[32px] w-auto object-contain shrink-0"
            />
          </div>

          <div className="h-8.5 w-[1.5px] bg-slate-200 hidden sm:block mx-1.5" />

          <div className="hidden sm:block">
            <p className="text-sm sm:text-[15px] font-bold text-slate-800 leading-tight">
              {lang === 'ta' ? 'அரசு தலைமை பொது மருத்துவமனை' : 'District Headquarters Government Hospital'}
            </p>
            <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
              {lang === 'ta' ? 'தமிழ்நாடு அரசு சுகாதாரத்துறை' : 'Ministry of Health & Family Welfare'}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Language Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-full font-bold text-xs sm:text-sm border border-slate-200 transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0066FF] shrink-0" />
            <span className="leading-none">{lang === 'ta' ? 'English' : 'தமிழ் (Tamil)'}</span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-2 sm:py-3 flex-1 flex flex-col justify-center relative z-10 min-h-0">
        
        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="w-full max-w-xl mx-auto mb-3 p-3.5 rounded-2xl bg-white border-2 border-red-200 text-red-700 text-xs flex items-center gap-3 shadow-md animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="w-full max-w-xl mx-auto mb-3 p-3.5 rounded-2xl bg-white border-2 border-teal-200 text-teal-800 text-xs flex items-center gap-3 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 1: COMMON LOGIN / REGISTRATION PAGE (Two-Column Layout) */}
        {/* ================================================================ */}
        {(activeStep === 'identify' || activeStep === 'register') && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            
            {/* LEFT COLUMN: Clean, Focused Hospital Journey Engine */}
            <div className="lg:col-span-7 flex flex-col space-y-4 sm:space-y-5 text-left">
              
              {/* Main Title & Description */}
              <div className="space-y-3 max-w-xl">
                <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black tracking-tight leading-tight">
                  <span className="text-[#0A2342] block">
                    {lang === 'ta' ? 'ஒருங்கிணைந்த நோயாளி வழிகாட்டல் &' : 'Unified Patient Journey &'}
                  </span>
                  <span className="bg-gradient-to-r from-[#0062E0] via-[#00A299] to-[#00C49F] bg-clip-text text-transparent block pb-1 leading-snug">
                    {lang === 'ta' ? 'மருத்துவ வரிசை இயக்கம்' : 'Clinical Queue Engine'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {lang === 'ta'
                    ? 'பதிவு, மருத்துவ ஆலோசனை, ஆய்வகம் மற்றும் மருந்தகம் வரை நிகழ்நேர வரிசை ஒருங்கிணைப்பு மூலம் தடையற்ற மருத்துவ சேவை.'
                    : 'Enabling a connected patient journey across registration, consultation, diagnostics, and pharmacy through real-time queue coordination.'}
                </p>
              </div>

              {/* 4-Step Care Journey Matrix (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                {/* Card 1: Instant OPD Token */}
                <div className="p-3 sm:p-3.5 bg-[#F0F7FF] hover:bg-[#E0F2FE]/70 border border-[#BAE6FD]/70 rounded-2xl flex items-center transition-all duration-200 shadow-2xs group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#BAE6FD] text-[#0066FF] flex items-center justify-center shrink-0 font-bold group-hover:scale-105 transition-transform">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Instant OPD Token</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lang === 'ta'
                          ? 'மொபைல் சரிபார்ப்பு & டோக்கன் உருவாக்கம்'
                          : 'Mobile verification & queue token generation'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Doctor Consultation */}
                <div className="p-3 sm:p-3.5 bg-[#F0FDF9] hover:bg-[#CCFBF1]/70 border border-[#99F6E4]/70 rounded-2xl flex items-center transition-all duration-200 shadow-2xs group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#99F6E4] text-[#00A272] flex items-center justify-center shrink-0 font-bold group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Doctor Consultation</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lang === 'ta'
                          ? 'நிகழ்நேர வரிசை மேலாண்மை & டிஜிட்டல் மருந்துக் குறிப்பு'
                          : 'Live queue management & digital prescriptions'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 3: Diagnostic Scans */}
                <div className="p-3 sm:p-3.5 bg-[#F5F3FF] hover:bg-[#EDE9FE]/70 border border-[#DDD6FE]/70 rounded-2xl flex items-center transition-all duration-200 shadow-2xs group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0 font-bold group-hover:scale-105 transition-transform">
                      <FlaskConical className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Diagnostic Scans</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lang === 'ta'
                          ? 'டிஜிட்டல் பரிசோதனை கண்காணிப்பு & அறிக்கை வழங்கல்'
                          : 'Digital test tracking & report delivery'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 4: Digital Pharmacy */}
                <div className="p-3 sm:p-3.5 bg-[#FDF2F8] hover:bg-[#FCE7F3]/70 border border-[#FBCFE8]/70 rounded-2xl flex items-center transition-all duration-200 shadow-2xs group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FBCFE8] text-[#DB2777] flex items-center justify-center shrink-0 font-bold group-hover:scale-105 transition-transform">
                      <Pill className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {lang === 'ta' ? 'டிஜிட்டல் மருந்தகம்' : 'Digital Pharmacy'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lang === 'ta'
                          ? 'டிஜிட்டல் மருந்துக் குறிப்பு & மருந்து வழங்கல்'
                          : 'Digital prescriptions & medicine dispensing'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: The Clean White Box (Login or Registration) */}
            <div className="lg:col-span-5 w-full max-w-[460px] mx-auto transition-all">
              {activeStep === 'identify' ? (
                <div className="bg-white rounded-[26px] border border-slate-100 shadow-[0_20px_50px_-10px_rgba(10,35,66,0.08),0_0_0_1px_rgba(226,232,240,0.8)] p-5 sm:p-6">
                  <div className="text-center mb-3.5 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0A2342] tracking-tight">
                      {lang === 'ta' ? 'அரசு மருத்துவமனை உள்நுழைவு' : 'Hospital Portal Login'}
                    </h2>
                  </div>

                  {errorMessage && (
                    <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                      {errorMessage.toLowerCase().includes('not registered') && (
                        <button
                          type="button"
                          onClick={() => switchStep('register')}
                          className="self-start text-[11px] font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          {lang === 'ta' ? 'புதிய நோயாளியாக பதிவு செய்க →' : 'Register as New Patient →'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleIdentify} className="space-y-3 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ta' ? 'மொபைல் எண் / பணியாளர் ஐடி' : 'Mobile Number / Staff ID'}
                      </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {identifier.startsWith('dr_') ? (
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                      ) : identifier.startsWith('tech_') || activeRoleTab === 'lab' ? (
                        <FlaskConical className="w-4 h-4 text-emerald-600" />
                      ) : identifier.startsWith('pharm_') ? (
                        <Pill className="w-4 h-4 text-purple-600" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={lang === 'ta' ? 'மொபைல் எண் அல்லது பணியாளர் ஐடி' : 'Enter mobile number or Staff ID'}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/15 font-mono shadow-2xs"
                      autoFocus
                    />
                  </div>
                </div>

                {/* One-Click Demo Access Section */}
                <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
                      <span>One-Click Demo Access</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Password: <strong className="font-mono text-slate-800 font-bold">password123</strong>
                    </span>
                  </div>

                  {/* 4 Role Buttons: Patient | Doctor | Lab | Pharmacy */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRoleTabSelect('patient')}
                      className={`py-1.5 px-1 rounded-xl font-bold flex flex-row items-center justify-center gap-1 transition-all cursor-pointer text-xs whitespace-nowrap ${
                        activeRoleTab === 'patient'
                          ? 'bg-[#0072FF] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>Patient</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabSelect('doctor')}
                      className={`py-1.5 px-1 rounded-xl font-bold flex flex-row items-center justify-center gap-1 transition-all cursor-pointer text-xs whitespace-nowrap ${
                        activeRoleTab === 'doctor'
                          ? 'bg-[#00A272] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                      <span>Doctor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabSelect('lab')}
                      className={`py-1.5 px-1 rounded-xl font-bold flex flex-row items-center justify-center gap-1 transition-all cursor-pointer text-xs whitespace-nowrap ${
                        activeRoleTab === 'lab'
                          ? 'bg-[#00A272] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                      <span>Lab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleTabSelect('pharmacy')}
                      className={`py-1.5 px-1 rounded-xl font-bold flex flex-row items-center justify-center gap-1 transition-all cursor-pointer text-xs whitespace-nowrap ${
                        activeRoleTab === 'pharmacy'
                          ? 'bg-[#7C3AED] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Pill className="w-3.5 h-3.5 shrink-0" />
                      <span>Pharmacy</span>
                    </button>
                  </div>

                  {/* Doctor Dropdown (select any of the 5 configured doctors) */}
                  {activeRoleTab === 'doctor' && (
                    <div className="pt-1.5 border-t border-slate-100">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {lang === 'ta' ? 'மருத்துவரைத் தேர்ந்தெடுக்கவும்:' : 'Select Doctor:'}
                      </label>
                      <select
                        value={selectedDoctorUsername}
                        onChange={(e) => {
                          const docUser = e.target.value;
                          setSelectedDoctorUsername(docUser);
                          setIdentifier(docUser);
                        }}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
                      >
                        {CONFIGURED_DOCTORS.map((doc) => (
                          <option key={doc.username} value={doc.username}>
                            {doc.name} ({doc.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#0066FF] via-[#009BF2] to-[#00D4A0] hover:brightness-105 text-white font-bold rounded-2xl text-sm transition-all shadow-[0_10px_25px_-5px_rgba(0,102,255,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3 active:scale-[0.99]"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{lang === 'ta' ? 'தொடரவும் / உள்நுழைக' : 'Proceed to Verification'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Link to New Patient Registration */}
              <div className="pt-2.5 text-center border-t border-slate-100 mt-2.5 sm:mt-3">
                <button
                  type="button"
                  onClick={() => switchStep('register')}
                  className="text-xs text-slate-500 hover:text-[#0284C7] font-medium transition-colors cursor-pointer"
                >
                  {lang === 'ta' ? 'முதல்முறையாக வருகை தரும் புதிய நோயாளி?' : 'Visiting this hospital for the first time?'}{' '}
                  <strong className="text-[#0284C7] underline font-bold">
                    {lang === 'ta' ? 'புதிய நோயாளி பதிவு' : 'New Patient Registration'}
                  </strong>
                </button>
              </div>
            </div>
          ) : (
                <div className="bg-white rounded-[26px] border border-slate-100 shadow-[0_20px_50px_-10px_rgba(10,35,66,0.08),0_0_0_1px_rgba(226,232,240,0.8)] p-5 sm:p-6">
                  <button
                    onClick={() => switchStep('identify')}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer transition-colors font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{lang === 'ta' ? 'உள்நுழைவுக்குத் திரும்பு' : 'Back to Login'}</span>
                  </button>

                  <div className="text-center space-y-1 mb-3">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {lang === 'ta' ? 'புதிய நோயாளி பதிவு' : 'New Patient Registration'}
                    </span>
                    <h2 className="text-xl font-black text-[#0A2342] pt-1">
                      {lang === 'ta' ? 'உங்கள் விவரங்களை உள்ளிடவும்' : 'Register with Mobile Number'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ta'
                        ? 'உங்கள் மொபைல் எண் மூலம் அணுகலாம்.'
                        : 'No password required. Mobile number will be your identifier.'}
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-2.5 text-xs text-left">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === 'ta' ? 'முழு பெயர்' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder="e.g. Arun Kumar"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{lang === 'ta' ? 'வயது' : 'Age'} *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={120}
                          value={regForm.age}
                          onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                          placeholder="e.g. 32"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{lang === 'ta' ? 'பாலினம்' : 'Gender'} *</label>
                        <select
                          value={regForm.gender}
                          onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs text-xs cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{lang === 'ta' ? 'இரத்த வகை' : 'Blood Group'}</label>
                        <select
                          value={regForm.bloodGroup}
                          onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs text-xs cursor-pointer"
                        >
                          <option value="">{lang === 'ta' ? '-- வகை --' : '-- Select --'}</option>
                          <option value="O+ve">O +ve</option>
                          <option value="O-ve">O -ve</option>
                          <option value="A+ve">A +ve</option>
                          <option value="A-ve">A -ve</option>
                          <option value="B+ve">B +ve</option>
                          <option value="B-ve">B -ve</option>
                          <option value="AB+ve">AB +ve</option>
                          <option value="AB-ve">AB -ve</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{lang === 'ta' ? 'ஒவ்வாமை' : 'Allergies'}</label>
                        <input
                          type="text"
                          value={regForm.allergies}
                          onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
                          placeholder="e.g. None"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === 'ta' ? 'மொபைல் எண் (+91)' : 'Mobile Number (+91)'} *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/[^0-9]/g, '') })}
                          placeholder="9876543210"
                          className="w-full pl-11 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284C7] font-mono shadow-2xs text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-[#0066FF] via-[#009BF2] to-[#00D4A0] hover:brightness-105 text-white font-bold rounded-xl text-xs transition-all shadow-[0_10px_25px_-5px_rgba(0,102,255,0.35)] flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>{lang === 'ta' ? 'பதிவு செய்து OTP பெறவும்' : 'Register & Send OTP'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 2A: PATIENT OTP VERIFICATION */}
        {/* ================================================================ */}
        {activeStep === 'patient_otp' && (
          <div className="w-full max-w-[480px] mx-auto bg-white rounded-[28px] border border-slate-100 shadow-[0_20px_50px_-10px_rgba(10,35,66,0.08),0_0_0_1px_rgba(226,232,240,0.8)] p-8 sm:p-9 space-y-6">
            <button
              type="button"
              onClick={cancelOtpSession}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer transition-colors font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'எண்ணை மாற்றவும்' : 'Change number'}</span>
            </button>

            {isOtpExpired ? (
              <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center space-y-3 shadow-xs">
                <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                <h3 className="text-base font-bold text-amber-900">
                  {lang === 'ta' ? 'OTP காலம் முடிந்துவிட்டது' : 'Your OTP session has expired. Please request a new OTP.'}
                </h3>
                <p className="text-xs text-amber-700">
                  {lang === 'ta' ? '10 நிமிட கால அவகாசம் முடிந்தது.' : 'The OTP verification window has lapsed.'}
                </p>
                <button
                  type="button"
                  onClick={cancelOtpSession}
                  className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm inline-flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{lang === 'ta' ? 'புதிய OTP கோரவும்' : 'Request New OTP'}</span>
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-[#0284C7] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <Phone className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-[#0A2342]">
                    {lang === 'ta' ? 'OTP சரிபார்ப்பு' : 'Patient OTP Verification'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {lang === 'ta' ? 'அனுப்பப்பட்ட எண்:' : 'OTP sent to:'}{' '}
                    <strong className="text-[#0D9488] font-mono font-bold text-sm">
                      {pendingOtpSession?.maskedPhone || `+91 ${pendingOtpSession?.phone || ''}`}
                    </strong>
                  </p>
                  {pendingOtpSession?.patientName && (
                    <div className="text-sm font-bold text-slate-900 capitalize">
                      {pendingOtpSession.patientName}
                    </div>
                  )}
                </div>

                {/* 6-Digit OTP Inputs */}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 text-center mb-3">
                      {lang === 'ta' ? '6 இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Enter 6-digit OTP'}
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-2.5">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-input-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className="w-11 h-13 sm:w-12 sm:h-13 text-center text-xl font-mono font-black bg-white border-2 border-slate-200 focus:border-[#0284C7] rounded-xl text-slate-900 focus:outline-none focus:ring-3 focus:ring-sky-500/20 transition-all shadow-2xs"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading || otpDigits.join('').length !== 6}
                      className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] via-[#0D9488] to-[#10B981] hover:brightness-105 text-white font-bold rounded-2xl text-sm transition-all shadow-[0_10px_25px_-5px_rgba(2,132,199,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>{lang === 'ta' ? 'OTP சரிபார்க்கவும்' : 'Verify OTP & Continue'}</span>
                        </>
                      )}
                    </button>

                    {/* Subtle Demo Auto-fill Helper */}
                    <p className="text-xs text-slate-400 text-center pt-1">
                      Demo OTP: <strong className="font-mono font-bold text-slate-600">{pendingOtpSession?.demoOtp || '123456'}</strong> ·{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const code = pendingOtpSession?.demoOtp || '123456';
                          setOtpDigits(code.split('').slice(0, 6));
                        }}
                        className="text-[#0284C7] hover:underline font-semibold cursor-pointer"
                      >
                        Auto-fill
                      </button>
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 2B: STAFF PASSWORD AUTHENTICATION */}
        {/* ================================================================ */}
        {activeStep === 'staff_password' && detectedStaff && (
          <div className="w-full max-w-[480px] mx-auto bg-white rounded-[28px] border border-slate-100 shadow-[0_20px_50px_-10px_rgba(10,35,66,0.08),0_0_0_1px_rgba(226,232,240,0.8)] p-8 sm:p-9 space-y-6">
            <button
              onClick={() => switchStep('identify')}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer transition-colors font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'பயனர்பெயரை மாற்றவும்' : 'Switch Username / Back'}</span>
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                {detectedStaff.role === 'doctor' ? (
                  <Stethoscope className="w-7 h-7 text-[#0D9488]" />
                ) : detectedStaff.role === 'scan_lab' ? (
                  <FlaskConical className="w-7 h-7 text-emerald-600" />
                ) : (
                  <Pill className="w-7 h-7 text-purple-600" />
                )}
              </div>
              <span className="text-[11px] font-bold font-mono px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                STAFF ROLE: {detectedStaff.role.toUpperCase()}
              </span>
              <h2 className="text-2xl font-black text-[#0A2342] pt-1">{detectedStaff.fullName}</h2>
              <p className="text-xs text-slate-500 font-mono">Authorized ID: @{detectedStaff.username}</p>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'ta' ? 'கடவுச்சொல்' : 'Staff Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. password123)"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/15 font-mono shadow-2xs"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Demo password: <strong className="text-slate-800 font-mono">password123</strong></span>
                  <button
                    type="button"
                    onClick={() => setPassword('password123')}
                    className="text-[#0D9488] hover:text-teal-900 font-bold underline cursor-pointer"
                  >
                    Fill Demo Password
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#0284C7] via-[#0D9488] to-[#10B981] hover:brightness-105 text-white font-bold rounded-2xl text-sm transition-all shadow-[0_10px_25px_-5px_rgba(2,132,199,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-5"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === 'ta' ? 'பணிப்பிரிவுக்குள் நுழைக' : 'Sign In as Staff'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}


      </main>

      {/* 4. COMPACT INSTITUTIONAL FOOTER (Clean & Visible at 100% Zoom) */}
      <footer className="py-2.5 px-6 text-center text-[11px] sm:text-xs text-slate-500 relative z-10 bg-white/75 backdrop-blur-xs border-t border-slate-200/70 flex items-center justify-center gap-2 sm:gap-3 shrink-0">
        <span className="font-semibold text-slate-700">CareNexus™</span>
        <span>•</span>
        <span>District Headquarters Government Hospital</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline text-slate-400">Ministry of Health & Family Welfare</span>
      </footer>
    </div>
  );
};
