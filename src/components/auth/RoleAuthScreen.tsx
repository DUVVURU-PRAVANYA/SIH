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
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

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

  // Active staff pending password
  const [detectedStaff, setDetectedStaff] = useState<{ username: string; fullName: string; role: string } | null>(null);

  // New Patient Registration state
  const [regForm, setRegForm] = useState({
    name: '',
    age: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'O+ve',
    allergies: 'Penicillin',
    chronicConditions: 'None Reported',
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
              ? `OTP +91 ${phoneToUse}-க்கு அனுப்பப்பட்டது. மாதிரி OTP: ${res.demoOtp || '123456'}`
              : `Demo OTP dispatched to +91 ${phoneToUse}. Demo OTP: ${res.demoOtp || '123456'}`
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
      const res = await fetch('http://localhost:4000/api/auth/identify', {
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
          setDetectedStaff({ username: 'dr_priya', fullName: 'Dr. Priya Kumar, MD', role: 'doctor' });
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
        setDetectedStaff({ username: 'dr_priya', fullName: 'Dr. Priya Kumar, MD', role: 'doctor' });
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
      // On success, QueueFlowContext automatically switches authStatus to 'AUTHENTICATED' and navigates
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
      // On success, QueueFlowContext automatically switches role to staff role
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
        age: Number(regForm.age) || 35,
        gender: regForm.gender,
        bloodGroup: regForm.bloodGroup,
        allergies: regForm.allergies ? [regForm.allergies] : ['None Reported'],
        chronicConditions: regForm.chronicConditions ? [regForm.chronicConditions] : ['None Reported'],
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
    <div className="min-h-screen bg-[#07172c] text-white flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Institutional Header */}
      <header className="bg-[#051020] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-teal-700 flex items-center justify-center border border-blue-400/40 shadow-inner">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight font-serif text-white">GH QueueFlow</span>
              <span className="text-[10px] uppercase font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 px-1.5 py-0.2 rounded">
                Govt Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'ta'
                ? 'அரசு தலைமை பொது மருத்துவமனை • தமிழ்நாடு அரசு சுகாதாரத்துறை'
                : 'District Headquarter Government Hospital • Ministry of Health & Family Welfare'}
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <button
          onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? 'English' : 'தமிழ் (Tamil)'}</span>
        </button>
      </header>

      {/* Main Form Center */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 flex flex-col items-center justify-center flex-1">
        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="w-full mb-4 p-3 rounded-lg bg-teal-950/80 border border-teal-500/50 text-teal-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 1: COMMON LOGIN PAGE (Mobile or Staff Username) */}
        {/* ================================================================ */}
        {activeStep === 'identify' && (
          <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                {lang === 'ta' ? 'பாதுகாப்பான பொது உள்நுழைவு' : 'Institutional Single Sign-On'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white pt-1">
                {lang === 'ta' ? 'அரசு மருத்துவமனை உள்நுழைவு' : 'Hospital Portal Login'}
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === 'ta'
                  ? 'நோயாளிகள் மொபைல் எண் மூலமாகவும், மருத்துவப் பணியாளர்கள் பயனர்பெயர் மூலமாகவும் உள்நுழையவும்.'
                  : 'Patients login with Mobile Number (OTP). Hospital staff login with Authorized Username.'}
              </p>
            </div>

            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'ta' ? 'மொபைல் எண் (நோயாளி) அல்லது பயனர்பெயர் (பணியாளர்)' : 'Mobile Number (Patient) or Username (Staff)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={lang === 'ta' ? 'எ.கா: 9876543210 அல்லது dr_priya' : 'e.g. 9876543210 or dr_priya'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors font-mono"
                    autoFocus
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800/80 pb-1">
                    <span>Quick Demo Credentials</span>
                    <span className="text-[10px] text-teal-400 font-normal">Password for all staff: <strong className="font-mono text-white">password123</strong></span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400 pt-0.5">
                    <div>👤 Patient: <span className="font-mono text-blue-300 font-bold">9876543210</span> (OTP: 123456)</div>
                    <div>🩺 Doctor: <span className="font-mono text-teal-300 font-bold">dr_priya</span> or <span className="font-mono text-teal-300">doctor</span></div>
                    <div>🔬 Lab/Scan: <span className="font-mono text-emerald-300 font-bold">tech_murugan</span> or <span className="font-mono text-emerald-300">lab</span></div>
                    <div>💊 Pharmacy: <span className="font-mono text-purple-300 font-bold">pharm_radha</span> or <span className="font-mono text-purple-300">pharmacy</span></div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-600 hover:to-teal-600 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{lang === 'ta' ? 'தொடரவும் / உள்நுழைக' : 'Continue / Proceed'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link to New Patient Registration */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">
                {lang === 'ta' ? 'முதல்முறையாக வருகை தரும் புதிய நோயாளி?' : 'Visiting this hospital for the first time?'}
              </p>
              <button
                type="button"
                onClick={() => switchStep('register')}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'புதிய நோயாளி பதிவு செய்யவும்' : 'New Patient Registration'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW 2A: PATIENT OTP VERIFICATION */}
        {/* ================================================================ */}
        {activeStep === 'patient_otp' && (
          <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={cancelOtpSession}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'எண்ணை மாற்றவும் / உள்நுழைவுக்குச் செல்லவும்' : 'Change Mobile Number / Back to Login'}</span>
            </button>

            {isOtpExpired ? (
              <div className="p-4 bg-amber-950/60 border-2 border-amber-500/50 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'ta' ? 'OTP காலம் முடிந்துவிட்டது' : 'Your OTP session has expired. Please request a new OTP.'}
                </h3>
                <p className="text-xs text-amber-200">
                  {lang === 'ta' ? '10 நிமிட கால அவகாசம் முடிந்தது.' : 'The OTP verification window has lapsed.'}
                </p>
                <button
                  type="button"
                  onClick={cancelOtpSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{lang === 'ta' ? 'புதிய OTP கோரவும்' : 'Request New OTP'}</span>
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                    {lang === 'ta' ? 'OTP சரிபார்ப்பு' : 'Patient OTP Verification'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {lang === 'ta' ? 'அனுப்பப்பட்ட எண்:' : 'OTP sent to:'}{' '}
                    <strong className="text-teal-300 font-mono font-bold">
                      {pendingOtpSession?.maskedPhone || `+91 ${pendingOtpSession?.phone || ''}`}
                    </strong>
                  </p>
                  {pendingOtpSession?.patientName && (
                    <div className="text-xs text-slate-400">
                      Patient Account: <strong className="text-slate-200">{pendingOtpSession.patientName}</strong>
                    </div>
                  )}
                </div>

                {/* Clear Demo Mode Indicator */}
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span>Demo Mode Active</span>
                  </div>
                  <p className="text-xs text-amber-200">
                    Demo OTP Code:{' '}
                    <span className="font-mono text-sm font-extrabold text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600">
                      {pendingOtpSession?.demoOtp || '123456'}
                    </span>
                  </p>
                  <p className="text-[10px] text-amber-400/80">
                    Backend strictly verifies this OTP before granting access to patient records.
                  </p>
                </div>

                {/* 6-Digit OTP Inputs */}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 text-center mb-2.5">
                      {lang === 'ta' ? '6 இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Enter 6-digit OTP'}
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
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
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50 transition-all"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={loading || otpDigits.join('').length !== 6}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>{lang === 'ta' ? 'OTP சரிபார்க்கவும்' : 'Verify OTP & Continue'}</span>
                        </>
                      )}
                    </button>

                    {/* Quick Auto-fill button for demo convenience */}
                    <button
                      type="button"
                      onClick={() => {
                        const code = pendingOtpSession?.demoOtp || '123456';
                        setOtpDigits(code.split('').slice(0, 6));
                      }}
                      className="w-full py-1 text-center text-xs text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
                    >
                      [ Auto-fill Demo OTP: {pendingOtpSession?.demoOtp || '123456'} ]
                    </button>
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
          <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => switchStep('identify')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'பயனர்பெயரை மாற்றவும்' : 'Switch Username'}</span>
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-teal-900/40 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-2">
                {detectedStaff.role === 'doctor' ? (
                  <Stethoscope className="w-6 h-6" />
                ) : detectedStaff.role === 'scan_lab' ? (
                  <FlaskConical className="w-6 h-6" />
                ) : (
                  <Pill className="w-6 h-6" />
                )}
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 uppercase">
                STAFF ROLE: {detectedStaff.role.toUpperCase()}
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white pt-1">{detectedStaff.fullName}</h2>
              <p className="text-xs text-slate-400 font-mono">@{detectedStaff.username}</p>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'ta' ? 'கடவுச்சொல்' : 'Staff Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. password123)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    autoFocus
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Demo password: <strong className="text-slate-400 font-mono">password123</strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
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

        {/* ================================================================ */}
        {/* VIEW 3: NEW PATIENT REGISTRATION */}
        {/* ================================================================ */}
        {activeStep === 'register' && (
          <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => switchStep('identify')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'உள்நுழைவுக்குத் திரும்பு' : 'Back to Login'}</span>
            </button>

            <div className="text-center space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                {lang === 'ta' ? 'புதிய நோயாளி பதிவு' : 'New Patient Registration'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                {lang === 'ta' ? 'உங்கள் விவரங்களை உள்ளிடவும்' : 'Register with Mobile Number'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ta'
                  ? 'பயனர்பெயர் அல்லது கடவுச்சொல் தேவையில்லை. உங்கள் மொபைல் எண் மூலம் அணுகலாம்.'
                  : 'No username or password required. Your mobile number will be your permanent login identifier.'}
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {lang === 'ta' ? 'முழு பெயர்' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="e.g. Murugesan K."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">{lang === 'ta' ? 'வயது' : 'Age'} *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={regForm.age}
                    onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                    placeholder="e.g. 48"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">{lang === 'ta' ? 'பாலினம்' : 'Gender'} *</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">{lang === 'ta' ? 'இரத்த வகை' : 'Blood Group'}</label>
                  <select
                    value={regForm.bloodGroup}
                    onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500"
                  >
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
                  <label className="block font-medium text-slate-300 mb-1">{lang === 'ta' ? 'மருந்து ஒவ்வாமை' : 'Known Allergies'}</label>
                  <input
                    type="text"
                    value={regForm.allergies}
                    onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
                    placeholder="e.g. Penicillin / None"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {lang === 'ta' ? 'நீண்டகால நோய்கள் (Chronic Conditions)' : 'Chronic Conditions'}
                </label>
                <input
                  type="text"
                  value={regForm.chronicConditions}
                  onChange={(e) => setRegForm({ ...regForm, chronicConditions: e.target.value })}
                  placeholder="e.g. Diabetes, Hypertension, Asthma / None Reported"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
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
                    className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'ta'
                    ? 'இந்த மொபைல் எண் உங்களின் நிரந்தர அடையாளமாக சேமிக்கப்படும்.'
                    : 'This mobile number will be your permanent login key and receive real-time queue updates.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
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
      </main>

      {/* Institutional Footer */}
      <footer className="bg-[#051020] border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        GH QueueFlow • District Headquarter Government Hospital • Ministry of Health & Family Welfare
      </footer>
    </div>
  );
};
