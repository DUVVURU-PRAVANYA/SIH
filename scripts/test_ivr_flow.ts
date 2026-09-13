import { ivrService } from '../server/ivr/ivr.service';
import { db } from '../server/db/database';

async function testIVR() {
  console.log('--- Testing IVR Complete Flow ---');

  // 1. Start call
  const startRes = ivrService.startCall('9876543210', 'en');
  console.log('1. Start Call:', startRes.state, '| Spoken:', startRes.spokenText);
  const sessionId = startRes.session.sessionId;

  // 2. Choose English (1)
  const langRes = ivrService.handleDtmf(sessionId, '1');
  console.log('2. Language Selected (1 -> EN):', langRes.state, '| Spoken:', langRes.spokenText);

  // 3. Main Menu: New Token (1)
  const menuRes = ivrService.handleDtmf(sessionId, '1');
  console.log('3. Main Menu Choice (1 -> New Token):', menuRes.state, '| Spoken:', menuRes.spokenText);

  // 4. Department Menu: Cardiology (2)
  const deptRes = ivrService.handleDtmf(sessionId, '2');
  console.log('4. Dept Selected (2 -> Cardiology):', deptRes.state, '| Spoken:', deptRes.spokenText);

  // 5. Confirmation: Confirm (1)
  const confirmRes = ivrService.handleDtmf(sessionId, '1');
  console.log('5. Token Generated (1 -> Confirm):', confirmRes.state);
  console.log('   Generated Token:', confirmRes.session.generatedToken);
  console.log('   People Ahead:', confirmRes.session.peopleAhead);
  console.log('   Estimated Wait:', confirmRes.session.estimatedWaitMinutes);
  console.log('   Spoken:', confirmRes.spokenText);

  if (!confirmRes.session.generatedToken?.startsWith('CARDIO-')) {
    throw new Error('Token should start with CARDIO-');
  }

  // 6. Test Help Me Choose with Symptom Speech
  console.log('\n--- Testing IVR Help Me Choose (Symptom Triage) ---');
  const session2 = ivrService.startCall('9876599999', 'en');
  ivrService.handleDtmf(session2.session.sessionId, '1'); // English
  ivrService.handleDtmf(session2.session.sessionId, '1'); // New Token
  const helpRes = ivrService.handleDtmf(session2.session.sessionId, '5'); // Help me choose
  console.log('Dept Choice (5 -> Help):', helpRes.state, '| Spoken:', helpRes.spokenText);

  const symptomRes = ivrService.handleSymptomSpeech(session2.session.sessionId, 'I have severe chest pain and palpitations');
  console.log('Symptom Speech Result:', symptomRes.state, '| Spoken:', symptomRes.spokenText);

  const symptomConfirm = ivrService.handleDtmf(session2.session.sessionId, '1');
  console.log('Symptom Token Generated:', symptomConfirm.session.generatedToken);
  console.log('Spoken:', symptomConfirm.spokenText);

  console.log('\n✅ All IVR Backend Tests Passed Successfully!');
  process.exit(0);
}

testIVR().catch((err) => {
  console.error('❌ IVR Test Failed:', err);
  process.exit(1);
});
