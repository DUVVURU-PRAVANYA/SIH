import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from '../server/db/database';
import { seedDatabase } from '../server/db/seed';
import { apiRouter } from '../server/routes/api';
import { ivrRouter } from '../server/ivr/ivr.routes';
import { initWebSocketServer } from '../server/realtime';

async function runE2E() {
  console.log('🚀 Starting IVR E2E Integration Test...');

  // Reset db to clean state
  db.clearAllPatientData();

  // Setup test server
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRouter);
  app.use('/api/ivr', ivrRouter);

  const server = http.createServer(app);
  initWebSocketServer(server);

  const TEST_PORT = 4099;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`✓ Test server listening on http://localhost:${TEST_PORT}`);

  // Connect test WebSocket client
  const wsEvents: string[] = [];
  const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);

  await new Promise<void>((resolve) => {
    ws.on('open', () => {
      console.log('✓ WebSocket test client connected');
      resolve();
    });
  });

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.event) {
        wsEvents.push(data.event);
      }
    } catch {}
  });

  const BASE = `http://localhost:${TEST_PORT}/api/ivr`;

  // 1. Start Call
  const startRes = await fetch(`${BASE}/call/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', language: 'en' }),
  }).then((r) => r.json());

  console.log('1. Start Call Response:', startRes.state, '| Spoken:', startRes.spokenText);
  if (startRes.state !== 'LANGUAGE_MENU') throw new Error('Expected LANGUAGE_MENU');
  const sessionId = startRes.session.sessionId;

  // 2. Select English (1)
  const langRes = await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, digit: '1' }),
  }).then((r) => r.json());

  console.log('2. Language Select (1):', langRes.state, '| Spoken:', langRes.spokenText);
  if (langRes.state !== 'MAIN_MENU') throw new Error('Expected MAIN_MENU');

  // 3. Main Menu: New Token (1)
  const menuRes = await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, digit: '1' }),
  }).then((r) => r.json());

  console.log('3. Main Menu (1 -> New Token):', menuRes.state, '| Spoken:', menuRes.spokenText);
  if (menuRes.state !== 'DEPARTMENT_MENU') throw new Error('Expected DEPARTMENT_MENU');

  // 4. Department: Cardiology (2)
  const deptRes = await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, digit: '2' }),
  }).then((r) => r.json());

  console.log('4. Dept Select (2 -> Cardiology):', deptRes.state, '| Spoken:', deptRes.spokenText);
  if (deptRes.state !== 'CONFIRMATION') throw new Error('Expected CONFIRMATION');

  // 5. Confirm (1) -> Generates token in real DB and broadcasts via WebSocket
  const confirmRes = await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, digit: '1' }),
  }).then((r) => r.json());

  console.log('5. Token Generated (1 -> Confirm):', confirmRes.state);
  console.log('   Generated Token Number:', confirmRes.session.generatedToken);
  console.log('   People Ahead in Queue:', confirmRes.session.peopleAhead);
  console.log('   Estimated Wait Minutes:', confirmRes.session.estimatedWaitMinutes);
  console.log('   Spoken Text:', confirmRes.spokenText);

  if (confirmRes.state !== 'TOKEN_GENERATED') throw new Error('Expected TOKEN_GENERATED');
  if (!confirmRes.session.generatedToken?.startsWith('CARDIO-')) throw new Error('Token should start with CARDIO-');

  // Give WebSocket 200ms to receive broadcast
  await new Promise((r) => setTimeout(r, 200));

  console.log('6. Received WebSocket Events:', wsEvents);
  if (!wsEvents.includes('TOKEN_CREATED') || !wsEvents.includes('QUEUE_UPDATED')) {
    throw new Error('WebSocket should have received TOKEN_CREATED and QUEUE_UPDATED');
  }

  // 7. Verify Cardiology Doctor Queue in the existing database API
  const docQueueRes = await fetch(`http://localhost:${TEST_PORT}/api/queues/dept-cardio`).then((r) => r.json());
  console.log('7. Cardiology Queue Count in DB:', docQueueRes.data?.length);
  const foundInQueue = docQueueRes.data?.find((q: any) => q.tokenNumber === confirmRes.session.generatedToken);
  if (!foundInQueue) throw new Error('Generated token must exist in the real Cardiology queue!');
  console.log('   ✓ Found token in real queue entry:', foundInQueue.tokenNumber, 'Priority:', foundInQueue.priority);

  // 8. Test Tamil Language flow
  console.log('\n--- Testing Tamil Language Voice Flow ---');
  const startTa = await fetch(`${BASE}/call/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876500002', language: 'en' }),
  }).then((r) => r.json());

  const langTa = await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: startTa.session.sessionId, digit: '2' }), // 2 = Tamil
  }).then((r) => r.json());

  console.log('Tamil Selected (2): Spoken:', langTa.spokenText);
  if (!langTa.spokenText.includes('புதிய டோக்கன்')) {
    throw new Error('Tamil spoken text expected for main menu');
  }

  // 9. Test Help Me Choose with Symptom Speech
  console.log('\n--- Testing Voice Symptom Speech Triage ---');
  await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: startTa.session.sessionId, digit: '1' }), // New Token
  });
  await fetch(`${BASE}/call/dtmf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: startTa.session.sessionId, digit: '5' }), // Help Me Choose
  });

  const symptomRes = await fetch(`${BASE}/call/symptom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: startTa.session.sessionId, transcript: 'நெஞ்சு வலி மற்றும் படபடப்பு' }), // Chest pain in Tamil
  }).then((r) => r.json());

  console.log('Tamil Symptom Triage Result:', symptomRes.session.selectedDeptCode, '| Spoken:', symptomRes.spokenText);
  if (symptomRes.session.selectedDeptCode !== 'CARDIO') {
    throw new Error('Tamil chest pain symptom should triage to CARDIO');
  }

  // Close connections
  ws.close();
  server.close();

  console.log('\n🎉 ALL E2E INTEGRATION TESTS PASSED 100%!');
  process.exit(0);
}

runE2E().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
