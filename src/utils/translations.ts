import { Language } from '../types';

export const translations = {
  // Brand & Global
  appName: {
    en: 'GH QueueFlow',
    ta: 'ஜிஎச் க்யூஃப்ளோ (GH QueueFlow)',
  },
  appSub: {
    en: 'Government Hospital Patient Flow & Queue Management System',
    ta: 'அரசு மருத்துவமனை நோயாளி வழித்தடம் மற்றும் வரிசை மேலாண்மை அமைப்பு',
  },
  hospitalName: {
    en: 'District Government Headquarter Hospital',
    ta: 'மாவட்ட அரசு தலைமை பொது மருத்துவமனை',
  },
  deptOfHealth: {
    en: 'Department of Health & Family Welfare Digital Infrastructure',
    ta: 'மக்கள் நல்வாழ்வு மற்றும் குடும்ப நலத்துறை டிஜிட்டல் தளம்',
  },

  // Roles
  roles: {
    patient: { en: 'Patient Portal', ta: 'நோயாளி போர்டல்' },
    doctor: { en: 'Doctor Portal (OPD)', ta: 'மருத்துவர் போர்டல் (OPD)' },
    lab: { en: 'Laboratory Staff', ta: 'ஆய்வக பணியாளர் (Lab)' },
    diagnostic: { en: 'Diagnostic & Scan', ta: 'ஸ்கேன் & பரிசோதனை' },
    pharmacy: { en: 'Pharmacy Dispensing', ta: 'மருந்தகம் (Pharmacy)' },
    reception: { en: 'Reception & Assistance', ta: 'வரவேற்பு & உதவி மையம்' },
    admin: { en: 'Hospital Admin Command', ta: 'மருத்துவமனை தலைமை நிர்வாகம்' },
    kiosk: { en: 'Touchscreen Kiosk', ta: 'தொடுதிரை கியோஸ்க்' },
    display: { en: 'Public Queue Display', ta: 'பொது காத்திருப்பு திரை' },
    phc: { en: 'PHC Referral Center', ta: 'ஆரம்ப சுகாதார நிலையம்' },
  },

  // Patient Dashboard Actions & Labels
  patient: {
    goodMorning: { en: 'Good morning', ta: 'வணக்கம்' },
    patientId: { en: 'Patient ID', ta: 'நோயாளி எண்' },
    currentQueue: { en: 'YOUR CURRENT QUEUE', ta: 'உங்கள் தற்போதைய வரிசை' },
    nowServing: { en: 'Currently Serving', ta: 'தற்போது பரிசோதிக்கப்படுவது' },
    yourPosition: { en: 'Your Position', ta: 'உங்கள் வரிசை எண்' },
    estimatedWait: { en: 'Estimated Waiting', ta: 'உத்தேச காத்திருப்பு' },
    viewLiveQueue: { en: 'View Live Queue', ta: 'நேரடி வரிசையை பார்க்க' },
    todaysVisit: { en: "Today's Visit", ta: 'இன்றைய மருத்துவமனை வருகை' },
    doctor: { en: 'Doctor', ta: 'மருத்துவர்' },
    department: { en: 'Department', ta: 'பிரிவு' },
    status: { en: 'Status', ta: 'நிலை' },
    nextAction: { en: 'Next Action', ta: 'அடுத்த செயல்முறை' },
    getDirections: { en: 'Get Directions', ta: 'வழித்தடம் பார்க்க' },
    queueMovingNormally: { en: 'Queue is moving normally', ta: 'வரிசை இயல்பாக நகர்கிறது' },
    highVolume: { en: 'High patient volume — expected delay', ta: 'அதிக கூட்டம் — சிறிது தாமதமாகலாம்' },
    patientsAhead: { en: 'patients ahead', ta: 'நோயாளிகள் முன்னால் உள்ளனர்' },
    needHelp: { en: 'Need help registering?', ta: 'பதிவு செய்ய உதவி தேவையா?' },
    callAssistance: { en: 'Call Hospital Assistance', ta: 'மருத்துவமனை உதவிக்கு அழைக்க' },
    assistedReg: { en: 'Assisted Registration', ta: 'நேரடி உதவி பதிவு' },
  },

  // Status Labels
  statusLabels: {
    normal: { en: 'Waiting in Queue', ta: 'வரிசையில் காத்திருக்கிறார்' },
    busy: { en: 'High Queue Rush', ta: 'அதிக கூட்டம்' },
    approaching: { en: 'Your Turn Approaching', ta: 'உங்கள் முறை விரைவில் வருகிறது' },
    your_turn: { en: 'It Is Your Turn Now', ta: 'இப்போது உங்கள் முறை! உள்ளே செல்லவும்' },
    in_consultation: { en: 'Consultation In Progress', ta: 'மருத்துவர் ஆலோசனையில் உள்ளார்' },
    lab_pending: { en: 'Lab Sample Pending', ta: 'ஆய்வக மாதிரி நிலுவையில் உள்ளது' },
    lab_ready: { en: 'Lab Results Ready', ta: 'ஆய்வக முடிவுகள் தயார்' },
    scan_pending: { en: 'Diagnostic Scan Pending', ta: 'ஸ்கேன் பரிசோதனை நிலுவையில் உள்ளது' },
    doctor_review: { en: 'Doctor Review Pending', ta: 'மருத்துவர் மதிப்பாய்வு நிலுவையில்' },
    pharmacy_ready: { en: 'Prescription Ready for Collection', ta: 'மருந்துகள் தயாராக உள்ளன' },
    payment_pending: { en: 'Payment Pending', ta: 'கட்டணம் செலுத்த நிலுவை' },
    completed: { en: 'Hospital Visit Completed', ta: 'வருகை வெற்றிகரமாக முடிந்தது' },
  },

  // Navigation Colors
  colors: {
    blue: { en: 'BLUE PATH', ta: 'நீல வழித்தடம்' },
    green: { en: 'GREEN PATH', ta: 'பச்சை வழித்தடம்' },
    orange: { en: 'ORANGE PATH', ta: 'ஆரஞ்சு வழித்தடம்' },
    purple: { en: 'PURPLE PATH', ta: 'ஊதா வழித்தடம்' },
    red: { en: 'RED PATH (EMERGENCY)', ta: 'சிவப்பு வழித்தடம் (அவசரம்)' },
    yellow: { en: 'YELLOW PATH', ta: 'மஞ்சள் வழித்தடம்' },
  },

  // Spoken voice lines
  voicePrompts: {
    welcome: {
      en: 'Welcome to Government Hospital QueueFlow. Your token is {token}.',
      ta: 'வணக்கம். அரசு மருத்துவமனைக்கு நல்வரவு. உங்கள் டோக்கன் எண் {token}.',
    },
    goToRoom: {
      en: 'Please proceed to {dept}, Room {room}. Follow the {color} arrows.',
      ta: '{dept} அறை எண் {room}க்கு செல்லவும். {color} அம்புக்குறிகளை பின்தொடரவும்.',
    },
    waitingCount: {
      en: 'There are {count} patients ahead of you. Estimated wait is {minutes} minutes.',
      ta: 'உங்களுக்கு முன்னால் {count} நோயாளிகள் உள்ளனர். உத்தேச காத்திருப்பு {minutes} நிமிடங்கள்.',
    },
    approaching: {
      en: 'Attention please. Your turn is approaching. Please wait near Room {room}.',
      ta: 'கவனிக்கவும். உங்கள் முறை விரைவில் வருகிறது. அறை {room} அருகில் காத்திருக்கவும்.',
    },
    yourTurn: {
      en: 'It is your turn now. Please enter Room {room} for consultation.',
      ta: 'இப்போது உங்கள் முறை. தயவுசெய்து அறை {room} உள்ளே செல்லவும்.',
    },
    journeyComplete: {
      en: 'Your hospital journey is complete. Wish you good health.',
      ta: 'உங்கள் மருத்துவமனை பயணம் நிறைவடைந்தது. நலம் பெற வாழ்த்துகிறோம்.',
    },
  },
};

export const getT = (lang: Language) => {
  return (keyPath: string, vars: Record<string, string | number> = {}): string => {
    const keys = keyPath.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        return keyPath;
      }
    }
    let text = typeof current === 'object' && current[lang] ? current[lang] : (current?.en || keyPath);
    for (const [vKey, vVal] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${vKey}\\}`, 'g'), String(vVal));
    }
    return text;
  };
};
