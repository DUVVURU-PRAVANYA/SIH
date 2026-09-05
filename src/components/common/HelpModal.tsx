import React from 'react';
import { X, MapPin, Volume2, Users, PhoneCall, AlertCircle, ShieldAlert } from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWayfinding: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onOpenWayfinding }) => {
  const { lang, speakPatientGuidance, addNotification, activePatient } = useQueueFlow();

  if (!isOpen) return null;

  const handleRepeatVoice = () => {
    speakPatientGuidance();
    onClose();
  };

  const handleHelpDesk = () => {
    addNotification({
      title: 'Help Desk / Volunteer Alerted',
      titleTa: 'உதவி மைய தன்னார்வலர் எச்சரிக்கப்பட்டார்',
      message: `Hospital Sahayogi volunteer dispatched to Block B Ground Floor to assist ${activePatient?.name || 'Patient'}.`,
      messageTa: `நோயாளிக்கு உதவ மருத்துவமனை தன்னார்வலர் அனுப்பப்பட்டார்.`,
      type: 'info',
      targetRole: 'patient',
    });
    alert(
      lang === 'ta'
        ? 'உதவி மைய தன்னார்வலர் உங்களை நோக்கி வருகிறார். பிளாக் A வரவேற்பு பகுதிக்கு செல்லவும்.'
        : 'A hospital Sahayogi assistant has been notified and is coming to assist you.'
    );
    onClose();
  };

  const handleCallAssistance = () => {
    alert(
      lang === 'ta'
        ? 'அரசு பொது மருத்துவமனை இலவச உதவி எண்: 104 / 108 அழைக்கப்படுகிறது...'
        : 'Connecting to Tamil Nadu 104 Health Helpline Assistance...'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border-4 border-red-500 overflow-hidden">
        {/* Urgent Header */}
        <div className="bg-red-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/20 text-white animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-black text-2xl tracking-tight">
                {lang === 'ta' ? 'உதவி தேவைப்படுகிறதா?' : 'WHAT DO YOU NEED?'}
              </h2>
              <p className="text-sm text-red-100 font-medium">
                {lang === 'ta' ? 'கீழே உள்ள பெரிய பட்டனை அழுத்தவும்' : 'Tap any big button below for instant assistance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 4 Huge Action Buttons */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Where should I go? */}
          <button
            onClick={() => {
              onClose();
              onOpenWayfinding();
            }}
            className="p-5 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 text-blue-900 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-lg transition-all transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <div className="font-black text-lg">
                {lang === 'ta' ? '📍 எங்கு செல்ல வேண்டும்?' : '📍 Where Should I Go?'}
              </div>
              <div className="text-xs text-blue-700 font-semibold mt-1">
                {lang === 'ta' ? 'அறை எண் மற்றும் வழித்தடம் காண்க' : 'Show room & color path arrows'}
              </div>
            </div>
          </button>

          {/* 2. Repeat Voice Instructions */}
          <button
            onClick={handleRepeatVoice}
            className="p-5 rounded-2xl bg-teal-50 hover:bg-teal-100 border-2 border-teal-500 text-teal-900 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-lg transition-all transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <Volume2 className="w-8 h-8" />
            </div>
            <div>
              <div className="font-black text-lg">
                {lang === 'ta' ? '🔊 வழிகாட்டுதல் கேட்க' : '🔊 Repeat Instructions'}
              </div>
              <div className="text-xs text-teal-700 font-semibold mt-1">
                {lang === 'ta' ? 'தமிழில் மீண்டும் பேசும்' : 'Audio guidance in Tamil / English'}
              </div>
            </div>
          </button>

          {/* 3. Find Help Desk / Volunteer */}
          <button
            onClick={handleHelpDesk}
            className="p-5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-500 text-amber-900 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-lg transition-all transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="font-black text-lg">
                {lang === 'ta' ? '👤 உதவி மையம் தேட' : '👤 Find Help Desk'}
              </div>
              <div className="text-xs text-amber-800 font-semibold mt-1">
                {lang === 'ta' ? 'தன்னார்வலர் உதவிக்கு அழைக்க' : 'Call hospital Sahayogi volunteer'}
              </div>
            </div>
          </button>

          {/* 4. Call Assistance (104 Helpline) */}
          <button
            onClick={handleCallAssistance}
            className="p-5 rounded-2xl bg-red-50 hover:bg-red-100 border-2 border-red-500 text-red-900 flex flex-col items-center text-center gap-3 shadow-md hover:shadow-lg transition-all transform active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <PhoneCall className="w-8 h-8" />
            </div>
            <div>
              <div className="font-black text-lg">
                {lang === 'ta' ? '☎ அவசர உதவி அழைப்பு' : '☎ Call 104 Assistance'}
              </div>
              <div className="text-xs text-red-700 font-semibold mt-1">
                {lang === 'ta' ? 'இலவச மருத்துவ உதவி எண்' : 'Toll-Free 24x7 Government Helpline'}
              </div>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <AlertCircle className="w-4 h-4 text-red-500" />
            {lang === 'ta' ? 'மருத்துவமனை உதவி மையம் பிளாக் A தரை தளத்தில் உள்ளது' : 'Main Helpdesk is located at Block A Entrance'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-900"
          >
            {lang === 'ta' ? 'மூடுக' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
