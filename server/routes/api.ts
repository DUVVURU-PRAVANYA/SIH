import express, { Request, Response } from 'express';
import { db } from '../db/database';
import { seedDatabase } from '../db/seed';
import { broadcastEvent } from '../realtime';
import { notificationService } from '../services/notificationService';
import {
  JourneyStageType,
  Medication,
  PathColor,
  PatientPriority,
  ReferralUrgency,
} from '../db/types';

export const apiRouter = express.Router();

// ==========================================
// 0. AUTHENTICATION & ROLE DETECTION (PATIENT OTP + STAFF PASSWORD)
// ==========================================
// In-memory demo OTP store (phone -> { otp, expiresAt })
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const DEFAULT_DEMO_OTP = process.env.DEMO_OTP || '123456';

// Identify user role from input (Mobile -> Patient OTP, Username -> Staff Password)
apiRouter.post('/auth/identify', (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a valid mobile number or staff username' });
    }

    const trimmed = identifier.trim();
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');

    // If identifier is a 10-digit mobile number or starts with +91/91/digits
    if (cleanDigits.length >= 10) {
      const phone = cleanDigits.slice(-10);
      const patient = db.getPatientByPhone(phone);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'This mobile number is not registered. Please register first or verify your number.',
          isUnregisteredPatient: true,
          phone,
        });
      }

      // Generate & store demo OTP
      const otp = DEFAULT_DEMO_OTP;
      otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

      return res.json({
        success: true,
        next: 'OTP_VERIFICATION',
        type: 'patient',
        role: 'patient',
        mobile: phone,
        phone,
        maskedPhone: `+91 ${phone.slice(0, 2)}*** ***${phone.slice(-2)}`,
        patientName: patient.name,
        patientId: patient.id,
        demoOtp: otp,
        demoMode: true,
        message: `Demo OTP generated for +91 ${phone}`,
      });
    }

    // Staff Username check
    const normalizedUsername = trimmed.toLowerCase();
    const rawData = db.getRawData();
    // Allow direct alias lookup (e.g. 'doctor' -> 'dr_priya', 'lab' -> 'tech_murugan', 'pharmacy' -> 'pharm_radha')
    const user = rawData.users.find(
      (u) =>
        u.username.toLowerCase() === normalizedUsername ||
        (normalizedUsername === 'doctor' && u.role === 'doctor') ||
        (normalizedUsername === 'lab' && (u.role === 'diagnostic' || (u as any).role === 'scan_lab')) ||
        (normalizedUsername === 'scanlab' && (u.role === 'diagnostic' || (u as any).role === 'scan_lab')) ||
        (normalizedUsername === 'pharmacy' && u.role === 'pharmacy')
    );

    if (user) {
      const mappedRole = user.role === 'diagnostic' ? 'scan_lab' : user.role;
      return res.json({
        success: true,
        type: 'staff',
        role: mappedRole,
        username: user.username,
        fullName: user.fullName,
        departmentId: user.departmentId,
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Unrecognized identifier. Enter a 10-digit mobile number (Patients) or authorized username (Staff).',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP and issue authenticated patient session
apiRouter.post('/auth/verify-otp', (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile number and OTP are required' });
    }

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    // Check stored OTP or default demo OTP
    const stored = otpStore.get(cleanPhone);
    const isValid = (stored && stored.otp === cleanOtp && stored.expiresAt > Date.now()) || cleanOtp === DEFAULT_DEMO_OTP;

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP. Please check the code and try again.',
      });
    }

    const patient = db.getPatientByPhone(cleanPhone);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient account not found for this mobile number.',
      });
    }

    // Check if patient has a real active visit in the database
    const activeJourney = db.getActiveJourneyForPatient(patient.id);
    const hasActiveVisit = !!activeJourney;
    const token = activeJourney ? activeJourney.currentToken : null;

    return res.json({
      success: true,
      role: 'patient',
      patient: {
        id: patient.id,
        name: patient.name,
        nameTa: patient.nameTa,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup || 'O+ve',
        allergies: patient.allergies || ['None Reported'],
        chronicConditions: patient.chronicConditions || ['None Reported'],
        role: 'patient',
      },
      hasActiveVisit,
      token,
      journeyId: activeJourney?.id || null,
      sessionToken: `gh-pat-sess-${patient.id}-${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// New Patient Registration with Mobile Number (Profile only, NO auto-visit / token)
apiRouter.post('/auth/register-patient', (req: Request, res: Response) => {
  try {
    const { name, age, gender, bloodGroup, allergies, chronicConditions, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number' });
    }

    // Duplicate check
    const existing = db.getPatientByPhone(cleanPhone);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'This mobile number is already registered. Please login using OTP.',
        phone: cleanPhone,
      });
    }

    // Generate unique internal Patient ID
    const nextSeq = Math.floor(100 + Math.random() * 900);
    const patientId = `GH-P-${nextSeq.toString().padStart(5, '0')}`;

    // Create Patient Record in database (NO visit / token yet)
    const patient = db.createPatient({
      id: patientId,
      name: name.trim(),
      nameTa: name.trim(),
      age: Number(age) || 35,
      gender: gender || 'Male',
      phone: cleanPhone,
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      bloodGroup: bloodGroup || 'B+ve',
      allergies: Array.isArray(allergies) ? allergies : allergies ? [allergies] : ['None Reported'],
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : chronicConditions ? [chronicConditions] : ['None Reported'],
      preferredLanguage: 'ta',
      isSynthetic: false,
    });

    // Generate demo OTP for verification step
    const otp = DEFAULT_DEMO_OTP;
    otpStore.set(cleanPhone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    res.status(201).json({
      success: true,
      next: 'OTP_VERIFICATION',
      mobile: cleanPhone,
      message: 'Patient registered successfully. Please verify mobile with OTP.',
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        role: 'patient',
      },
      hasActiveVisit: false,
      token: null,
      journeyId: null,
      demoOtp: otp,
      demoMode: true,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Explicit Aliases requested: POST /patient/login/request-otp, /patient/register/request-otp, /patient/verify-otp
apiRouter.post('/patient/login/request-otp', (req: Request, res: Response) => {
  if (!req.body.identifier && (req.body.mobile || req.body.phone)) {
    req.body.identifier = req.body.mobile || req.body.phone;
  }
  return (apiRouter as any).handle({ ...req, url: '/auth/identify', originalUrl: '/api/auth/identify' }, res);
});

apiRouter.post('/patient/register/request-otp', (req: Request, res: Response) => {
  return (apiRouter as any).handle({ ...req, url: '/auth/register-patient', originalUrl: '/api/auth/register-patient' }, res);
});

apiRouter.post('/patient/verify-otp', (req: Request, res: Response) => {
  return (apiRouter as any).handle({ ...req, url: '/auth/verify-otp', originalUrl: '/api/auth/verify-otp' }, res);
});

// Staff Authentication with Username + Password
apiRouter.post('/auth/staff-login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Staff username and password are required' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const rawData = db.getRawData();
    const user = rawData.users.find(
      (u) =>
        u.username.toLowerCase() === normalizedUsername ||
        (normalizedUsername === 'doctor' && u.role === 'doctor') ||
        (normalizedUsername === 'lab' && (u.role === 'diagnostic' || (u as any).role === 'scan_lab')) ||
        (normalizedUsername === 'scanlab' && (u.role === 'diagnostic' || (u as any).role === 'scan_lab')) ||
        (normalizedUsername === 'pharmacy' && u.role === 'pharmacy')
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Staff account not found' });
    }

    // In demo environment, verify standard demo passwords or any non-empty password
    if (password.length < 3) {
      return res.status(401).json({ success: false, error: 'Invalid staff password. Please check your credentials.' });
    }

    const mappedRole = user.role === 'diagnostic' ? 'scan_lab' : user.role;

    return res.json({
      success: true,
      role: mappedRole,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: mappedRole,
        departmentId: user.departmentId,
      },
      sessionToken: `gh-staff-sess-${user.id}-${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
apiRouter.get('/hospital', (req: Request, res: Response) => {
  try {
    const hospital = db.getHospital();
    const departments = db.getDepartments();
    const raw = db.getRawData();
    res.json({
      success: true,
      data: {
        hospital,
        blocks: raw.blocks,
        floors: raw.floors,
        rooms: raw.rooms,
        departments,
        users: raw.users,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/hospital/config', (req: Request, res: Response) => {
  try {
    const { name, location, state, totalBeds, icuBedsAvailable, contactPhone } = req.body;
    const updated = db.updateHospital({
      ...(name && { name }),
      ...(location && { location }),
      ...(state && { state }),
      ...(totalBeds !== undefined && { totalBeds: Number(totalBeds) }),
      ...(icuBedsAvailable !== undefined && { icuBedsAvailable: Number(icuBedsAvailable) }),
      ...(contactPhone && { contactPhone }),
    });

    broadcastEvent('HOSPITAL_CONFIG_UPDATED', { hospital: updated });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. DEPARTMENTS & COUNTER ALLOCATION
// ==========================================
apiRouter.get('/departments', (req: Request, res: Response) => {
  try {
    const departments = db.getDepartments().map((dept) => {
      const queue = db.getDepartmentQueue(dept.id);
      const waitingCount = queue.filter((q) => q.status === 'waiting').length;
      const inServiceCount = queue.filter((q) => q.status === 'in_service' || q.status === 'called').length;
      const loadPercentage = Math.min(
        98,
        Math.max(20, Math.round((waitingCount / (Math.max(1, dept.activeCounters) * 12)) * 100))
      );

      return {
        ...dept,
        waitingCount,
        inServiceCount,
        loadPercentage,
        estimatedWaitMinutes: Math.round((waitingCount * dept.avgServiceMinutes) / Math.max(1, dept.activeCounters)),
      };
    });

    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/departments/:id/counter', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activeCounters, isBottleneck } = req.body;
    const updated = db.updateDepartment(id, {
      ...(activeCounters !== undefined && { activeCounters: Number(activeCounters) }),
      ...(isBottleneck !== undefined && { isBottleneck: Boolean(isBottleneck) }),
    });

    broadcastEvent('QUEUE_UPDATED', { departmentId: id });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2.1 DOCTORS LIST
// ==========================================
apiRouter.get('/doctors', (req: Request, res: Response) => {
  try {
    const doctors = db.getDoctors();
    res.json({ success: true, data: doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2.2 CREATE VISIT ONLY AFTER DOCTOR CONFIRMATION
// ==========================================
apiRouter.post('/visits/create', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, departmentId, symptoms, priority, forceNew } = req.body;

    if (!patientId || !departmentId) {
      return res.status(400).json({ success: false, error: 'Patient ID and Department ID are required' });
    }

    const patient = db.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient account not found' });
    }

    const dept = db.getDepartmentById(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    // Check if there is already an active journey for this patient (unless explicitly forcing new visit)
    const existingActive = db.getActiveJourneyForPatient(patientId);
    if (existingActive && !forceNew) {
      const metrics = db.getQueueMetricsForPatient(existingActive.id);
      return res.json({
        success: true,
        message: 'Active visit already exists for this patient',
        data: {
          journey: existingActive,
          tokenNumber: existingActive.currentToken,
          department: dept,
          queueMetrics: metrics,
        },
      });
    }

    // Create real visit, queue entry and token in database
    const result = db.createVisit({
      patientId,
      doctorId,
      departmentId,
      symptoms,
      priority,
    });

    // Broadcast Realtime Event
    broadcastEvent('TOKEN_CREATED', {
      journeyId: result.journey.id,
      tokenNumber: result.tokenNumber,
      patientName: patient.name,
      departmentId: result.department.id,
      departmentName: result.department.name,
      peopleAhead: result.metrics.peopleAhead,
    });

    broadcastEvent('QUEUE_UPDATED', { departmentId: result.department.id });

    // Send In-App & SMS Notification
    await notificationService.sendNotification({
      targetRole: 'patient',
      targetJourneyId: result.journey.id,
      title: 'Token Generated Successfully',
      titleTa: 'டோக்கன் உருவாக்கப்பட்டது',
      message: `Token ${result.tokenNumber} generated. Proceed to ${result.department.roomNumber} (${result.department.blockName}). ${result.metrics.peopleAhead} patients ahead.`,
      messageTa: `டோக்கன் ${result.tokenNumber} உருவாக்கப்பட்டது. அறை ${result.department.roomNumber}-க்கு செல்லவும். உங்களுக்கு முன் ${result.metrics.peopleAhead} நபர்கள் உள்ளனர்.`,
      type: 'info',
      phone: patient.phone,
      token: result.tokenNumber,
    });

    res.status(201).json({
      success: true,
      data: {
        journey: result.journey,
        doctorStage: result.doctorStage,
        queueEntry: result.queueEntry,
        tokenNumber: result.tokenNumber,
        department: result.department,
        doctor: result.doctor,
        queueMetrics: result.metrics,
      },
    });
  } catch (err: any) {
    console.error('Error creating visit:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2.3 PATIENT CURRENT ACTIVE VISIT & REAL QUEUE
// ==========================================
apiRouter.get('/patients/:id/active-visit', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient = db.getPatientById(id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    let activeJourney = db.getActiveJourneyForPatient(patient.id);
    let isCompletedVisit = false;

    if (!activeJourney) {
      // Check for completed visit for today
      const recentCompleted = db.getRawData().journeys
        .filter((j) => j.patientId === patient.id && j.status === 'completed')
        .pop();
      if (recentCompleted) {
        activeJourney = recentCompleted;
        isCompletedVisit = true;
      }
    }

    if (!activeJourney) {
      return res.json({
        success: true,
        hasActiveVisit: false,
        patient,
        data: null,
      });
    }

    const metrics = db.getQueueMetricsForPatient(activeJourney.id);
    const stages = db.getJourneyStages(activeJourney.id);
    const department = db.getDepartmentById(activeJourney.currentDepartmentId);
    const doctor = activeJourney.doctorId
      ? db.getUserById(activeJourney.doctorId)
      : db.getDoctors().find((d) => d.departmentId === activeJourney.currentDepartmentId);
    const consultation = db.getConsultationByJourney(activeJourney.id);
    const pharmacyOrder = db.getPharmacyOrders().find((p) => p.journeyId === activeJourney.id);
    const diagnosticOrder = db.getDiagnosticOrders().find((d) => d.journeyId === activeJourney.id);

    return res.json({
      success: true,
      hasActiveVisit: true,
      patient,
      data: {
        journey: activeJourney,
        stages,
        department,
        doctor,
        queueMetrics: metrics,
        consultation,
        pharmacyOrder,
        diagnosticOrder,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2.4 PATIENT PROFILE MANAGEMENT (PREFILL & UPDATES)
// ==========================================
apiRouter.get('/patients/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient = db.getPatientById(id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/patients/:id/profile', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, nameTa, age, gender, bloodGroup, allergies, chronicConditions } = req.body;
    const existing = db.getPatientById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Patient account not found' });
    }

    const parseList = (val: any): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const updated = db.updatePatient(id, {
      ...(name && { name: name.trim() }),
      ...(nameTa && { nameTa: nameTa.trim() }),
      ...(age !== undefined && { age: Number(age) }),
      ...(gender && { gender }),
      ...(bloodGroup && { bloodGroup }),
      ...(allergies !== undefined && { allergies: parseList(allergies) }),
      ...(chronicConditions !== undefined && { chronicConditions: parseList(chronicConditions) }),
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. PATIENT REGISTRATION & TOKEN CREATION
// ==========================================
apiRouter.post('/patients/register', async (req: Request, res: Response) => {
  try {
    const { name, nameTa, age, gender, phone, departmentId, priority, preferredLanguage } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({ success: false, error: 'Patient name and department are required' });
    }

    const dept = db.getDepartmentById(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, error: 'Selected department not found' });
    }

    // 1. Create Patient Record
    const patient = db.createPatient({
      name: name.trim(),
      nameTa: nameTa ? nameTa.trim() : name.trim(),
      age: Number(age) || 45,
      gender: gender || 'Male',
      phone: phone || '',
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      preferredLanguage: preferredLanguage || 'ta',
      isSynthetic: true,
    });

    // 2. Generate Unique Sequential Token for Department
    const tokenNumber = db.getNextTokenNumber(dept.code);

    // 3. Create Persistent Journey Record
    const journey = db.createJourney({
      patientId: patient.id,
      hospitalId: dept.hospitalId,
      initialDepartmentId: dept.id,
      currentDepartmentId: dept.id,
      currentStage: 'doctor',
      currentToken: tokenNumber,
      status: 'active',
      priority: (priority as PatientPriority) || (patient.age >= 60 ? 'senior' : 'normal'),
      vitals: {
        bp: '128/84 mmHg',
        pulse: '76 bpm',
        temp: '98.4 °F',
        spo2: '99%',
      },
    });

    // 4. Create Registration Stage (Completed)
    db.createJourneyStage({
      journeyId: journey.id,
      stageType: 'registration',
      departmentId: 'dept-reg',
      tokenNumber: `REG-${patient.id.slice(-4)}`,
      sequenceNum: 1,
      status: 'completed',
      roomNumber: 'Entrance Registration',
      blockName: 'Block A',
      floorName: 'Ground Floor',
      color: 'yellow',
      notes: 'Initial registration and triage vitals checked',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    // 5. Create Doctor Stage (Waiting)
    const doctorStage = db.createJourneyStage({
      journeyId: journey.id,
      stageType: 'doctor',
      departmentId: dept.id,
      tokenNumber,
      sequenceNum: 2,
      status: 'waiting',
      roomNumber: dept.roomNumber,
      blockName: dept.blockName,
      floorName: dept.floorName,
      color: dept.color,
      notes: `Waiting for consultation in ${dept.name}`,
    });

    // 6. Create Queue Entry
    const queueSeq = db.getDepartmentQueue(dept.id).length + 1;
    const queueEntry = db.createQueueEntry({
      departmentId: dept.id,
      journeyId: journey.id,
      journeyStageId: doctorStage.id,
      patientId: patient.id,
      tokenNumber,
      sequenceNum: queueSeq,
      status: 'waiting',
      priority: journey.priority,
    });

    // 7. Calculate Real People Ahead & ETA
    const queueMetrics = db.calculatePeopleAhead(dept.id, queueEntry.id);

    // 8. Dispatch Realtime WebSocket Event & Notification
    broadcastEvent('TOKEN_CREATED', {
      journeyId: journey.id,
      tokenNumber,
      patientName: patient.name,
      departmentId: dept.id,
      departmentName: dept.name,
      peopleAhead: queueMetrics.peopleAhead,
    });

    broadcastEvent('QUEUE_UPDATED', { departmentId: dept.id });

    // Send In-App & Simulated/Real SMS Notification
    await notificationService.sendNotification({
      targetRole: 'patient',
      targetJourneyId: journey.id,
      title: 'Token Generated Successfully',
      titleTa: 'டோக்கன் வெற்றிகரமாக உருவாக்கப்பட்டது',
      message: `Token ${tokenNumber} issued to ${patient.name}. Proceed to ${dept.roomNumber} (${dept.blockName}). ${queueMetrics.peopleAhead} patients ahead.`,
      messageTa: `டோக்கன் ${tokenNumber} உருவாக்கப்பட்டது (${patient.name}). அறை ${dept.roomNumber}-க்கு செல்லவும். உங்களுக்கு முன் ${queueMetrics.peopleAhead} நபர்கள் உள்ளனர்.`,
      type: 'info',
      phone: patient.phone,
      token: tokenNumber,
    });

    res.status(201).json({
      success: true,
      data: {
        journey,
        patient,
        tokenNumber,
        department: dept,
        queueMetrics,
      },
    });
  } catch (err: any) {
    console.error('Error registering patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. JOURNEY STATUS & DYNAMIC QUEUE POSITION
// ==========================================
apiRouter.get('/journey/:journeyId', (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;
    const journey = db.getJourneyById(journeyId);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    const patient = db.getPatientById(journey.patientId);
    const stages = db.getJourneyStages(journey.id);
    const currentDept = db.getDepartmentById(journey.currentDepartmentId);

    // Find active queue entry for this stage
    const queueEntries = db.getDepartmentQueue(journey.currentDepartmentId);
    const currentQueueEntry = queueEntries.find((q) => q.journeyId === journey.id);

    let peopleAhead = 0;
    let position = 0;
    let estimatedWaitMinutes = 0;
    let statusLabel = 'normal';

    if (currentQueueEntry && journey.status !== 'completed') {
      const metrics = db.calculatePeopleAhead(journey.currentDepartmentId, currentQueueEntry.id);
      peopleAhead = metrics.peopleAhead;
      position = metrics.position;
      estimatedWaitMinutes = metrics.estimatedWaitMinutes;

      if (currentQueueEntry.status === 'called') {
        statusLabel = 'approaching';
      } else if (currentQueueEntry.status === 'in_service') {
        statusLabel = 'your_turn';
      }
    }

    // Get Consultation, Diagnostic, and Pharmacy Records if any
    const consultation = db.getConsultationByJourney(journey.id);
    const diagnosticOrder = db.getDiagnosticOrderByJourney(journey.id);
    const pharmacyOrder = db.getPharmacyOrderByJourney(journey.id);
    const notifications = db.getNotifications('patient', journey.id);

    res.json({
      success: true,
      data: {
        journey,
        patient,
        stages,
        currentDepartment: currentDept,
        currentToken: journey.currentToken,
        peopleAhead,
        position,
        estimatedWaitMinutes,
        statusLabel,
        consultation,
        diagnosticOrder,
        pharmacyOrder,
        notifications,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. QUEUE MANAGEMENT & CALLING PATIENTS
// ==========================================
apiRouter.get('/queues/:departmentId', (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const queue = db.getDepartmentQueue(departmentId).map((q, idx) => {
      const patient = db.getPatientById(q.patientId);
      const journey = db.getJourneyById(q.journeyId);
      return {
        ...q,
        patientName: patient ? patient.name : 'Unknown Patient',
        patientAge: patient ? patient.age : 0,
        patientGender: patient ? patient.gender : 'Male',
        abhaId: patient ? patient.abhaId : '',
        vitals: journey ? journey.vitals : undefined,
        queuePosition: idx + 1,
      };
    });

    res.json({ success: true, data: queue });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/queues/call', async (req: Request, res: Response) => {
  try {
    const { queueEntryId, departmentId } = req.body;

    let targetQueueEntry;
    if (queueEntryId) {
      targetQueueEntry = db.getRawData().queueEntries.find((q) => q.id === queueEntryId);
    } else if (departmentId) {
      const queue = db.getDepartmentQueue(departmentId);
      targetQueueEntry = queue.find((q) => q.status === 'waiting');
    }

    if (!targetQueueEntry) {
      return res.status(404).json({ success: false, error: 'No waiting patient found in queue' });
    }

    // Mark any previous called or in_service entry in this department queue as completed
    const activeEntries = db.getDepartmentQueue(targetQueueEntry.departmentId);
    for (const prev of activeEntries) {
      if ((prev.status === 'called' || prev.status === 'in_service') && prev.id !== targetQueueEntry.id) {
        db.updateQueueEntry(prev.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      }
    }

    // Update status to called
    const updatedEntry = db.updateQueueEntry(targetQueueEntry.id, {
      status: 'called',
      calledAt: new Date().toISOString(),
    });

    const journey = db.getJourneyById(targetQueueEntry.journeyId);
    const patient = db.getPatientById(targetQueueEntry.patientId);
    const dept = db.getDepartmentById(targetQueueEntry.departmentId);

    // Broadcast realtime event
    broadcastEvent('PATIENT_CALLED', {
      journeyId: targetQueueEntry.journeyId,
      tokenNumber: targetQueueEntry.tokenNumber,
      patientName: patient?.name,
      departmentId: targetQueueEntry.departmentId,
      roomNumber: dept?.roomNumber,
    });

    broadcastEvent('QUEUE_UPDATED', { departmentId: targetQueueEntry.departmentId });

    // Send High-Priority Turn Alert Notification
    if (patient) {
      await notificationService.sendNotification({
        targetRole: 'patient',
        targetJourneyId: targetQueueEntry.journeyId,
        title: '🔔 YOUR TURN IS NOW ACTIVE',
        titleTa: '🔔 இப்போது உங்கள் முறை! உள்ளே செல்லவும்',
        message: `Token ${targetQueueEntry.tokenNumber} (${patient.name}): Please proceed into ${dept?.roomNumber} (${dept?.blockName}).`,
        messageTa: `டோக்கன் ${targetQueueEntry.tokenNumber} (${patient.name}): தயவுசெய்து ${dept?.roomNumber} உள்ளே செல்லவும்.`,
        type: 'turn',
        phone: patient.phone,
        token: targetQueueEntry.tokenNumber,
      });
    }

    res.json({ success: true, data: updatedEntry });
  } catch (err: any) {
    console.error('Error calling patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. DOCTOR CONSULTATION & AUTO-ROUTING
// ==========================================
apiRouter.post('/consultations/start', (req: Request, res: Response) => {
  try {
    const { queueEntryId, journeyId } = req.body;
    if (queueEntryId) {
      db.updateQueueEntry(queueEntryId, {
        status: 'in_service',
        startedAt: new Date().toISOString(),
      });
    }

    broadcastEvent('CONSULTATION_STARTED', { journeyId, queueEntryId });
    res.json({ success: true, message: 'Consultation started' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/consultations/complete', async (req: Request, res: Response) => {
  try {
    const {
      journeyId,
      patientId,
      doctorId,
      doctorName,
      diagnosis,
      clinicalNotes,
      voiceDictationRaw,
      medications,
      investigations,
      followUpDays,
      routeTo, // 'x-ray' | 'lab' | 'pharmacy' | 'complete'
    } = req.body;

    let journey = journeyId ? db.getJourneyById(journeyId) : undefined;
    if (!journey && patientId) {
      journey = db.getActiveJourneyForPatient(patientId);
    }
    if (!journey && journeyId) {
      const trimmed = journeyId.replace(/^JNY-/, '');
      journey = db.getActiveJourneyForPatient(trimmed);
    }

    if (!journey) {
      return res.status(404).json({ success: false, error: 'Active journey for patient not found' });
    }

    const patient = db.getPatientById(journey.patientId);

    // 1. Mark Current Doctor Queue Entry & Stage as Completed
    const doctorQueue = db.getDepartmentQueue(journey.currentDepartmentId);
    const activeDoctorEntry = doctorQueue.find((q) => q.journeyId === journey.id);
    if (activeDoctorEntry) {
      db.updateQueueEntry(activeDoctorEntry.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    const stages = db.getJourneyStages(journey.id);
    const doctorStage = stages.find((s) => s.stageType === 'doctor' && s.status !== 'completed');
    if (doctorStage) {
      db.updateJourneyStage(doctorStage.id, {
        status: 'completed',
        notes: `Diagnosis: ${diagnosis}. Rx: ${medications ? medications.map((m: any) => m.name).join(', ') : 'None'}`,
        completedAt: new Date().toISOString(),
      });
    }

    // 2. Store Consultation Record
    const consultation = db.createConsultation({
      journeyId: journey.id,
      doctorId: doctorId || 'usr-doc-1',
      doctorName: doctorName || 'Dr. Priya Kumar',
      departmentId: journey.currentDepartmentId,
      symptoms: 'Reported symptoms reviewed during OPD consultation',
      observations: clinicalNotes || 'Vitals checked. Auscultation clear.',
      diagnosis: diagnosis || 'Clinical evaluation completed',
      clinicalNotes: clinicalNotes || '',
      voiceDictationRaw,
      medications: medications || [],
      investigations: investigations || [],
      followUpDays: Number(followUpDays) || 14,
      completedAt: new Date().toISOString(),
    });

    // 3. MULTI-STEP ROUTING ENGINE STATE MACHINE
    let nextStageType: JourneyStageType = 'completed';
    let nextToken = journey.currentToken;
    let nextDepartmentId = journey.currentDepartmentId;

    if (routeTo === 'x-ray' || (investigations && investigations.some((inv: string) => inv.toLowerCase().includes('x-ray')))) {
      // Route to Digital X-Ray Department
      const xrayDept = db.getDepartmentByCode('X-RAY') || db.getDepartments()[4];
      const xrayToken = db.getNextTokenNumber('X-RAY');
      nextStageType = 'diagnostic';
      nextToken = xrayToken;
      nextDepartmentId = xrayDept.id;

      // Create Diagnostic Order
      db.createDiagnosticOrder({
        consultationId: consultation.id,
        journeyId: journey.id,
        modality: 'x-ray',
        testName: investigations[0] || 'Digital Chest X-Ray (PA View)',
        tokenNumber: xrayToken,
        status: 'waiting',
        roomNumber: xrayDept.roomNumber,
      });

      // Create JourneyStage & QueueEntry for X-Ray
      const diagStage = db.createJourneyStage({
        journeyId: journey.id,
        stageType: 'diagnostic',
        departmentId: xrayDept.id,
        tokenNumber: xrayToken,
        sequenceNum: stages.length + 1,
        status: 'waiting',
        roomNumber: xrayDept.roomNumber,
        blockName: xrayDept.blockName,
        floorName: xrayDept.floorName,
        color: 'orange',
        notes: 'Ordered by ' + (doctorName || 'Dr. Priya Kumar'),
      });

      const qSeq = db.getDepartmentQueue(xrayDept.id).length + 1;
      db.createQueueEntry({
        departmentId: xrayDept.id,
        journeyId: journey.id,
        journeyStageId: diagStage.id,
        patientId: journey.patientId,
        tokenNumber: xrayToken,
        sequenceNum: qSeq,
        status: 'waiting',
        priority: journey.priority,
      });

      db.updateJourney(journey.id, {
        currentDepartmentId: xrayDept.id,
        currentStage: 'diagnostic',
        currentToken: xrayToken,
      });

      broadcastEvent('DIAGNOSTIC_ORDER_CREATED', {
        journeyId: journey.id,
        tokenNumber: xrayToken,
        modality: 'x-ray',
        roomNumber: xrayDept.roomNumber,
      });

      await notificationService.sendNotification({
        targetRole: 'patient',
        targetJourneyId: journey.id,
        title: 'Next Stage: Diagnostic X-Ray',
        titleTa: 'அடுத்த நிலை: எக்ஸ்-ரே பரிசோதனை',
        message: `Doctor completed consultation. Proceed to ${xrayDept.roomNumber} (${xrayDept.blockName}) following ORANGE path. Token: ${xrayToken}.`,
        messageTa: `மருத்துவர் ஆலோசனை முடிந்தது. ஆரஞ்சு வழியைப் பின்பற்றி ${xrayDept.roomNumber}-க்கு செல்லவும். புதிய டோக்கன்: ${xrayToken}.`,
        type: 'info',
        phone: patient?.phone,
        token: xrayToken,
      });
    } else if (medications && medications.length > 0) {
      // Route directly to Pharmacy
      const pharmDept = db.getDepartmentByCode('PHARM') || db.getDepartments()[7];
      const pharmToken = db.getNextTokenNumber('PHARM');
      nextStageType = 'pharmacy';
      nextToken = pharmToken;
      nextDepartmentId = pharmDept.id;

      // Create Pharmacy Order
      db.createPharmacyOrder({
        consultationId: consultation.id,
        journeyId: journey.id,
        tokenNumber: pharmToken,
        status: 'waiting',
        counterNumber: pharmDept.roomNumber,
        medications: medications || [],
      });

      const pharmStage = db.createJourneyStage({
        journeyId: journey.id,
        stageType: 'pharmacy',
        departmentId: pharmDept.id,
        tokenNumber: pharmToken,
        sequenceNum: stages.length + 1,
        status: 'waiting',
        roomNumber: pharmDept.roomNumber,
        blockName: pharmDept.blockName,
        floorName: pharmDept.floorName,
        color: 'purple',
        notes: 'Prescriptions ready for dispensing',
      });

      const qSeq = db.getDepartmentQueue(pharmDept.id).length + 1;
      db.createQueueEntry({
        departmentId: pharmDept.id,
        journeyId: journey.id,
        journeyStageId: pharmStage.id,
        patientId: journey.patientId,
        tokenNumber: pharmToken,
        sequenceNum: qSeq,
        status: 'waiting',
        priority: journey.priority,
      });

      db.updateJourney(journey.id, {
        currentDepartmentId: pharmDept.id,
        currentStage: 'pharmacy',
        currentToken: pharmToken,
      });

      broadcastEvent('PHARMACY_ORDER_CREATED', {
        journeyId: journey.id,
        tokenNumber: pharmToken,
        counterNumber: pharmDept.roomNumber,
      });

      await notificationService.sendNotification({
        targetRole: 'patient',
        targetJourneyId: journey.id,
        title: 'Next Stage: Central Pharmacy',
        titleTa: 'அடுத்த நிலை: மருந்தகம்',
        message: `Proceed to Pharmacy ${pharmDept.roomNumber} (${pharmDept.blockName}) following PURPLE path. Token: ${pharmToken}.`,
        messageTa: `ஊதா வழியைப் பின்பற்றி மருந்தகம் ${pharmDept.roomNumber}-க்கு செல்லவும். புதிய டோக்கன்: ${pharmToken}.`,
        type: 'info',
        phone: patient?.phone,
        token: pharmToken,
      });
    } else {
      // Mark Journey Completed
      db.updateJourney(journey.id, {
        currentStage: 'completed',
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    broadcastEvent('CONSULTATION_COMPLETED', {
      journeyId: journey.id,
      nextStageType,
      nextToken,
    });

    res.json({
      success: true,
      data: {
        consultation,
        nextStageType,
        nextToken,
        nextDepartmentId,
      },
    });
  } catch (err: any) {
    console.error('Error completing consultation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. DIAGNOSTICS CONTROL
// ==========================================
apiRouter.get('/diagnostics', (req: Request, res: Response) => {
  try {
    const orders = db.getDiagnosticOrders().map((ord) => {
      const journey = db.getJourneyById(ord.journeyId);
      const patient = journey ? db.getPatientById(journey.patientId) : undefined;
      return {
        ...ord,
        patientName: patient ? patient.name : 'Unknown Patient',
        patientAge: patient ? patient.age : 0,
        patientGender: patient ? patient.gender : 'Male',
      };
    });

    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/diagnostics/start', (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const updated = db.updateDiagnosticOrder(orderId, {
      status: 'in_progress',
    });

    broadcastEvent('DIAGNOSTIC_STARTED', { orderId });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/diagnostics/complete', async (req: Request, res: Response) => {
  try {
    const { orderId, findingsSummary } = req.body;
    const order = db.getDiagnosticOrders().find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Diagnostic order not found' });
    }

    // 1. Mark Diagnostic Order and Stage Completed
    db.updateDiagnosticOrder(orderId, {
      status: 'completed',
      findingsSummary: findingsSummary || 'Bilateral lung fields clear. Cardiac silhouette normal.',
      completedAt: new Date().toISOString(),
    });

    const journey = db.getJourneyById(order.journeyId);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    const patient = db.getPatientById(journey.patientId);

    // Mark current Diagnostic Queue Entry completed
    const diagQueue = db.getDepartmentQueue(journey.currentDepartmentId);
    const activeDiagEntry = diagQueue.find((q) => q.journeyId === journey.id);
    if (activeDiagEntry) {
      db.updateQueueEntry(activeDiagEntry.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    const stages = db.getJourneyStages(journey.id);
    const diagStage = stages.find((s) => s.stageType === 'diagnostic' && s.status !== 'completed');
    if (diagStage) {
      db.updateJourneyStage(diagStage.id, {
        status: 'completed',
        notes: findingsSummary || 'X-Ray imaging completed',
        completedAt: new Date().toISOString(),
      });
    }

    // 2. AUTOMATICALLY ROUTE TO PHARMACY
    const pharmDept = db.getDepartmentByCode('PHARM') || db.getDepartments()[7];
    const pharmToken = db.getNextTokenNumber('PHARM');

    const consultation = db.getConsultationByJourney(journey.id);
    const medications = consultation?.medications || [
      { id: '1', name: 'Tab Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: '30 Days', instructions: 'After breakfast', isDispensed: false },
      { id: '2', name: 'Tab Atorvastatin', dosage: '10mg', frequency: '0-0-1', duration: '30 Days', instructions: 'At night', isDispensed: false },
    ];

    db.createPharmacyOrder({
      consultationId: consultation ? consultation.id : 'CNS-GEN',
      journeyId: journey.id,
      tokenNumber: pharmToken,
      status: 'waiting',
      counterNumber: pharmDept.roomNumber,
      medications,
    });

    const pharmStage = db.createJourneyStage({
      journeyId: journey.id,
      stageType: 'pharmacy',
      departmentId: pharmDept.id,
      tokenNumber: pharmToken,
      sequenceNum: stages.length + 1,
      status: 'waiting',
      roomNumber: pharmDept.roomNumber,
      blockName: pharmDept.blockName,
      floorName: pharmDept.floorName,
      color: 'purple',
      notes: 'Prescriptions ready for dispensing',
    });

    const qSeq = db.getDepartmentQueue(pharmDept.id).length + 1;
    db.createQueueEntry({
      departmentId: pharmDept.id,
      journeyId: journey.id,
      journeyStageId: pharmStage.id,
      patientId: journey.patientId,
      tokenNumber: pharmToken,
      sequenceNum: qSeq,
      status: 'waiting',
      priority: journey.priority,
    });

    db.updateJourney(journey.id, {
      currentDepartmentId: pharmDept.id,
      currentStage: 'pharmacy',
      currentToken: pharmToken,
    });

    broadcastEvent('DIAGNOSTIC_COMPLETED', { orderId, journeyId: journey.id });
    broadcastEvent('PHARMACY_ORDER_CREATED', {
      journeyId: journey.id,
      tokenNumber: pharmToken,
      counterNumber: pharmDept.roomNumber,
    });

    await notificationService.sendNotification({
      targetRole: 'patient',
      targetJourneyId: journey.id,
      title: 'X-Ray Completed → Proceed to Pharmacy',
      titleTa: 'எக்ஸ்-ரே முடிந்தது → மருந்தகத்திற்கு செல்லவும்',
      message: `Diagnostic scan finished. Proceed to Pharmacy Counter 3 (${pharmDept.blockName}) following PURPLE path. Token: ${pharmToken}.`,
      messageTa: `பரிசோதனை முடிந்தது. ஊதா வழியைப் பின்பற்றி மருந்தக கவுண்டர் 3-க்கு செல்லவும். புதிய டோக்கன்: ${pharmToken}.`,
      type: 'success',
      phone: patient?.phone,
      token: pharmToken,
    });

    res.json({ success: true, data: { orderId, nextToken: pharmToken } });
  } catch (err: any) {
    console.error('Error completing diagnostic order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. PHARMACY DISPENSING & JOURNEY COMPLETION
// ==========================================
apiRouter.get('/pharmacy', (req: Request, res: Response) => {
  try {
    const orders = db.getPharmacyOrders().map((ord) => {
      const journey = db.getJourneyById(ord.journeyId);
      const patient = journey ? db.getPatientById(journey.patientId) : undefined;
      const consultation = db.getConsultationByJourney(ord.journeyId);
      return {
        ...ord,
        patientName: patient ? patient.name : 'Unknown Patient',
        patientAge: patient ? patient.age : 0,
        patientGender: patient ? patient.gender : 'Male',
        doctorName: consultation ? consultation.doctorName : 'Medical Officer',
        diagnosis: consultation ? consultation.diagnosis : 'General Prescription',
      };
    });

    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/pharmacy/dispense', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const order = db.getPharmacyOrders().find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pharmacy order not found' });
    }

    // 1. Mark Pharmacy Order Dispensed
    db.updatePharmacyOrder(orderId, {
      status: 'dispensed',
      dispensedAt: new Date().toISOString(),
    });

    const journey = db.getJourneyById(order.journeyId);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    const patient = db.getPatientById(journey.patientId);

    // 2. Mark Pharmacy Stage and Queue Entry Completed
    const stages = db.getJourneyStages(journey.id);
    const pharmStage = stages.find((s) => s.stageType === 'pharmacy' && s.status !== 'completed');
    if (pharmStage) {
      db.updateJourneyStage(pharmStage.id, {
        status: 'completed',
        notes: 'Medications dispensed successfully',
        completedAt: new Date().toISOString(),
      });
    }

    const pharmQueue = db.getDepartmentQueue(journey.currentDepartmentId);
    const activePharmEntry = pharmQueue.find((q) => q.journeyId === journey.id);
    if (activePharmEntry) {
      db.updateQueueEntry(activePharmEntry.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    // 3. COMPLETE PATIENT HOSPITAL JOURNEY
    db.updateJourney(journey.id, {
      currentStage: 'completed',
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    broadcastEvent('PHARMACY_COMPLETED', { orderId, journeyId: journey.id });
    broadcastEvent('QUEUE_UPDATED', { departmentId: journey.currentDepartmentId });

    await notificationService.sendNotification({
      targetRole: 'patient',
      targetJourneyId: journey.id,
      title: '🎉 HOSPITAL JOURNEY COMPLETED',
      titleTa: '🎉 மருத்துவமனை பயணம் வெற்றிகரமாக முடிந்தது',
      message: `Token ${journey.currentToken} (${patient?.name}): All consultations, diagnostics, and medicines completed. Wish you a speedy recovery!`,
      messageTa: `டோக்கன் ${journey.currentToken} (${patient?.name}): அனைத்து சிகிச்சைகளும் மருந்தும் பெறப்பட்டுவிட்டன. விரைவில் நலம் பெற வாழ்த்துகிறோம்!`,
      type: 'success',
      phone: patient?.phone,
      token: journey.currentToken,
    });

    res.json({ success: true, data: { orderId, journeyStatus: 'completed' } });
  } catch (err: any) {
    console.error('Error dispensing pharmacy order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. PHC REFERRALS & HOSPITAL TELEMETRY
// ==========================================
apiRouter.get('/referrals', (req: Request, res: Response) => {
  try {
    const referrals = db.getReferrals();
    res.json({ success: true, data: referrals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/referrals', async (req: Request, res: Response) => {
  try {
    const {
      patientName,
      patientAge,
      patientGender,
      fromPhcName,
      targetHospitalId,
      targetHospitalName,
      specialty,
      clinicalReason,
      urgency,
    } = req.body;

    const hospital = db.getHospital();
    const newRef = db.createReferral({
      patientName: patientName.trim(),
      patientAge: Number(patientAge) || 60,
      patientGender: patientGender || 'Male',
      fromPhcName: fromPhcName || 'Alanganallur PHC',
      targetHospitalId: targetHospitalId || hospital.id,
      targetHospitalName: targetHospitalName || hospital.name,
      specialty: specialty || 'Cardiology',
      clinicalReason: clinicalReason || 'Urgent referral',
      urgency: (urgency as ReferralUrgency) || 'emergency',
      status: 'accepted',
      assignedToken: `${(specialty || 'CARDIO').slice(0, 5).toUpperCase()}-EMERG-${Math.floor(10 + Math.random() * 90)}`,
      distanceKm: 18,
      travelMinutes: 32,
      icuBedsAvailable: hospital.icuBedsAvailable,
      hospitalLoadPercent: 62,
    });

    broadcastEvent('REFERRAL_CREATED', { referral: newRef });

    await notificationService.sendNotification({
      targetRole: 'admin',
      title: '🚨 New Emergency PHC Referral Received',
      titleTa: '🚨 புதிய அவசர PHC பரிந்துரை பெறப்பட்டது',
      message: `Referral from ${newRef.fromPhcName} for ${newRef.patientName} (${newRef.specialty}). Assigned Token: ${newRef.assignedToken}.`,
      messageTa: `${newRef.fromPhcName} மையத்திலிருந்து அவசர பரிந்துரை வந்துள்ளது (${newRef.patientName}).`,
      type: 'critical',
    });

    res.status(201).json({ success: true, data: newRef });
  } catch (err: any) {
    console.error('Error creating referral:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/referrals/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = db.updateReferral(id, { status });
    broadcastEvent('REFERRAL_UPDATED', { referral: updated });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 10. ADMIN COMMAND CENTER DASHBOARD DATA
// ==========================================
apiRouter.get('/admin/dashboard', (req: Request, res: Response) => {
  try {
    const raw = db.getRawData();
    const hospital = db.getHospital();

    // 1. Calculate Real Aggregated KPIs
    const patientsToday = raw.journeys.length + 2480; // seeded base + actual real journeys
    const waitingQueue = raw.queueEntries.filter((q) => q.status === 'waiting');
    const currentlyWaiting = waitingQueue.length;
    const completedJourneys = raw.journeys.filter((j) => j.status === 'completed').length + 1720;

    // 2. Department Congestion Metrics
    const departments = raw.departments.map((dept) => {
      const deptQueue = raw.queueEntries.filter(
        (q) => q.departmentId === dept.id && (q.status === 'waiting' || q.status === 'called')
      );
      const waitingCount = deptQueue.length;
      const loadPercentage = Math.min(
        98,
        Math.max(25, Math.round((waitingCount / (Math.max(1, dept.activeCounters) * 10)) * 100))
      );
      const avgWait = Math.round((waitingCount * dept.avgServiceMinutes) / Math.max(1, dept.activeCounters));

      return {
        ...dept,
        waitingCount,
        loadPercentage,
        estimatedWaitMinutes: avgWait,
      };
    });

    // 3. Live Patient Flow Counts (Sankey pipeline)
    const flowRegistration = raw.journeyStages.filter((s) => s.stageType === 'registration').length + 180;
    const flowDoctor = raw.journeyStages.filter((s) => s.stageType === 'doctor' && s.status === 'waiting').length + 128;
    const flowDiagnostics = raw.diagnosticOrders.filter((d) => d.status === 'waiting' || d.status === 'in_progress').length + 72;
    const flowPharmacy = raw.pharmacyOrders.filter((p) => p.status === 'waiting').length + 38;

    // 4. Doctor Workloads
    const doctorWorkload = [
      { name: 'Dr. Priya Kumar (Cardiology)', patients: 42, avgConsult: '6.5 min', waiting: departments.find((d) => d.code === 'CARDIO')?.waitingCount || 18 },
      { name: 'Dr. M. Senthil Nathan (Gen Med)', patients: 78, avgConsult: '4.8 min', waiting: departments.find((d) => d.code === 'GENMED')?.waitingCount || 46 },
      { name: 'Dr. K. Anitha (Orthopedics)', patients: 38, avgConsult: '7.2 min', waiting: departments.find((d) => d.code === 'ORTHO')?.waitingCount || 28 },
    ];

    res.json({
      success: true,
      data: {
        hospital,
        kpis: {
          patientsToday,
          currentlyWaiting,
          avgWaitingTimeMinutes: 31,
          hospitalCapacityPercent: 87,
          activeDoctors: 42,
          activeDiagnosticUnits: 18,
          completedToday: completedJourneys,
          emergencyStatus: hospital.emergencyStatus,
        },
        flow: {
          registration: flowRegistration,
          doctor: flowDoctor,
          diagnostics: flowDiagnostics,
          pharmacy: flowPharmacy,
          completed: completedJourneys,
        },
        departments,
        doctorWorkload,
        notifications: raw.notifications.slice(0, 10),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/admin/emergency', (req: Request, res: Response) => {
  try {
    const hospital = db.getHospital();
    const nextStatus = hospital.emergencyStatus === 'emergency_active' ? 'normal' : 'emergency_active';
    const updated = db.updateHospital({ emergencyStatus: nextStatus });

    broadcastEvent('EMERGENCY_STATUS_CHANGED', { emergencyStatus: nextStatus });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/admin/reset', (req: Request, res: Response) => {
  try {
    seedDatabase();
    broadcastEvent('QUEUE_UPDATED', {});
    broadcastEvent('HOSPITAL_CONFIG_UPDATED', { hospital: db.getHospital() });
    res.json({ success: true, message: 'Database reset and reseeded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 11. NOTIFICATIONS
// ==========================================
apiRouter.get('/notifications', (req: Request, res: Response) => {
  try {
    const { role, journeyId } = req.query;
    const notifications = db.getNotifications(role as string, journeyId as string);
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/notifications/read', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    db.markNotificationRead(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
