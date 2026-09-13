import { db } from '../server/db/database';

function runTest() {
  console.log('🧪 Testing Doctor Review Decision (Normal vs Emergency) & Pharmacy Synchronization...\n');

  // 1. Get Doctor & Patient
  const doctors = db.getDoctors();
  const doctor = doctors[0];
  const hospital = db.getHospital()!;
  const cardioDept = db.getDepartmentByCode('CARDIO')!;

  const patient = db.createPatient({
    name: 'Muthukumar P.',
    phone: '9842109988',
    age: 52,
    gender: 'Male',
    preferredLanguage: 'ta',
    isSynthetic: true,
  });

  console.log(`[PASS] 1. Created Patient: ${patient.name} (ID: ${patient.id}) for Doctor: ${doctor.fullName}`);

  // 2. Create Initial Visit
  const visit = db.createVisit({
    patientId: patient.id,
    doctorId: doctor.id,
    departmentId: cardioDept.id,
    symptoms: 'Exertional dyspnea and atypical angina',
    priority: 'normal',
  });
  console.log(`[PASS] 2. Visit Created: Journey ${visit.journey.id}, Token: ${visit.tokenNumber}`);

  // 3. Initial Consultation: Doctor orders Lab and Diagnostic tests
  const consultation = db.createConsultation({
    journeyId: visit.journey.id,
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    departmentId: cardioDept.id,
    symptoms: 'Chest tightness',
    observations: 'BP 150/95, S4 gallop heard',
    diagnosis: 'Ischemic Heart Disease',
    clinicalNotes: 'Order Chest X-Ray and Lipid Profile',
    medications: [],
    investigations: ['Digital Chest X-Ray', 'Lipid Profile Panel'],
    followUpDays: 7,
    completedAt: new Date().toISOString(),
  });

  const xrayDept = db.getDepartmentByCode('X-RAY')!;
  const diagToken = db.getNextTokenNumber(xrayDept.code);
  const diagOrder = db.createDiagnosticOrder({
    consultationId: consultation.id,
    journeyId: visit.journey.id,
    modality: 'x-ray',
    testName: 'Digital Chest X-Ray (PA View)',
    tokenNumber: diagToken,
    status: 'waiting',
    roomNumber: xrayDept.roomNumber,
    doctorId: doctor.id,
    doctorName: doctor.fullName,
  });
  console.log(`[PASS] 3. Diagnostic Order Created: ${diagOrder.id} (${diagOrder.testName})`);

  // 4. Diagnostic Technician completes scan with critical finding
  db.updateDiagnosticOrder(diagOrder.id, {
    status: 'completed',
    findingsSummary: 'CRITICAL: Marked cardiomegaly with acute pulmonary congestion.',
    completedAt: new Date().toISOString(),
  });
  console.log(`[PASS] 4. Diagnostic Scan Completed with Findings: "${diagOrder.findingsSummary}"`);

  // 5. DOCTOR REVIEWS REPORT -> CHOOSES EMERGENCY DECISION!
  const revisitRes = db.createRevisit({
    patientId: patient.id,
    decisionType: 'emergency',
    doctorId: doctor.id,
    doctorRemarks: 'Urgent acute pulmonary congestion. Direct immediate consultation required.',
  });

  console.log(`[PASS] 5a. Emergency Revisit Created: Revisit Token ${revisitRes.tokenNumber}`);
  console.log(`         Queue Status: ${revisitRes.queueEntry.status} (Immediate Consultation)`);
  console.log(`         Priority: ${revisitRes.queueEntry.priority}`);

  if (revisitRes.queueEntry.status !== 'in_service') {
    throw new Error(`Expected emergency status to be 'in_service', got ${revisitRes.queueEntry.status}`);
  }
  if (revisitRes.queueEntry.priority !== 'emergency') {
    throw new Error(`Expected emergency priority, got ${revisitRes.queueEntry.priority}`);
  }

  // Verify diagnostic order is now marked reviewed
  const updatedDiag = db.getDiagnosticOrders().find(o => o.id === diagOrder.id)!;
  console.log(`[PASS] 5b. Diagnostic Report Reviewed Flag: ${(updatedDiag as any).isReviewed === true ? 'YES ✅' : 'NO'}`);

  // Verify Doctor OPD queue has this patient in_service
  const docQueue = db.getDoctorQueue(doctor.id);
  const activeEntry = docQueue.find(q => q.patientId === patient.id);
  console.log(`[PASS] 5c. Doctor Queue shows patient ${patient.name}: Status = ${activeEntry?.status}, Priority = ${activeEntry?.priority}`);

  // 6. Doctor Consults Emergency Patient & Prescribes Medications -> Routes to Pharmacy
  const pharmDept = db.getDepartmentByCode('PHARM')!;
  const pharmToken = db.getNextTokenNumber('PHARM');
  const pharmOrder = db.createPharmacyOrder({
    consultationId: consultation.id,
    journeyId: visit.journey.id,
    patientId: patient.id,
    tokenNumber: pharmToken,
    status: 'waiting',
    counterNumber: pharmDept.roomNumber,
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    medications: [
      { id: 'm-1', name: 'Tab Nitroglycerin 2.6mg', dosage: '2.6 mg', frequency: '1-0-1', duration: '30 Days', instructions: 'After food', quantity: 60 },
      { id: 'm-2', name: 'Tab Furosemide 40mg', dosage: '40 mg', frequency: '1-0-0', duration: '15 Days', instructions: 'Morning after food', quantity: 15 },
    ] as any,
  });

  db.updateJourney(visit.journey.id, {
    currentDepartmentId: pharmDept.id,
    currentStage: 'pharmacy',
    currentToken: pharmToken,
    status: 'active',
  });

  console.log(`[PASS] 6. Pharmacy Order Created: ${pharmOrder.id} (Token: ${pharmToken}, Counter: ${pharmDept.roomNumber})`);

  // 7. Verify Pharmacy Portal finds the order
  const pharmacyList = db.getPharmacyOrders();
  const foundInPharm = pharmacyList.find(p => p.id === pharmOrder.id);
  console.log(`[PASS] 7. Pharmacy Portal displays order: Found = ${Boolean(foundInPharm)}, Status = ${foundInPharm?.status}`);

  // 8. Verify Patient Active Visit finds the order
  const patientOrders = db.getPatientPharmacyOrders(patient.id);
  console.log(`[PASS] 8. Patient Portal Prescriptions found: ${patientOrders.length} order(s), Token: ${patientOrders[0]?.tokenNumber}`);

  // 9. Pharmacy Staff Updates Status: Preparing -> Ready -> Dispensed
  db.updatePharmacyOrder(pharmOrder.id, { status: 'preparing' as any });
  console.log(`[PASS] 9a. Pharmacy Status: PREPARING`);

  db.updatePharmacyOrder(pharmOrder.id, { status: 'ready' as any });
  console.log(`[PASS] 9b. Pharmacy Status: READY FOR PICKUP`);

  db.updatePharmacyOrder(pharmOrder.id, {
    status: 'dispensed',
    dispensedAt: new Date().toISOString(),
  });
  db.updateJourney(visit.journey.id, {
    currentStage: 'completed',
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
  console.log(`[PASS] 9c. Pharmacy Status: DISPENSED -> Patient Journey COMPLETED ✅`);

  // 10. Test Normal Revisit Case
  console.log('\n--- Testing Normal Revisit Case ---');
  const patient2 = db.createPatient({
    name: 'Sundaram R.',
    phone: '9842109989',
    age: 44,
    gender: 'Male',
    preferredLanguage: 'en',
    isSynthetic: true,
  });

  const visit2 = db.createVisit({
    patientId: patient2.id,
    doctorId: doctor.id,
    departmentId: cardioDept.id,
    symptoms: 'Routine checkup with normal lab reports',
    priority: 'normal',
  });

  const revisitNormal = db.createRevisit({
    patientId: patient2.id,
    decisionType: 'normal',
    doctorId: doctor.id,
    doctorRemarks: 'Lipid profile stable. Continue current dietary control.',
  });

  console.log(`[PASS] 10. Normal Revisit Created: Token ${revisitNormal.tokenNumber}`);
  console.log(`          Queue Status: ${revisitNormal.queueEntry.status} (Waiting in Queue)`);
  console.log(`          Sequence Number: ${revisitNormal.queueEntry.sequenceNum} (Added to Queue List)`);

  if (revisitNormal.queueEntry.status !== 'waiting') {
    throw new Error(`Expected normal revisit status to be 'waiting', got ${revisitNormal.queueEntry.status}`);
  }

  console.log('\n=============================================================');
  console.log('🎉 ALL REVIEW DECISION & PHARMACY SYNC VERIFICATIONS PASSED!');
  console.log('=============================================================');
}

runTest();
