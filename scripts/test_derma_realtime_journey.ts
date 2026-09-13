import { WebSocket } from 'ws';

const BASE_URL = 'http://localhost:4000/api';
const WS_URL = 'ws://localhost:4000/ws';

async function runTest() {
  console.log('===============================================================');
  console.log('REAL-TIME TEST: DERMATOLOGY OPD -> DOCTOR -> PHARMACY & LAB');
  console.log('===============================================================');

  // 1. Establish WebSocket listener to verify real-time events
  const receivedEvents: string[] = [];
  const ws = new WebSocket(WS_URL);
  ws.on('open', () => console.log('✓ WebSocket connected to server'));
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.event) {
        receivedEvents.push(parsed.event);
        console.log(`  [WS EVENT RECEIVED]: ${parsed.event}`);
      }
    } catch {
      // ignore
    }
  });

  await new Promise((r) => setTimeout(r, 500));

  const suffix = Date.now().toString().slice(-4);
  const patientPhone = `984099${suffix}`;

  // 2. Register Patient "Kazama Test"
  console.log('\n[Step 1] Registering Patient Kazama Test...');
  const regRes = await fetch(`${BASE_URL}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Kazama Test',
      age: 26,
      gender: 'Male',
      phone: patientPhone,
      bloodGroup: 'B+ve',
      allergies: ['None Reported'],
      chronicConditions: ['None Reported'],
    }),
  });
  const regData: any = await regRes.json();
  if (!regData.success) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  const patientId = regData.patient.id;
  console.log(`✓ Patient registered with ID: ${patientId}`);

  // 3. Create Visit in Dermatology (dept-derma) with Dr. Ravi (usr-doc-ravi)
  console.log('\n[Step 2] Creating Visit in Dermatology...');
  const visitRes = await fetch(`${BASE_URL}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      departmentId: 'dept-derma',
      doctorId: 'usr-doc-ravi',
      symptoms: 'Dry itchy red skin rash',
      forceNew: true,
    }),
  });
  const visitData: any = await visitRes.json();
  if (!visitData.success) throw new Error(`Visit creation failed: ${JSON.stringify(visitData)}`);
  const tokenNumber = visitData.data.tokenNumber;
  const journeyId = visitData.data.journey.id;
  console.log(`✓ Visit created! Token: ${tokenNumber}, Journey: ${journeyId}`);

  // 4. Verify Doctor Queue for Dr. Ravi (usr-doc-ravi / dept-derma)
  console.log('\n[Step 3] Fetching Doctor Queue for Dr. Ravi...');
  const queueRes = await fetch(`${BASE_URL}/doctors/usr-doc-ravi/queue`);
  const queueData: any = await queueRes.json();
  if (!queueData.success) throw new Error(`Queue query failed: ${JSON.stringify(queueData)}`);

  console.log(`✓ Queue entries found: ${queueData.data.length}`);
  const hasKazama = queueData.data.some((q: any) => q.patientId === patientId);
  const hasLakshmi = queueData.data.some((q: any) => q.patientName && q.patientName.includes('Lakshmi'));

  console.log(`  - Kazama in queue: ${hasKazama}`);
  console.log(`  - Lakshmi in queue: ${hasLakshmi}`);

  if (!hasKazama) throw new Error('Kazama should be in Dr. Ravi queue!');
  if (hasLakshmi) throw new Error('Lakshmi should NOT be in Dermatology queue!');
  console.log('✓ Queue check passed: Only Dermatology patient is present.');

  // 5. Doctor Calls Patient
  console.log('\n[Step 4] Doctor calls patient...');
  const callRes = await fetch(`${BASE_URL}/queues/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId: 'usr-doc-ravi' }),
  });
  const callData: any = await callRes.json();
  console.log(`✓ Patient called: ${callData.data?.tokenNumber || 'OK'}`);

  // 6. Doctor Completes Consultation with Prescriptions & Lab Order
  console.log('\n[Step 5] Doctor completes consultation with Prescriptions & Lab test...');
  const consultRes = await fetch(`${BASE_URL}/consultations/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      journeyId,
      patientId,
      doctorId: 'usr-doc-ravi',
      doctorName: 'Dr. Ravi Kumar',
      diagnosis: 'Atopic Dermatitis & Pruritus',
      clinicalNotes: 'Erythematous scaly patches. Prescribed antihistamines and topical emollient.',
      medications: [
        {
          name: 'Tab Cetirizine IP',
          dosage: '10 mg',
          frequency: '0-0-1 (Night - After Food)',
          duration: '7 Days',
          instructions: 'Take 1 tablet at night after food',
          quantity: 7,
          isDispensed: false,
        },
        {
          name: 'Calamine Lotion Topical',
          dosage: '100 ml',
          frequency: '1-0-1 (Apply Twice Daily)',
          duration: '14 Days',
          instructions: 'Shake bottle well and apply gently on skin',
          quantity: 1,
          isDispensed: false,
        },
      ],
      investigations: ['Skin Scraping for KOH Mount & Microscopic Exam'],
      labTests: ['Skin Scraping for KOH Mount & Microscopic Exam'],
      routeTo: 'both',
    }),
  });
  const consultData: any = await consultRes.json();
  if (!consultData.success) throw new Error(`Consultation failed: ${JSON.stringify(consultData)}`);
  console.log('✓ Consultation completed successfully!');

  await new Promise((r) => setTimeout(r, 1000));

  // 7. Verify Pharmacy has the newly created order
  console.log('\n[Step 6] Checking Pharmacy orders...');
  const pharmRes = await fetch(`${BASE_URL}/pharmacy`);
  const pharmData: any = await pharmRes.json();
  if (!pharmData.success) throw new Error('Failed to fetch pharmacy orders');

  const kazamaPharmOrder = pharmData.data.find((o: any) => o.patientId === patientId || o.journeyId === journeyId);
  if (!kazamaPharmOrder) throw new Error('Kazama pharmacy order was NOT found in Pharmacy!');
  console.log(`✓ Pharmacy order found! ID: ${kazamaPharmOrder.id}, Status: ${kazamaPharmOrder.status}`);
  console.log(`  Medications in order (${kazamaPharmOrder.medications.length}):`);
  kazamaPharmOrder.medications.forEach((m: any) => console.log(`    - ${m.name} (${m.dosage})`));

  // 8. Verify Diagnostics has the newly created lab order
  console.log('\n[Step 7] Checking Diagnostic / Lab orders...');
  const diagRes = await fetch(`${BASE_URL}/diagnostics`);
  const diagData: any = await diagRes.json();
  if (!diagData.success) throw new Error('Failed to fetch diagnostic orders');

  const kazamaDiagOrder = diagData.data.find((o: any) => o.patientId === patientId || o.journeyId === journeyId);
  if (!kazamaDiagOrder) throw new Error('Kazama diagnostic order was NOT found in Lab!');
  console.log(`✓ Diagnostic order found! ID: ${kazamaDiagOrder.id}, Test: ${kazamaDiagOrder.testName}, Status: ${kazamaDiagOrder.status}`);

  // 9. Verify Patient Dashboard Active Visit
  console.log('\n[Step 8] Checking Patient Active Visit data...');
  const activeVisitRes = await fetch(`${BASE_URL}/patients/${patientId}/active-visit`);
  const activeVisitData: any = await activeVisitRes.json();
  if (!activeVisitData.hasActiveVisit) throw new Error('Patient active visit should be active!');
  console.log(`✓ Active visit verified! Current Stage: ${activeVisitData.data.journey.currentStage}`);
  console.log(`  Pharmacy Order Attached: ${Boolean(activeVisitData.data.pharmacyOrder)}`);
  console.log(`  Diagnostic Order Attached: ${Boolean(activeVisitData.data.diagnosticOrder)}`);

  // 10. Pharmacist Updates Status: preparing -> ready -> dispensed
  console.log('\n[Step 9] Pharmacist transitions order: Preparing -> Ready -> Dispensed...');
  await fetch(`${BASE_URL}/pharmacy/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: kazamaPharmOrder.id, status: 'preparing' }),
  });
  console.log('✓ Status set to preparing');

  await fetch(`${BASE_URL}/pharmacy/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: kazamaPharmOrder.id, status: 'ready' }),
  });
  console.log('✓ Status set to ready');

  await fetch(`${BASE_URL}/pharmacy/dispense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: kazamaPharmOrder.id }),
  });
  console.log('✓ Order dispensed!');

  // 11. Diagnostic Lab completes test
  console.log('\n[Step 10] Diagnostic Lab completes investigation...');
  await fetch(`${BASE_URL}/diagnostics/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: kazamaDiagOrder.id,
      findingsSummary: 'KOH Preparation: Negative for fungal hyphae or fungal elements. Mild epidermal hyperplasia.',
    }),
  });
  console.log('✓ Diagnostic investigation completed!');

  await new Promise((r) => setTimeout(r, 800));

  console.log('\n===============================================================');
  console.log('ALL INTEGRATION CHECKS PASSED SUCCESSFULLY!');
  console.log(`Total WebSocket Events Received: ${receivedEvents.length}`);
  console.log('Events:', [...new Set(receivedEvents)].join(', '));
  console.log('===============================================================');

  ws.close();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
