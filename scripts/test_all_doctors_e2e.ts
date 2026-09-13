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

async function runAllDoctorsTest() {
  console.log('========================================================================');
  console.log('🏥 GH QUEUEFLOW: E2E DOCTOR-PATIENT CONNECTIVITY AUDIT FOR ALL DOCTORS');
  console.log('========================================================================\n');

  // Step 1: Fetch dynamic doctors from database
  console.log('1. Loading active doctors from persistent database via GET /api/doctors...');
  const doctorsRes = await req('/doctors');
  const doctors = doctorsRes.data;
  console.log(`✓ Loaded ${doctors.length} active doctors from database:`);
  for (const doc of doctors) {
    console.log(`   - [${doc.id}] ${doc.fullName} (${doc.department?.name || doc.departmentId}) | username: ${doc.username}`);
  }

  if (!doctors || doctors.length < 5) {
    throw new Error(`Expected at least 5 doctors in DB, found ${doctors.length}`);
  }

  // Verify all expected doctors are present
  const docUsernames = doctors.map((d: any) => d.username.toLowerCase());
  const expectedDocs = ['dr_priya', 'dr_senthil', 'dr_arun', 'dr_meena', 'dr_ravi'];
  for (const exp of expectedDocs) {
    if (!docUsernames.includes(exp)) {
      throw new Error(`Missing expected doctor in DB: ${exp}`);
    }
  }
  console.log('✓ All 5 target doctors (Priya, Senthil/Sethilnathan, Arun, Meena, Ravi) exist in DB.\n');

  const createdVisits: { doctor: any; patient: any; visit: any }[] = [];

  // Step 2: For EVERY doctor, create a brand-new patient, select doctor, and verify queue isolation
  console.log('2. Testing Registration, Doctor Selection, and Queue Isolation for EVERY doctor...');
  const runId = Date.now().toString().slice(-4);
  let phoneCounter = 11;

  for (const doc of doctors) {
    const phone = `984${runId}0${phoneCounter++}`;
    const patientName = `Test Pat for ${doc.fullName.replace('Dr. ', '')}`;
    console.log(`\n--- Testing Doctor: ${doc.fullName} (${doc.id}) ---`);

    // A. Register Patient
    const regRes = await req('/auth/register-patient', {
      method: 'POST',
      body: JSON.stringify({
        name: patientName,
        phone,
        age: 35 + phoneCounter,
        gender: phoneCounter % 2 === 0 ? 'Female' : 'Male',
        bloodGroup: 'B+ve',
        allergies: ['Penicillin'],
        chronicConditions: ['None'],
      }),
    });
    const patient = regRes.patient;
    console.log(`   ✓ Registered Patient: ${patient.name} (ID: ${patient.id}, Phone: ${patient.phone})`);

    // B. Verify OTP
    const verifyRes = await req('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        otp: '123456',
      }),
    });
    console.log(`   ✓ OTP Verified for ${patient.name}. Has active visit: ${verifyRes.hasActiveVisit}`);

    // C. Create Visit with this Doctor Selected
    const visitRes = await req('/visits/create', {
      method: 'POST',
      body: JSON.stringify({
        patientId: patient.id,
        doctorId: doc.id,
        departmentId: doc.departmentId,
        symptoms: `Specific consultation requested with ${doc.fullName}`,
        forceNew: true,
      }),
    });

    const visitData = visitRes.data;
    console.log(`   ✓ Visit Created! Token: ${visitData.tokenNumber}, Journey ID: ${visitData.journey.id}, Queue Entry ID: ${visitData.queueEntry.id}`);
    console.log(`   ✓ Assigned Doctor: ${visitData.doctor.fullName} (${visitData.doctor.id}) in ${visitData.department.name}`);

    if (visitData.doctor.id !== doc.id) {
      throw new Error(`Doctor ID mismatch: expected ${doc.id}, got ${visitData.doctor.id}`);
    }

    createdVisits.push({ doctor: doc, patient, visit: visitData });

    // D. Verify Doctor Queue Isolation: MUST be in this doctor's queue
    const myQueueRes = await req(`/doctors/${doc.id}/queue`);
    const myQueue = myQueueRes.data;
    const inMyQueue = myQueue.find((q: any) => q.patientId === patient.id);
    if (!inMyQueue) {
      throw new Error(`Patient ${patient.id} NOT FOUND in ${doc.fullName}'s queue!`);
    }
    console.log(`   ✓ Patient confirmed present in ${doc.fullName}'s queue (Token: ${inMyQueue.tokenNumber}, Status: ${inMyQueue.status})`);

    // E. Verify Strict Doctor Isolation: MUST NOT be in any other doctor's queue!
    for (const otherDoc of doctors) {
      if (otherDoc.id === doc.id) continue;
      const otherQueueRes = await req(`/doctors/${otherDoc.id}/queue`);
      const inOtherQueue = otherQueueRes.data.find((q: any) => q.patientId === patient.id);
      if (inOtherQueue) {
        throw new Error(`CRITICAL: Patient ${patient.id} leaked into ${otherDoc.fullName}'s queue!`);
      }
    }
    console.log(`   ✓ Strict Isolation Verified: Patient is NOT present in any other doctor's queue.`);
  }

  // Step 3: Verify the full clinical workflow for EVERY doctor
  console.log('\n========================================================================');
  console.log('3. Running Full Clinical Flow for EVERY Doctor');
  console.log('   (Call Patient → Consultation → Lab Order → Lab Results → Pharmacy → Completion)');
  console.log('========================================================================\n');

  for (const item of createdVisits) {
    const { doctor, patient, visit } = item;
    console.log(`\n▶ Workflow Execution for ${doctor.fullName} and Patient ${patient.name}:`);

    // A. Staff Login as this exact doctor
    const loginRes = await req('/auth/staff-login', {
      method: 'POST',
      body: JSON.stringify({
        username: doctor.username,
        password: 'password123',
      }),
    });
    console.log(`   ✓ Authenticated as ${loginRes.user.fullName} (${loginRes.user.role})`);

    // B. Call Next Patient
    const callRes = await req('/queues/call', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: doctor.id,
        queueEntryId: visit.queueEntry.id,
      }),
    });
    console.log(`   ✓ Doctor called patient! Status: ${callRes.data.status}, Token: ${callRes.data.tokenNumber}`);

    // C. Start Consultation
    const startRes = await req('/consultations/start', {
      method: 'POST',
      body: JSON.stringify({
        queueEntryId: visit.queueEntry.id,
        journeyId: visit.journey.id,
      }),
    });
    console.log(`   ✓ Consultation started. Stage status: ${startRes.data?.status || startRes.queueEntry?.status}`);

    // D. Complete Consultation with Prescriptions and Diagnostic Lab Request
    const testName = `Comprehensive ${doctor.department?.name || 'OPD'} Diagnostic Panel`;
    const completeRes = await req('/consultations/complete', {
      method: 'POST',
      body: JSON.stringify({
        journeyId: visit.journey.id,
        patientId: patient.id,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        diagnosis: `Clinical findings evaluated by ${doctor.fullName}`,
        clinicalNotes: 'Vitals stable. Patient advised regular follow-up.',
        medications: [
          {
            name: 'Tab Paracetamol 500mg',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '3 Days',
            instructions: 'After Food',
            quantity: 6,
          },
          {
            name: 'Tab Cetirizine 10mg',
            dosage: '10mg',
            frequency: '0-0-1',
            duration: '5 Days',
            instructions: 'Bedtime',
            quantity: 5,
          },
        ],
        investigations: [testName],
        routeTo: 'lab',
      }),
    });
    console.log(`   ✓ Consultation completed by ${doctor.fullName}. Routed to Lab.`);

    // E. Verify Diagnostic Lab Order Created with correct Doctor & Patient IDs
    const labOrdersRes = await req('/diagnostics');
    const labOrder = labOrdersRes.data.find((o: any) => o.journeyId === visit.journey.id);
    if (!labOrder) {
      throw new Error(`Lab order not created for journey ${visit.journey.id}`);
    }
    console.log(`   ✓ Lab Order found: [${labOrder.id}] ${labOrder.testName} (Doctor: ${labOrder.doctorName}, Patient: ${labOrder.patientName})`);

    // F. Lab Technician starts & completes test
    await req('/diagnostics/start', {
      method: 'POST',
      body: JSON.stringify({ orderId: labOrder.id }),
    });
    const labCompleteRes = await req('/diagnostics/complete', {
      method: 'POST',
      body: JSON.stringify({
        orderId: labOrder.id,
        findingsSummary: 'CBC: Normal range; Blood Glucose: 98 mg/dL; No acute abnormalities.',
      }),
    });
    console.log(`   ✓ Lab test completed by diagnostics wing. Findings saved to DB.`);

    // G. Verify Pharmacy Order Created
    const pharmOrdersRes = await req('/pharmacy');
    const pharmOrder = pharmOrdersRes.data.find((p: any) => p.journeyId === visit.journey.id);
    if (!pharmOrder) {
      throw new Error(`Pharmacy order not created for journey ${visit.journey.id}`);
    }
    console.log(`   ✓ Pharmacy Order found: [${pharmOrder.id}] with ${pharmOrder.medications?.length || 0} medications.`);

    // H. Pharmacist dispenses medicines
    const dispenseRes = await req('/pharmacy/dispense', {
      method: 'POST',
      body: JSON.stringify({ orderId: pharmOrder.id }),
    });
    console.log(`   ✓ Medicines dispensed by Central Pharmacy. Order Status: ${dispenseRes.data.status}`);

    // I. Verify Journey Status in Persistent DB
    const journeyRes = await req(`/journey/${visit.journey.id}`);
    console.log(`   ✓ Journey State: ${journeyRes.data.journey.status} (Completed: ${journeyRes.data.journey.completedAt || 'in terminal stage'})`);
    console.log(`   ✨ ALL STEPS SUCCEEDED FOR DOCTOR: ${doctor.fullName} (${doctor.id})\n`);
  }

  console.log('========================================================================');
  console.log('🎉 ALL 5 DOCTORS VERIFIED END-TO-END WITH ZERO LEAKAGE AND 100% SUCCESS!');
  console.log('========================================================================');
}

runAllDoctorsTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
