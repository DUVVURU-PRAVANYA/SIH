async function runTest() {
  console.log('=== STARTING TEST: SCAN + LAB SIMULTANEOUS + DOCTOR REVIEW FLOW ===');

  const BASE_URL = 'http://localhost:4000/api';

  // 1. Register Patient via API
  console.log('\n--- 1. Registering patient and starting OPD journey via HTTP API ---');
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regRes = await fetch(`${BASE_URL}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pravanya Test Patient',
      age: 28,
      gender: 'Female',
      phone: testPhone,
      bloodGroup: 'B+ve',
    }),
  }).then((r) => r.json());

  console.log('Registration Response:', regRes.success ? '✓ SUCCESS' : regRes);
  const patientId = regRes.patient?.id || regRes.data?.id;

  // Create Visit via API
  const visitRes = await fetch(`${BASE_URL}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      doctorId: 'usr-doc-1',
      departmentId: 'dept-genmed',
      symptoms: 'Fatigue, muscle cramps and mild cough',
      priority: 'normal',
      forceNew: true,
    }),
  }).then((r) => r.json());

  console.log('Visit Creation Response:', visitRes.success ? '✓ SUCCESS' : visitRes);
  const journeyId = visitRes.data?.journey?.id;
  const tokenNumber = visitRes.data?.tokenNumber;
  console.log(`Patient ID: ${patientId}, Journey ID: ${journeyId}, Token: ${tokenNumber}`);

  // 2. Doctor prescribes BOTH Serum Electrolytes AND Digital Chest X-Ray
  console.log('\n--- 2. Doctor orders BOTH Serum Electrolytes AND Digital Chest X-Ray ---');
  const consultCompRes = await fetch(`${BASE_URL}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId,
      patientId,
      doctorId: 'usr-doc-1',
      doctorName: 'Dr. Priya Kumar',
      diagnosis: 'Suspected electrolyte disturbance & atypical respiratory symptoms',
      clinicalNotes: 'Vitals stable. Ordered serum electrolytes panel and chest imaging.',
      labTests: ['Serum Electrolytes'],
      diagnosticTestName: 'Digital Chest X-Ray (PA View)',
      diagnosticModality: 'x-ray',
      investigations: ['Serum Electrolytes', 'Digital Chest X-Ray (PA View)'],
      routeTo: 'both',
    }),
  }).then((r) => r.json());

  console.log('Consultation Complete Response:', consultCompRes.success ? '✓ SUCCESS' : consultCompRes);

  // 3. Verify BOTH orders exist in /api/diagnostics
  console.log('\n--- 3. Checking /api/diagnostics for both orders ---');
  const diagRes = await fetch(`${BASE_URL}/diagnostics`).then((r) => r.json());
  const patientDiagOrders = diagRes.data.filter((d: any) => d.patientId === patientId || d.journeyId === journeyId);
  console.log(`Diagnostic orders found for patient: ${patientDiagOrders.length}`);
  for (const ord of patientDiagOrders) {
    console.log(`  - Order ID: ${ord.id} | Test: ${ord.testName} | Modality: ${ord.modality} | Status: ${ord.status}`);
  }

  const hasSerum = patientDiagOrders.some((o: any) => o.testName.toLowerCase().includes('electrolyte'));
  const hasXray = patientDiagOrders.some((o: any) => o.testName.toLowerCase().includes('x-ray') || o.modality === 'x-ray');

  if (!hasSerum || !hasXray) {
    throw new Error(`FAILED: Both tests were not created. hasSerum=${hasSerum}, hasXray=${hasXray}`);
  }
  console.log('✓ BOTH Serum Electrolytes and Digital Chest X-Ray exist in workstation queue!');

  // 4. Technician completes both tests
  console.log('\n--- 4. Technician enters results and completes both tests ---');
  for (const ord of patientDiagOrders) {
    const findings = ord.modality === 'x-ray'
      ? 'Bilateral lung fields clear. Normal cardiac silhouette. No acute consolidation.'
      : 'Na: 138 mEq/L, K: 4.2 mEq/L, Cl: 102 mEq/L, HCO3: 24 mEq/L. Normal electrolytes.';

    console.log(`Completing ${ord.testName}...`);
    const compRes = await fetch(`${BASE_URL}/diagnostics/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: ord.id,
        findingsSummary: findings,
      }),
    }).then((r) => r.json());

    console.log(`Completed ${ord.testName}:`, compRes.success ? '✓ SUCCESS' : compRes);
  }

  // 5. Verify patient is returned to doctor review stage (NOT directly to pharmacy)
  console.log('\n--- 5. Verifying patient journey after tests completion ---');
  const activeVisit = await fetch(`${BASE_URL}/patients/${patientId}/active-visit`).then((r) => r.json());
  const journey = activeVisit.data?.journey;
  const pharmacyOrder = activeVisit.data?.pharmacyOrder;
  console.log(`Journey current stage: ${journey?.currentStage}`);
  console.log(`Pharmacy order exists: ${Boolean(pharmacyOrder)}`);

  if (journey?.currentStage !== 'doctor') {
    throw new Error(`FAILED: Journey currentStage is ${journey?.currentStage}, expected 'doctor'`);
  }
  if (pharmacyOrder) {
    throw new Error('FAILED: Pharmacy order should NOT exist before doctor consultation!');
  }
  console.log('✓ Patient successfully returned to DOCTOR stage for clinical review!');

  // 6. Doctor Revisit Decision (Emergency Consult Now)
  console.log('\n--- 6. Testing Doctor Emergency Decision ---');
  const revRes = await fetch(`${BASE_URL}/visits/revisit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      decisionType: 'emergency',
      doctorRemarks: 'Serum electrolytes normal, chest clear. Proceeding to symptomatic prescription.',
    }),
  }).then((r) => r.json());

  console.log('Revisit Response:', revRes.success ? '✓ SUCCESS' : revRes);
  console.log(`Revisit Token: ${revRes.data?.tokenNumber}, Queue Status: ${revRes.data?.queueEntry?.status}`);

  // 7. Doctor prescribes medicines during consultation and submits
  console.log('\n--- 7. Doctor consults and prescribes medicines ---');
  const finalConsultRes = await fetch(`${BASE_URL}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId,
      patientId,
      doctorId: 'usr-doc-1',
      doctorName: 'Dr. Priya Kumar',
      diagnosis: 'Atypical Viral Bronchitis (Electrolytes Checked & Normal)',
      clinicalNotes: 'All investigations reviewed with patient. Prescribed oral rehydration and bronchodilator.',
      medications: [
        { name: 'Oral Rehydration Salts (ORS)', dosage: '1 Sachet in 1L', frequency: 'PRN', duration: '5 Days', instructions: 'Drink throughout day' },
        { name: 'Tab Paracetamol IP', dosage: '650mg', frequency: '1-0-1', duration: '3 Days', instructions: 'After food' },
        { name: 'Syr Ambroxol + Levosalbutamol', dosage: '10ml', frequency: '1-1-1', duration: '5 Days', instructions: 'After meals' },
      ],
      routeTo: 'pharmacy',
    }),
  }).then((r) => r.json());

  console.log('Final Consultation Complete:', finalConsultRes.success ? '✓ SUCCESS' : finalConsultRes);

  // 8. Verify Pharmacy order is created with the doctor's prescribed medicines
  console.log('\n--- 8. Verifying Pharmacy Order in Central Pharmacy ---');
  const pharmOrdersRes = await fetch(`${BASE_URL}/pharmacy`).then((r) => r.json());
  const patientPharmOrder = pharmOrdersRes.data.find((p: any) => p.patientId === patientId || p.journeyId === journeyId);

  if (!patientPharmOrder) {
    throw new Error('FAILED: Pharmacy order was not found for patient!');
  }

  console.log(`Pharmacy Order Found! ID: ${patientPharmOrder.id}, Token: ${patientPharmOrder.tokenNumber}`);
  console.log(`Medications Count: ${patientPharmOrder.medications?.length}`);
  for (const m of patientPharmOrder.medications || []) {
    console.log(`  - ${m.name} (${m.dosage}) [${m.frequency}]`);
  }

  const hasORS = patientPharmOrder.medications.some((m: any) => m.name.includes('ORS') || m.name.includes('Oral Rehydration'));
  const hasParacetamol = patientPharmOrder.medications.some((m: any) => m.name.includes('Paracetamol'));

  if (!hasORS || !hasParacetamol) {
    throw new Error('FAILED: The prescribed medications do not match what the doctor entered!');
  }

  console.log('\n===========================================================');
  console.log('🎉 ALL TESTS PASSED! FULL SCAN + LAB + REVIEW + RX FLOW VERIFIED!');
  console.log('===========================================================');
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
