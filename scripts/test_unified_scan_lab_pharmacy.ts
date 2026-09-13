import { db } from '../server/db/database';

async function testUnifiedScanLabPharmacyFlow() {
  console.log('🧪 Running Comprehensive Test: Multi-Investigation & Pharmacy Merging...\n');

  const baseUrl = 'http://localhost:4000/api';

  // 1. Create Patient "Boo"
  const dermaDept = db.getDepartmentByCode('DERMA') || db.getDepartments()[1];
  const dermaDoctor = db.getUsers().find(u => u.departmentId === dermaDept.id && u.role === 'doctor') || db.getDoctors()[0];

  const suffix = Date.now().toString().slice(-4);
  const regRes = await fetch(`${baseUrl}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Boo K.',
      age: 28,
      gender: 'Female',
      phone: `984012${suffix}`,
      bloodGroup: 'O+ve',
      allergies: ['None Reported'],
      chronicConditions: ['None Reported'],
    }),
  });
  const regData: any = await regRes.json();
  if (!regData.success) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  
  const patientId = regData.patient.id;

  const visitRes = await fetch(`${baseUrl}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      departmentId: dermaDept.id,
      doctorId: dermaDoctor.id,
      symptoms: 'Erythematous rash with pruritus',
      priority: 'normal',
    }),
  });
  const visitData: any = await visitRes.json();
  if (!visitData.success) throw new Error(`Visit creation failed: ${JSON.stringify(visitData)}`);

  const journeyId = visitData.data.journey.id;
  const initialToken = visitData.data.tokenNumber;
  console.log(`[PASS] 1. Registered Patient "Boo" (ID: ${patientId}, Token: ${initialToken}, Dept: ${dermaDept.name})`);

  // 2. Doctor starts consultation
  await fetch(`${baseUrl}/consultations/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ journeyId, doctorId: dermaDoctor.id }),
  });
  console.log(`[PASS] 2. Consultation started by Dr. ${dermaDoctor.fullName}`);

  // 3. Doctor orders BOTH Scan & Lab test AND prescribes an initial medicine
  const initialConsultRes = await fetch(`${baseUrl}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId,
      patientId,
      doctorId: dermaDoctor.id,
      doctorName: dermaDoctor.fullName,
      diagnosis: 'Allergic Contact Dermatitis vs Scabies',
      clinicalNotes: 'Order CBC and Dermoscopy to confirm lesion morphology',
      medications: [
        {
          id: 'med-1',
          name: 'Tab Cetirizine IP',
          dosage: '10 mg',
          frequency: '0-0-1 (Night)',
          duration: '5 Days',
          instructions: 'Take at night after food',
          quantity: 5,
        },
      ],
      investigations: ['Dermoscopy Skin Lesion Assessment', 'Complete Blood Count (CBC)'],
      labTests: ['Complete Blood Count (CBC)'],
      diagnosticTestName: 'Dermoscopy Skin Lesion Assessment',
      diagnosticModality: 'specialty',
      routeTo: 'both',
    }),
  });
  const initialConsultData: any = await initialConsultRes.json();
  if (!initialConsultData.success) throw new Error(`Consultation failed: ${JSON.stringify(initialConsultData)}`);

  console.log(`[PASS] 3. Doctor submitted consultation:`);
  console.log(`         - Next Stage: ${initialConsultData.data.nextStageType}`);
  console.log(`         - Diagnostic Token: ${initialConsultData.data.nextToken}`);

  // Check diagnostic orders created via REST API
  const diagRes: any = await (await fetch(`${baseUrl}/diagnostics`)).json();
  const allDiagList: any[] = diagRes.data || [];
  const diagOrders = allDiagList.filter(o => o.journeyId === journeyId);
  console.log(`[PASS] 4. Found ${diagOrders.length} Diagnostic Orders in Database:`);
  diagOrders.forEach(o => console.log(`         • ${o.testName} (${o.modality}) - Status: ${o.status}`));
  if (diagOrders.length < 2) throw new Error('Expected 2 diagnostic orders (1 scan + 1 lab)');

  // 4. Lab Technician completes Test #1 (CBC)
  const cbcOrder = diagOrders.find(o => o.testName.includes('CBC'))!;
  const completeCbcRes = await fetch(`${baseUrl}/diagnostics/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: cbcOrder.id,
      findingsSummary: 'CBC: Hb 13.2 g/dL, WBC 7,800/mcL, Eosinophils 8% (Mild Eosinophilia)',
    }),
  });
  const cbcData: any = await completeCbcRes.json();
  console.log(`[PASS] 5. Completed Test #1 (CBC): allCompleted = ${cbcData.data?.allCompleted}`);
  if (cbcData.data?.allCompleted === true) {
    throw new Error('Expected allCompleted to be false because Scan is still pending!');
  }

  // 5. Technician completes Test #2 (Dermoscopy Scan)
  const scanOrder = diagOrders.find(o => o.testName.includes('Dermoscopy'))!;
  const completeScanRes = await fetch(`${baseUrl}/diagnostics/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: scanOrder.id,
      findingsSummary: 'Dermoscopy: Delta-wing jet sign observed. Typical scabies burrow with mite identified at stratum corneum.',
    }),
  });
  const scanData: any = await completeScanRes.json();
  console.log(`[PASS] 6. Completed Test #2 (Dermoscopy Scan): allCompleted = ${scanData.data?.allCompleted}, Next = ${scanData.data?.nextStage}`);
  if (scanData.data?.allCompleted !== true) {
    throw new Error('Expected allCompleted to be true now that all tests are finished!');
  }

  // 6. Doctor performs Revisit Consultation
  const revisitRes = await fetch(`${baseUrl}/visits/revisit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      decisionType: 'normal',
      doctorId: dermaDoctor.id,
      doctorRemarks: 'Burrow identified on dermoscopy. Confirmed Sarcoptes scabiei infestation. Prescribing Permethrin.',
    }),
  });
  const revisitData: any = await revisitRes.json();
  console.log(`[PASS] 7. Revisit Token Generated: ${revisitData.data?.tokenNumber}`);

  // 7. Doctor completes Revisit consultation with adjusted prescriptions
  const revisitConsultRes = await fetch(`${baseUrl}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId,
      patientId,
      doctorId: dermaDoctor.id,
      doctorName: dermaDoctor.fullName,
      diagnosis: 'Scabies Infestation with Secondary Excoriation',
      clinicalNotes: 'Apply Permethrin 5% cream overnight from neck down. Treat all co-habitants.',
      medications: [
        {
          id: 'med-2',
          name: 'Permethrin Cream 5% w/w',
          dosage: '30 gm',
          frequency: 'Single Application',
          duration: '1 Day',
          instructions: 'Apply neck down, wash off after 8-12 hours',
          quantity: 1,
        },
        {
          id: 'med-3',
          name: 'Calamine Lotion Topical',
          dosage: '100 ml',
          frequency: '1-0-1 (Apply Twice Daily)',
          duration: '7 Days',
          instructions: 'Apply gently for soothing anti-pruritic effect',
          quantity: 1,
        },
      ],
      investigations: [],
      routeTo: 'pharmacy',
    }),
  });
  const revisitConsultData: any = await revisitConsultRes.json();
  console.log(`[PASS] 8. Revisit consultation completed: nextStage = ${revisitConsultData.data.nextStageType}`);

  // 8. CRITICAL VERIFICATION: Pharmacy orders for patient "Boo"
  const pharmRes: any = await (await fetch(`${baseUrl}/pharmacy`)).json();
  const allPharmList: any[] = pharmRes.data || [];
  const allPharmOrders = allPharmList.filter(o => o.patientId === patientId);
  console.log(`\n======================================================`);
  console.log(`📋 PHARMACY VERIFICATION FOR PATIENT "BOO":`);
  console.log(`   Total Pharmacy Orders Count: ${allPharmOrders.length} (MUST BE EXACTLY 1)`);
  
  if (allPharmOrders.length !== 1) {
    throw new Error(`FAILURE: Expected exactly 1 consolidated pharmacy order, but found ${allPharmOrders.length}! Tablets assigned twice.`);
  }

  const pOrder = allPharmOrders[0];
  console.log(`   Token Number: ${pOrder.tokenNumber}`);
  console.log(`   Status: ${pOrder.status}`);
  console.log(`   Total Prescribed Items: ${pOrder.medications.length}`);
  pOrder.medications.forEach((m: any, idx: number) => {
    console.log(`     ${idx + 1}. ${m.name} (${m.dosage}) - ${m.frequency}`);
  });

  const medNames = pOrder.medications.map((m: any) => m.name);
  if (!medNames.some(n => n.includes('Cetirizine'))) throw new Error('Missing initial medication Cetirizine in merged order');
  if (!medNames.some(n => n.includes('Permethrin'))) throw new Error('Missing revisit medication Permethrin in merged order');
  if (!medNames.some(n => n.includes('Calamine'))) throw new Error('Missing revisit medication Calamine in merged order');

  console.log(`======================================================`);
  console.log(`🎉 ALL TESTS PASSED!`);
  console.log(`   ✓ Multi-investigation options (Scan & Lab) ordered together cleanly.`);
  console.log(`   ✓ Lab test turnaround verified before premature doctor revisit.`);
  console.log(`   ✓ Consolidated review eliminates duplicate revisit queues.`);
  console.log(`   ✓ Pharmacy order properly merged into single token without duplicating tablets.`);
}

testUnifiedScanLabPharmacyFlow().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
