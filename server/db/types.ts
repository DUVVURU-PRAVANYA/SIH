export type PathColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';

export type UserRole = 'patient' | 'registration' | 'doctor' | 'diagnostic' | 'pharmacy' | 'phc' | 'admin';

export type JourneyStageType = 'registration' | 'doctor' | 'diagnostic' | 'pharmacy' | 'completed';

export type StageStatus = 'pending' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export type PatientPriority = 'normal' | 'senior' | 'urgent' | 'emergency';

export type ReferralUrgency = 'normal' | 'urgent' | 'emergency';

export type ReferralStatus = 'created' | 'sent' | 'accepted' | 'rejected' | 'en_route' | 'received' | 'completed';

export interface Hospital {
  id: string;
  name: string;
  location: string;
  state: string;
  totalBeds: number;
  icuBedsAvailable: number;
  emergencyBedsAvailable: number;
  contactPhone: string;
  emergencyStatus: 'normal' | 'emergency_active';
  createdAt: string;
}

export interface Block {
  id: string;
  hospitalId: string;
  name: string;
  description: string;
}

export interface Floor {
  id: string;
  blockId: string;
  level: number;
  name: string;
}

export interface Room {
  id: string;
  blockId: string;
  floorId: string;
  roomNumber: string;
  name: string;
  category: string;
  color: PathColor;
}

export interface Department {
  id: string;
  hospitalId: string;
  code: string; // e.g. CARDIO, GENMED, X-RAY, LAB, PHARM, EMERG
  name: string;
  nameTa: string;
  category: 'opd' | 'diagnostic' | 'pharmacy' | 'emergency' | 'registration';
  color: PathColor;
  blockName: string;
  floorName: string;
  roomNumber: string;
  activeCounters: number;
  totalCounters: number;
  avgServiceMinutes: number;
  isBottleneck: boolean;
  bottleneckReason?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  departmentId?: string;
  hospitalId: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  name: string;
  nameTa: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  abhaId: string;
  bloodGroup?: string;
  allergies?: string[];
  role?: 'patient';
  preferredLanguage: 'ta' | 'en';
  isSynthetic: boolean;
  createdAt: string;
}

export interface Journey {
  id: string; // e.g. JNY-20260902-00042
  patientId: string;
  hospitalId: string;
  initialDepartmentId: string;
  currentDepartmentId: string;
  currentStage: JourneyStageType;
  currentToken: string;
  status: 'active' | 'completed' | 'cancelled';
  priority: PatientPriority;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface JourneyStage {
  id: string;
  journeyId: string;
  stageType: JourneyStageType;
  departmentId: string;
  tokenNumber: string;
  sequenceNum: number;
  status: StageStatus;
  roomNumber: string;
  blockName: string;
  floorName: string;
  color: PathColor;
  notes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface QueueEntry {
  id: string;
  departmentId: string;
  journeyId: string;
  journeyStageId: string;
  patientId: string;
  tokenNumber: string;
  sequenceNum: number;
  status: 'waiting' | 'called' | 'in_service' | 'completed' | 'skipped';
  priority: PatientPriority;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  isDispensed: boolean;
}

export interface Consultation {
  id: string;
  journeyId: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  symptoms: string;
  observations: string;
  diagnosis: string;
  clinicalNotes: string;
  voiceDictationRaw?: string;
  medications: Medication[];
  investigations: string[];
  followUpDays: number;
  createdAt: string;
  completedAt?: string;
}

export interface DiagnosticOrder {
  id: string;
  consultationId: string;
  journeyId: string;
  modality: 'x-ray' | 'lab' | 'ct' | 'ultrasound';
  testName: string;
  tokenNumber: string;
  status: 'ordered' | 'waiting' | 'in_progress' | 'completed';
  findingsSummary?: string;
  technicianName?: string;
  roomNumber: string;
  orderedAt: string;
  completedAt?: string;
}

export interface PharmacyOrder {
  id: string;
  consultationId: string;
  journeyId: string;
  tokenNumber: string;
  status: 'waiting' | 'verifying' | 'dispensed';
  counterNumber: string;
  pharmacistName?: string;
  medications: Medication[];
  createdAt: string;
  dispensedAt?: string;
}

export interface PHCReferral {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  fromPhcName: string;
  targetHospitalId: string;
  targetHospitalName: string;
  specialty: string;
  clinicalReason: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  assignedToken?: string;
  distanceKm: number;
  travelMinutes: number;
  icuBedsAvailable: number;
  hospitalLoadPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  targetRole: UserRole | 'all';
  targetJourneyId?: string;
  title: string;
  titleTa: string;
  message: string;
  messageTa: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'turn';
  isRead: boolean;
  createdAt: string;
}

export interface ServiceCounter {
  id: string;
  departmentId: string;
  counterNumber: string;
  name: string;
  isActive: boolean;
  technicianName?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  actionType: string;
  entityName: string;
  entityId: string;
  details: string;
  timestamp: string;
}
