import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Bell,
  LogOut,
  User,
  Stethoscope,
  FlaskConical,
  Pill,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    lang,
    setLang,
    notifications,
    dismissNotification,
    activePatient,
    logout,
  } = useQueueFlow();

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  if (role === 'auth') return null;

  const unreadNotifs = notifications.filter((n) => !n.read);

  // Role info display (no room/location in doctor header)
  const getRoleHeaderInfo = () => {
    switch (role) {
      case 'patient':
        return {
          title: lang === 'ta' ? 'நோயாளி போர்டல்' : 'Patient Portal',
          subtitle: activePatient ? `${activePatient.name} • Token: ${activePatient.token}` : 'Active Patient Session',
          icon: <User className="w-4 h-4 text-blue-300" />,
          badgeColor: 'bg-blue-600',
        };
      case 'doctor':
        return {
          title: lang === 'ta' ? 'மருத்துவர் OPD' : 'Doctor OPD',
          subtitle: lang === 'ta' ? 'மருத்துவர் பிரியா குமார் (MD) • பொது மருத்துவம்' : 'Dr. Priya Kumar (MD) • General Medicine',
          icon: <Stethoscope className="w-4 h-4 text-teal-300" />,
          badgeColor: 'bg-teal-600',
        };
      case 'scan_lab':
        return {
          title: lang === 'ta' ? 'ஸ்கேன் & ஆய்வக பணிப்பிரிவு' : 'Diagnostic Lab & Scan Workstation',
          subtitle: 'Pathology, Biochemistry & Radiology',
          icon: <FlaskConical className="w-4 h-4 text-emerald-300" />,
          badgeColor: 'bg-emerald-600',
        };
      case 'pharmacy':
        return {
          title: lang === 'ta' ? 'மைய மருந்தகம்' : 'Central Pharmacy',
          subtitle: 'TNMSC Generic Dispensing Counter 03',
          icon: <Pill className="w-4 h-4 text-purple-300" />,
          badgeColor: 'bg-purple-600',
        };
      default:
        return {
          title: 'GH QueueFlow',
          subtitle: 'Government Hospital Patient Flow System',
          icon: <Building2 className="w-4 h-4 text-white" />,
          badgeColor: 'bg-slate-700',
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <header className="bg-[#0b2545] text-white border-b border-slate-700 shadow-md sticky top-0 z-40">
      {/* Top Institutional Bar */}
      <div className="bg-[#06182e] px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium tracking-wide">
            {lang === 'ta'
              ? 'அரசு தலைமை பொது மருத்துவமனை • தமிழ்நாடு அரசு'
              : 'District Headquarter Government Hospital • Ministry of Health & Family Welfare'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-medium text-xs transition-colors border border-slate-700"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'English' : 'தமிழ் (Tamil)'}</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand & Role Identity */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-teal-700 flex items-center justify-center border border-blue-400/40 shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-serif">
                GH QueueFlow
              </span>
              <span className={`text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded flex items-center gap-1 ${roleInfo.badgeColor}`}>
                {roleInfo.icon}
                <span>{role.toUpperCase()}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              {roleInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown (Hidden for doctor to prioritize direct clinical workflow statuses) */}
          {role !== 'doctor' && (
            <div className="relative">
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md text-xs font-medium text-slate-200 flex items-center gap-1 relative"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-slate-400">
                    <span className="font-bold text-[11px] uppercase tracking-wider">Live System Alerts</span>
                    <span>{notifications.length} Total</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No active notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-800/60 transition-colors flex gap-2">
                          <div className="mt-0.5">
                            {n.type === 'critical' ? (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            ) : n.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-100">{lang === 'ta' ? n.titleTa : n.title}</div>
                            <p className="text-slate-300 text-[11px] mt-0.5">{lang === 'ta' ? n.messageTa : n.message}</p>
                            <div className="text-[10px] text-slate-400 mt-1">{n.timestamp}</div>
                          </div>
                          <button
                            onClick={() => dismissNotification(n.id)}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Secure Logout Button */}
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/80 border border-slate-600 hover:border-red-500 rounded-md text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all shadow-xs"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
