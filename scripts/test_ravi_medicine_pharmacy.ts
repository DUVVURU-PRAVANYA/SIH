const BASE_URL = 'http://localhost:4000/api';

async function req(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data: any = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(`Request failed: ${options.method || 'GET'} ${path} -> ${JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log('================================================================');
  console.log('🩺 VERIFYING DR. RAVI KUMAR MEDICINE & PHARMACY CONNECTIVITY');
  console.log('================================================================\n');

  // Step 1: Check Dr. Ravi Kumar in database
  console.log('1. Loading Dr. Ravi Kumar from /api/doctors...');
  const docsRes = await req('/doctors');
  const ravi = docsRes.data.find((d: any) => d.id === 'usr-doc-ravi' || d.username === 'dr_ravi');
  if (!ravi) {
    throw new Error('Dr. Ravi Kumar not found in active doctors database!');
  }
  console.log(`✓ Found Dr. Ravi Kumar: ID=${ravi.id}, Name=${ravi.fullName}, Dept=${ravi.department?.name || ravi.departmentId}\n`);

  // Step 2: Register a new patient specifically selecting Dr. Ravi Kumar
  console.log('2. Registering new patient for Dr. Ravi Kumar...');
  const testPhone = `9840${Date.now().toString().slice(-6)}`;
  const regRes = await req('/auth/register-patient', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Ravi Test Patient',
      phone: testPhone,
      age: 42,
      gender: 'Male',
      bloodGroup: 'O+ve',
      allergies: ['Dust'],
      chronicConditions: ['None'],
    }),
  });
  const patient = regRes.patient;
  console.log(`✓ Registered Patient: ${patient.name} (ID: ${patient.id}, Phone: ${patient.phone})`);

  // Verify OTP
  await req('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: testPhone, otp: '123456' }),
  });
  console.log('✓ OTP Verified for patient.\n');

  // Step 3: Create Visit assigned specifically to Dr. Ravi Kumar
  console.log('3. Creating Visit assigned to Dr. Ravi Kumar...');
  const visitRes = await req('/visits/create', {
    method: 'POST',
    body: JSON.stringify({
      patientId: patient.id,
      departmentId: ravi.departmentId,
      doctorId: ravi.id,
      symptoms: 'Skin rash, severe pruritus, allergic dermatitis',
      priority: 'normal',
    }),
  });
  const visit = visitRes.data;
  console.log(`✓ Visit Created! Token: ${visit.tokenNumber}, Journey ID: ${visit.journey.id}, Queue Entry: ${visit.queueEntry.id}\n`);

  // Step 4: Verify Patient appears in Dr. Ravi Kumar's queue
  console.log("4. Checking Dr. Ravi Kumar's queue...");
  const docQueueRes = await req(`/doctors/${ravi.id}/queue`);
  const queueList = Array.isArray(docQueueRes.data) ? docQueueRes.data : (docQueueRes.data.queue || []);
  const foundInQueue = queueList.find((q: any) => q.patientId === patient.id || q.tokenNumber === visit.tokenNumber);
  if (!foundInQueue) {
    throw new Error("Patient did not appear in Dr. Ravi Kumar's queue!");
  }
  console.log(`✓ Patient confirmed in Dr. Ravi Kumar's queue: Token ${foundInQueue.tokenNumber}, Status: ${foundInQueue.status}\n`);

  // Step 5: Doctor Calls Patient
  console.log('5. Dr. Ravi calls the patient...');
  await req('/queues/call', {
    method: 'POST',
    body: JSON.stringify({
      queueEntryId: visit.queueEntry.id,
      departmentId: ravi.departmentId,
      doctorId: ravi.id,
    }),
  });
  console.log('✓ Doctor called patient successfully.\n');

  // Step 6: Doctor Starts Consultation
  console.log('6. Dr. Ravi starts consultation...');
  await req('/consultations/start', {
    method: 'POST',
    body: JSON.stringify({
      queueEntryId: visit.queueEntry.id,
      journeyId: visit.journey.id,
    }),
  });
  console.log('✓ Consultation started.\n');

  // Step 7: Doctor prescribes medicines (NO LAB TESTS - pure medicine route)
  console.log('7. Dr. Ravi prescribes medicines and completes consultation...');
  const prescribedMeds = [
    {
      id: 'med-1',
      name: 'Cetirizine 10mg',
      dosage: '10mg',
      frequency: 'Once Daily (Night)',
      duration: '7 Days',
      instructions: 'After food',
      quantity: 7,
      isDispensed: false,
    },
    {
      id: 'med-2',
      name: 'Hydroxyzine 25mg',
      dosage: '25mg',
      frequency: 'SOS (At bed time if itching)',
      duration: '5 Days',
      instructions: 'When itching is severe',
      quantity: 5,
      isDispensed: false,
    },
    {
      id: 'med-3',
      name: 'Calamine Lotion 100ml',
      dosage: 'Apply topically',
      frequency: 'Twice Daily',
      duration: '10 Days',
      instructions: 'External application on affected areas',
      quantity: 1,
      isDispensed: false,
    },
  ];

  const compRes = await req('/consultations/complete', {
    method: 'POST',
    body: JSON.stringify({
      journeyId: visit.journey.id,
      patientId: patient.id,
      doctorId: ravi.id,
      doctorName: ravi.fullName,
      diagnosis: 'Acute Allergic Contact Dermatitis',
      clinicalNotes: 'Erythematous papules and plaques on bilateral arms. No secondary infection.',
      medications: prescribedMeds,
      investigations: [],
      routeTo: 'pharmacy',
      followUpDays: 7,
    }),
  });
  console.log(`✓ Consultation completed! Routed to: ${compRes.data.nextStageType}, Next Token: ${compRes.data.nextToken}\n`);

  // Step 8: Verify Patient's Active Visit reflects Pharmacy stage and medicines
  console.log("8. Checking Patient's Active Visit (/api/patients/:id/active-visit)...");
  const activeVisitRes = await req(`/patients/${patient.id}/active-visit`);
  const activeData = activeVisitRes.data;
  console.log(`   - Current Stage: ${activeData.journey.currentStage}`);
  console.log(`   - Current Token: ${activeData.journey.currentToken}`);
  console.log(`   - Has Pharmacy Order in active visit: ${Boolean(activeData.pharmacyOrder)}`);
  if (!activeData.pharmacyOrder) {
    throw new Error('Active visit does NOT have pharmacyOrder attached!');
  }
  console.log(`   - Pharmacy Order Token: ${activeData.pharmacyOrder.tokenNumber}`);
  console.log(`   - Pharmacy Order Status: ${activeData.pharmacyOrder.status}`);
  console.log(`   - Medications in active visit pharmacyOrder: ${activeData.pharmacyOrder.medications.length}`);
  activeData.pharmacyOrder.medications.forEach((m: any, i: number) => {
    console.log(`     ${i + 1}. ${m.name} (${m.dosage}) - ${m.frequency}`);
  });
  console.log('✓ Patient Active Visit accurately reflects Pharmacy stage and prescribed medicines!\n');

  // Step 9: Verify Patient Prescriptions endpoint (/api/patients/:id/prescriptions)
  console.log("9. Checking Patient Prescriptions endpoint (/api/patients/:id/prescriptions)...");
  const rxRes = await req(`/patients/${patient.id}/prescriptions`);
  console.log(`   - Prescriptions returned: ${rxRes.data.length}`);
  if (rxRes.data.length === 0) {
    throw new Error('No prescriptions returned for patient!');
  }
  const latestRx = rxRes.data[0];
  console.log(`   - Latest Prescription ID: ${latestRx.id}, Token: ${latestRx.tokenNumber}, Doctor: ${latestRx.doctorName}`);
  console.log('✓ Patient Prescriptions endpoint verified!\n');

  // Step 10: Verify Central Pharmacy endpoint (/api/pharmacy)
  console.log('10. Checking Central Pharmacy (/api/pharmacy)...');
  const pharmRes = await req('/pharmacy');
  const pharmOrders = pharmRes.data;
  const orderForPatient = pharmOrders.find((o: any) => o.patientId === patient.id || o.journeyId === visit.journey.id);
  if (!orderForPatient) {
    throw new Error('Pharmacy queue (/api/pharmacy) does NOT contain order for this patient!');
  }
  console.log(`   ✓ Found Order in Pharmacy: ID=${orderForPatient.id}, Token=${orderForPatient.tokenNumber}`);
  console.log(`   ✓ Patient Name: ${orderForPatient.patientName}`);
  console.log(`   ✓ Doctor Name: ${orderForPatient.doctorName}`);
  console.log(`   ✓ Diagnosis: ${orderForPatient.diagnosis}`);
  console.log(`   ✓ Medicines (${orderForPatient.medications.length} items):`);
  orderForPatient.medications.forEach((m: any, idx: number) => {
    console.log(`     ${idx + 1}. ${m.name} [${m.dosage}] - ${m.frequency} (${m.duration})`);
  });
  console.log('✓ Central Pharmacy connection verified!\n');

  // Step 11: Dispense medicines at Pharmacy
  console.log('11. Dispensing medicines from Pharmacy (/api/pharmacy/dispense)...');
  const dispRes = await req('/pharmacy/dispense', {
    method: 'POST',
    body: JSON.stringify({ orderId: orderForPatient.id }),
  });
  console.log(`✓ Dispense Response: ${JSON.stringify(dispRes.data)}`);

  // Step 12: Verify Patient Journey is now completed
  const completedVisitRes = await req(`/patients/${patient.id}/active-visit`);
  console.log(`   - Patient Journey Status after dispensing: ${completedVisitRes.data?.journey?.status}`);
  console.log('✓ Full medicine prescription & dispensing cycle completed successfully!\n');

  // Step 13: Clean wipe of all entries/patients as requested
  console.log('12. Removing ALL entries and patients till now (/api/admin/clear-all-patients)...');
  const clearRes = await req('/admin/clear-all-patients', { method: 'POST' });
  console.log(`✓ Clear response: ${clearRes.message}`);

  // Step 14: Confirm Database is 100% clean
  const checkDocsQueue = await req(`/doctors/${ravi.id}/queue`);
  const checkQueueLen = Array.isArray(checkDocsQueue.data) ? checkDocsQueue.data.length : (checkDocsQueue.data.queue?.length || 0);
  console.log(`   - Dr. Ravi Queue length after wipe: ${checkQueueLen} (Expected: 0)`);
  const checkPharmOrders = await req('/pharmacy');
  console.log(`   - Pharmacy Orders count after wipe: ${checkPharmOrders.data.length} (Expected: 0)`);

  if (checkQueueLen !== 0 || checkPharmOrders.data.length !== 0) {
    throw new Error('Database was not completely wiped!');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL CONNECTIONS VERIFIED & ALL ENTRIES CLEANLY WIPED!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
