export type IVRLanguage = 'en' | 'ta';

export type IVRCallState =
  | 'IDLE'
  | 'CALLING'
  | 'CONNECTED'
  | 'LANGUAGE_MENU'
  | 'MAIN_MENU'
  | 'DEPARTMENT_MENU'
  | 'SYMPTOM_INPUT'
  | 'CONFIRMATION'
  | 'TOKEN_GENERATED'
  | 'CHECK_STATUS'
  | 'REPEAT_TOKEN'
  | 'CALL_ENDED';

export interface IVRSession {
  sessionId: string;
  callerPhone: string;
  callerName?: string;
  language: IVRLanguage;
  state: IVRCallState;
  startTime?: number;
  endTime?: number;
  selectedDeptId?: string;
  selectedDeptCode?: string;
  selectedDeptNameEn?: string;
  selectedDeptNameTa?: string;
  recognizedSymptom?: string;
  activeJourneyId?: string;
  generatedToken?: string;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
  lastPromptTextEn: string;
  lastPromptTextTa: string;
  lastSpokenText: string;
  needsSpeechInput?: boolean;

  // Live Stage & Doctor Completion metadata
  currentStage?: 'doctor' | 'diagnostic' | 'pharmacy' | 'completed';
  stageTitle?: string;
  doctorName?: string;
  diagnosis?: string;
  isCompleted?: boolean;
  queueStatus?: string;
  notRegistered?: boolean;
}

export interface IVRActionResponse {
  success: boolean;
  session: IVRSession;
  spokenText: string;
  language: IVRLanguage;
  state: IVRCallState;
  notRegistered?: boolean;
  error?: string;
}
