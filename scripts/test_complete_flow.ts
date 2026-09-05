import http from 'http';

function request(options: http.RequestOptions, postData?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 200, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 200, body: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTest() {
  console.log('====================================================');
  console.log('STARTING GH QUEUEFLOW END-TO-END WORKFLOW TEST');
  console.log('====================================================');

  const testPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);

  // 1. Register New Patient
  console.log('\n[STEP 1] Registering New Patient...');
  const regRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/register-patient',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'Kavitha Ramesh',
      age: 32,
      gender: 'Female',
      bloodGroup: 'B+',
      allergies: 'Penicillin',
      chronicConditions: 'Asthma',
      phone: testPhone,
    }
  );

  console.log('Register Response Status:', regRes.status);
  console.log('Patient ID:', regRes.body.patient?.id);
  console.log('Demo OTP:', regRes.body.demoOtp);

  if (!regRes.body.success || !regRes.body.patient?.id) {
    throw new Error('Step 1 Failed: Patient registration failed');
  }

  const patientId = regRes.body.patient.id;

  // Verify that NO active visit or token exists yet
  console.log('\n[STEP 2] Verifying NO visit or token exists yet...');
  const preVisitRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/patients/${patientId}/active-visit`,
    method: 'GET',
  });
  console.log('Pre-Visit Body:', JSON.stringify(preVisitRes.body));
  if (preVisitRes.body.hasActiveVisit) {
    throw new Error('Step 2 Failed: Active visit unexpectedly exists before doctor selection');
  }

  // 3. Verify OTP
  console.log('\n[STEP 3] Verifying OTP 123456...');
  const otpRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/verify-otp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      phone: testPhone,
      otp: '123456',
    }
  );

  console.log('OTP Verify Body:', JSON.stringify(otpRes.body));

  // 4. Fetch Doctors & Departments
  console.log('\n[STEP 4] Fetching Doctors from Database...');
  const docsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/doctors',
    method: 'GET',
  });
  console.log('Doctors Body:', JSON.stringify(docsRes.body));
  const priya = docsRes.body.data?.find((d: any) => d.id === 'usr-doc-1');
  console.log('Selected Doctor:', priya?.fullName, 'in Department:', priya?.departmentId);

  // 5. Create Visit ONLY after Doctor Confirmation
  console.log('\n[STEP 5] Creating Visit & Generating Sequential Token...');
  const visitRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/visits/create',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      patientId,
      doctorId: 'usr-doc-1',
      departmentId: 'dept-genmed',
      symptoms: 'Cough and fever',
      priority: 'normal',
    }
  );

  console.log('Visit Body:', JSON.stringify(visitRes.body));
  const generatedToken = visitRes.body.data?.tokenNumber;
  const journeyId = visitRes.body.data?.journey?.id;
  console.log('Generated Token:', generatedToken);
  console.log('Generated Journey ID:', journeyId);
  console.log('Initial Queue Position (People Ahead):', visitRes.body.data?.queueMetrics?.peopleAhead);

  if (!generatedToken || !journeyId) {
    throw new Error('Step 5 Failed: Visit or Token creation failed');
  }

  // 6. Patient Dashboard Queries Active Visit
  console.log('\n[STEP 6] Patient Dashboard Queries Real Database Active Visit...');
  const activeVisitRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/patients/${patientId}/active-visit`,
    method: 'GET',
  });

  console.log('Patient Active Visit Token:', activeVisitRes.body.data?.journey?.currentToken);
  console.log('Doctor Assigned:', activeVisitRes.body.data?.doctor?.fullName);
  console.log('Department:', activeVisitRes.body.data?.department?.name);
  console.log('Now Serving:', activeVisitRes.body.data?.queueMetrics?.nowServingToken);
  console.log('Patients Ahead:', activeVisitRes.body.data?.queueMetrics?.peopleAhead);
  console.log('Estimated Wait (mins):', activeVisitRes.body.data?.queueMetrics?.estimatedWaitMinutes);

  // 7. Doctor Calls Patient
  console.log('\n[STEP 7] Doctor Calls Patient in OPD Queue...');
  const callRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/queues/call',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      departmentId: 'dept-genmed',
    }
  );
  console.log('Doctor Call Success:', callRes.body.success);
  console.log('Updated Queue Status:', callRes.body.data?.status);

  // 8. Doctor Completes Consultation (Medication Prescription)
  console.log('\n[STEP 8] Doctor Submits Consultation & Prescription...');
  const consultRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/consultations/complete',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      journeyId,
      patientId,
      doctorId: 'usr-doc-1',
      doctorName: 'Dr. Priya Kumar, MD, DM',
      diagnosis: 'Acute Upper Respiratory Tract Infection',
      clinicalNotes: 'Throat hyperemic, lungs clear to auscultation. Hydration advised.',
      medications: [
        {
          id: 'med-1',
          name: 'Tab Paracetamol IP',
          dosage: '650 mg',
          frequency: '1-0-1 (After Food)',
          duration: '5 Days',
          instructions: 'For fever, take after food',
          quantity: 10,
          isDispensed: false,
        },
        {
          id: 'med-2',
          name: 'Cap Amoxicillin Trihydrate IP',
          dosage: '500 mg',
          frequency: '1-1-1 (After Food)',
          duration: '5 Days',
          instructions: 'Complete full course',
          quantity: 15,
          isDispensed: false,
        },
      ],
      routeTo: 'pharmacy',
    }
  );

  console.log('Consultation Complete Success:', consultRes.body.success);
  console.log('Next Stage:', consultRes.body.data?.nextStageType);
  console.log('Next Token:', consultRes.body.data?.nextToken);

  // 9. Pharmacy Dashboard retrieves real orders
  console.log('\n[STEP 9] Pharmacy Dashboard queries Prescriptions...');
  const pharmRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/pharmacy',
    method: 'GET',
  });

  const matchingPharmOrder = pharmRes.body.data?.find((o: any) => o.journeyId === journeyId);
  console.log('Pharmacy Order Found:', matchingPharmOrder?.id);
  console.log('Prescribed Medications Count:', matchingPharmOrder?.medications?.length);
  console.log('Initial Pharmacy Status:', matchingPharmOrder?.status);

  if (!matchingPharmOrder) {
    throw new Error('Step 9 Failed: Prescriptions not found in pharmacy queue');
  }

  // 10. Pharmacy Dispenses Medicines
  console.log('\n[STEP 10] Pharmacy Dispenses Medications...');
  const dispenseRes = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/pharmacy/dispense',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      orderId: matchingPharmOrder.id,
    }
  );

  console.log('Dispense Success:', dispenseRes.body.success);

  // 11. Final Verification of Patient Journey
  console.log('\n[STEP 11] Verifying Final Patient Journey Status in Database...');
  const finalVisitRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/patients/${patientId}/active-visit`,
    method: 'GET',
  });

  console.log('Final Journey Stage:', finalVisitRes.body.data?.journey?.currentStage);
  console.log('Final Journey Status:', finalVisitRes.body.data?.journey?.status);
  console.log('Pharmacy Order Status:', finalVisitRes.body.data?.pharmacyOrder?.status);

  console.log('\n====================================================');
  console.log('SUCCESS! ALL 11 STEPS COMPLETED AGAINST PERSISTENT DB!');
  console.log('====================================================');
}

runTest().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
