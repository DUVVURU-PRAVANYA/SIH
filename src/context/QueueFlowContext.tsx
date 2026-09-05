import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserRole,
  AuthStatus,
  PendingOtpSession,
  Language,
  AccessibilitySettings,
  Patient,
  DepartmentStats,
  HospitalComparison,
  PHCReferral,
  AppNotification,
  CommandKPIData,
  DoctorNotes,
  LabOrder,
  DiagnosticOrder,
  PharmacyOrder,
  CallAssistanceRequest,
  PaymentRecord,
  RevisitSchedule,
  PathColor,
  LabResultItem,
} from '../types';
import {
  initialPatients,
  initialDepartments,
  initialHospitalComparisons,
  initialReferrals,
  initialNotifications,
  initialKPIData,
  initialLabOrders,
  initialDiagnosticOrders,
  initialPharmacyOrders,
  initialCallRequests,
} from '../data/initialData';
import { voiceService } from '../utils/voice';
import { getT } from '../utils/translations';
import { apiClient } from '../services/api';

interface QueueFlowContextType {
  // Navigation & Preferences
  role: UserRole;
  setRole: (role: UserRole) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (keyPath: string, vars?: Record<string, string | number>) => string;
  accessibility: AccessibilitySettings;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;

  // Real Database Active Visit & Current Patient
  currentPatient: Patient | null;
  hasActiveVisit: boolean;
  activeVisitData: any | null;
  loadActiveVisit: (patientId?: string) => Promise<void>;
  createPatientVisit: (data: {
    patientId: string;
    doctorId?: string;
    departmentId: string;
    symptoms?: string;
    priority?: string;
  }) => Promise<any>;

  // Hospital & Data
  hospitalConfig: {
    name: string;
    location: string;
    state: string;
    totalBeds: number;
    icuBedsAvailable: number;
    contactPhone: string;
    assistanceHotline: string;
  };
  patients: Patient[];
  activePatient: Patient | null;
  activeJourneyId: string;
  setActivePatientId: (id: string) => void;
  departments: DepartmentStats[];
  hospitalComparisons: HospitalComparison[];
  referrals: PHCReferral[];
  notifications: AppNotification[];
  kpiData: CommandKPIData;

  // Domain Orders
  labOrders: LabOrder[];
  diagnosticOrders: DiagnosticOrder[];
  pharmacyOrders: PharmacyOrder[];
  callRequests: CallAssistanceRequest[];
  payments: PaymentRecord[];
  revisits: RevisitSchedule[];

  // System Controls
  isEmergencyMode: boolean;
  toggleEmergencyMode: () => void;
  isSimulationActive: boolean;
  toggleSimulation: () => void;
  resetToSeedData: () => void;

  // Demo Walkthrough Scenario
  demoStep: number;
  isDemoMode: boolean;
  startDemoScenario: () => void;
  nextDemoStep: () => void;
  prevDemoStep: () => void;
  exitDemoScenario: () => void;
  jumpToDemoStep: (step: number) => void;

  // Patient Actions
  registerPatient: (data: {
    name: string;
    nameTa?: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    departmentId: string;
    bloodGroup?: string;
    allergies?: string[];
    existingConditions?: string[];
    priority?: 'normal' | 'senior' | 'urgent' | 'emergency';
    address?: string;
    emergencyContact?: string;
  }) => Promise<Patient>;

  // Doctor Actions
  callNextOPDPatient: (deptId?: string) => void;
  startConsultation: (patientId: string) => void;
  submitDoctorConsultation: (
    patientId: string,
    notes: DoctorNotes,
    orders: {
      labTests?: string[];
      labPriority?: 'routine' | 'urgent';
      labSchedule?: 'today' | 'next_day';
      diagnosticModality?: 'x-ray' | 'ultrasound' | 'ct' | 'mri';
      diagnosticTestName?: string;
      diagnosticPriority?: 'routine' | 'urgent';
      diagnosticNotes?: string;
      prescriptions?: { name: string; dosage: string; frequency: string; duration: string; instructions: string; quantity?: number }[];
      scheduleRevisit?: { date: string; time: string; reason: string };
      isComplete?: boolean;
    }
  ) => void;
  reviewAndCompleteResults: (
    patientId: string,
    doctorRemarks: string,
    medications?: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[]
  ) => void;
  doctorRevisitDecision: (
    patientId: string,
    decisionType: 'normal' | 'emergency' | 'late_result',
    data?: {
      doctorRemarks?: string;
      expectedResultTime?: string;
      revisitDate?: string;
      revisitTime?: string;
      medications?: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[];
    }
  ) => void;

  // Lab Actions
  updateLabOrderStatus: (orderId: string, status: LabOrder['status'], results?: LabResultItem[]) => void;

  // Diagnostic Actions
  updateDiagnosticStatus: (orderId: string, status: DiagnosticOrder['status'], report?: { findingsSummary: string; observations: string; recommendations: string }) => void;

  // Pharmacy Actions
  updatePharmacyStatus: (orderId: string, status: PharmacyOrder['status']) => void;

  // Reception / Assistance Actions
  logCallAssistanceRequest: (data: Omit<CallAssistanceRequest, 'id' | 'createdAt' | 'status'>) => void;
  convertCallToRegistration: (requestId: string) => Promise<Patient>;

  // Payment Actions
  processPayment: (patientId: string, method: 'Cash' | 'UPI' | 'Card' | 'Govt Scheme') => void;

  // Admin Actions
  applyBottleneckAction: (deptId: string) => void;
  pauseDepartmentQueue: (deptId: string) => void;
  resumeDepartmentQueue: (deptId: string) => void;
  assignDepartmentCounters: (deptId: string, count: number) => void;

  // PHC Referral Actions
  createPHCReferral: (referralData: Omit<PHCReferral, 'id' | 'createdAt' | 'status' | 'metrics'>) => Promise<PHCReferral>;
  acceptReferral: (referralId: string) => Promise<void>;

  // Notifications & Voice
  dismissNotification: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  speakPatientGuidance: (patientOverride?: Patient) => void;
  stopVoice: () => void;

  // Authentication & Session Persistence
  authStatus: AuthStatus;
  pendingOtpSession: PendingOtpSession | null;
  currentPath: string;
  navigate: (to: string) => void;
  requestPatientOtp: (phone: string) => Promise<{ success: boolean; next?: string; mobile?: string; demoOtp?: string; patientName?: string; maskedPhone?: string; error?: string }>;
  cancelOtpSession: () => void;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; demoOtp?: string; error?: string; patientName?: string; maskedPhone?: string }>;
  verifyPatientOtp: (phone: string, otp: string) => Promise<{ success: boolean; hasActiveVisit?: boolean; error?: string; patient?: any }>;
  loginStaff: (username: string, password?: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  registerPatientWithPhone: (data: { name: string; age: number; gender: 'Male' | 'Female' | 'Other'; phone: string; bloodGroup?: string; allergies?: string[]; chronicConditions?: string[] }) => Promise<{ success: boolean; demoOtp?: string; error?: string; patient?: any }>;
  updatePatientProfile: (patientId: string, data: { name?: string; nameTa?: string; age?: number; gender?: string; bloodGroup?: string; allergies?: string[] | string; chronicConditions?: string[] | string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  refreshDoctorQueue: (deptId?: string) => Promise<void>;
  refreshLabOrders: () => Promise<void>;
  refreshPharmacyOrders: () => Promise<void>;
  logout: () => void;
}

const QueueFlowContext = createContext<QueueFlowContextType | undefined>(undefined);

export const QueueFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pending OTP Session state (Restored on refresh)
  const [pendingOtpSession, setPendingOtpSession] = useState<PendingOtpSession | null>(() => {
    try {
      const savedOtp = sessionStorage.getItem('gh_pending_otp') || localStorage.getItem('gh_pending_otp');
      if (savedOtp) {
        const parsed = JSON.parse(savedOtp);
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Explicit Auth Status: 'NOT_AUTHENTICATED' | 'OTP_PENDING' | 'AUTHENTICATED'
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    try {
      const savedOtp = sessionStorage.getItem('gh_pending_otp') || localStorage.getItem('gh_pending_otp');
      if (savedOtp) {
        const parsed = JSON.parse(savedOtp);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          return 'OTP_PENDING';
        }
      }
      const saved = localStorage.getItem('gh_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role && ['patient', 'doctor', 'scan_lab', 'pharmacy'].includes(parsed.role)) {
          return 'AUTHENTICATED';
        }
      }
    } catch {
      // ignore
    }
    return 'NOT_AUTHENTICATED';
  });

  // URL / Route synchronization
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash.startsWith('/') ? hash : `/${hash}`;
    return window.location.pathname || '/login';
  });

  const navigate = useCallback((to: string) => {
    const normalized = to.startsWith('/') ? to : `/${to}`;
    setCurrentPath(normalized);
    try {
      window.location.hash = normalized;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        setCurrentPath(hash.startsWith('/') ? hash : `/${hash}`);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Restore persisted session if available
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('gh_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role && ['patient', 'doctor', 'scan_lab', 'pharmacy'].includes(parsed.role)) {
          return parsed.role;
        }
      }
    } catch {
      // ignore
    }
    return 'auth';
  });

  const [hasActiveVisit, setHasActiveVisit] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gh_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.hasActiveVisit);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [activeVisitData, setActiveVisitData] = useState<any | null>(null);

  const [activePatientId, setActivePatientIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gh_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.patientId) return parsed.patientId;
      }
    } catch {
      // ignore
    }
    return '';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      if (newRole === 'auth') {
        localStorage.removeItem('gh_session');
      } else {
        const existing = JSON.parse(localStorage.getItem('gh_session') || '{}');
        localStorage.setItem('gh_session', JSON.stringify({ ...existing, role: newRole }));
      }
    } catch {
      // ignore
    }
  };

  const setActivePatientId = (id: string) => {
    setActivePatientIdState(id);
    try {
      const existing = JSON.parse(localStorage.getItem('gh_session') || '{}');
      localStorage.setItem('gh_session', JSON.stringify({ ...existing, patientId: id }));
    } catch {
      // ignore
    }
  };

  const [lang, setLang] = useState<Language>('en'); // Default English with 1-click Tamil toggle
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 'normal',
    highContrast: false,
    voiceEnabled: true,
    speechRate: 0.95,
    reducedMotion: false,
  });

  const [hospitalConfig] = useState({
    name: 'District Government Headquarter Hospital',
    location: 'Madurai, Tamil Nadu',
    state: 'Tamil Nadu',
    totalBeds: 1250,
    icuBedsAvailable: 6,
    contactPhone: '+91 452 2532535',
    assistanceHotline: '1800-425-4444',
  });

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [activeJourneyId] = useState<string>('JNY-20260904-004281');
  const [departments, setDepartments] = useState<DepartmentStats[]>(initialDepartments);
  const [hospitalComparisons] = useState<HospitalComparison[]>(initialHospitalComparisons);
  const [referrals, setReferrals] = useState<PHCReferral[]>(initialReferrals);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [kpiData, setKpiData] = useState<CommandKPIData>(initialKPIData);

  const [labOrders, setLabOrders] = useState<LabOrder[]>(initialLabOrders);
  const [diagnosticOrders, setDiagnosticOrders] = useState<DiagnosticOrder[]>(initialDiagnosticOrders);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>(initialPharmacyOrders);
  const [callRequests, setCallRequests] = useState<CallAssistanceRequest[]>(initialCallRequests);
  const [payments, setPayments] = useState<PaymentRecord[]>([
    {
      id: 'PAY-2026-004281',
      patientId: 'GH-2026-004281',
      patientToken: 'OP-047',
      patientName: 'Anitha Kumar',
      services: [
        { name: 'OP Consultation & Registration Fee', amount: 10 },
        { name: 'Pathology Blood Sugar & CBC Panel', amount: 50 },
        { name: 'Digital Chest X-Ray (Govt Subsidized)', amount: 100 },
        { name: 'Generic Medicines (TNMSC Scheme)', amount: 0 },
      ],
      totalAmount: 160,
      status: 'pending',
    },
  ]);
  const [revisits, setRevisits] = useState<RevisitSchedule[]>([]);

  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const t = useCallback(getT(lang), [lang]);

  // Real Database Active Visit Loader
  const loadActiveVisit = useCallback(async (targetPatientId?: string) => {
    const idToUse = targetPatientId || activePatientId;
    if (!idToUse) return;

    try {
      const res: any = await apiClient.getActiveVisit(idToUse);
      if (res.success && res.hasActiveVisit && res.data) {
        setHasActiveVisit(true);
        setActiveVisitData(res.data);
        if (res.patient) {
          setCurrentPatient(res.patient as any);
        }
      } else {
        setHasActiveVisit(false);
        setActiveVisitData(null);
        if (res.patient) {
          setCurrentPatient(res.patient as any);
        }
      }
    } catch (err) {
      console.warn('Could not load active visit:', err);
    }
  }, [activePatientId]);

  const createPatientVisit = async (data: {
    patientId: string;
    doctorId?: string;
    departmentId: string;
    symptoms?: string;
    priority?: string;
    forceNew?: boolean;
  }) => {
    const res = await apiClient.createVisit(data);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to create visit');
    }

    setHasActiveVisit(true);
    await loadActiveVisit(data.patientId);

    const pat = currentPatient || (activePatientId ? patients.find((p) => p.id === activePatientId) : null);
    const patName = pat?.name || 'Patient';
    const dept = departments.find((d) => d.id === data.departmentId);

    const newPat: Patient = {
      id: data.patientId,
      token: res.data.tokenNumber,
      name: patName,
      nameTa: pat?.nameTa || patName,
      age: pat?.age || 35,
      gender: pat?.gender || 'Female',
      phone: pat?.phone || '',
      bloodGroup: pat?.bloodGroup || 'B+',
      allergies: pat?.allergies || [],
      existingConditions: pat?.existingConditions || [],
      priority: (pat?.priority || 'normal') as any,
      abhaId: pat?.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      departmentId: data.departmentId,
      departmentName: res.data.department?.name || dept?.name || 'General Medicine OPD',
      departmentNameTa: res.data.department?.nameTa || dept?.nameTa || 'பொது மருத்துவம்',
      queuePosition: res.data.queueMetrics?.peopleAhead || 1,
      estimatedWaitMinutes: res.data.queueMetrics?.estimatedWaitMinutes || 15,
      status: 'normal',
      currentStage: 'doctor',
      vitals: {
        bp: '120/80 mmHg',
        pulse: '72 bpm',
        temp: '98.6 °F',
        weight: '60 kg',
        spo2: '99%',
      },
      stagesHistory: [
        {
          stage: 'registration',
          title: 'Central Registration & Token Triage',
          titleTa: 'மைய பதிவு மற்றும் டோக்கன் பிரிவு',
          departmentCode: 'REG',
          tokenNumber: `REG-${data.patientId.slice(-4)}`,
          status: 'completed',
          room: 'Counter 2',
          block: 'Block A',
          floor: 'Ground Floor',
          color: 'yellow',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          stage: 'doctor',
          title: `${res.data.department?.name || 'General Medicine'} Consultation`,
          titleTa: `${res.data.department?.nameTa || 'பொது மருத்துவம்'} ஆலோசனை`,
          departmentCode: res.data.department?.code || 'GM',
          tokenNumber: res.data.tokenNumber,
          status: 'current',
          room: res.data.department?.roomNumber || 'Room 12',
          block: res.data.department?.blockName || 'Block B',
          floor: res.data.department?.floorName || 'Ground Floor',
          color: res.data.department?.color || 'blue',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      location: {
        block: res.data.department?.blockName || 'Block B',
        floor: res.data.department?.floorName || 'Ground Floor',
        room: res.data.department?.roomNumber || 'Room 12',
        pathColor: res.data.department?.color || 'blue',
        pathName: `Follow Blue Path → Room 12`,
        pathNameTa: `நீல வழியைப் பின்பற்றவும் → அறை 12`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === data.patientId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newPat };
        return copy;
      }
      return [newPat, ...prev];
    });

    setCurrentPatient(newPat);

    try {
      const existing = JSON.parse(localStorage.getItem('gh_session') || '{}');
      localStorage.setItem('gh_session', JSON.stringify({ ...existing, hasActiveVisit: true }));
    } catch {
      // ignore
    }

    return res.data;
  };

  // Real Database Queue & Orders Refreshers
  const refreshDoctorQueue = useCallback(async (deptId: string = 'dept-genmed') => {
    try {
      const res = await apiClient.getQueue(deptId);
      if (res.success && Array.isArray(res.data)) {
        const queuePatients: Patient[] = res.data.map((q: any) => ({
          id: q.patientId,
          name: q.patientName,
          nameTa: q.patientName,
          age: q.patientAge || 35,
          gender: q.patientGender || 'Male',
          phone: '',
          abhaId: q.abhaId || '',
          token: q.tokenNumber,
          departmentId: q.departmentId,
          departmentName: 'General Medicine (OPD)',
          departmentNameTa: 'பொது மருத்துவம்',
          currentStage: 'doctor' as const,
          queuePosition: q.queuePosition || 1,
          estimatedWaitMinutes: Math.max(1, (q.queuePosition || 1) * 3),
          status: q.status === 'in_service' ? 'in_consultation' : q.status === 'called' ? 'approaching' : 'normal',
          priority: q.priority || 'normal',
          bloodGroup: 'B+ve',
          allergies: ['None Reported'],
          existingConditions: ['None Reported'],
          address: 'Madurai District',
          emergencyContact: 'Family Member',
          vitals: q.vitals || {
            bp: '120/80 mmHg',
            pulse: '76 bpm',
            temp: '98.4 °F',
            weight: '62 kg',
            spo2: '99%',
          },
          stagesHistory: [
            {
              stage: 'registration',
              title: 'Central Registration & Token Triage',
              titleTa: 'மைய பதிவு மற்றும் டோக்கன் பிரிவு',
              departmentCode: 'REG',
              tokenNumber: `REG-${q.patientId.slice(-4)}`,
              status: 'completed',
              room: 'Counter 2',
              block: 'Block A',
              floor: 'Ground Floor',
              color: 'yellow',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            {
              stage: 'doctor',
              title: 'General Medicine Consultation',
              titleTa: 'பொது மருத்துவம் ஆலோசனை',
              departmentCode: 'GM',
              tokenNumber: q.tokenNumber,
              status: q.status === 'in_service' || q.status === 'called' ? 'current' : 'upcoming',
              room: 'Rooms 4-8',
              block: 'Block B',
              floor: 'Ground Floor',
              color: 'blue',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
          location: {
            block: 'Block B',
            floor: 'Ground Floor',
            room: 'Rooms 4-8',
            pathColor: 'blue',
            pathName: 'Follow Blue Path → Block B → Rooms 4-8',
            pathNameTa: 'நீல வழித்தடத்தை பின்தொடரவும் → பிளாக் B → அறைகள் 4-8',
          },
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: q.createdAt || new Date().toISOString(),
        }));

        setPatients((prev) => {
          const otherDept = prev.filter((p) => p.departmentId !== deptId);
          return [...queuePatients, ...otherDept];
        });
      }
    } catch (err) {
      console.warn('Could not refresh doctor queue:', err);
    }
  }, []);

  const refreshLabOrders = useCallback(async () => {
    try {
      const res = await apiClient.getDiagnostics();
      if (res.success && Array.isArray(res.data)) {
        const mappedOrders: LabOrder[] = res.data.map((ord: any) => ({
          id: ord.id,
          patientId: ord.patientId || (ord.journeyId ? ord.journeyId.replace(/^JNY-/, '') : 'GH-P-00127'),
          patientName: ord.patientName || 'Patient',
          patientToken: ord.tokenNumber || 'GM-029',
          requestedByDoctor: 'Dr. Priya Kumar (MD - Gen Med)',
          tests: [ord.testName || 'Diagnostic Investigation'],
          priority: 'routine' as const,
          schedule: 'today' as const,
          status: ord.status === 'completed'
            ? 'result_ready'
            : ord.status === 'in_progress'
            ? 'sample_collected'
            : 'pending',
          results: ord.findingsSummary
            ? [
                {
                  testName: ord.testName || 'Diagnostic Investigation',
                  value: ord.findingsSummary,
                  unit: '',
                  referenceRange: 'Clinical Range',
                  isAbnormal: false,
                  remarks: ord.findingsSummary,
                },
              ]
            : undefined,
          createdAt: ord.orderedAt || ord.createdAt || new Date().toISOString(),
          completedAt: ord.completedAt,
        }));
        setLabOrders(mappedOrders);
      }
    } catch (err) {
      console.warn('Could not refresh lab orders:', err);
    }
  }, []);

  const refreshPharmacyOrders = useCallback(async () => {
    try {
      const res = await apiClient.getPharmacyOrders();
      if (res.success && Array.isArray(res.data)) {
        const mappedOrders: PharmacyOrder[] = res.data.map((ord: any) => ({
          id: ord.id,
          patientId: ord.patientId || (ord.journeyId ? ord.journeyId.replace(/^JNY-/, '') : 'GH-P-00127'),
          patientName: ord.patientName || 'Patient',
          patientToken: ord.tokenNumber || 'PH-001',
          doctorName: ord.doctorName || 'Dr. Priya Kumar',
          medications: (ord.medications || []).map((m: any, idx: number) => ({
            id: m.id || `m-${idx}`,
            name: m.name,
            dosage: m.dosage || '500mg',
            frequency: m.frequency || '1-0-1',
            duration: m.duration || '5 Days',
            instructions: m.instructions || 'After Food',
            quantity: m.quantity || 10,
          })),
          status: ord.status === 'dispensed'
            ? 'dispensed'
            : ord.status === 'ready'
            ? 'ready'
            : ord.status === 'preparing'
            ? 'preparing'
            : 'waiting',
          counterNumber: ord.counterNumber || 'Counter 3',
          tokenNumber: ord.tokenNumber || 'PH-001',
          totalAmount: 0,
          isPaid: true,
          createdAt: ord.createdAt || new Date().toISOString(),
          completedAt: ord.dispensedAt,
        }));
        setPharmacyOrders(mappedOrders);
      }
    } catch (err) {
      console.warn('Could not refresh pharmacy orders:', err);
    }
  }, []);

  // Initial fetch for all roles on mount
  useEffect(() => {
    if (activePatientId && role === 'patient') {
      loadActiveVisit(activePatientId);
    }
    refreshDoctorQueue('dept-genmed');
    refreshLabOrders();
    refreshPharmacyOrders();
  }, [activePatientId, role, loadActiveVisit, refreshDoctorQueue, refreshLabOrders, refreshPharmacyOrders]);

  // Dynamic real-time polling every 3 seconds for all portals
  useEffect(() => {
    const interval = setInterval(() => {
      if (role === 'patient' && activePatientId && hasActiveVisit) {
        loadActiveVisit(activePatientId);
      } else if (role === 'doctor') {
        refreshDoctorQueue('dept-genmed');
        refreshLabOrders();
      } else if (role === 'scan_lab') {
        refreshLabOrders();
      } else if (role === 'pharmacy') {
        refreshPharmacyOrders();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [role, activePatientId, hasActiveVisit, loadActiveVisit, refreshDoctorQueue, refreshLabOrders, refreshPharmacyOrders]);

  // Active Patient lookup: derived from real database visit
  const basePatient = currentPatient || (activePatientId ? patients.find((p) => p.id === activePatientId) : null) || null;

  const activePatient: Patient | null = basePatient
    ? {
        ...basePatient,
        ...(activeVisitData
          ? {
              token: activeVisitData.journey?.currentToken || activeVisitData.queueMetrics?.tokenNumber || basePatient.token,
              departmentId: activeVisitData.department?.id || basePatient.departmentId,
              departmentName: activeVisitData.department?.name || basePatient.departmentName,
              departmentNameTa: activeVisitData.department?.nameTa || basePatient.departmentNameTa,
              currentStage: activeVisitData.journey?.currentStage || 'doctor',
              queuePosition: activeVisitData.queueMetrics?.peopleAhead !== undefined ? activeVisitData.queueMetrics.peopleAhead : basePatient.queuePosition,
              estimatedWaitMinutes: activeVisitData.queueMetrics?.estimatedWaitMinutes !== undefined ? activeVisitData.queueMetrics.estimatedWaitMinutes : basePatient.estimatedWaitMinutes,
              status: activeVisitData.queueMetrics?.queueStatus === 'in_service'
                ? 'in_consultation'
                : activeVisitData.queueMetrics?.queueStatus === 'called'
                ? 'your_turn'
                : 'normal',
            }
          : {}),
      }
    : null;

  // Sync voice settings
  useEffect(() => {
    voiceService.setMute(!accessibility.voiceEnabled);
    voiceService.setRate(accessibility.speechRate);
  }, [accessibility.voiceEnabled, accessibility.speechRate]);

  const updateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    voiceService.playChime(notif.type === 'turn' ? 'turn' : 'alert');
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Speak voice assistance
  const speakPatientGuidance = useCallback((patientOverride?: Patient) => {
    const p = patientOverride || activePatient;
    if (!p) return;

    if (p.currentStage === 'doctor') {
      if (p.status === 'your_turn') {
        const text =
          lang === 'ta'
            ? `இப்போது உங்கள் முறை. தயவுசெய்து ${p.location.room} உள்ளே செல்லவும்.`
            : `It is your turn now. Please enter ${p.location.room} for consultation.`;
        voiceService.speak(text, lang);
      } else {
        const text =
          lang === 'ta'
            ? `வணக்கம். உங்கள் டோக்கன் எண் ${p.token}. ${p.location.room}, ${p.location.block}, தளம் ${p.location.floor}க்கு செல்லவும். நீல அம்புக்குறிகளை பின்தொடரவும். உங்களுக்கு முன்னால் ${p.queuePosition} நோயாளிகள் உள்ளனர்.`
            : `Welcome. Your token is ${p.token}. Please proceed to ${p.location.room}, ${p.location.block}, ${p.location.floor}. Follow Blue path. ${p.queuePosition} patients ahead.`;
        voiceService.speak(text, lang);
      }
    } else if (p.currentStage === 'lab') {
      const text =
        lang === 'ta'
          ? `மருத்துவர் ரத்த பரிசோதனை பரிந்துரைத்துள்ளார். பச்சை வழித்தடத்தை பின்தொடர்ந்து ஆய்வகம் அறை 101-க்கு செல்லவும்.`
          : `Doctor has ordered laboratory tests. Please follow the Green path to Room 101 Biochemistry Lab.`;
      voiceService.speak(text, lang);
    } else if (p.currentStage === 'diagnostic') {
      const text =
        lang === 'ta'
          ? `ஆரஞ்சு வழித்தடத்தை பின்தொடர்ந்து எக்ஸ்-ரே அறை 108-க்கு செல்லவும்.`
          : `Please follow the Orange path to Room 108 for your Diagnostic X-Ray.`;
      voiceService.speak(text, lang);
    } else if (p.currentStage === 'pharmacy') {
      const text =
        lang === 'ta'
          ? `மருந்துகள் தயாராக உள்ளன. ஊதா வழித்தடத்தை பின்தொடர்ந்து மருந்தக கவுண்டர் 03-க்கு செல்லவும்.`
          : `Your prescription is ready. Please proceed to Pharmacy Counter 03 following the Purple path.`;
      voiceService.speak(text, lang);
    } else if (p.currentStage === 'completed') {
      const text =
        lang === 'ta'
          ? `உங்கள் மருத்துவமனை வருகை வெற்றிகரமாக முடிந்தது. நன்றி. விரைவில் நலம் பெற வாழ்த்துகிறோம்.`
          : `Your hospital visit is completed. Thank you. Wish you a speedy recovery.`;
      voiceService.speak(text, lang);
    }
  }, [activePatient, lang]);

  const stopVoice = () => {
    voiceService.stop();
  };

  // 1. Register Patient (Patient or Reception Walk-in)
  const registerPatient = async (data: {
    name: string;
    nameTa?: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    departmentId: string;
    bloodGroup?: string;
    allergies?: string[];
    existingConditions?: string[];
    priority?: 'normal' | 'senior' | 'urgent' | 'emergency';
    address?: string;
    emergencyContact?: string;
  }): Promise<Patient> => {
    const dept = departments.find((d) => d.id === data.departmentId) || departments[1];
    const newIdNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `GH-2026-${newIdNum}`;
    const tokenNumber = `${dept.code}-${String(dept.waitingCount + 1).padStart(3, '0')}`;

    const newPat: Patient = {
      id: newId,
      name: data.name,
      nameTa: data.nameTa || data.name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      token: tokenNumber,
      departmentId: dept.id,
      departmentName: dept.name,
      departmentNameTa: dept.nameTa,
      currentStage: 'doctor',
      queuePosition: dept.waitingCount + 1,
      estimatedWaitMinutes: (dept.waitingCount + 1) * Math.round(dept.avgServiceMinutes),
      status: 'normal',
      priority: data.priority || 'normal',
      bloodGroup: data.bloodGroup || 'B+ve',
      allergies: data.allergies || ['None Reported'],
      existingConditions: data.existingConditions || ['None Reported'],
      address: data.address || 'Madurai District',
      emergencyContact: data.emergencyContact || 'Family Member',
      vitals: {
        bp: '120/80 mmHg',
        pulse: '76 bpm',
        temp: '98.4 °F',
        weight: '62 kg',
        spo2: '99%',
      },
      stagesHistory: [
        {
          stage: 'registration',
          title: 'Central Registration & Token Triage',
          titleTa: 'மைய பதிவு மற்றும் டோக்கன் பிரிவு',
          departmentCode: 'REG',
          tokenNumber: `REG-${newIdNum}`,
          status: 'completed',
          room: 'Counter 2',
          block: 'Block A',
          floor: 'Ground Floor',
          color: 'yellow',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          stage: 'doctor',
          title: `${dept.name} Consultation`,
          titleTa: `${dept.nameTa} ஆலோசனை`,
          departmentCode: dept.code,
          tokenNumber,
          status: 'current',
          room: dept.room,
          block: dept.block,
          floor: dept.floor,
          color: dept.color,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      location: {
        block: dept.block,
        floor: dept.floor,
        room: dept.room,
        pathColor: dept.color,
        pathName: `Follow ${dept.color.toUpperCase()} Path → ${dept.block} → ${dept.room}`,
        pathNameTa: `${dept.color.toUpperCase()} வழித்தடத்தை பின்தொடரவும் → ${dept.block} → ${dept.room}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPatients((prev) => [newPat, ...prev]);
    setActivePatientId(newId);

    // Update department stats
    setDepartments((prev) =>
      prev.map((d) => (d.id === dept.id ? { ...d, waitingCount: d.waitingCount + 1 } : d))
    );

    // Create payment ledger entry
    setPayments((prev) => [
      {
        id: `PAY-${newId}`,
        patientId: newId,
        patientToken: tokenNumber,
        patientName: data.name,
        services: [{ name: 'OP Consultation & Registration Fee', amount: 10 }],
        totalAmount: 10,
        status: 'pending',
      },
      ...prev,
    ]);

    addNotification({
      title: `Registration Successful: ${tokenNumber}`,
      titleTa: `பதிவு வெற்றிகரமாக முடிந்தது: ${tokenNumber}`,
      message: `Patient ${data.name} assigned to ${dept.name} (${dept.room}).`,
      messageTa: `நோயாளி ${data.name} அவர்களுக்கு ${dept.nameTa} (${dept.room}) ஒதுக்கப்பட்டது.`,
      type: 'success',
      targetRole: 'patient',
    });

    return newPat;
  };

  // 2. Doctor OPD Queue Advance (Connects to Real Database Queue)
  const callNextOPDPatient = (deptId: string = 'dept-genmed') => {
    // 1. Call Backend API to advance queue in database
    apiClient.callPatient({ departmentId: deptId }).then(async (res) => {
      if (res.success) {
        await refreshDoctorQueue(deptId);
        if (activePatientId) {
          await loadActiveVisit(activePatientId);
        }
      }
    }).catch((err) => {
      console.warn('Backend call patient notification:', err);
    });

    // 2. Update local state as well
    setPatients((prev) => {
      const deptPatients = prev.filter((p) => p.departmentId === deptId && p.currentStage === 'doctor');
      if (deptPatients.length === 0) return prev;

      return prev.map((p) => {
        if (p.departmentId === deptId && p.currentStage === 'doctor') {
          const newPos = Math.max(0, p.queuePosition - 1);
          const newStatus = newPos === 0 ? 'in_consultation' : newPos === 1 ? 'approaching' : p.status;
          return {
            ...p,
            queuePosition: newPos,
            estimatedWaitMinutes: Math.max(1, newPos * 3),
            status: newStatus,
          };
        }
        return p;
      });
    });

    addNotification({
      title: 'OPD Queue Advanced',
      titleTa: 'OPD வரிசை நகர்த்தப்பட்டது',
      message: 'Next patient called into Consultation Room.',
      messageTa: 'அடுத்த நோயாளி அறைக்குள் அழைக்கப்பட்டார்.',
      type: 'info',
      targetRole: 'doctor',
    });
  };

  // 3. Start Doctor Consultation
  const startConsultation = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'in_consultation',
            stagesHistory: p.stagesHistory.map((s) => (s.stage === 'doctor' ? { ...s, status: 'current' } : s)),
          };
        }
        return p;
      })
    );

    addNotification({
      title: 'Consultation Started',
      titleTa: 'மருத்துவர் ஆலோசனை தொடங்கியது',
      message: `Consultation in progress for patient ${patientId}.`,
      messageTa: `நோயாளி ${patientId} அவர்களுக்கான ஆலோசனை நடைபெறுகிறது.`,
      type: 'info',
      targetRole: 'doctor',
    });
  };

  // 4. Submit Doctor Consultation & Multi-Orders
  const submitDoctorConsultation = (
    patientId: string,
    notes: DoctorNotes,
    orders: {
      labTests?: string[];
      labPriority?: 'routine' | 'urgent';
      labSchedule?: 'today' | 'next_day';
      diagnosticModality?: 'x-ray' | 'ultrasound' | 'ct' | 'mri';
      diagnosticTestName?: string;
      diagnosticPriority?: 'routine' | 'urgent';
      diagnosticNotes?: string;
      prescriptions?: { name: string; dosage: string; frequency: string; duration: string; instructions: string; quantity?: number }[];
      scheduleRevisit?: { date: string; time: string; reason: string };
      isComplete?: boolean;
    }
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);

    // Call Backend API to save Consultation, Prescription, and Diagnostic Orders to database
    const targetJourneyId = activeVisitData?.journey?.id || `JNY-${patientId}`;
    apiClient.completeConsultation({
      journeyId: targetJourneyId,
      patientId,
      doctorId: 'usr-doc-1',
      doctorName: 'Dr. Priya Kumar, MD, DM',
      diagnosis: notes.diagnosis,
      clinicalNotes: notes.clinicalNotes || (notes as any).notes || '',
      medications: orders.prescriptions?.map((p, idx) => ({
        id: `med-${idx + 1}`,
        name: p.name,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions,
        quantity: p.quantity || 10,
        isDispensed: false,
      })),
      investigations: orders.labTests || (orders.diagnosticTestName ? [orders.diagnosticTestName] : []),
      routeTo: orders.labTests && orders.labTests.length > 0 ? 'lab' : (orders.diagnosticTestName ? 'x-ray' : (orders.prescriptions && orders.prescriptions.length > 0 ? 'pharmacy' : 'complete')),
    }).then(async () => {
      await refreshDoctorQueue();
      await refreshLabOrders();
      await refreshPharmacyOrders();
      if (activePatientId) await loadActiveVisit(activePatientId);
    }).catch((err) => {
      console.warn('Backend complete consultation notification:', err);
    });

    if (!targetPatient) return;

    // Handle Lab Order
    if (orders.labTests && orders.labTests.length > 0) {
      const newLabOrder: LabOrder = {
        id: `LAB-ORD-${Date.now().toString().slice(-4)}`,
        patientId,
        patientName: targetPatient.name,
        patientToken: targetPatient.token,
        requestedByDoctor: 'Dr. Priya Kumar (MD - Gen Med)',
        tests: orders.labTests,
        priority: orders.labPriority || 'routine',
        schedule: orders.labSchedule || 'today',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setLabOrders((prev) => [newLabOrder, ...prev]);

      addNotification({
        title: 'Lab Investigation Requested',
        titleTa: 'ஆய்வக பரிசோதனை கோரிக்கை அனுப்பப்பட்டது',
        message: `${orders.labTests.join(', ')} ordered for ${targetPatient.name}. Please proceed to Room 101.`,
        messageTa: `${targetPatient.name} அவர்களுக்கு ஆய்வக பரிசோதனை பரிந்துரைக்கப்பட்டது. அறை 101-க்கு செல்லவும்.`,
        type: 'warning',
        targetRole: 'scan_lab',
      });
    }

    // Handle Diagnostic Order
    if (orders.diagnosticModality) {
      const newDiagOrder: DiagnosticOrder = {
        id: `DIAG-ORD-${Date.now().toString().slice(-4)}`,
        patientId,
        patientName: targetPatient.name,
        patientToken: targetPatient.token,
        requestedByDoctor: 'Dr. Priya Kumar',
        modality: orders.diagnosticModality,
        testName: orders.diagnosticTestName || `${orders.diagnosticModality.toUpperCase()} Scan`,
        priority: orders.diagnosticPriority || 'routine',
        clinicalNotes: orders.diagnosticNotes || notes.clinicalNotes,
        status: 'waiting',
        room: orders.diagnosticModality === 'x-ray' ? 'Room 108' : 'Room 112',
        createdAt: new Date().toISOString(),
      };
      setDiagnosticOrders((prev) => [newDiagOrder, ...prev]);

      addNotification({
        title: 'Diagnostic Scan Ordered',
        titleTa: 'ஸ்கேன் பரிசோதனை கோரிக்கை',
        message: `${newDiagOrder.testName} requested for ${targetPatient.name}. Proceed to Room 108.`,
        messageTa: `${newDiagOrder.testName} பரிந்துரைக்கப்பட்டது. அறை 108-க்கு செல்லவும்.`,
        type: 'warning',
        targetRole: 'scan_lab',
      });
    }

    // Handle Pharmacy Order
    if (orders.prescriptions && orders.prescriptions.length > 0) {
      const newPharmOrder: PharmacyOrder = {
        id: `PHARM-ORD-${Date.now().toString().slice(-4)}`,
        patientId,
        patientName: targetPatient.name,
        patientToken: targetPatient.token,
        doctorName: 'Dr. Priya Kumar',
        medications: orders.prescriptions.map((m, idx) => ({
          id: `m-${idx}`,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
          quantity: m.quantity || 30,
        })),
        status: 'waiting',
        counterNumber: 'Counter 03',
        tokenNumber: `PH-${targetPatient.token.slice(-3)}`,
        totalAmount: 0,
        isPaid: true,
        createdAt: new Date().toISOString(),
      };
      setPharmacyOrders((prev) => [newPharmOrder, ...prev]);

      addNotification({
        title: 'Prescription Transmitted to Pharmacy',
        titleTa: 'மருந்தகத்திற்கு மருந்து சீட்டு அனுப்பப்பட்டது',
        message: `Prescription for ${targetPatient.name} received at Pharmacy Counter 03.`,
        messageTa: `${targetPatient.name} அவர்களின் மருந்து சீட்டு மருந்தகம் கவுண்டர் 03-க்கு அனுப்பப்பட்டது.`,
        type: 'info',
        targetRole: 'pharmacy',
      });
    }

    // Handle Revisit
    if (orders.scheduleRevisit) {
      const newRevisit: RevisitSchedule = {
        id: `REV-${Date.now().toString().slice(-4)}`,
        patientId,
        patientName: targetPatient.name,
        date: orders.scheduleRevisit.date,
        time: orders.scheduleRevisit.time,
        department: targetPatient.departmentName,
        doctor: 'Dr. Priya Kumar',
        reason: orders.scheduleRevisit.reason,
        assignedToken: `REV-${targetPatient.token}`,
      };
      setRevisits((prev) => [newRevisit, ...prev]);
    }

    // Update Patient State
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          let nextStage: Patient['currentStage'] = 'completed';
          let nextStatus: Patient['status'] = 'completed';
          let nextLoc = {
            block: 'Block A',
            floor: 'Ground Floor',
            room: 'Exit Desk',
            pathColor: 'green' as PathColor,
            pathName: 'Exit Desk',
            pathNameTa: 'வெளியேறும் பிரிவு',
          };

          if (orders.labTests && orders.labTests.length > 0) {
            nextStage = 'lab';
            nextStatus = 'lab_pending';
            nextLoc = {
              block: 'Block C',
              floor: '1st Floor',
              room: 'Room 101 (Lab)',
              pathColor: 'green' as PathColor,
              pathName: 'Follow Green Path → Block C → 1st Floor → Room 101',
              pathNameTa: 'பச்சை வழித்தடத்தை பின்தொடரவும் → பிளாக் C → முதல் தளம் → அறை 101',
            };
          } else if (orders.diagnosticModality) {
            nextStage = 'diagnostic';
            nextStatus = 'scan_pending';
            nextLoc = {
              block: 'Block C',
              floor: 'Ground Floor',
              room: 'Room 108 (X-Ray)',
              pathColor: 'orange' as PathColor,
              pathName: 'Follow Orange Path → Block C → Ground Floor → Room 108',
              pathNameTa: 'ஆரஞ்சு வழித்தடத்தை பின்தொடரவும் → பிளாக் C → தரை தளம் → அறை 108',
            };
          } else if (orders.prescriptions && orders.prescriptions.length > 0) {
            nextStage = 'pharmacy';
            nextStatus = 'pharmacy_ready';
            nextLoc = {
              block: 'Block A',
              floor: 'Ground Floor',
              room: 'Counter 03',
              pathColor: 'purple' as PathColor,
              pathName: 'Follow Purple Path → Block A → Ground Floor → Counter 03',
              pathNameTa: 'ஊதா வழித்தடத்தை பின்தொடரவும் → பிளாக் A → தரை தளம் → கவுண்டர் 03',
            };
          }

          const updatedHistory = p.stagesHistory.map((s) => {
            if (s.stage === 'doctor') return { ...s, status: 'completed' as const };
            if (s.stage === nextStage) return { ...s, status: 'current' as const };
            return s;
          });

          return {
            ...p,
            doctorNotes: notes,
            currentStage: nextStage,
            status: nextStatus,
            location: nextLoc,
            stagesHistory: updatedHistory,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // 5. Review Completed Results (Doctor)
  const reviewAndCompleteResults = (
    patientId: string,
    doctorRemarks: string,
    medications?: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[]
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    if (medications && medications.length > 0) {
      const newPharmOrder: PharmacyOrder = {
        id: `PHARM-ORD-${Date.now().toString().slice(-4)}`,
        patientId,
        patientName: targetPatient.name,
        patientToken: targetPatient.token,
        doctorName: 'Dr. Priya Kumar',
        medications: medications.map((m, idx) => ({
          id: `m-rev-${idx}`,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
          quantity: 30,
        })),
        status: 'waiting',
        counterNumber: 'Counter 03',
        tokenNumber: `PH-${targetPatient.token.slice(-3)}`,
        totalAmount: 0,
        isPaid: true,
        createdAt: new Date().toISOString(),
      };
      setPharmacyOrders((prev) => [newPharmOrder, ...prev]);
    }

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            currentStage: 'pharmacy',
            status: 'pharmacy_ready',
            location: {
              block: 'Block A',
              floor: 'Ground Floor',
              room: 'Counter 03',
              pathColor: 'purple',
              pathName: 'Follow Purple Path → Block A → Ground Floor → Counter 03',
              pathNameTa: 'ஊதா வழித்தடத்தை பின்தொடரவும் → பிளாக் A → தரை தளம் → கவுண்டர் 03',
            },
            stagesHistory: p.stagesHistory.map((s) => {
              if (s.stage === 'lab' || s.stage === 'diagnostic' || s.stage === 'doctor_review') {
                return { ...s, status: 'completed' as const };
              }
              if (s.stage === 'pharmacy') return { ...s, status: 'current' as const };
              return s;
            }),
            doctorNotes: p.doctorNotes
              ? { ...p.doctorNotes, clinicalNotes: `${p.doctorNotes.clinicalNotes}\n[Review Note]: ${doctorRemarks}` }
              : undefined,
          };
        }
        return p;
      })
    );

    addNotification({
      title: 'Doctor Review Complete',
      titleTa: 'மருத்துவர் மதிப்பாய்வு நிறைவுற்றது',
      message: `Dr. Priya Kumar reviewed results for ${targetPatient.name} and issued prescription. Proceed to Pharmacy Counter 03.`,
      messageTa: `மருத்துவர் பிரியா குமார் பரிசோதனை முடிவுகளை சரிபார்த்து மருந்து சீட்டு வழங்கியுள்ளார். மருந்தகம் கவுண்டர் 03-க்கு செல்லவும்.`,
      type: 'success',
      targetRole: 'patient',
    });
  };

  // 5b. Doctor Revisit Decision (NORMAL vs EMERGENCY vs LATE_RESULT)
  const doctorRevisitDecision = (
    patientId: string,
    decisionType: 'normal' | 'emergency' | 'late_result',
    data?: {
      doctorRemarks?: string;
      expectedResultTime?: string;
      revisitDate?: string;
      revisitTime?: string;
      medications?: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[];
    }
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    if (decisionType === 'normal' || decisionType === 'emergency') {
      apiClient.createRevisit({
        patientId,
        decisionType,
        doctorRemarks: data?.doctorRemarks,
      }).then(async () => {
        await refreshDoctorQueue();
        if (activePatientId) await loadActiveVisit(activePatientId);
      }).catch((err) => {
        console.warn('Backend revisit error:', err);
      });
    }

    if (decisionType === 'normal') {
      const newToken = 'GM-039';
      setPatients((prev) =>
        prev.map((p) => {
          if (p.id === patientId) {
            return {
              ...p,
              token: newToken,
              currentStage: 'doctor',
              status: 'approaching',
              priority: 'normal',
              queuePosition: 1,
              estimatedWaitMinutes: 5,
              location: {
                block: 'Block B',
                floor: '2nd Floor',
                room: 'Room 204',
                pathColor: 'blue',
                pathName: 'Follow Blue Path → Block B → 2nd Floor → Room 204',
                pathNameTa: 'நீல வழித்தடத்தை பின்தொடரவும் → பிளாக் B → 2-ம் தளம் → அறை 204',
              },
              stagesHistory: [
                ...p.stagesHistory.map((s) => (s.stage === 'lab' || s.stage === 'doctor_review' ? { ...s, status: 'completed' as const } : s)),
                {
                  stage: 'doctor_review',
                  title: 'Doctor Follow-up Consultation',
                  titleTa: 'மருத்துவர் தொடர் ஆலோசனை',
                  departmentCode: 'GENMED',
                  tokenNumber: newToken,
                  status: 'current',
                  room: 'Room 204',
                  block: 'Block B',
                  floor: '2nd Floor',
                  color: 'blue',
                  notes: 'Active in Revisit Queue under Dr. Priya Kumar',
                },
              ],
            };
          }
          return p;
        })
      );

      addNotification({
        title: `Revisit Token Generated: ${newToken}`,
        titleTa: `மறு வருகை டோக்கன் உருவாக்கப்பட்டது: ${newToken}`,
        message: `New queue entry ${newToken} created for ${targetPatient.name}. Please proceed to Room 204 (Est. wait: 5 mins).`,
        messageTa: `புதிய வரிசை எண் ${newToken} உருவாக்கப்பட்டது. அறை 204-க்கு செல்லவும் (காத்திருப்பு: 5 நிமி).`,
        type: 'turn',
        targetRole: 'patient',
      });
    } else if (decisionType === 'emergency') {
      setPatients((prev) =>
        prev.map((p) => {
          if (p.id === patientId) {
            return {
              ...p,
              currentStage: 'doctor',
              status: 'your_turn',
              priority: 'emergency',
              queuePosition: 0,
              estimatedWaitMinutes: 0,
              stagesHistory: p.stagesHistory.map((s) => (s.stage === 'doctor' || s.stage === 'doctor_review' ? { ...s, status: 'current' as const } : s)),
            };
          }
          return p;
        })
      );

      addNotification({
        title: `EMERGENCY Priority Assigned: ${targetPatient.name}`,
        titleTa: `அவசர முன்னுரிமை ஒதுக்கப்பட்டது: ${targetPatient.name}`,
        message: `Patient prioritized for immediate Doctor Consultation in Room 204.`,
        messageTa: `நோயாளி உடனடியாக அறை 204-ல் மருத்துவரை அணுகலாம்.`,
        type: 'critical',
        targetRole: 'doctor',
      });
    } else if (decisionType === 'late_result') {
      const newRevSchedule: RevisitSchedule = {
        id: `REV-${Date.now().toString().slice(-4)}`,
        patientId,
        patientName: targetPatient.name,
        date: data?.revisitDate || '2026-09-04',
        time: data?.revisitTime || '04:15 PM',
        department: 'General Medicine (OPD)',
        doctor: 'Dr. Priya Kumar',
        reason: `Late test result review (Expected: ${data?.expectedResultTime || '03:45 PM'})`,
        assignedToken: `REV-${targetPatient.token}`,
      };
      setRevisits((prev) => [newRevSchedule, ...prev]);

      addNotification({
        title: `Revisit Scheduled for ${targetPatient.name}`,
        titleTa: `மறு வருகை நேரம் ஒதுக்கப்பட்டது: ${targetPatient.name}`,
        message: `Test results expected by ${data?.expectedResultTime || '3:45 PM'}. Revisit scheduled at ${data?.revisitTime || '4:15 PM'} with Dr. Priya Kumar.`,
        messageTa: `முடிவுகள் ${data?.expectedResultTime || '3:45 PM'} மணிக்கு எதிர்பார்க்கப்படுகிறது. மறு வருகை: ${data?.revisitTime || '4:15 PM'}.`,
        type: 'info',
        targetRole: 'patient',
      });
    }
  };

  // 6. Update Lab Order Status & Results
  const updateLabOrderStatus = (orderId: string, status: LabOrder['status'], results?: LabResultItem[]) => {
    setLabOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            status,
            results: results || ord.results,
            completedAt: status === 'result_ready' ? new Date().toISOString() : ord.completedAt,
          };

          if (status === 'sample_collected' || status === 'processing') {
            apiClient.startDiagnostic(orderId).then(() => {
              refreshLabOrders();
            }).catch((err) => console.warn('Sync start diagnostic to backend:', err));
          } else if (status === 'result_ready') {
            // Update patient to Doctor Review Pending
            setPatients((pList) =>
              pList.map((p) => {
                if (p.id === ord.patientId) {
                  return {
                    ...p,
                    currentStage: 'doctor_review',
                    status: 'doctor_review',
                    labResults: results || ord.results,
                    stagesHistory: p.stagesHistory.map((s) => {
                      if (s.stage === 'lab') return { ...s, status: 'completed' as const };
                      if (s.stage === 'doctor_review') return { ...s, status: 'current' as const };
                      return s;
                    }),
                  };
                }
                return p;
              })
            );

            addNotification({
              title: `Lab Result Ready for ${ord.patientName}`,
              titleTa: `${ord.patientName} அவர்களின் ஆய்வக முடிவுகள் தயார்`,
              message: `Fasting Blood Sugar & CBC panel completed. Transmitted to Dr. Priya Kumar for review.`,
              messageTa: `ரத்த பரிசோதனை முடிவுகள் தயாராக உள்ளன. மருத்துவர் பிரியா குமார் அவர்களின் மதிப்பாய்வுக்கு அனுப்பப்பட்டது.`,
              type: 'success',
              targetRole: 'doctor',
            });

            // Sync with backend persistent database
            const findingsSummary = results?.map((r) => `${r.testName}: ${r.value} ${r.unit} (${r.remarks || ''})`).join('; ') || 'Diagnostic investigation completed';
            apiClient.completeDiagnostic(orderId, findingsSummary).then(async () => {
              await refreshLabOrders();
              await refreshDoctorQueue();
              if (activePatientId) await loadActiveVisit(activePatientId);
            }).catch((err) => console.warn('Sync lab result to backend:', err));
          }
          return updated;
        }
        return ord;
      })
    );
  };

  // 7. Update Diagnostic Order Status & Findings
  const updateDiagnosticStatus = (
    orderId: string,
    status: DiagnosticOrder['status'],
    report?: { findingsSummary: string; observations: string; recommendations: string }
  ) => {
    setDiagnosticOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            status,
            findingsSummary: report?.findingsSummary || ord.findingsSummary,
            observations: report?.observations || ord.observations,
            recommendations: report?.recommendations || ord.recommendations,
            completedAt: status === 'completed' ? new Date().toISOString() : ord.completedAt,
          };

          if (status === 'completed') {
            setPatients((pList) =>
              pList.map((p) => {
                if (p.id === ord.patientId) {
                  return {
                    ...p,
                    currentStage: 'doctor_review',
                    status: 'doctor_review',
                    diagnosticDetails: {
                      modality: ord.modality,
                      token: ord.patientToken,
                      testName: ord.testName,
                      status: 'completed',
                      findingsSummary: report?.findingsSummary,
                      observations: report?.observations,
                      recommendations: report?.recommendations,
                      completedAt: new Date().toISOString(),
                      room: ord.room,
                    },
                    stagesHistory: p.stagesHistory.map((s) => {
                      if (s.stage === 'diagnostic') return { ...s, status: 'completed' as const };
                      if (s.stage === 'doctor_review') return { ...s, status: 'current' as const };
                      return s;
                    }),
                  };
                }
                return p;
              })
            );

            addNotification({
              title: `Diagnostic Scan Ready: ${ord.testName}`,
              titleTa: `ஸ்கேன் அறிக்கை தயார்: ${ord.testName}`,
              message: `Report uploaded for ${ord.patientName}. Transmitted to Dr. Priya Kumar.`,
              messageTa: `${ord.patientName} அவர்களின் ஸ்கேன் அறிக்கை பதிவேற்றப்பட்டு மருத்துவருக்கு அனுப்பப்பட்டது.`,
              type: 'info',
              targetRole: 'doctor',
            });

            // Sync with backend persistent database
            apiClient.completeDiagnostic(orderId, report?.findingsSummary).then(() => {
              if (activePatientId) loadActiveVisit(activePatientId);
            }).catch((err) => console.warn('Sync diagnostic scan to backend:', err));
          }
          return updated;
        }
        return ord;
      })
    );
  };

  // 8. Update Pharmacy Status
  const updatePharmacyStatus = (orderId: string, status: PharmacyOrder['status']) => {
    setPharmacyOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            status,
            completedAt: status === 'dispensed' ? new Date().toISOString() : ord.completedAt,
          };

          if (status === 'preparing' || status === 'ready') {
            apiClient.updatePharmacyStatus(orderId, status).then(() => {
              refreshPharmacyOrders();
            }).catch((err) => console.warn('Sync pharmacy status to backend:', err));
          }

          if (status === 'ready') {
            setPatients((pList) =>
              pList.map((p) => {
                if (p.id === ord.patientId) {
                  return {
                    ...p,
                    status: 'pharmacy_ready',
                    pharmacyDetails: {
                      token: ord.tokenNumber,
                      status: 'ready',
                      counterNumber: ord.counterNumber,
                      dispensedMedicines: ord.medications.map((m) => `${m.name} (${m.dosage})`),
                      completedAt: new Date().toISOString(),
                    },
                  };
                }
                return p;
              })
            );

            addNotification({
              title: `Prescription Ready: Token ${ord.tokenNumber}`,
              titleTa: `மருந்துகள் தயார்: டோக்கன் ${ord.tokenNumber}`,
              message: `Medicines ready for collection at Pharmacy Counter ${ord.counterNumber}.`,
              messageTa: `மருந்தக கவுண்டர் ${ord.counterNumber}-ல் மருந்துகளை பெற்றுக்கொள்ளவும்.`,
              type: 'turn',
              targetRole: 'patient',
            });
          } else if (status === 'dispensed') {
            setPatients((pList) =>
              pList.map((p) => {
                if (p.id === ord.patientId) {
                  return {
                    ...p,
                    currentStage: 'completed',
                    status: 'completed',
                    stagesHistory: p.stagesHistory.map((s) => {
                      if (s.stage === 'pharmacy') return { ...s, status: 'completed' as const };
                      if (s.stage === 'completed') return { ...s, status: 'completed' as const };
                      return s;
                    }),
                  };
                }
                return p;
              })
            );

            try {
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            } catch {
              // safe fallback
            }

            addNotification({
              title: `Hospital Visit Completed: ${ord.patientName}`,
              titleTa: `மருத்துவமனை வருகை நிறைவடைந்தது: ${ord.patientName}`,
              message: `All prescribed medications dispensed. Visit closed. Wish you good health.`,
              messageTa: `அனைத்து மருந்துகளும் வழங்கப்பட்டன. வருகை நிறைவடைந்தது. நலம் பெற வாழ்த்துகிறோம்.`,
              type: 'success',
              targetRole: 'patient',
            });

            // Sync with backend persistent database
            apiClient.dispensePharmacyOrder(orderId).then(async () => {
              await refreshPharmacyOrders();
              if (activePatientId) await loadActiveVisit(activePatientId);
            }).catch((err) => console.warn('Sync pharmacy dispense to backend:', err));
          }

          return updated;
        }
        return ord;
      })
    );
  };

  // 9. Call Hotline Registration
  const logCallAssistanceRequest = (data: Omit<CallAssistanceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: CallAssistanceRequest = {
      ...data,
      id: `CALL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setCallRequests((prev) => [newReq, ...prev]);

    addNotification({
      title: 'New Hotline Assistance Call Logged',
      titleTa: 'புதிய உதவி அழைப்பு பதிவு செய்யப்பட்டது',
      message: `Call from ${data.callerPhone} for ${data.patientName} (${data.reasonForVisit.slice(0, 30)}...).`,
      messageTa: `${data.callerPhone} எண்ணிலிருந்து ${data.patientName} அவர்களுக்கு உதவி கோரிக்கை.`,
      type: 'info',
      targetRole: 'all',
    });
  };

  const convertCallToRegistration = async (requestId: string): Promise<Patient> => {
    const req = callRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Call request not found');

    const pat = await registerPatient({
      name: req.patientName,
      age: req.age,
      gender: req.gender,
      phone: req.callerPhone,
      departmentId: req.departmentId,
      priority: req.isEmergency ? 'emergency' : 'senior',
    });

    setCallRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'registered', assignedToken: pat.token } : r))
    );

    return pat;
  };

  // 10. Process Payment
  const processPayment = (patientId: string, method: 'Cash' | 'UPI' | 'Card' | 'Govt Scheme') => {
    setPayments((prev) =>
      prev.map((pay) => {
        if (pay.patientId === patientId) {
          return {
            ...pay,
            status: 'paid',
            method,
            receiptNumber: `REC-TN-${Date.now().toString().slice(-6)}`,
            paidAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return pay;
      })
    );

    addNotification({
      title: 'Payment Receipt Generated',
      titleTa: 'கட்டண ரசீது உருவாக்கப்பட்டது',
      message: `Government subsidized fee paid via ${method}. Receipt recorded.`,
      messageTa: `${method} மூலம் கட்டணம் செலுத்தப்பட்டது. ரசீது பதிவானது.`,
      type: 'success',
      targetRole: 'patient',
    });
  };

  // 11. Admin Controls
  const applyBottleneckAction = (deptId: string) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === deptId) {
          return {
            ...d,
            activeCounters: Math.min(d.totalCounters, d.activeCounters + 1),
            isBottleneck: false,
            waitingCount: Math.max(12, Math.round(d.waitingCount * 0.6)),
            avgServiceMinutes: Math.max(2.5, d.avgServiceMinutes * 0.7),
            loadPercentage: 62,
            status: 'normal',
          };
        }
        return d;
      })
    );

    addNotification({
      title: 'Bottleneck Counter Activated',
      titleTa: 'கூடுதல் கவுண்டர் செயல்படுத்தப்பட்டது',
      message: 'Standby personnel allocated. Department queue normalized.',
      messageTa: 'கூடுதல் பணியாளர் நியமிக்கப்பட்டார். வரிசை சுமை குறைந்தது.',
      type: 'success',
      targetRole: 'all',
    });
  };

  const pauseDepartmentQueue = (deptId: string) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, status: 'busy' } : d))
    );
  };

  const resumeDepartmentQueue = (deptId: string) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, status: 'normal' } : d))
    );
  };

  const assignDepartmentCounters = (deptId: string, count: number) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, activeCounters: count } : d))
    );
  };

  const createPHCReferral = async (
    referralData: Omit<PHCReferral, 'id' | 'createdAt' | 'status' | 'metrics'>
  ): Promise<PHCReferral> => {
    const newRef: PHCReferral = {
      ...referralData,
      id: `REF-TN-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'accepted',
      assignedToken: `EMERG-${Math.floor(10 + Math.random() * 90)}`,
      createdAt: new Date().toISOString(),
      metrics: {
        distanceKm: 18,
        travelMinutes: 26,
        icuBedsAvailable: 6,
        emergencyStatus: 'Available',
        hospitalLoadPercent: 74,
      },
    };

    setReferrals((prev) => [newRef, ...prev]);

    addNotification({
      title: 'Emergency PHC Referral Accepted',
      titleTa: 'அவசர PHC பரிந்துரை ஏற்றுக்கொள்ளப்பட்டது',
      message: `Patient ${referralData.patientName} (${referralData.specialty}) dispatched to GRH. Token: ${newRef.assignedToken}.`,
      messageTa: `நோயாளி ${referralData.patientName} மருத்துவமனைக்கு அனுப்பப்படுகிறார். டோக்கன்: ${newRef.assignedToken}.`,
      type: 'warning',
      targetRole: 'doctor',
    });

    return newRef;
  };

  const acceptReferral = async (referralId: string) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === referralId ? { ...r, status: 'accepted' } : r))
    );
  };

  const toggleEmergencyMode = () => {
    setIsEmergencyMode((prev) => !prev);
    addNotification({
      title: isEmergencyMode ? 'Emergency Mode Stand-Down' : 'HOSPITAL EMERGENCY TRIAGE ACTIVATED',
      titleTa: isEmergencyMode ? 'அவசர நிலை விலக்கிக்கொள்ளப்பட்டது' : 'மருத்துவமனை அவசர சிகிச்சை நெறிமுறை தீவிரப்படுத்தப்பட்டது',
      message: isEmergencyMode ? 'All departments returned to standard flow.' : 'Trauma & Red Priority cases given immediate queue bypass.',
      messageTa: isEmergencyMode ? 'இயல்பு நிலை திரும்பியது.' : 'அவசர சிகிச்சை நோயாளிகளுக்கு உடனடி முன்னுரிமை.',
      type: isEmergencyMode ? 'info' : 'critical',
      targetRole: 'all',
    });
  };

  const toggleSimulation = () => {
    setIsSimulationActive((prev) => !prev);
  };

  const resetToSeedData = () => {
    setPatients(initialPatients);
    setActivePatientId('GH-2026-004281');
    setDepartments(initialDepartments);
    setLabOrders(initialLabOrders);
    setDiagnosticOrders(initialDiagnosticOrders);
    setPharmacyOrders(initialPharmacyOrders);
    setCallRequests(initialCallRequests);
    setNotifications(initialNotifications);
    setKpiData(initialKPIData);
    setDemoStep(0);
    setIsDemoMode(false);
  };

  // Guided Demo Scenario Stepper (Anitha Kumar - GH-2026-004281 - OP-047)
  const startDemoScenario = () => {
    setIsDemoMode(true);
    setDemoStep(1);
    setRole('patient');
    setActivePatientId('GH-2026-004281');
  };

  const nextDemoStep = () => {
    const next = demoStep + 1;
    setDemoStep(next);

    if (next === 1) {
      // Step 1: Patient Home View
      setRole('patient');
      setActivePatientId('GH-2026-004281');
    } else if (next === 2) {
      // Step 2: Patient Live Queue & Audio Directions
      setRole('patient');
      speakPatientGuidance();
    } else if (next === 3) {
      // Step 3: Switch to Doctor Portal
      setRole('doctor');
      callNextOPDPatient('dept-genmed');
    } else if (next === 4) {
      // Step 4: Doctor Start Consultation
      setRole('doctor');
      startConsultation('GH-2026-004281');
    } else if (next === 5) {
      // Step 5: Doctor sends to Lab (Blood & Sugar)
      setRole('doctor');
      submitDoctorConsultation(
        'GH-2026-004281',
        {
          chiefComplaint: 'Generalized fatigue, polyuria, intermittent postprandial dizziness.',
          symptoms: ['Fatigue', 'Increased Thirst', 'Mild Exertional Dyspnea'],
          vitals: { bp: '138/88 mmHg', pulse: '78 bpm', temp: '98.4 °F', weight: '64 kg', spo2: '99%' },
          provisionalDiagnosis: 'Uncontrolled Type 2 Diabetes Mellitus & Grade I Essential HTN',
          diagnosis: 'Type 2 Diabetes Mellitus with Poor Glycemic Control',
          clinicalNotes: 'Order Fasting Blood Sugar, PPBS, HbA1c, and CBC. Evaluate glycemic status.',
          medications: [],
          investigations: ['Fasting Blood Sugar (FBS)', 'Postprandial Blood Sugar (PPBS)', 'HbA1c', 'Complete Blood Count (CBC)'],
          followUpDays: 14,
        },
        {
          labTests: ['Fasting Blood Sugar (FBS)', 'Postprandial Blood Sugar (PPBS)', 'HbA1c', 'Complete Blood Count (CBC)'],
          labPriority: 'routine',
          labSchedule: 'today',
        }
      );
    } else if (next === 6) {
      // Step 6: Scan/Lab Staff Portal Processes Sample
      setRole('scan_lab');
      updateLabOrderStatus('LAB-ORD-101', 'sample_collected');
    } else if (next === 7) {
      // Step 7: Scan/Lab Enters Results & Transmits to Doctor
      setRole('scan_lab');
      updateLabOrderStatus('LAB-ORD-101', 'result_ready', [
        { testName: 'Fasting Blood Sugar (FBS)', value: '154', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', isAbnormal: true, remarks: 'Elevated fasting glycemia' },
        { testName: 'Postprandial Blood Sugar (PPBS)', value: '210', unit: 'mg/dL', referenceRange: '< 140 mg/dL', isAbnormal: true, remarks: 'Impaired glucose tolerance' },
        { testName: 'HbA1c Glycated Hemoglobin', value: '7.8', unit: '%', referenceRange: '< 5.7 %', isAbnormal: true, remarks: 'Suboptimal diabetic control' },
        { testName: 'Hemoglobin (Hb)', value: '12.4', unit: 'g/dL', referenceRange: '12.0 - 15.5 g/dL', isAbnormal: false, remarks: 'Normal' },
      ]);
    } else if (next === 8) {
      // Step 8: Doctor Reviews Results & Generates Prescription
      setRole('doctor');
      reviewAndCompleteResults(
        'GH-2026-004281',
        'FBS 154, HbA1c 7.8% confirms uncontrolled diabetes. Starting Metformin 500mg BD and Telmisartan 40mg OD. Revisit in 14 days.',
        [
          { name: 'Tab Metformin Hydrochloride IP', dosage: '500 mg', frequency: '1-0-1 (After Meals)', duration: '30 Days', instructions: 'Take twice daily after food' },
          { name: 'Tab Telmisartan IP', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Take once daily in the morning' },
          { name: 'Tab Vitamin B Complex with Folic Acid', dosage: '1 Tab', frequency: '0-1-0 (After Lunch)', duration: '30 Days', instructions: 'Nutritional supplement' },
        ]
      );
    } else if (next === 9) {
      // Step 9: Pharmacy Staff Prepares & Marks Ready
      setRole('pharmacy');
      updatePharmacyStatus('PHARM-ORD-301', 'ready');
    } else if (next === 10) {
      // Step 10: Pharmacy Dispenses & Completes Visit
      setRole('pharmacy');
      updatePharmacyStatus('PHARM-ORD-301', 'dispensed');
    } else if (next === 11) {
      // Step 11: Patient sees Completed Summary
      setRole('patient');
    } else if (next === 12) {
      // Step 12: Reset to Patient
      setRole('patient');
    }
  };

  const prevDemoStep = () => {
    setDemoStep((prev) => Math.max(1, prev - 1));
  };

  const exitDemoScenario = () => {
    setIsDemoMode(false);
    setDemoStep(0);
  };

  const jumpToDemoStep = (step: number) => {
    setDemoStep(step);
  };

  // ==========================================
  // AUTHENTICATION & PATIENT OTP WORKFLOW
  // ==========================================
  const requestPatientOtp = async (rawPhone: string) => {
    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number' };
    }

    try {
      const res = await fetch('http://localhost:4000/api/auth/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Patient account not found. Please register as a new patient.',
        };
      }

      const session: PendingOtpSession = {
        phone: cleanPhone,
        patientName: data.patientName || 'Patient',
        maskedPhone: data.maskedPhone || `+91 ${cleanPhone.slice(0, 2)}*** ***${cleanPhone.slice(-2)}`,
        demoOtp: data.demoOtp || '123456',
        expiresAt: Date.now() + 10 * 60 * 1000,
        isNewPatient: false,
      };

      setPendingOtpSession(session);
      setAuthStatus('OTP_PENDING');
      try {
        sessionStorage.setItem('gh_pending_otp', JSON.stringify(session));
        localStorage.setItem('gh_pending_otp', JSON.stringify(session));
      } catch {
        // ignore
      }

      navigate('/verify-otp');

      return {
        success: true,
        next: 'OTP_VERIFICATION',
        mobile: cleanPhone,
        demoOtp: session.demoOtp,
        patientName: session.patientName,
        maskedPhone: session.maskedPhone,
      };
    } catch {
      // Offline fallback: check local patients
      const matched = patients.find((p) => p.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone);
      if (!matched && cleanPhone !== '9876543210' && cleanPhone !== '9840123456') {
        return { success: false, error: 'This mobile number is not registered. Please register first.' };
      }

      const session: PendingOtpSession = {
        phone: cleanPhone,
        patientName: matched?.name || 'Anitha Kumar',
        maskedPhone: `+91 ${cleanPhone.slice(0, 2)}*** ***${cleanPhone.slice(-2)}`,
        demoOtp: '123456',
        expiresAt: Date.now() + 10 * 60 * 1000,
        isNewPatient: false,
      };

      setPendingOtpSession(session);
      setAuthStatus('OTP_PENDING');
      try {
        sessionStorage.setItem('gh_pending_otp', JSON.stringify(session));
        localStorage.setItem('gh_pending_otp', JSON.stringify(session));
      } catch {
        // ignore
      }

      navigate('/verify-otp');

      return {
        success: true,
        next: 'OTP_VERIFICATION',
        mobile: cleanPhone,
        demoOtp: '123456',
        patientName: session.patientName,
        maskedPhone: session.maskedPhone,
      };
    }
  };

  const loginWithPhone = requestPatientOtp;

  const verifyPatientOtp = async (rawPhone: string, otp: string) => {
    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '').slice(-10);
    try {
      const res = await fetch('http://localhost:4000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid OTP. Please try again.' };
      }

      // Successful verification: clear OTP pending state
      setPendingOtpSession(null);
      try {
        sessionStorage.removeItem('gh_pending_otp');
        localStorage.removeItem('gh_pending_otp');
      } catch {
        // ignore
      }

      const pat = data.patient;
      const patId = pat?.id || `GH-P-${cleanPhone.slice(-5)}`;
      const hasVisit = Boolean(data.hasActiveVisit);

      setCurrentPatient(pat);
      setActivePatientId(patId);
      setHasActiveVisit(hasVisit);
      setAuthStatus('AUTHENTICATED');
      setRole('patient');

      if (hasVisit) {
        await loadActiveVisit(patId);
        navigate('/patient/dashboard');
      } else {
        setActiveVisitData(null);
        navigate('/patient/select-doctor');
      }

      localStorage.setItem('gh_session', JSON.stringify({
        role: 'patient',
        patientId: patId,
        hasActiveVisit: hasVisit,
      }));

      addNotification({
        title: 'Authentication Successful',
        titleTa: 'உள்நுழைவு வெற்றிகரமாக முடிந்தது',
        message: `Welcome, ${pat?.name || 'Patient'}. Session verified.`,
        messageTa: `வணக்கம், ${pat?.name || 'நோயாளி'}. உங்கள் சுயவிவரம் திறக்கப்பட்டது.`,
        type: 'success',
        targetRole: 'patient',
      });

      return { success: true, hasActiveVisit: hasVisit, patient: pat };
    } catch {
      // Local fallback verification
      if (otp.trim() === '123456') {
        const matched = patients.find((p) => p.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone);
        const patId = matched ? matched.id : `GH-P-${cleanPhone.slice(-5)}`;

        setPendingOtpSession(null);
        try {
          sessionStorage.removeItem('gh_pending_otp');
          localStorage.removeItem('gh_pending_otp');
        } catch {
          // ignore
        }

        setActivePatientId(patId);
        setHasActiveVisit(false);
        setActiveVisitData(null);
        setAuthStatus('AUTHENTICATED');
        setRole('patient');
        navigate('/patient/select-doctor');
        localStorage.setItem('gh_session', JSON.stringify({ role: 'patient', patientId: patId, hasActiveVisit: false }));
        return { success: true, hasActiveVisit: false, patient: matched };
      }
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }
  };

  const loginStaff = async (username: string, password: string = 'password123') => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid staff credentials' };
      }

      const assignedRole = data.role as UserRole;
      setAuthStatus('AUTHENTICATED');
      setRole(assignedRole);
      navigate(`/${assignedRole}/dashboard`);
      localStorage.setItem('gh_session', JSON.stringify({ role: assignedRole, username: data.user?.username }));

      addNotification({
        title: 'Staff Login Authorized',
        titleTa: 'பணியாளர் உள்நுழைவு அங்கீகரிக்கப்பட்டது',
        message: `Authenticated as ${data.user?.fullName || username} (${assignedRole.toUpperCase()}).`,
        messageTa: `${data.user?.fullName || username} அவர்களின் பணிப்பிரிவு திறக்கப்பட்டது.`,
        type: 'info',
        targetRole: assignedRole,
      });

      return { success: true, role: assignedRole };
    } catch {
      // Local fallback for staff aliases
      const norm = username.toLowerCase().trim();
      let assignedRole: UserRole = 'doctor';
      if (norm === 'lab' || norm === 'scanlab' || norm === 'tech_murugan') assignedRole = 'scan_lab';
      else if (norm === 'pharmacy' || norm === 'pharm_radha') assignedRole = 'pharmacy';
      else assignedRole = 'doctor';

      setAuthStatus('AUTHENTICATED');
      setRole(assignedRole);
      navigate(`/${assignedRole}/dashboard`);
      localStorage.setItem('gh_session', JSON.stringify({ role: assignedRole, username }));
      return { success: true, role: assignedRole };
    }
  };

  const registerPatientWithPhone = async (data: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
  }) => {
    const cleanPhone = data.phone.replace(/[^0-9]/g, '').slice(-10);

    try {
      const res = await fetch('http://localhost:4000/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: cleanPhone,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return {
          success: false,
          error: resData.error || 'Failed to register patient account',
        };
      }

      // Profile created in DB. Store pending OTP session & transition to /verify-otp
      const registeredPatient = resData.patient;
      setCurrentPatient(registeredPatient);
      setHasActiveVisit(false);
      setActiveVisitData(null);

      const session: PendingOtpSession = {
        phone: cleanPhone,
        patientName: registeredPatient.name,
        maskedPhone: `+91 ${cleanPhone.slice(0, 2)}*** ***${cleanPhone.slice(-2)}`,
        demoOtp: resData.demoOtp || '123456',
        expiresAt: Date.now() + 10 * 60 * 1000,
        isNewPatient: true,
      };

      setPendingOtpSession(session);
      setAuthStatus('OTP_PENDING');
      try {
        sessionStorage.setItem('gh_pending_otp', JSON.stringify(session));
        localStorage.setItem('gh_pending_otp', JSON.stringify(session));
      } catch {
        // ignore
      }

      navigate('/verify-otp');

      return {
        success: true,
        next: 'OTP_VERIFICATION',
        mobile: cleanPhone,
        demoOtp: session.demoOtp,
        patient: registeredPatient,
        hasActiveVisit: false,
      };
    } catch {
      // Local fallback creation
      const newId = `GH-P-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPat: Patient = {
        id: newId,
        name: data.name,
        nameTa: data.name,
        age: data.age,
        gender: data.gender,
        phone: cleanPhone,
        abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        token: '',
        departmentId: '',
        departmentName: '',
        departmentNameTa: '',
        currentStage: 'registration',
        queuePosition: 0,
        estimatedWaitMinutes: 0,
        status: 'normal',
        priority: data.age >= 60 ? 'senior' : 'normal',
        bloodGroup: data.bloodGroup || 'O+ve',
        allergies: data.allergies || ['None Reported'],
        existingConditions: data.chronicConditions || ['None Reported'],
        address: 'District Government Hospital Jurisdiction',
        emergencyContact: 'Family Member',
        vitals: { bp: '120/80 mmHg', pulse: '76 bpm', temp: '98.4 °F', weight: '62 kg', spo2: '99%' },
        stagesHistory: [],
        location: {
          block: 'Block B',
          floor: 'Ground Floor',
          room: 'Rooms 4-8',
          pathColor: 'blue',
          pathName: 'Follow Blue Path',
          pathNameTa: 'நீல வழித்தடம்',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentPatient(newPat);
      setHasActiveVisit(false);
      setActiveVisitData(null);

      const session: PendingOtpSession = {
        phone: cleanPhone,
        patientName: data.name,
        maskedPhone: `+91 ${cleanPhone.slice(0, 2)}*** ***${cleanPhone.slice(-2)}`,
        demoOtp: '123456',
        expiresAt: Date.now() + 10 * 60 * 1000,
        isNewPatient: true,
      };

      setPendingOtpSession(session);
      setAuthStatus('OTP_PENDING');
      try {
        sessionStorage.setItem('gh_pending_otp', JSON.stringify(session));
        localStorage.setItem('gh_pending_otp', JSON.stringify(session));
      } catch {
        // ignore
      }

      navigate('/verify-otp');

      return { success: true, next: 'OTP_VERIFICATION', mobile: cleanPhone, demoOtp: '123456', patient: newPat, hasActiveVisit: false };
    }
  };

  const cancelOtpSession = () => {
    setPendingOtpSession(null);
    setAuthStatus('NOT_AUTHENTICATED');
    try {
      sessionStorage.removeItem('gh_pending_otp');
      localStorage.removeItem('gh_pending_otp');
    } catch {
      // ignore
    }
    navigate('/login');
  };

  const updatePatientProfile = async (
    patientId: string,
    data: {
      name?: string;
      nameTa?: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      allergies?: string[] | string;
      chronicConditions?: string[] | string;
    }
  ) => {
    try {
      const res = await apiClient.updatePatientProfile(patientId, data);
      if (res.success && res.data) {
        const updated = res.data;
        setCurrentPatient((prev) => (prev ? { ...prev, ...updated } : updated));
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? { ...p, ...updated } : p))
        );
        return { success: true, data: updated };
      }
      return { success: false, error: res.error || 'Failed to update profile' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('gh_session');
      localStorage.removeItem('gh_pending_otp');
      sessionStorage.removeItem('gh_pending_otp');
    } catch {
      // ignore
    }
    setPendingOtpSession(null);
    setAuthStatus('NOT_AUTHENTICATED');
    setRole('auth');
    setActivePatientId('');
    setCurrentPatient(null);
    setActiveVisitData(null);
    navigate('/login');
  };

  return (
    <QueueFlowContext.Provider
      value={{
        role,
        setRole,
        authStatus,
        pendingOtpSession,
        currentPath,
        navigate,
        requestPatientOtp,
        cancelOtpSession,
        lang,
        setLang,
        t,
        accessibility,
        updateAccessibility,
        hospitalConfig,
        patients,
        activePatient,
        activeJourneyId,
        setActivePatientId,
        departments,
        hospitalComparisons,
        referrals,
        notifications,
        kpiData,
        labOrders,
        diagnosticOrders,
        pharmacyOrders,
        callRequests,
        payments,
        revisits,
        isEmergencyMode,
        toggleEmergencyMode,
        isSimulationActive,
        toggleSimulation,
        resetToSeedData,
        demoStep,
        isDemoMode,
        startDemoScenario,
        nextDemoStep,
        prevDemoStep,
        exitDemoScenario,
        jumpToDemoStep,
        registerPatient,
        callNextOPDPatient,
        startConsultation,
        submitDoctorConsultation,
        reviewAndCompleteResults,
        doctorRevisitDecision,
        updateLabOrderStatus,
        updateDiagnosticStatus,
        updatePharmacyStatus,
        logCallAssistanceRequest,
        convertCallToRegistration,
        processPayment,
        applyBottleneckAction,
        pauseDepartmentQueue,
        resumeDepartmentQueue,
        assignDepartmentCounters,
        createPHCReferral,
        acceptReferral,
        dismissNotification,
        addNotification,
        speakPatientGuidance,
        stopVoice,
        hasActiveVisit,
        currentPatient,
        activeVisitData,
        loadActiveVisit,
        createPatientVisit,
        loginWithPhone,
        verifyPatientOtp,
        loginStaff,
        registerPatientWithPhone,
        updatePatientProfile,
        refreshDoctorQueue,
        refreshLabOrders,
        refreshPharmacyOrders,
        logout,
      }}
    >
      <div
        className={`min-h-screen flex flex-col ${
          accessibility.fontSize === 'large'
            ? 'text-scale-large'
            : accessibility.fontSize === 'extra-large'
            ? 'text-scale-extra-large'
            : ''
        } ${accessibility.highContrast ? 'high-contrast-mode' : ''} ${
          accessibility.reducedMotion ? 'reduced-motion' : ''
        }`}
      >
        {children}
      </div>
    </QueueFlowContext.Provider>
  );
};

export const useQueueFlow = () => {
  const context = useContext(QueueFlowContext);
  if (!context) {
    throw new Error('useQueueFlow must be used within a QueueFlowProvider');
  }
  return context;
};
