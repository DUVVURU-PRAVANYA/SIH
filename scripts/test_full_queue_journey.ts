const BASE_URL = 'http://localhost:4000/api';

async function runMultiQueueTest() {
  console.log('===============================================================');
  console.log('TEST: MULTI-PATIENT QUEUE VISIBILITY + DOCTOR ADVANCEMENT');
  console.log('===============================================================');

  const suffix = Date.now().toString().slice(-4);
  // 1. Create Patient A (Will be serving / called first)
  console.log('\n[1] Registering Patient A (Murugan K.)...');
  const regARes = await fetch(`${BASE_URL}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Murugan K.', age: 52, gender: 'Male', phone: `984011${suffix}` }),
  });
  const regA: any = await regARes.json();
  const patAId = regA.patient.id;

  const visitARes = await fetch(`${BASE_URL}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: patAId, doctorId: 'usr-doc-1', departmentId: 'dept-genmed', symptoms: 'Fever' }),
  });
  const visitA: any = await visitARes.json();
  console.log('✓ Patient A created with token:', visitA.data.tokenNumber);

  // 2. Create Patient B (Waiting ahead of Anitha)
  console.log('\n[2] Registering Patient B (Lakshmi S.)...');
  const regBRes = await fetch(`${BASE_URL}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Lakshmi S.', age: 39, gender: 'Female', phone: `984022${suffix}` }),
  });
  const regB: any = await regBRes.json();
  const patBId = regB.patient.id;

  const visitBRes = await fetch(`${BASE_URL}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: patBId, doctorId: 'usr-doc-1', departmentId: 'dept-genmed', symptoms: 'Headache' }),
  });
  const visitB: any = await visitBRes.json();
  console.log('✓ Patient B created with token:', visitB.data.tokenNumber);

  // 3. Create Patient C (Waiting ahead of Anitha)
  console.log('\n[3] Registering Patient C (Gopal R.)...');
  const regCRes = await fetch(`${BASE_URL}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Gopal R.', age: 61, gender: 'Male', phone: `984033${suffix}` }),
  });
  const regC: any = await regCRes.json();
  const patCId = regC.patient.id;

  const visitCRes = await fetch(`${BASE_URL}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: patCId, doctorId: 'usr-doc-1', departmentId: 'dept-genmed', symptoms: 'Joint pain' }),
  });
  const visitC: any = await visitCRes.json();
  console.log('✓ Patient C created with token:', visitC.data.tokenNumber);

  // 4. Now create visit for Anitha Kumar (GH-P-00127) who enters behind Patients A, B, C!
  console.log('\n[4] Creating new visit for Anitha Kumar (GH-P-00127)...');
  const anithaVisitRes = await fetch(`${BASE_URL}/visits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: 'GH-P-00127',
      doctorId: 'usr-doc-1',
      departmentId: 'dept-genmed',
      symptoms: 'Checkup for allergies and blood sugar',
      forceNew: true,
    }),
  });
  const anithaVisit: any = await anithaVisitRes.json();
  const anithaToken = anithaVisit.data.tokenNumber;
  console.log('✓ Anitha Kumar visit created with Token:', anithaToken);

  // 5. Inspect Anitha's Queue Metrics
  console.log('\n[5] Verifying Queue Ahead of Anitha Kumar...');
  const activeRes = await fetch(`${BASE_URL}/patients/GH-P-00127/active-visit`);
  const activeData: any = await activeRes.json();
  const metrics = activeData.data.queueMetrics;

  console.log('✓ Initial Queue Status for Anitha:');
  console.log(`  - Your Token: ${anithaToken}`);
  console.log(`  - Now Serving: ${metrics.nowServingToken}`);
  console.log(`  - Patients Ahead: ${metrics.peopleAhead}`);
  console.log(`  - Estimated Wait: ${metrics.estimatedWaitMinutes} mins`);
  console.log(`  - Queue Ahead Count: ${metrics.queueAhead.length}`);

  if (metrics.queueAhead.length === 0) {
    throw new Error('Expected entries ahead of Anitha, but got 0!');
  }

  console.log('\n  QUEUE AHEAD OF YOU:');
  metrics.queueAhead.forEach((q: any, i: number) => {
    console.log(`    ${i + 1}. ${q.tokenNumber}   ${q.status}`);
  });
  console.log(`    YOUR TOKEN: ${anithaToken}`);

  // 6. Doctor Calls Next Patient -> Patients Ahead Decrements!
  console.log('\n[6] Doctor clicks "Call Next Patient"...');
  const callRes = await fetch(`${BASE_URL}/queues/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentId: 'dept-genmed' }),
  });
  const callData: any = await callRes.json();
  console.log('✓ Doctor called:', callData.data.tokenNumber);

  // 7. Check Anitha's updated queue metrics
  const updatedRes = await fetch(`${BASE_URL}/patients/GH-P-00127/active-visit`);
  const updatedData: any = await updatedRes.json();
  const updatedMetrics = updatedData.data.queueMetrics;

  console.log('\n[7] Verified Updated Queue for Anitha:');
  console.log(`  - Now Serving: ${updatedMetrics.nowServingToken}`);
  console.log(`  - Patients Ahead: ${updatedMetrics.peopleAhead} (was ${metrics.peopleAhead})`);
  console.log(`  - Estimated Wait: ${updatedMetrics.estimatedWaitMinutes} mins (was ${metrics.estimatedWaitMinutes} mins)`);

  if (updatedMetrics.peopleAhead < metrics.peopleAhead) {
    console.log(`\n🎉 SUCCESS: Patients Ahead decremented from ${metrics.peopleAhead} to ${updatedMetrics.peopleAhead}!`);
  } else {
    throw new Error('Patients ahead did not decrement after calling next patient!');
  }
}

runMultiQueueTest().catch((err) => {
  console.error('Multi queue test failed:', err);
  process.exit(1);
});
