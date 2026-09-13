import { db } from '../server/db/database';
import { ivrService } from '../server/ivr/ivr.service';

async function testDoctorCompleteSync() {
  console.log('🧪 Testing Doctor Consultation Completion ➔ IVR Status Sync...');

  // Reset database for clean test
  db.clearAllPatientData();

  // 1. Patient dials IVR and generates a token
  const callerPhone = '9876543210';
  const startCall = ivrService.startCall(callerPhone, 'en');
  const sessionId = startCall.session.sessionId;

  ivrService.handleDtmf(sessionId, '1'); // English
  ivrService.handleDtmf(sessionId, '1'); // New Token
  ivrService.handleDtmf(sessionId, '2'); // Cardiology
  const genRes = ivrService.handleDtmf(sessionId, '1'); // Confirm
  console.log('1. Generated Token via IVR:', genRes.session.generatedToken);
  const journeyId = genRes.session.activeJourneyId!;

  // 2. Check initial status before doctor consults
  const checkBefore = ivrService.getActiveTokenInfo(callerPhone, 'en');
  console.log('2. Status BEFORE Doctor Consultation:');
  console.log('   Stage:', checkBefore.currentStage);
  console.log('   Spoken:', checkBefore.message);
  if (checkBefore.currentStage !== 'doctor' || checkBefore.isCompleted) {
    throw new Error('Expected active doctor OPD stage');
  }

  // 3. Simulate Doctor Consultation Completion (routed to Pharmacy with medication)
  console.log('\n3. Doctor Completes Consultation (prescribing meds ➔ routed to Pharmacy)...');
  const journey = db.getJourneyById(journeyId)!;
  const patient = db.getPatientById(journey.patientId)!;
  const doctor = db.getUserById('usr-doc-arun')!;

  const consultation = db.createConsultation({
    journeyId: journey.id,
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    departmentId: journey.currentDepartmentId,
    symptoms: 'Chest heaviness reported',
    observations: 'BP 130/85, Pulse 78',
    diagnosis: 'Hypertensive Heart Disease',
    clinicalNotes: 'Initiated ACE inhibitors. Review in 14 days.',
    medications: [
      { id: 'med-1', name: 'Tab Telmisartan 40mg', dosage: '40mg', frequency: '1-0-0', duration: '30 Days', instructions: 'After food' },
    ],
    investigations: [],
    followUpDays: 14,
    completedAt: new Date().toISOString(),
  });

  // Create pharmacy order and route journey stage
  const pharmToken = db.getNextTokenNumber('PHARM');
  db.createPharmacyOrder({
    consultationId: consultation.id,
    journeyId: journey.id,
    patientId: patient.id,
    tokenNumber: pharmToken,
    status: 'waiting',
    counterNumber: 'Central Pharmacy Counter 3',
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    medications: consultation.medications,
  });

  db.updateJourney(journey.id, {
    currentDepartmentId: 'dept-pharm',
    currentStage: 'pharmacy',
    currentToken: pharmToken,
    status: 'active',
  });

  // 4. Patient calls back or presses 2 to check status
  const call2 = ivrService.startCall(callerPhone, 'en');
  ivrService.handleDtmf(call2.session.sessionId, '1'); // English
  const statusPharm = ivrService.handleDtmf(call2.session.sessionId, '2'); // Check status

  console.log('\n4. Status AFTER Doctor Completed Consultation (Routed to Pharmacy):');
  console.log('   Current Stage:', statusPharm.session.currentStage);
  console.log('   Stage Title:', statusPharm.session.stageTitle);
  console.log('   New Token:', statusPharm.session.generatedToken);
  console.log('   Spoken Message:', statusPharm.spokenText);

  if (statusPharm.session.currentStage !== 'pharmacy') {
    throw new Error('Expected pharmacy stage after doctor consult');
  }
  if (!statusPharm.spokenText.includes('Central Pharmacy')) {
    throw new Error('Expected Central Pharmacy in spoken message');
  }

  // 5. Simulate Final Discharge / Completion by Pharmacy
  console.log('\n5. Pharmacy Dispenses & Marks Journey Completed...');
  db.updateJourney(journey.id, {
    currentStage: 'completed',
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  const call3 = ivrService.startCall(callerPhone, 'en');
  ivrService.handleDtmf(call3.session.sessionId, '1'); // English
  const statusCompleted = ivrService.handleDtmf(call3.session.sessionId, '2'); // Check status

  console.log('\n6. Status AFTER Full Completion:');
  console.log('   Is Completed:', statusCompleted.session.isCompleted);
  console.log('   Current Stage:', statusCompleted.session.currentStage);
  console.log('   Diagnosis:', statusCompleted.session.diagnosis);
  console.log('   Spoken Message:', statusCompleted.spokenText);

  if (!statusCompleted.session.isCompleted) {
    throw new Error('Expected isCompleted = true');
  }
  if (!statusCompleted.spokenText.includes('concluded successfully') || !statusCompleted.spokenText.includes('Hypertensive Heart Disease')) {
    throw new Error('Expected diagnosis and completion confirmation in spoken message');
  }

  console.log('\n🎉 ALL DOCTOR COMPLETION ➔ IVR STATUS SYNC TESTS PASSED 100%!');
  process.exit(0);
}

testDoctorCompleteSync().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
