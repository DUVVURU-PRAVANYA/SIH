export type UserRole =
  | 'auth'
  | 'patient'
  | 'doctor'
  | 'scan_lab'
  | 'pharmacy';

export type AuthStatus = 'NOT_AUTHENTICATED' | 'OTP_PENDING' | 'AUTHENTICATED';

export interface PendingOtpSession {
  phone: string;
  patientName?: string;
  maskedPhone?: string;
  demoOtp: string;
  expiresAt: number;
  isNewPatient?: boolean;
}

export interface DoctorProfile {
  id: string;
  name: string;
  nameTa: string;
  departmentId: string;
  departmentName: string;
  departmentNameTa: string;
  specialization: string;
  roomNumber: string;
  availability: 'online' | 'busy' | 'offline';
}

export type Language = 'ta' | 'en';

export type PathColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';

export type PatientStatus =
  | 'normal'
  | 'busy'
  | 'approaching'
  | 'your_turn'
  | 'in_consultation'
  | 'lab_pending'
  | 'lab_ready'
  | 'scan_pending'
  | 'doctor_review'
  | 'pharmacy_ready'
  | 'payment_pending'
  | 'completed';

export type JourneyStageId =
  | 'registration'
  | 'doctor'
  | 'diagnostic'
  | 'lab'
  | 'doctor_review'
  | 'pharmacy'
  | 'payment'
  | 'completed';

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  voiceEnabled: boolean;
  speechRate: number;
  reducedMotion: boolean;
}

export interface PatientJourneyStep {
  stage: JourneyStageId;
  title: string;
  titleTa: string;
  departmentCode: string;
  tokenNumber: string;
  status: 'completed' | 'current' | 'upcoming';
  room: string;
  block: string;
  floor: string;
  color: PathColor;
  timestamp?: string;
  notes?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity?: number;
}

export interface DoctorNotes {
  chiefComplaint?: string;
  symptoms?: string[];
  clinicalObservations?: string;
  provisionalDiagnosis?: string;
  diagnosis: string;
  clinicalNotes: string;
  vitals?: {
    bp: string;
    pulse: string;
    temp: string;
    weight: string;
    spo2?: string;
  };
  medications: MedicationItem[];
  investigations: string[];
  followUpDays: number;
  recordedByVoice?: boolean;
}

export interface LabResultItem {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  remarks?: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  patientToken: string;
  requestedByDoctor: string;
  tests: string[];
  priority: 'routine' | 'urgent';
  schedule: 'today' | 'next_day';
  scheduledTime?: string;
  status: 'pending' | 'sample_collected' | 'processing' | 'result_ready' | 'reviewed';
  results?: LabResultItem[];
  createdAt: string;
  completedAt?: string;
}

export interface DiagnosticOrder {
  id: string;
  patientId: string;
  patientName: string;
  patientToken: string;
  requestedByDoctor: string;
  modality: 'x-ray' | 'ultrasound' | 'ct' | 'mri';
  testName: string;
  priority: 'routine' | 'urgent';
  clinicalNotes: string;
  status: 'waiting' | 'in_progress' | 'completed';
  findingsSummary?: string;
  observations?: string;
  recommendations?: string;
  room: string;
  createdAt: string;
  completedAt?: string;
}

export interface PharmacyOrder {
  id: string;
  patientId: string;
  patientName: string;
  patientToken: string;
  doctorName: string;
  medications: MedicationItem[];
  status: 'waiting' | 'preparing' | 'ready' | 'dispensed';
  counterNumber: string;
  tokenNumber: string;
  totalAmount?: number;
  isPaid?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface CallAssistanceRequest {
  id: string;
  callerPhone: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  reasonForVisit: string;
  departmentId: string;
  isEmergency: boolean;
  assignedToken?: string;
  status: 'pending' | 'registered' | 'cancelled';
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  patientId: string;
  patientToken: string;
  patientName: string;
  services: { name: string; amount: number }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'waived';
  method?: 'Cash' | 'UPI' | 'Card' | 'Govt Scheme';
  receiptNumber?: string;
  paidAt?: string;
}

export interface RevisitSchedule {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  department: string;
  doctor: string;
  reason: string;
  assignedToken: string;
}

export interface DiagnosticDetails {
  modality: 'x-ray' | 'lab' | 'ct' | 'ultrasound' | 'mri';
  token: string;
  testName: string;
  status: 'waiting' | 'in_progress' | 'completed';
  technicianName?: string;
  room: string;
  findingsSummary?: string;
  observations?: string;
  recommendations?: string;
  completedAt?: string;
}

export interface PharmacyDetails {
  token: string;
  status: 'waiting' | 'verifying' | 'preparing' | 'ready' | 'dispensing' | 'dispensed';
  counterNumber: string;
  dispensedMedicines: string[];
  pharmacistName?: string;
  completedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  nameTa: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  abhaId: string;
  token: string;
  departmentId: string;
  departmentName: string;
  departmentNameTa: string;
  currentStage: JourneyStageId;
  queuePosition: number;
  estimatedWaitMinutes: number;
  status: PatientStatus;
  priority: 'normal' | 'senior' | 'urgent' | 'emergency';
  bloodGroup?: string;
  allergies?: string[];
  existingConditions?: string[];
  chronicConditions?: string[];
  address?: string;
  emergencyContact?: string;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    weight?: string;
    spo2?: string;
  };
  stagesHistory: PatientJourneyStep[];
  doctorNotes?: DoctorNotes;
  diagnosticDetails?: DiagnosticDetails;
  pharmacyDetails?: PharmacyDetails;
  labResults?: LabResultItem[];
  paymentRecord?: PaymentRecord;
  revisitSchedule?: RevisitSchedule;
  location: {
    block: string;
    floor: string;
    room: string;
    pathColor: PathColor;
    pathName: string;
    pathNameTa: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentStats {
  id: string;
  code: string;
  name: string;
  nameTa: string;
  category: 'opd' | 'diagnostic' | 'pharmacy' | 'emergency' | 'registration' | 'lab';
  color: PathColor;
  block: string;
  floor: string;
  room: string;
  activeCounters: number;
  totalCounters: number;
  waitingCount: number;
  inProgressCount: number;
  completedToday: number;
  avgServiceMinutes: number;
  serviceVelocityPerHour: number;
  loadPercentage: number;
  status: 'normal' | 'busy' | 'critical';
  isBottleneck: boolean;
  bottleneckReason?: string;
  recommendation?: {
    action: string;
    actionTa: string;
    impact: string;
    impactTa: string;
    simulatedNewWaitMinutes: number;
  };
}

export interface HospitalComparison {
  id: string;
  name: string;
  distanceKm: number;
  travelMinutes: number;
  icuBedsAvailable: number;
  emergencyCapacity: 'Available' | 'High Load' | 'Critical';
  specialistAvailable: boolean;
  specialistName: string;
  currentLoadPercent: number;
  isRecommended: boolean;
  recommendationReason: string;
  recommendationReasonTa: string;
}

export interface PHCReferral {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  fromPhcName: string;
  targetHospitalId: string;
  targetHospitalName: string;
  specialty: string;
  clinicalReason: string;
  requiredService: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  status: 'created' | 'sent' | 'accepted' | 'en_route' | 'received' | 'completed';
  createdAt: string;
  assignedToken?: string;
  metrics: {
    distanceKm: number;
    travelMinutes: number;
    icuBedsAvailable: number;
    emergencyStatus: string;
    hospitalLoadPercent: number;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  titleTa: string;
  message: string;
  messageTa: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'turn';
  targetRole: UserRole | 'all';
  timestamp: string;
  read: boolean;
}

export interface CommandKPIData {
  patientsToday: number;
  currentlyWaiting: number;
  avgWaitingTimeMinutes: number;
  hospitalCapacityPercent: number;
  activeDoctors: number;
  activeDiagnosticUnits: number;
  emergencyBedsAvailable: number;
  icuBedsAvailable: number;
  totalCompletedToday: number;
}
