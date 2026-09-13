import { IVRLanguage } from './ivr.types';

export interface PromptSet {
  welcome: string;
  languageSelect: string;
  mainMenu: string;
  deptMenu: string;
  symptomPrompt: string;
  symptomResult: (deptName: string) => string;
  confirmDept: (deptName: string) => string;
  tokenGenerated: (token: string, peopleAhead: number, waitMinutes: number) => string;
  tokenStatus: (token: string, peopleAhead: number, waitMinutes: number) => string;
  consultationCompleted: (token: string, diagnosis?: string) => string;
  routedToPharmacy: (token: string, peopleAhead: number, waitMinutes: number) => string;
  routedToDiagnostics: (token: string, peopleAhead: number, waitMinutes: number) => string;
  calledForConsultation: (token: string) => string;
  noActiveToken: string;
  repeatToken: (token: string, peopleAhead: number) => string;
  invalidChoice: string;
  callEnded: string;
}

export const PROMPTS_EN: PromptSet = {
  welcome: 'Welcome to GH-QueueFlow.',
  languageSelect: 'Welcome to GH-QueueFlow. For English, press 1. For Tamil, press 2.',
  mainMenu: 'For a new token, press 1. To check your token status, press 2. To repeat your token, press 3.',
  deptMenu: 'For General Medicine, press 1. For Cardiology, press 2. For Orthopedics, press 3. For Dermatology, press 4. To help me choose a department, press 5.',
  symptomPrompt: 'Please briefly tell us your health problem after the tone.',
  symptomResult: (deptName: string) => `Based on your symptoms, ${deptName} is recommended. Press 1 to confirm.`,
  confirmDept: (deptName: string) => `You selected ${deptName}. Press 1 to confirm.`,
  tokenGenerated: (token: string, peopleAhead: number, waitMinutes: number) =>
    `Your token number is ${token}. There are ${peopleAhead} patients ahead of you. Your estimated waiting time is ${waitMinutes} minutes.`,
  tokenStatus: (token: string, peopleAhead: number, waitMinutes: number) =>
    `Your token number is ${token}. There are ${peopleAhead} patients ahead of you. Your estimated waiting time is ${waitMinutes} minutes.`,
  consultationCompleted: (token: string, diagnosis?: string) =>
    diagnosis
      ? `Your doctor consultation for token ${token} is completed. Diagnosis: ${diagnosis}. Your hospital visit has been concluded successfully.`
      : `Your doctor consultation for token ${token} is completed. Your hospital visit has been concluded successfully.`,
  routedToPharmacy: (token: string, peopleAhead: number, waitMinutes: number) =>
    `Your doctor consultation is completed. Your prescription is ready at Central Pharmacy. Your token number is ${token}. There are ${peopleAhead} patients ahead of you. Estimated wait is ${waitMinutes} minutes.`,
  routedToDiagnostics: (token: string, peopleAhead: number, waitMinutes: number) =>
    `Your doctor consultation is completed. You are routed for diagnostic investigations. Your token number is ${token}. There are ${peopleAhead} patients ahead of you. Estimated wait is ${waitMinutes} minutes.`,
  calledForConsultation: (token: string) =>
    `Your turn has arrived. You are currently called for consultation with the doctor for token ${token}.`,
  noActiveToken: 'You currently do not have an active or recent token.',
  repeatToken: (token: string, peopleAhead: number) =>
    `Your token number is ${token}. There are ${peopleAhead} patients ahead of you.`,
  invalidChoice: 'Invalid choice. Please try again.',
  callEnded: 'Thank you for calling GH-QueueFlow. Call ended.',
};

export const PROMPTS_TA: PromptSet = {
  welcome: 'GH-QueueFlow-விற்கு நல்வரவு.',
  languageSelect: 'GH-QueueFlow-விற்கு நல்வரவு. ஆங்கிலத்திற்கு 1-ஐ அழுத்தவும். தமிழுக்கு 2-ஐ அழுத்தவும்.',
  mainMenu: 'புதிய டோக்கன் பெற 1-ஐ அழுத்தவும். உங்கள் டோக்கன் நிலையை அறிய 2-ஐ அழுத்தவும். உங்கள் டோக்கனை மீண்டும் கேட்க 3-ஐ அழுத்தவும்.',
  deptMenu: 'பொது மருத்துவத்திற்கு 1-ஐ அழுத்தவும். இதயவியலுக்கு 2-ஐ அழுத்தவும். எலும்பியல் பிரிவுக்கு 3-ஐ அழுத்தவும். தோல் மருத்துவத்திற்கு 4-ஐ அழுத்தவும். பிரிவை தேர்வு செய்ய உதவி பெற 5-ஐ அழுத்தவும்.',
  symptomPrompt: 'தயவுசெய்து உங்கள் உடல்நலப் பிரச்சனையை சுருக்கமாகக் கூறுங்கள்.',
  symptomResult: (deptName: string) => `உங்கள் அறிகுறிகளின்படி, ${deptName} பரிந்துரைக்கப்படுகிறது. உறுதிப்படுத்த 1-ஐ அழுத்தவும்.`,
  confirmDept: (deptName: string) => `நீங்கள் ${deptName} தேர்ந்தெடுத்துள்ளீர்கள். உறுதிப்படுத்த 1-ஐ அழுத்தவும்.`,
  tokenGenerated: (token: string, peopleAhead: number, waitMinutes: number) =>
    `உங்கள் டோக்கன் எண் ${token}. உங்களுக்கு முன் ${peopleAhead} நோயாளிகள் உள்ளனர். உங்கள் காத்திருப்பு நேரம் தோராயமாக ${waitMinutes} நிமிடங்கள்.`,
  tokenStatus: (token: string, peopleAhead: number, waitMinutes: number) =>
    `உங்கள் டோக்கன் எண் ${token}. உங்களுக்கு முன் ${peopleAhead} நோயாளிகள் உள்ளனர். உங்கள் காத்திருப்பு நேரம் தோராயமாக ${waitMinutes} நிமிடங்கள்.`,
  consultationCompleted: (token: string, diagnosis?: string) =>
    diagnosis
      ? `உங்கள் டோக்கன் ${token}-க்கான மருத்துவர் ஆலோசனை முடிவடைந்தது. பரிசோதனை முடிவு: ${diagnosis}. உங்கள் வருகை நிறைவு பெற்றது.`
      : `உங்கள் டோக்கன் ${token}-க்கான மருத்துவர் ஆலோசனை முடிவடைந்தது. உங்கள் வருகை நிறைவு பெற்றது.`,
  routedToPharmacy: (token: string, peopleAhead: number, waitMinutes: number) =>
    `மருத்துவர் ஆலோசனை முடிவடைந்தது. உங்கள் மருந்துச் சீட்டு மத்திய மருந்தகத்திற்கு அனுப்பப்பட்டுள்ளது. உங்கள் டோக்கன் எண் ${token}. உங்களுக்கு முன் ${peopleAhead} நோயாளிகள் உள்ளனர். காத்திருப்பு நேரம் ${waitMinutes} நிமிடங்கள்.`,
  routedToDiagnostics: (token: string, peopleAhead: number, waitMinutes: number) =>
    `மருத்துவர் ஆலோசனை முடிவடைந்தது. நீங்கள் ஆய்வக பரிசோதனைக்கு அனுப்பப்பட்டுள்ளீர்கள். உங்கள் டோக்கன் எண் ${token}. உங்களுக்கு முன் ${peopleAhead} நோயாளிகள் உள்ளனர். காத்திருப்பு நேரம் ${waitMinutes} நிமிடங்கள்.`,
  calledForConsultation: (token: string) =>
    `உங்கள் டோக்கன் ${token}-க்கான முறை வந்துவிட்டது. மருத்துவர் ஆலோசனைக்கு அழைக்கப்பட்டுள்ளீர்கள்.`,
  noActiveToken: 'உங்களுக்கு தற்போது செயலில் உள்ள டோக்கன் ஏதும் இல்லை.',
  repeatToken: (token: string, peopleAhead: number) =>
    `உங்கள் டோக்கன் எண் ${token}. உங்களுக்கு முன் ${peopleAhead} நோயாளிகள் உள்ளனர்.`,
  invalidChoice: 'தவறான தேர்வு. மீண்டும் முயற்சிக்கவும்.',
  callEnded: 'GH-QueueFlow-வை அழைத்தமைக்கு நன்றி. அழைப்பு முடிந்தது.',
};

export function getPrompt(lang: IVRLanguage): PromptSet {
  return lang === 'ta' ? PROMPTS_TA : PROMPTS_EN;
}
