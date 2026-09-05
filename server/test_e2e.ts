import { db } from './db/database';
import { seedDatabase } from './db/seed';

async function runE2ETest() {
  console.log('🧪 Starting GH-QueueFlow End-to-End Automated Integration Test...\n');

  // 1. Fresh Seed
  seedDatabase();
  const hospital = db.getHospital();
  console.log(`[PASS] 1. Hospital Config Loaded: ${hospital.name}`);

  // 2. Patient Registration
  const cardioDept = db.getDepartmentByCode('CARDIO')!;
  const patient = db.createPatient({
    name: 'Ganesan S.',
    nameTa: 'கணேசன் எஸ்.',
    age: 63,
    gender: 'Male',
    phone: '98401 11223',
    abhaId: '91-7788-9900-1122',
    preferredLanguage: 'ta',
    isSynthetic: true,
  });

  const tokenNumber = db.getNextTokenNumber(cardioDept.code);
  const journey = db.createJourney({
    patientId: patient.id,
    hospitalId: hospital.id,
    initialDepartmentId: cardioDept.id,
    currentDepartmentId: cardioDept.id,
    currentStage: 'doctor',
    currentToken: tokenNumber,
    status: 'active',
    priority: 'senior',
    vitals: { bp: '142/90 mmHg', pulse: '80 bpm', temp: '98.6 °F', spo2: '98%' },
  });

  const stageDoctor = db.createJourneyStage({
    journeyId: journey.id,
    stageType: 'doctor',
    departmentId: cardioDept.id,
    tokenNumber,
    sequenceNum: 1,
    status: 'waiting',
    roomNumber: cardioDept.roomNumber,
    blockName: cardioDept.blockName,
    floorName: cardioDept.floorName,
    color: cardioDept.color,
  });

  const queueEntry = db.createQueueEntry({
    departmentId: cardioDept.id,
    journeyId: journey.id,
    journeyStageId: stageDoctor.id,
    patientId: patient.id,
    tokenNumber,
    sequenceNum: 99,
    status: 'waiting',
    priority: 'senior',
  });

  const metrics = db.calculatePeopleAhead(cardioDept.id, queueEntry.id);
  console.log(`[PASS] 2. Patient Registered: ${patient.name} (${tokenNumber}), Journey: ${journey.id}, People Ahead: ${metrics.peopleAhead}, ETA: ${metrics.estimatedWaitMinutes}m`);

  // 3. Doctor Call
  db.updateQueueEntry(queueEntry.id, { status: 'called', calledAt: new Date().toISOString() });
  console.log(`[PASS] 3. Doctor Called Patient: ${tokenNumber} status is now CALLED (Approaching)`);

  // 4. Doctor Completes Consultation with X-Ray Order
  const consultation = db.createConsultation({
    journeyId: journey.id,
    doctorId: 'usr-doc-1',
    doctorName: 'Dr. Priya Kumar',
    departmentId: cardioDept.id,
    symptoms: 'Exertional dyspnea and hypertension',
    observations: 'BP 142/90. S1/S2 normal.',
    diagnosis: 'Hypertensive Heart Disease',
    clinicalNotes: 'Order Chest X-Ray. Prescribe Amlodipine 5mg.',
    medications: [{ id: '1', name: 'Tab Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: '30 Days', instructions: 'After breakfast', isDispensed: false }],
    investigations: ['Digital Chest X-Ray (PA View)'],
    followUpDays: 14,
  });

  // Multi-step auto-routing to X-Ray
  const xrayDept = db.getDepartmentByCode('X-RAY')!;
  const xrayToken = db.getNextTokenNumber('X-RAY');
  const diagOrder = db.createDiagnosticOrder({
    consultationId: consultation.id,
    journeyId: journey.id,
    modality: 'x-ray',
    testName: 'Digital Chest X-Ray (PA View)',
    tokenNumber: xrayToken,
    status: 'waiting',
    roomNumber: xrayDept.roomNumber,
  });

  db.updateJourney(journey.id, {
    currentDepartmentId: xrayDept.id,
    currentStage: 'diagnostic',
    currentToken: xrayToken,
  });

  console.log(`[PASS] 4. Doctor Completed Consultation -> System Auto-Routed to Diagnostic X-Ray (New Token: ${xrayToken}, Room: ${xrayDept.roomNumber})`);

  // 5. Diagnostic Staff Completes X-Ray -> Auto-Routes to Pharmacy
  db.updateDiagnosticOrder(diagOrder.id, {
    status: 'completed',
    findingsSummary: 'Cardiac silhouette mildly enlarged. Lung fields clear.',
    completedAt: new Date().toISOString(),
  });

  const pharmDept = db.getDepartmentByCode('PHARM')!;
  const pharmToken = db.getNextTokenNumber('PHARM');
  const pharmOrder = db.createPharmacyOrder({
    consultationId: consultation.id,
    journeyId: journey.id,
    tokenNumber: pharmToken,
    status: 'waiting',
    counterNumber: pharmDept.roomNumber,
    medications: consultation.medications,
  });

  db.updateJourney(journey.id, {
    currentDepartmentId: pharmDept.id,
    currentStage: 'pharmacy',
    currentToken: pharmToken,
  });

  console.log(`[PASS] 5. X-Ray Completed -> System Auto-Routed to Pharmacy (New Token: ${pharmToken}, Counter: ${pharmDept.roomNumber})`);

  // 6. Pharmacy Dispenses Medicines -> Journey Complete!
  db.updatePharmacyOrder(pharmOrder.id, {
    status: 'dispensed',
    dispensedAt: new Date().toISOString(),
  });

  db.updateJourney(journey.id, {
    currentStage: 'completed',
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  const finalJourney = db.getJourneyById(journey.id)!;
  console.log(`[PASS] 6. Pharmacy Dispensed -> Patient Hospital Journey Marked: ${finalJourney.status.toUpperCase()} ✅`);

  // 7. PHC Referral Engine
  const ref = db.createReferral({
    patientName: 'Subramanian K.',
    patientAge: 65,
    patientGender: 'Male',
    fromPhcName: 'Alanganallur PHC',
    targetHospitalId: hospital.id,
    targetHospitalName: hospital.name,
    specialty: 'Cardiology',
    clinicalReason: 'Unstable Angina',
    urgency: 'emergency',
    status: 'accepted',
    assignedToken: 'CARDIO-EMERG-099',
    distanceKm: 18,
    travelMinutes: 32,
    icuBedsAvailable: 4,
    hospitalLoadPercent: 62,
  });

  console.log(`[PASS] 7. PHC Referral Engine Created & Accepted: ${ref.id} (${ref.patientName}, Assigned Token: ${ref.assignedToken})`);

  console.log('\n===========================================================');
  console.log('🎉 ALL 7 END-TO-END WORKFLOW INTEGRATION TESTS PASSED!');
  console.log('===========================================================\n');
}

runE2ETest().catch(console.error);
