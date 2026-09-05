import React from 'react';
import { X, Type, Eye, Volume2, Gauge, Check } from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const { accessibility, updateAccessibility, lang } = useQueueFlow();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {lang === 'ta' ? 'அணுகல்தன்மை அமைப்புகள்' : 'Accessibility Settings'}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === 'ta' ? 'எழுத்து அளவு, குரல் மற்றும் காட்சியை மாற்றியமைக்கவும்' : 'Adjust text size, voice and contrast for easier reading'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Text Size */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-600" />
              {lang === 'ta' ? 'எழுத்து அளவு (Text Size)' : 'Text Size Scaling'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'extra-large'] as const).map((size) => {
                const isActive = accessibility.fontSize === size;
                const labels = {
                  normal: { en: 'Standard', ta: 'வழக்கமான' },
                  large: { en: 'Large (+25%)', ta: 'பெரியது' },
                  'extra-large': { en: 'Extra Large (+50%)', ta: 'மிகப் பெரியது' },
                };
                return (
                  <button
                    key={size}
                    onClick={() => updateAccessibility({ fontSize: size })}
                    className={`py-2.5 px-3 rounded-xl border text-center font-bold text-sm transition-all ${
                      isActive
                        ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-md ring-2 ring-teal-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ta' ? labels[size].ta : labels[size].en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-sm text-slate-800">
                {lang === 'ta' ? 'உயர் மாறுபட்ட காட்சி (High Contrast)' : 'High Contrast Mode'}
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'ta' ? 'கருப்பு மற்றும் மஞ்சள் பின்னணியில் தெளிவான பார்வை' : 'Deep black & high-contrast yellow outline for visual aid'}
              </p>
            </div>
            <button
              onClick={() => updateAccessibility({ highContrast: !accessibility.highContrast })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                accessibility.highContrast ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  accessibility.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Voice Guidance Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-teal-600" />
                {lang === 'ta' ? 'குரல் வழி காட்டுதல் (Voice Speech)' : 'Voice Audio Guidance'}
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'ta' ? 'தானாக குரல் வழி வழிகாட்டுதல் படிக்கப்படும்' : 'Audio guidance for queue turns and room directions'}
              </p>
            </div>
            <button
              onClick={() => updateAccessibility({ voiceEnabled: !accessibility.voiceEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                accessibility.voiceEnabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  accessibility.voiceEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Speech Rate */}
          {accessibility.voiceEnabled && (
            <div className="space-y-2 p-3.5 rounded-xl bg-teal-50/50 border border-teal-100">
              <label className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-teal-600" />
                {lang === 'ta' ? 'பேச்சு வேகம் (Speech Speed)' : 'Voice Speed Control'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0.75, label: lang === 'ta' ? 'மெதுவாக' : '0.75x Slow' },
                  { rate: 0.95, label: lang === 'ta' ? 'இயல்பு' : '1.0x Normal' },
                  { rate: 1.25, label: lang === 'ta' ? 'வேகமாக' : '1.25x Fast' },
                ].map((item) => (
                  <button
                    key={item.rate}
                    onClick={() => updateAccessibility({ speechRate: item.rate })}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      accessibility.speechRate === item.rate
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {lang === 'ta' ? 'அமைப்புகளை சேமிக்க' : 'Apply Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
