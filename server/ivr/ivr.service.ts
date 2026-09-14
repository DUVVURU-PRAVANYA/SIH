import { db } from '../db/database';
import { broadcastEvent } from '../realtime';
import { notificationService } from '../services/notificationService';
import { IVRSession, IVRActionResponse, IVRLanguage } from './ivr.types';
import { ivrSessionManager } from './ivr.session';
import { getPrompt, PROMPTS_EN, PROMPTS_TA } from './ivr.prompts';

interface DeptMeta {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
}

const DEPT_MAP: Record<string, DeptMeta> = {
  '1': { id: 'dept-genmed', code: 'GENMED', nameEn: 'General Medicine', nameTa: 'பொது மருத்துவம்' },
  '2': { id: 'dept-cardio', code: 'CARDIO', nameEn: 'Cardiology', nameTa: 'இதயவியல்' },
  '3': { id: 'dept-ortho', code: 'ORTHO', nameEn: 'Orthopedics', nameTa: 'எலும்பியல்' },
  '4': { id: 'dept-derma', code: 'DERMA', nameEn: 'Dermatology', nameTa: 'தோல் மருத்துவம்' },
};

export const DOCTOR_VOICE_MAP: Record<string, { en: string; ta: string }> = {
  'usr-doc-1': { en: 'Doctor Priya Kumar', ta: 'டாக்டர் பிரியா குமார்' },
  'dr_priya': { en: 'Doctor Priya Kumar', ta: 'டாக்டர் பிரியா குமார்' },
  'Dr. Priya Kumar': { en: 'Doctor Priya Kumar', ta: 'டாக்டர் பிரியா குமார்' },

  'usr-doc-2': { en: 'Doctor Senthil Nathan', ta: 'டாக்டர் செந்தில் நாதன்' },
  'dr_senthil': { en: 'Doctor Senthil Nathan', ta: 'டாக்டர் செந்தில் நாதன்' },
  'Dr. M. Senthil Nathan': { en: 'Doctor Senthil Nathan', ta: 'டாக்டர் செந்தில் நாதன்' },

  'usr-doc-arun': { en: 'Doctor Arun Kumar', ta: 'டாக்டர் அருண் குமார்' },
  'dr_arun': { en: 'Doctor Arun Kumar', ta: 'டாக்டர் அருண் குமார்' },
  'Dr. Arun Kumar': { en: 'Doctor Arun Kumar', ta: 'டாக்டர் அருண் குமார்' },

  'usr-doc-meena': { en: 'Doctor Meena Sharma', ta: 'டாக்டர் மீனா சர்மா' },
  'dr_meena': { en: 'Doctor Meena Sharma', ta: 'டாக்டர் மீனா சர்மா' },
  'Dr. Meena Sharma': { en: 'Doctor Meena Sharma', ta: 'டாக்டர் மீனா சர்மா' },

  'usr-doc-ravi': { en: 'Doctor Ravi Kumar', ta: 'டாக்டர் ரவி குமார்' },
  'dr_ravi': { en: 'Doctor Ravi Kumar', ta: 'டாக்டர் ரவி குமார்' },
  'Dr. Ravi Kumar': { en: 'Doctor Ravi Kumar', ta: 'டாக்டர் ரவி குமார்' },
};

export function formatDoctorNameForVoice(doctorInput?: string, lang: IVRLanguage = 'en'): string {
  if (!doctorInput) {
    return lang === 'ta' ? 'டாக்டர்' : 'Doctor';
  }
  const clean = doctorInput.trim();
  const direct = DOCTOR_VOICE_MAP[clean];
  if (direct) {
    return direct[lang];
  }
  for (const [key, mapping] of Object.entries(DOCTOR_VOICE_MAP)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return mapping[lang];
    }
  }
  if (lang === 'en') {
    return clean.replace(/^Dr\.?\s*/i, 'Doctor ');
  }
  return clean.startsWith('டாக்டர்') ? clean : `டாக்டர் ${clean}`;
}

export class IVRService {
  /**
   * 1. Start a new IVR Call
   */
  public startCall(callerPhone: string, initialLang: IVRLanguage = 'en'): IVRActionResponse {
    const session = ivrSessionManager.createSession(callerPhone, initialLang);

    // Look up caller if existing patient
    const existingPatient = db.getPatientByPhone(session.callerPhone);
    if (existingPatient) {
      session.callerName = existingPatient.name;
    }

    const promptTextEn = PROMPTS_EN.languageSelect;
    const promptTextTa = PROMPTS_TA.languageSelect;

    session.state = 'LANGUAGE_MENU';
    session.lastPromptTextEn = promptTextEn;
    session.lastPromptTextTa = promptTextTa;
    session.lastSpokenText = `${promptTextEn} ${promptTextTa}`;

    ivrSessionManager.updateSession(session.sessionId, session);

    return {
      success: true,
      session,
      spokenText: `${promptTextEn} [PAUSE_3S] ${promptTextTa}`,
      language: session.language,
      state: session.state,
    };
  }

  /**
   * 2. Handle Keypad DTMF Input
   */
  public handleDtmf(sessionId: string, digit: string): IVRActionResponse {
    const session = ivrSessionManager.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        session: {} as any,
        spokenText: 'Call session not found',
        language: 'en',
        state: 'CALL_ENDED',
        error: 'Session expired or not found',
      };
    }

    const lang = session.language;
    const prompts = getPrompt(lang);

    switch (session.state) {
      // ----------------------------------------------------
      // STEP 1: LANGUAGE SELECTION
      // ----------------------------------------------------
      case 'LANGUAGE_MENU': {
        if (digit === '1') {
          session.language = 'en';
        } else if (digit === '2') {
          session.language = 'ta';
        } else {
          // Invalid digit, repeat prompt
          return this.respondWithPrompt(session, prompts.invalidChoice + ' ' + prompts.languageSelect);
        }

        const newPrompts = getPrompt(session.language);
        session.state = 'MAIN_MENU';
        return this.respondWithPrompt(session, newPrompts.mainMenu);
      }

      // ----------------------------------------------------
      // STEP 2: MAIN MENU (1: New Token, 2: Check Status, 3: Repeat Token)
      // ----------------------------------------------------
      case 'MAIN_MENU': {
        if (digit === '1') {
          // New Token -> Ensure patient exists, then show department menu
          this.ensurePatientRecord(session.callerPhone);
          session.state = 'DEPARTMENT_MENU';
          return this.respondWithPrompt(session, prompts.deptMenu);
        }

        if (digit === '2') {
          // Check Token Status
          session.state = 'CHECK_STATUS';
          const statusInfo = this.getActiveTokenInfo(session.callerPhone, session.language);
          session.currentStage = statusInfo.currentStage;
          session.isCompleted = statusInfo.isCompleted;
          session.stageTitle = statusInfo.stageTitle;
          session.diagnosis = statusInfo.diagnosis;
          session.doctorName = statusInfo.doctorName;
          session.queueStatus = statusInfo.queueStatus;
          return this.respondWithPrompt(session, statusInfo.message, statusInfo.journeyId, statusInfo.token, statusInfo.peopleAhead, statusInfo.waitMinutes);
        }

        if (digit === '3') {
          // Repeat Token
          session.state = 'REPEAT_TOKEN';
          const repeatInfo = this.getRepeatTokenInfo(session.callerPhone, session.language);
          session.currentStage = repeatInfo.currentStage;
          session.isCompleted = repeatInfo.isCompleted;
          session.stageTitle = repeatInfo.stageTitle;
          session.diagnosis = repeatInfo.diagnosis;
          session.doctorName = repeatInfo.doctorName;
          session.queueStatus = repeatInfo.queueStatus;
          return this.respondWithPrompt(session, repeatInfo.message, repeatInfo.journeyId, repeatInfo.token, repeatInfo.peopleAhead, repeatInfo.waitMinutes);
        }

        return this.respondWithPrompt(session, prompts.invalidChoice + ' ' + prompts.mainMenu);
      }

      // ----------------------------------------------------
      // STEP 3: DEPARTMENT MENU (1: GenMed, 2: Cardio, 3: Ortho, 4: Derma, 5: Help Choose)
      // ----------------------------------------------------
      case 'DEPARTMENT_MENU': {
        if (digit in DEPT_MAP) {
          const dept = DEPT_MAP[digit];
          session.selectedDeptId = dept.id;
          session.selectedDeptCode = dept.code;
          session.selectedDeptNameEn = dept.nameEn;
          session.selectedDeptNameTa = dept.nameTa;
          session.state = 'CONFIRMATION';
          session.needsSpeechInput = false;

          const deptName = lang === 'ta' ? dept.nameTa : dept.nameEn;
          return this.respondWithPrompt(session, prompts.confirmDept(deptName));
        }

        if (digit === '5') {
          // Help me choose (Symptom Triage via Voice Input)
          session.state = 'SYMPTOM_INPUT';
          session.needsSpeechInput = true;
          return this.respondWithPrompt(session, prompts.symptomPrompt);
        }

        return this.respondWithPrompt(session, prompts.invalidChoice + ' ' + prompts.deptMenu);
      }

      // ----------------------------------------------------
      // STEP 4: CONFIRMATION (1: Confirm and Generate Token)
      // ----------------------------------------------------
      case 'CONFIRMATION': {
        if (digit === '1') {
          // Generate Token using EXISTING database and queue logic
          return this.generateToken(session);
        }

        // Any other digit cancels back to department menu
        session.state = 'DEPARTMENT_MENU';
        return this.respondWithPrompt(session, prompts.deptMenu);
      }

      // ----------------------------------------------------
      // POST-TOKEN STATES: If user presses keys after token generated
      // ----------------------------------------------------
      case 'TOKEN_GENERATED':
      case 'CHECK_STATUS':
      case 'REPEAT_TOKEN': {
        // Pressing * or 0 returns to main menu
        if (digit === '*' || digit === '0') {
          session.state = 'MAIN_MENU';
          return this.respondWithPrompt(session, prompts.mainMenu);
        }
        // Repeat current token info
        const repeatInfo = this.getRepeatTokenInfo(session.callerPhone, session.language);
        return this.respondWithPrompt(session, repeatInfo.message, repeatInfo.journeyId, repeatInfo.token, repeatInfo.peopleAhead, repeatInfo.waitMinutes);
      }

      default:
        return this.respondWithPrompt(session, prompts.mainMenu);
    }
  }

  /**
   * 3. Handle Voice Symptom Input for "Help Me Choose"
   */
  public handleSymptomSpeech(sessionId: string, transcript: string): IVRActionResponse {
    const session = ivrSessionManager.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        session: {} as any,
        spokenText: 'Call session not found',
        language: 'en',
        state: 'CALL_ENDED',
        error: 'Session expired or not found',
      };
    }

    const lang = session.language;
    const prompts = getPrompt(lang);

    session.recognizedSymptom = transcript.trim();
    session.needsSpeechInput = false;

    // Run EXISTING symptom triage logic
    const matchedDept = this.triageSymptom(transcript);

    session.selectedDeptId = matchedDept.id;
    session.selectedDeptCode = matchedDept.code;
    session.selectedDeptNameEn = matchedDept.nameEn;
    session.selectedDeptNameTa = matchedDept.nameTa;
    session.state = 'CONFIRMATION';

    const deptName = lang === 'ta' ? matchedDept.nameTa : matchedDept.nameEn;
    const resultPrompt = prompts.symptomResult(deptName);

    return this.respondWithPrompt(session, resultPrompt);
  }

  /**
   * 4. Generate Real Token using EXISTING GH-QueueFlow DB & WebSocket logic
   */
  private generateToken(session: IVRSession): IVRActionResponse {
    const patient = this.ensurePatientRecord(session.callerPhone);
    const deptId = session.selectedDeptId || 'dept-genmed';
    const dept = db.getDepartmentById(deptId) || db.getDepartments()[0];

    // Reuse EXISTING createVisit mechanism
    const result = db.createVisit({
      patientId: patient.id,
      departmentId: dept.id,
      symptoms: session.recognizedSymptom ? `IVR Helpline: ${session.recognizedSymptom}` : 'IVR Telephone Token',
      priority: 'normal', // Strict requirement: NO priority selection in IVR
    });

    // Broadcast Realtime Events so DOCTOR DASHBOARD updates AUTOMATICALLY
    broadcastEvent('TOKEN_CREATED', {
      journeyId: result.journey.id,
      tokenNumber: result.tokenNumber,
      patientName: patient.name,
      departmentId: result.department.id,
      departmentName: result.department.name,
      peopleAhead: result.metrics.peopleAhead,
      channel: 'IVR_PHONE',
    });

    broadcastEvent('QUEUE_UPDATED', {
      departmentId: result.department.id,
      channel: 'IVR_PHONE',
    });

    // Send in-app / SMS notification
    notificationService.sendNotification({
      targetRole: 'patient',
      targetJourneyId: result.journey.id,
      title: 'IVR Token Issued',
      titleTa: 'IVR தொலைபேசி டோக்கன் வழங்கப்பட்டது',
      message: `Token ${result.tokenNumber} generated via IVR phone helpline. ${result.metrics.peopleAhead} patients ahead.`,
      messageTa: `தொலைபேசி வழியாக டோக்கன் ${result.tokenNumber} உருவாக்கப்பட்டது. உங்களுக்கு முன் ${result.metrics.peopleAhead} நோயாளிகள் உள்ளனர்.`,
      type: 'info',
      phone: patient.phone,
      token: result.tokenNumber,
    }).catch((err) => console.warn('Notification send error:', err));

    // Update Session
    session.state = 'TOKEN_GENERATED';
    session.activeJourneyId = result.journey.id;
    session.generatedToken = result.tokenNumber;
    session.peopleAhead = result.metrics.peopleAhead;
    session.estimatedWaitMinutes = result.metrics.estimatedWaitMinutes;
    session.doctorName = result.doctor?.fullName || 'Assigned Specialist';

    const lang = session.language;
    const prompts = getPrompt(lang);
    const spokenDoctor = formatDoctorNameForVoice(result.doctor?.fullName, lang);
    const spokenText = prompts.tokenGenerated(
      result.tokenNumber,
      result.metrics.peopleAhead,
      result.metrics.estimatedWaitMinutes,
      spokenDoctor
    );

    return this.respondWithPrompt(
      session,
      spokenText,
      result.journey.id,
      result.tokenNumber,
      result.metrics.peopleAhead,
      result.metrics.estimatedWaitMinutes
    );
  }

  /**
   * 5. End Call
   */
  public endCall(sessionId: string): IVRActionResponse {
    const session = ivrSessionManager.endSession(sessionId);
    const lang = session ? session.language : 'en';
    const prompts = getPrompt(lang);

    return {
      success: true,
      session: session || ({} as any),
      spokenText: prompts.callEnded,
      language: lang,
      state: 'CALL_ENDED',
    };
  }

  /**
   * 6. Check Active or Completed Token Status for Caller
   */
  public getActiveTokenInfo(callerPhone: string, lang: IVRLanguage) {
    const patient = db.getPatientByPhone(callerPhone);
    const prompts = getPrompt(lang);

    if (!patient) {
      return { hasToken: false, message: prompts.noActiveToken };
    }

    // Check active journey first; if none, check latest journey for patient
    const activeJourney = db.getActiveJourneyForPatient(patient.id);
    const allPatientJourneys = db.getJourneys().filter((j) => j.patientId === patient.id);
    const latestJourney = activeJourney || allPatientJourneys[0];

    if (!latestJourney) {
      return { hasToken: false, message: prompts.noActiveToken };
    }

    // CASE 1: Journey / Consultation is completed by Doctor or Pharmacy
    if (latestJourney.status === 'completed' || latestJourney.currentStage === 'completed') {
      const consultation = db.getConsultationByJourney(latestJourney.id);
      const diagnosis = consultation?.diagnosis || 'Medical consultation completed';
      const doctorName = consultation?.doctorName || 'Attending Doctor';
      const message = prompts.consultationCompleted(latestJourney.currentToken, diagnosis);

      return {
        hasToken: true,
        isCompleted: true,
        currentStage: 'completed' as const,
        stageTitle: 'Consultation Completed',
        journeyId: latestJourney.id,
        token: latestJourney.currentToken,
        diagnosis,
        doctorName,
        peopleAhead: 0,
        waitMinutes: 0,
        message,
      };
    }

    // CASE 2: Active Journey - check real-time queue metrics and stage
    const metrics = db.getQueueMetricsForPatient(latestJourney.id);

    // Sub-case: Routed to Pharmacy
    if (latestJourney.currentStage === 'pharmacy') {
      const message = prompts.routedToPharmacy(
        latestJourney.currentToken,
        metrics.peopleAhead,
        metrics.estimatedWaitMinutes
      );
      return {
        hasToken: true,
        isCompleted: false,
        currentStage: 'pharmacy' as const,
        stageTitle: 'Central Pharmacy',
        journeyId: latestJourney.id,
        token: latestJourney.currentToken,
        peopleAhead: metrics.peopleAhead,
        waitMinutes: metrics.estimatedWaitMinutes,
        message,
      };
    }

    // Sub-case: Routed to Diagnostics (Lab / Scan)
    if (latestJourney.currentStage === 'diagnostic') {
      const message = prompts.routedToDiagnostics(
        latestJourney.currentToken,
        metrics.peopleAhead,
        metrics.estimatedWaitMinutes
      );
      return {
        hasToken: true,
        isCompleted: false,
        currentStage: 'diagnostic' as const,
        stageTitle: 'Diagnostics / Scan & Lab',
        journeyId: latestJourney.id,
        token: latestJourney.currentToken,
        peopleAhead: metrics.peopleAhead,
        waitMinutes: metrics.estimatedWaitMinutes,
        message,
      };
    }

    // Sub-case: Doctor OPD - Called / In Consultation
    if (metrics.queueStatus === 'in_service' || metrics.queueStatus === 'called') {
      const spokenDoctor = formatDoctorNameForVoice(metrics.doctorName, lang);
      const message = lang === 'ta'
        ? `உங்கள் டோக்கன் ${latestJourney.currentToken}-க்கான முறை வந்துவிட்டது. ${spokenDoctor} ஆலோசனைக்கு அழைக்கப்பட்டுள்ளீர்கள்.`
        : `Your turn has arrived. You are currently called for consultation with ${spokenDoctor} for token ${latestJourney.currentToken}.`;
      return {
        hasToken: true,
        isCompleted: false,
        currentStage: 'doctor' as const,
        stageTitle: 'Doctor OPD Consultation',
        queueStatus: metrics.queueStatus,
        journeyId: latestJourney.id,
        token: latestJourney.currentToken,
        doctorName: metrics.doctorName,
        peopleAhead: 0,
        waitMinutes: 0,
        message,
      };
    }

    // Sub-case: Doctor OPD - Waiting in queue
    const spokenDoctor = formatDoctorNameForVoice(metrics.doctorName, lang);
    const message = prompts.tokenStatus(
      latestJourney.currentToken,
      metrics.peopleAhead,
      metrics.estimatedWaitMinutes,
      spokenDoctor
    );

    return {
      hasToken: true,
      isCompleted: false,
      currentStage: 'doctor' as const,
      stageTitle: 'Doctor OPD Consultation',
      journeyId: latestJourney.id,
      token: latestJourney.currentToken,
      doctorName: metrics.doctorName,
      peopleAhead: metrics.peopleAhead,
      waitMinutes: metrics.estimatedWaitMinutes,
      message,
    };
  }

  /**
   * 7. Repeat Token Info
   */
  public getRepeatTokenInfo(callerPhone: string, lang: IVRLanguage) {
    return this.getActiveTokenInfo(callerPhone, lang);
  }

  /**
   * Helper: Ensure patient record exists (Existing patient or phone-only record)
   */
  private ensurePatientRecord(phone: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    let patient = db.getPatientByPhone(cleanPhone);

    if (!patient) {
      patient = db.createPatient({
        phone: cleanPhone,
        name: `Patient (+91 ${cleanPhone})`,
        age: 0,
        gender: 'Not Specified',
        bloodGroup: 'Not Specified',
        allergies: [],
        chronicConditions: [],
      });
    }

    return patient;
  }

  /**
   * Helper: Existing symptom triage keyword classifier
   */
  public triageSymptom(text: string): DeptMeta {
    const lower = text.toLowerCase();

    // Cardiology: chest pain, heart, palpitation, breathlessness
    if (
      lower.includes('chest') ||
      lower.includes('heart') ||
      lower.includes('palpitation') ||
      lower.includes('breathless') ||
      lower.includes('cardio') ||
      lower.includes('நெஞ்சு') ||
      lower.includes('இதயம்') ||
      lower.includes('மார்பு')
    ) {
      return DEPT_MAP['2']; // Cardiology
    }

    // Orthopedics: bone, joint, knee, fracture, back pain
    if (
      lower.includes('bone') ||
      lower.includes('joint') ||
      lower.includes('fracture') ||
      lower.includes('knee') ||
      lower.includes('back') ||
      lower.includes('spine') ||
      lower.includes('ortho') ||
      lower.includes('எலும்பு') ||
      lower.includes('மூட்டு') ||
      lower.includes('முழங்கால்') ||
      lower.includes('வலி')
    ) {
      return DEPT_MAP['3']; // Orthopedics
    }

    // Dermatology: skin, rash, itch, allergy, acne, eczema
    if (
      lower.includes('skin') ||
      lower.includes('rash') ||
      lower.includes('itch') ||
      lower.includes('derma') ||
      lower.includes('allergy') ||
      lower.includes('acne') ||
      lower.includes('தோல்') ||
      lower.includes('அரிப்பு') ||
      lower.includes('தடிப்பு')
    ) {
      return DEPT_MAP['4']; // Dermatology
    }

    // Default: General Medicine (cough, cold, fever, headache, stomach)
    return DEPT_MAP['1'];
  }

  /**
   * Helper: Update session and format response
   */
  private respondWithPrompt(
    session: IVRSession,
    spokenText: string,
    journeyId?: string,
    token?: string,
    peopleAhead?: number,
    waitMinutes?: number
  ): IVRActionResponse {
    session.lastSpokenText = spokenText;
    if (journeyId) session.activeJourneyId = journeyId;
    if (token) session.generatedToken = token;
    if (peopleAhead !== undefined) session.peopleAhead = peopleAhead;
    if (waitMinutes !== undefined) session.estimatedWaitMinutes = waitMinutes;

    ivrSessionManager.updateSession(session.sessionId, session);

    return {
      success: true,
      session,
      spokenText,
      language: session.language,
      state: session.state,
    };
  }
}

export const ivrService = new IVRService();
