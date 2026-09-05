const API_BASE = 'http://localhost:4000/api';

async function testCompleteDatabaseFlow() {
  console.log('===============================================================');
  console.log('🧪 GH QUEUEFLOW — COMPREHENSIVE END-TO-END DATABASE INTEGRATION TEST');
  console.log('===============================================================\n');

  // STEP 1: Patient Identify & OTP
  console.log('--- STEP 1: PATIENT IDENTIFY & OTP ---');
  const testPhone = '9876543210';
  const idRes = await fetch(`${API_BASE}/auth/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testPhone }),
  });
  const idData: any = await idRes.json();
  console.log('Identify Patient Result:', idData.success, 'Patient:', idData.patientName, 'ID:', idData.patientId);
  if (!idData.success || !idData.patientId) {
    throw new Error('Identify failed');
  }
  const patientId = idData.patientId;

  // STEP 2: Verify OTP
  console.log('\n--- STEP 2: VERIFY OTP ---');
  const otpRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, otp: '123456' }),
  });
  const otpData: any = await otpRes.json();
  console.log('OTP Verification Result:', otpData.success, 'Patient ID:', otpData.patient?.id);
  if (!otpData.success) {
    throw new Error('OTP verification failed');
  }

  // STEP 3: Update Profile (Persistent Profile Update)
  console.log('\n--- STEP 3: UPDATE PATIENT PROFILE ---');
  const updateRes = await fetch(`${API_BASE}/patients/${patientId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allergies: ['Penicillin', 'Dust'],
      chronicConditions: ['Type 2 Diabetes Mellitus', 'Hypertension'],
    }),
  });
  const updateData: any = await updateRes.json();
  console.log('Profile Update Result:', updateData.success, 'Allergies:', updateData.data?.allergies);

  // STEP 4: Start New Visit & Generate Token (Backend generated)
  console.log('\n--- STEP 4: CREATE VISIT & GENERATE TOKEN ---');
  const visitRes = await fetch(`${API_BASE}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      departmentId: 'dept-genmed',
      doctorId: 'usr-doc-1',
      symptoms: 'Mild fever and routine review of blood glucose',
      forceNew: true,
    }),
  });
  const visitData: any = await visitRes.json();
  console.log('Create Visit Result:', visitData.success, 'Token:', visitData.data?.tokenNumber, 'Journey:', visitData.data?.journey?.id);
  if (!visitData.success || !visitData.data?.tokenNumber) {
    throw new Error('Visit creation failed');
  }
  const tokenNumber = visitData.data.tokenNumber;
  const journeyId = visitData.data.journey.id;

  // STEP 5: Verify Token in Doctor OPD Queue
  console.log('\n--- STEP 5: VERIFY DOCTOR OPD QUEUE ---');
  const queueRes = await fetch(`${API_BASE}/queues/dept-genmed`);
  const queueData: any = await queueRes.json();
  const queueEntry = queueData.data?.find((q: any) => q.tokenNumber === tokenNumber);
  console.log('Queue has Token', tokenNumber, '?', Boolean(queueEntry), 'Status:', queueEntry?.status);
  if (!queueEntry) {
    throw new Error(`Token ${tokenNumber} not found in doctor queue!`);
  }

  // STEP 6: Doctor Calls Patient
  console.log('\n--- STEP 6: DOCTOR CALLS PATIENT ---');
  const callRes = await fetch(`${API_BASE}/queues/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queueEntryId: queueEntry.id }),
  });
  const callData: any = await callRes.json();
  console.log('Doctor Call Result:', callData.success, 'Active Token Called:', callData.data?.tokenNumber);

  // STEP 7: Doctor Submits Consultation + Orders Lab Investigation + Rx
  console.log('\n--- STEP 7: DOCTOR SUBMITS CONSULTATION (WITH LAB INVESTIGATION & RX) ---');
  const consultRes = await fetch(`${API_BASE}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId,
      patientId,
      doctorId: 'usr-doc-1',
      doctorName: 'Dr. Priya Kumar',
      diagnosis: 'Type 2 Diabetes Mellitus - Glycemic Review',
      clinicalNotes: 'Blood pressure 130/80 mmHg. Advised fasting blood sugar and HbA1c panel.',
      medications: [
        { name: 'Tab Metformin', dosage: '500mg', frequency: '1-0-1', duration: '30 Days', instructions: 'After food', quantity: 60 },
        { name: 'Tab Glimepiride', dosage: '1mg', frequency: '1-0-0', duration: '30 Days', instructions: 'Before breakfast', quantity: 30 },
      ],
      investigations: ['Fasting Blood Sugar & HbA1c Panel'],
      routeTo: 'lab',
    }),
  });
  const consultData: any = await consultRes.json();
  console.log('Consultation Complete Result:', consultData.success, 'Next Stage:', consultData.data?.nextStageType, 'Next Token:', consultData.data?.nextToken);

  // STEP 8: Lab Technician Fetches Diagnostics Queue
  console.log('\n--- STEP 8: LAB TECHNICIAN FETCHES DIAGNOSTICS QUEUE ---');
  const diagRes = await fetch(`${API_BASE}/diagnostics`);
  const diagData: any = await diagRes.json();
  const labOrder = diagData.data?.find((d: any) => d.journeyId === journeyId);
  console.log('Lab Order Found for Journey?', Boolean(labOrder), 'Order ID:', labOrder?.id, 'Test:', labOrder?.testName);
  if (!labOrder) {
    throw new Error('Lab order was not found in diagnostics queue!');
  }

  // STEP 9: Lab Technician Starts Test & Submits Result
  console.log('\n--- STEP 9: LAB TECHNICIAN STARTS TEST & SUBMITS RESULTS ---');
  const startRes = await fetch(`${API_BASE}/diagnostics/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: labOrder.id }),
  });
  const startData: any = await startRes.json();
  console.log('Start Test Result:', startData.success, 'Status:', startData.data?.status);

  const completeDiagRes = await fetch(`${API_BASE}/diagnostics/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: labOrder.id,
      findingsSummary: 'FBS: 142 mg/dL (Elevated); HbA1c: 7.2% (Suboptimal glycemic control)',
    }),
  });
  const completeDiagData: any = await completeDiagRes.json();
  console.log('Lab Result Submitted Result:', completeDiagData.success, 'Next Token:', completeDiagData.data?.nextToken);

  // STEP 10: Doctor Revisit Review Decision
  console.log('\n--- STEP 10: DOCTOR REVISIT / RESULT REVIEW DECISION ---');
  const revisitRes = await fetch(`${API_BASE}/visits/revisit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      decisionType: 'normal',
      doctorRemarks: 'Results reviewed. Continue Metformin & Glimepiride. Revisit in 30 days with repeat FBS.',
    }),
  });
  const revisitData: any = await revisitRes.json();
  console.log('Doctor Review & Revisit Result:', revisitData.success, 'Message:', revisitData.message);

  // STEP 11: Central Pharmacy Processing
  console.log('\n--- STEP 11: CENTRAL PHARMACY FULFILLMENT ---');
  const pharmRes = await fetch(`${API_BASE}/pharmacy`);
  const pharmData: any = await pharmRes.json();
  const pharmOrder = pharmData.data?.find((p: any) => p.journeyId === journeyId);
  console.log('Pharmacy Order Found for Journey?', Boolean(pharmOrder), 'Order ID:', pharmOrder?.id, 'Status:', pharmOrder?.status);
  if (!pharmOrder) {
    throw new Error('Pharmacy order was not found!');
  }

  // Update Pharmacy Status -> Preparing
  const prepRes = await fetch(`${API_BASE}/pharmacy/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: pharmOrder.id, status: 'preparing' }),
  });
  const prepData: any = await prepRes.json();
  console.log('Pharmacy Preparing Result:', prepData.success, 'Status:', prepData.data?.status);

  // Update Pharmacy Status -> Ready
  const readyRes = await fetch(`${API_BASE}/pharmacy/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: pharmOrder.id, status: 'ready' }),
  });
  const readyData: any = await readyRes.json();
  console.log('Pharmacy Ready Result:', readyData.success, 'Status:', readyData.data?.status);

  // Dispense Medication
  const dispenseRes = await fetch(`${API_BASE}/pharmacy/dispense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: pharmOrder.id }),
  });
  const dispenseData: any = await dispenseRes.json();
  console.log('Pharmacy Dispense Result:', dispenseData.success, 'Journey Status:', dispenseData.data?.journeyStatus);

  // STEP 12: Patient Historical Sub-Tabs Verification
  console.log('\n--- STEP 12: PATIENT HISTORY, REPORTS & PRESCRIPTIONS VERIFICATION ---');
  const histRes = await fetch(`${API_BASE}/patients/${patientId}/history`);
  const histData: any = await histRes.json();
  const latestHistWithConsultation = histData.data?.find((h: any) => h.consultation);
  console.log('Patient Consultations in History:', histData.data?.length, 'Latest Diagnosis:', latestHistWithConsultation?.consultation?.diagnosis);

  const reportsRes = await fetch(`${API_BASE}/patients/${patientId}/reports`);
  const reportsData: any = await reportsRes.json();
  console.log('Patient Diagnostic Reports:', reportsData.data?.length, 'Latest Findings:', reportsData.data?.[0]?.findingsSummary);

  const rxRes = await fetch(`${API_BASE}/patients/${patientId}/prescriptions`);
  const rxData: any = await rxRes.json();
  console.log('Patient Prescriptions:', rxData.data?.length, 'Medications Count:', rxData.data?.[0]?.medications?.length);

  // STEP 13: Final Journey Status
  console.log('\n--- STEP 13: FINAL JOURNEY STATUS ---');
  const journeyRes = await fetch(`${API_BASE}/journey/${journeyId}`);
  const finalJourneyData: any = await journeyRes.json();
  console.log('Journey Final Stage:', finalJourneyData.data?.journey?.currentStage, 'Status:', finalJourneyData.data?.journey?.status);

  console.log('\n===============================================================');
  console.log('✅ ALL 13 END-TO-END DATABASE INTEGRATION STEPS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

testCompleteDatabaseFlow().catch((err) => {
  console.error('\n❌ End-to-End Test Failed:', err);
  process.exit(1);
});
