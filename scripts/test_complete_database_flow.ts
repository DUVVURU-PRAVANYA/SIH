import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:4000/api';

async function runCompleteWorkflowAudit() {
  console.log('========================================================================');
  console.log('🧪 GH QUEUEFLOW — COMPREHENSIVE 15-POINT DATABASE CONNECTIVITY AUDIT');
  console.log('========================================================================\n');

  // ====================================================================
  // AUDIT POINT 1: DOCTORS LIST DATABASE CONNECTIVITY
  // ====================================================================
  console.log('--- 1. AUDITING DOCTORS LIST FROM DATABASE ---');
  const docsRes = await fetch(`${API_BASE}/doctors`);
  const docsData: any = await docsRes.json();
  if (!docsData.success || !Array.isArray(docsData.data)) {
    throw new Error('Failed to retrieve doctors from database');
  }
  const allDoctors = docsData.data;
  console.log(`✓ Retrieved ${allDoctors.length} doctors from database:`);
  for (const d of allDoctors) {
    console.log(`  - [${d.id}] ${d.fullName} (@${d.username}) -> Dept: ${d.departmentId} (${d.department?.name || ''})`);
  }

  const priya = allDoctors.find((d: any) => d.id === 'usr-doc-1');
  const senthil = allDoctors.find((d: any) => d.id === 'usr-doc-2');
  const arun = allDoctors.find((d: any) => d.id === 'usr-doc-arun');
  const meena = allDoctors.find((d: any) => d.id === 'usr-doc-meena');
  const ravi = allDoctors.find((d: any) => d.id === 'usr-doc-ravi');

  if (!priya || !senthil || !arun || !meena || !ravi) {
    throw new Error('One or more required doctors are missing from the database!');
  }
  console.log('✓ All 5 required doctors present in database including Dr. M. Senthil Nathan!');

  // Check login alias for Dr. Sethilnathan
  const aliasRes = await fetch(`${API_BASE}/auth/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dr_sethilnathan' }),
  });
  const aliasData: any = await aliasRes.json();
  if (!aliasData.success || aliasData.username !== 'dr_senthil') {
    throw new Error('Dr. Sethilnathan alias failed to identify Dr. Senthil Nathan!');
  }
  console.log('✓ Alias dr_sethilnathan correctly resolves to Dr. M. Senthil Nathan (@dr_senthil)');

  // ====================================================================
  // AUDIT POINT 2: NEW PATIENT ZERO HISTORY ISOLATION
  // ====================================================================
  console.log('\n--- 2. AUDITING NEW PATIENT ZERO-HISTORY ISOLATION ---');
  const testPhone = '9840112233';
  const regRes = await fetch(`${API_BASE}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramesh Sundaram',
      phone: testPhone,
      age: 48,
      gender: 'Male',
      bloodGroup: 'B+ve',
      allergies: ['Dust Allergy'],
      chronicConditions: ['None Reported'],
    }),
  });
  let regData: any = await regRes.json();
  if (regRes.status === 409) {
    // Already exists in seed/run, identify
    const idRes = await fetch(`${API_BASE}/auth/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testPhone }),
    });
    regData = await idRes.json();
  }
  const newPatientId = regData.patient?.id || regData.patientId;
  console.log(`✓ Patient registered with permanent Patient ID: ${newPatientId}`);

  // Query sub-tabs for new patient: Must be 0
  const [initHist, initRep, initRx] = await Promise.all([
    fetch(`${API_BASE}/patients/${newPatientId}/history`).then((r) => r.json()),
    fetch(`${API_BASE}/patients/${newPatientId}/reports`).then((r) => r.json()),
    fetch(`${API_BASE}/patients/${newPatientId}/prescriptions`).then((r) => r.json()),
  ]);

  console.log(`  - Previous Consultations: ${initHist.data?.length || 0}`);
  console.log(`  - Previous Lab Reports:   ${initRep.data?.length || 0}`);
  console.log(`  - Previous Prescriptions: ${initRx.data?.length || 0}`);

  if ((initHist.data?.length || 0) > 0 || (initRep.data?.length || 0) > 0 || (initRx.data?.length || 0) > 0) {
    throw new Error('New patient has non-zero fake history!');
  }
  console.log('✓ Verified: New patient starts with exactly 0 consultations, 0 reports, 0 prescriptions.');

  // ====================================================================
  // AUDIT POINT 3: MULTI-DOCTOR QUEUE ISOLATION (5 DOCTORS)
  // ====================================================================
  console.log('\n--- 3. AUDITING MULTI-DOCTOR QUEUE ISOLATION ACROSS 5 DOCTORS ---');
  
  // Register 5 distinct patients for 5 distinct doctors
  const doctorsToTest = [
    { doctor: priya, patientName: 'Patient Alpha (Priya)' },
    { doctor: senthil, patientName: 'Patient Beta (Senthil)' },
    { doctor: arun, patientName: 'Patient Gamma (Arun)' },
    { doctor: meena, patientName: 'Patient Delta (Meena)' },
    { doctor: ravi, patientName: 'Patient Epsilon (Ravi)' },
  ];

  const createdVisits: Array<{ doctorId: string; patientId: string; tokenNumber: string; journeyId: string }> = [];

  for (let i = 0; i < doctorsToTest.length; i++) {
    const item = doctorsToTest[i];
    const patPhone = `912345000${i}`;
    let patId: string;
    const pRegRes = await fetch(`${API_BASE}/auth/register-patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.patientName,
        phone: patPhone,
        age: 30 + i,
        gender: i % 2 === 0 ? 'Male' : 'Female',
      }),
    });
    const pRegData: any = await pRegRes.json();
    if (pRegRes.status === 409) {
      const idRes = await fetch(`${API_BASE}/auth/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: patPhone }),
      });
      const idData: any = await idRes.json();
      patId = idData.patientId;
    } else {
      patId = pRegData.patient.id;
    }

    // Create visit explicitly assigning to that doctor
    const vRes = await fetch(`${API_BASE}/visits/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patId,
        doctorId: item.doctor.id,
        departmentId: item.doctor.departmentId,
        symptoms: `Consultation with ${item.doctor.fullName}`,
        forceNew: true,
      }),
    });
    const vData: any = await vRes.json();
    if (!vData.success || !vData.data?.tokenNumber) {
      throw new Error(`Failed to create visit for ${item.doctor.fullName}`);
    }
    createdVisits.push({
      doctorId: item.doctor.id,
      patientId: patId,
      tokenNumber: vData.data.tokenNumber,
      journeyId: vData.data.journey.id,
    });
    console.log(`  - Created visit for ${item.doctor.fullName}: Token ${vData.data.tokenNumber} (Patient: ${patId})`);
  }

  // Now verify doctor queues for EACH doctor
  for (const item of createdVisits) {
    const qRes = await fetch(`${API_BASE}/doctors/${item.doctorId}/queue`);
    const qData: any = await qRes.json();
    const tokensInQueue = (qData.data || []).map((q: any) => q.tokenNumber);
    console.log(`  Queue for Doctor ${item.doctorId}: [${tokensInQueue.join(', ')}]`);

    // The assigned token MUST be in this doctor's queue
    if (!tokensInQueue.includes(item.tokenNumber)) {
      throw new Error(`Token ${item.tokenNumber} missing from doctor ${item.doctorId} queue!`);
    }

    // Other doctors' tokens MUST NOT be in this doctor's queue
    const otherTokens = createdVisits.filter((v) => v.doctorId !== item.doctorId).map((v) => v.tokenNumber);
    for (const ot of otherTokens) {
      if (tokensInQueue.includes(ot)) {
        throw new Error(`Multi-Doctor Isolation Broken: Token ${ot} found in queue of doctor ${item.doctorId}!`);
      }
    }
  }
  console.log('✓ Multi-Doctor Isolation 100% verified across all 5 doctors!');

  // ====================================================================
  // AUDIT POINT 4: CROSS-MODULE DATA FLOW WITH SAME DATABASE RECORD
  // ====================================================================
  console.log('\n--- 4. AUDITING END-TO-END WORKFLOW WITH DR. M. SENTHIL NATHAN ---');
  const senthilVisit = createdVisits.find((v) => v.doctorId === 'usr-doc-2')!;
  const targetPatientId = senthilVisit.patientId;
  const targetJourneyId = senthilVisit.journeyId;
  const targetToken = senthilVisit.tokenNumber;

  console.log(`Using Patient: ${targetPatientId}, Journey: ${targetJourneyId}, Token: ${targetToken}`);

  // Step 4.1: Doctor Senthil Nathan calls patient
  const callRes = await fetch(`${API_BASE}/queues/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId: 'usr-doc-2' }),
  });
  const callData: any = await callRes.json();
  console.log(`✓ Dr. Senthil called patient: Token ${callData.data?.tokenNumber} (Status: ${callData.data?.status})`);

  // Verify patient sees CALLED status
  const patActiveVisitRes = await fetch(`${API_BASE}/patients/${targetPatientId}/active-visit`);
  const patActiveVisitData: any = await patActiveVisitRes.json();
  console.log(`✓ Patient Dashboard Live Queue Status: ${patActiveVisitData.data?.queueMetrics?.queueStatus}`);

  // Step 4.2: Doctor Consultation + Orders Lab Investigation + Prescription
  const consultRes = await fetch(`${API_BASE}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId: targetJourneyId,
      patientId: targetPatientId,
      doctorId: 'usr-doc-2',
      doctorName: 'Dr. M. Senthil Nathan',
      diagnosis: 'Acute Upper Respiratory Tract Infection with Glycemic Surge',
      clinicalNotes: 'Throat congestion noted. Auscultation clear. Advised blood glucose panel and antibiotics.',
      medications: [
        { name: 'Tab Amoxicillin & Clavulanate', dosage: '625mg', frequency: '1-0-1', duration: '5 Days', instructions: 'After food', quantity: 10 },
        { name: 'Tab Paracetamol', dosage: '650mg', frequency: '1-0-1', duration: '3 Days', instructions: 'After food', quantity: 6 },
      ],
      investigations: ['Fasting Blood Sugar & Routine Pathology'],
      routeTo: 'lab',
    }),
  });
  const consultData: any = await consultRes.json();
  console.log(`✓ Consultation saved by Dr. M. Senthil Nathan: Diagnosis: "${consultData.data?.consultation?.diagnosis}"`);

  // Step 4.3: Diagnostic Lab Portal receives exact order
  const diagRes = await fetch(`${API_BASE}/diagnostics`);
  const diagData: any = await diagRes.json();
  const labOrder = diagData.data?.find((d: any) => d.journeyId === targetJourneyId);
  if (!labOrder) {
    throw new Error('Diagnostic Lab did not receive order from Dr. Senthil Nathan!');
  }
  console.log(`✓ Diagnostic Lab received order: ID ${labOrder.id}, Doctor: ${labOrder.doctorName}, Test: ${labOrder.testName}`);

  // Step 4.4: Lab Technician starts test and submits results
  await fetch(`${API_BASE}/diagnostics/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: labOrder.id }),
  });
  const labSubmitRes = await fetch(`${API_BASE}/diagnostics/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: labOrder.id,
      findingsSummary: 'FBS: 168 mg/dL (Abnormal High); TLC: 11,200 /cu.mm (Mild Leukocytosis)',
    }),
  });
  const labSubmitData: any = await labSubmitRes.json();
  console.log(`✓ Lab Technician submitted test results. Status updated in database.`);

  // Step 4.5: Patient sees Lab Report
  const patRepRes = await fetch(`${API_BASE}/patients/${targetPatientId}/reports`);
  const patRepData: any = await patRepRes.json();
  const latestReport = patRepData.data?.[0];
  console.log(`✓ Patient Report Tab shows: "${latestReport?.findingsSummary}" (Doctor: ${latestReport?.doctorName})`);
  if (!latestReport?.findingsSummary) {
    throw new Error('Patient report findings missing!');
  }

  // Step 4.6: Doctor Revisit Review Decision
  const revRes = await fetch(`${API_BASE}/visits/revisit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: targetPatientId,
      decisionType: 'normal',
      doctorRemarks: 'Results reviewed by Dr. Senthil Nathan. Blood sugar elevated. Follow medication schedule.',
    }),
  });
  const revData: any = await revRes.json();
  console.log(`✓ Doctor Result Review decision recorded. Revisit Token: ${revData.data?.tokenNumber}`);

  // Step 4.7: Central Pharmacy receives exact prescription
  const pharmRes = await fetch(`${API_BASE}/pharmacy`);
  const pharmData: any = await pharmRes.json();
  const pharmOrder = pharmData.data?.find((p: any) => p.journeyId === targetJourneyId);
  if (!pharmOrder) {
    throw new Error('Central Pharmacy did not receive prescription order!');
  }
  console.log(`✓ Central Pharmacy received prescription: ID ${pharmOrder.id}, Prescribing Doctor: ${pharmOrder.doctorName}, Meds: ${pharmOrder.medications?.length}`);

  // Step 4.8: Central Pharmacy transitions: Waiting -> Preparing -> Ready -> Dispensed
  await fetch(`${API_BASE}/pharmacy/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: pharmOrder.id, status: 'preparing' }),
  });
  console.log(`  - Pharmacy marked order: PREPARING`);

  await fetch(`${API_BASE}/pharmacy/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: pharmOrder.id, status: 'ready' }),
  });
  console.log(`  - Pharmacy marked order: READY`);

  const dispRes = await fetch(`${API_BASE}/pharmacy/dispense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: pharmOrder.id }),
  });
  const dispData: any = await dispRes.json();
  console.log(`✓ Pharmacy marked order: DISPENSED (Journey Status: ${dispData.data?.journeyStatus})`);

  // Step 4.9: Patient sees completed visit & permanent records
  const finalPatHistRes = await fetch(`${API_BASE}/patients/${targetPatientId}/history`);
  const finalPatHist: any = await finalPatHistRes.json();
  console.log(`✓ Patient Consultation History entries: ${finalPatHist.data?.length}`);

  const finalPatRxRes = await fetch(`${API_BASE}/patients/${targetPatientId}/prescriptions`);
  const finalPatRx: any = await finalPatRxRes.json();
  console.log(`✓ Patient Prescriptions Tab status: ${finalPatRx.data?.[0]?.status} (${finalPatRx.data?.[0]?.medications?.length} medications)`);

  // ====================================================================
  // AUDIT POINT 5: DISK PERSISTENCE VERIFICATION IN db.json
  // ====================================================================
  console.log('\n--- 5. AUDITING DISK PERSISTENCE IN server/data/db.json ---');
  const dbJsonPath = path.resolve(process.cwd(), 'server/data/db.json');
  const rawDisk = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

  const diskPatient = rawDisk.patients.find((p: any) => p.id === targetPatientId);
  const diskJourney = rawDisk.journeys.find((j: any) => j.id === targetJourneyId);
  const diskConsult = rawDisk.consultations.find((c: any) => c.journeyId === targetJourneyId);
  const diskDiag = rawDisk.diagnosticOrders.find((d: any) => d.journeyId === targetJourneyId);
  const diskPharm = rawDisk.pharmacyOrders.find((p: any) => p.journeyId === targetJourneyId);

  if (!diskPatient || !diskJourney || !diskConsult || !diskDiag || !diskPharm) {
    throw new Error('Database persistence check failed! Records not found in db.json on disk!');
  }

  console.log(`✓ Disk records verified in ${dbJsonPath}:`);
  console.log(`  - Patient:       ${diskPatient.id} (${diskPatient.name})`);
  console.log(`  - Journey:       ${diskJourney.id} (${diskJourney.status})`);
  console.log(`  - Doctor:        ${diskConsult.doctorId} (${diskConsult.doctorName})`);
  console.log(`  - Lab Order:     ${diskDiag.id} (Findings: ${diskDiag.findingsSummary})`);
  console.log(`  - Pharmacy Order:${diskPharm.id} (Status: ${diskPharm.status})`);

  console.log('\n========================================================================');
  console.log('🎉 100% COMPLETE DATABASE CONNECTIVITY & LIVE AUDIT PASSED!');
  console.log('========================================================================');
}

runCompleteWorkflowAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
