/**
 * CareNexus — Government Hospital Portal Header
 * Institutional, accessible, multi-role header
 * Brand: Connected Care. Healthier Tomorrow.
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Menu,
  ChevronDown,
  Accessibility,
  Phone,
  ClipboardList,
  Shield,
  Info,
} from 'lucide-react';
import { useQueueFlow } from '../../context/QueueFlowContext';
import { RealtimeIndicator } from './CareNexusDesignSystem';
import { realtimeClient } from '../../services/websocket';

// ================================================================
// ROLE CONFIGURATION MAP
// ================================================================

const ROLE_CONFIG = {
  patient: {
    label: 'Patient Portal',
    labelTa: 'நோயாளி போர்டல்',
    icon: <User className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/25',
    color: 'text-[#0066FF]',
  },
  doctor: {
    label: 'Doctor OPD',
    labelTa: 'மருத்துவர் OPD',
    icon: <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-[#00A272]/10 text-[#00A272] border border-[#00A272]/25',
    color: 'text-[#00A272]',
  },
  scan_lab: {
    label: 'Diagnostics',
    labelTa: 'ஆய்வகம்',
    icon: <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/25',
    color: 'text-[#7C3AED]',
  },
  pharmacy: {
    label: 'Pharmacy',
    labelTa: 'மருந்தகம்',
    icon: <Pill className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-[#DB2777]/10 text-[#DB2777] border border-[#DB2777]/25',
    color: 'text-[#DB2777]',
  },
  phc: {
    label: 'PHC Referral',
    labelTa: 'PHC பரிந்துரை',
    icon: <Building2 className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    color: 'text-indigo-600',
  },
  admin: {
    label: 'Admin Console',
    labelTa: 'நிர்வாக கேன்சோல்',
    icon: <Shield className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
    color: 'text-rose-600',
  },
  registration: {
    label: 'Registration',
    labelTa: 'பதிவு',
    icon: <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200',
    color: 'text-amber-600',
  },
  auth: {
    label: 'Portal Login',
    labelTa: 'உள்நுழைவு',
    icon: <User className="w-3.5 h-3.5" aria-hidden="true" />,
    badgeBg: 'bg-slate-100 text-slate-700 border border-slate-200',
    color: 'text-slate-600',
  },
} as const;

// ================================================================
// NOTIFICATION TYPE MAP
// ================================================================

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />;
    case 'warning':  return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />;
    case 'success':  return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />;
    default:         return <Info className="w-4 h-4 text-blue-500 shrink-0" aria-hidden="true" />;
  }
};

// ================================================================
// CARENEXUS OFFICIAL LOGO MARK — Clean emblem + custom font wordmark
// ================================================================

const CareNexusLogo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
    <img
      src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        if (!target.src.endsWith('/carenexus-emblem.png')) {
          target.src = '/carenexus-emblem.png';
        }
      }}
      alt="CareNexus Emblem"
      className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0"
    />
    <img
      src={`${import.meta.env.BASE_URL}carenexus-wordmark.png`}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        if (!target.src.endsWith('/carenexus-wordmark.png')) {
          target.src = '/carenexus-wordmark.png';
        }
      }}
      alt="CareNexus"
      className="h-6 sm:h-7 w-auto object-contain shrink-0"
    />
  </div>
);

// ================================================================
// MAIN HEADER COMPONENT
// ================================================================

export const Header: React.FC = () => {
  const {
    role,
    lang,
    setLang,
    notifications,
    dismissNotification,
    activePatient,
    currentUser,
    logout,
    isEmergencyMode,
  } = useQueueFlow();

  const [notifOpen, setNotifOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Track WebSocket connection
  useEffect(() => {
    const unsub = realtimeClient.onStatusChange(setWsConnected);
    return unsub;
  }, []);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Don't render header on auth screen
  if (role === 'auth') return null;

  // Role-aware notification filter (same logic as original)
  const filteredNotifs = notifications.filter((n) => {
    if (n.targetRole === 'all') return true;
    if (role === 'patient') {
      return n.targetRole === 'patient';
    }
    return n.targetRole === role;
  });

  const unreadCount = filteredNotifs.filter((n) => !n.read).length;
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.auth;

  // Subtitle — role specific (English for staff, bilingual for patient)
  const getRoleSubtitle = () => {
    switch (role as string) {
      case 'patient':      return lang === 'ta' ? 'அரசு தலைமை பொது மருத்துவமனை' : 'District Headquarters Government Hospital';
      case 'doctor':       return currentUser?.fullName || 'Doctor OPD';
      case 'scan_lab':     return 'Clinical Pathology & Radiology';
      case 'pharmacy':     return 'Medicine Dispensing Unit';
      case 'phc':          return 'PHC Referral Centre';
      case 'admin':        return 'Hospital Operations Command Centre';
      case 'registration': return 'Patient Registration Desk';
      default:             return 'Government Hospital Patient Flow System';
    }
  };

  return (
    <>
      {/* Emergency Banner — shown when admin activates emergency mode */}
      {isEmergencyMode && (
        <div
          className="bg-red-600 text-white px-4 py-2 border-b border-red-700 shadow-md"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-bold">
            <AlertTriangle className="w-4 h-4 text-red-200" aria-hidden="true" />
            <span>⚠ EMERGENCY MODE ACTIVE — All Departments on High Alert · Emergency: 104</span>
            <AlertTriangle className="w-4 h-4 text-red-200" aria-hidden="true" />
          </div>
        </div>
      )}

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs" role="banner">
        {/* ── Utility Strip (slim top bar) ── */}
        <div className="bg-slate-50/90 border-b border-slate-100/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-8">
            {/* Left: Live status */}
            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
              <RealtimeIndicator connected={wsConnected} />
            </div>

            {/* Right: Emergency hotline */}
            <div className="flex items-center gap-3">
              <a
                href="tel:1800-425-4444"
                className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-900 transition-colors"
                aria-label="Emergency Hotline 1800-425-4444"
              >
                <Phone className="w-3 h-3 text-[#00A272]" aria-hidden="true" />
                <span className="font-mono text-slate-700 font-bold">1800-425-4444</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Main Header Bar ── */}
        <div className="h-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">

            {/* Left: Logo + Brand + Role Identity */}
            <div className="flex items-center gap-3 select-none min-w-0">
              <CareNexusLogo size={42} />

              <div className="h-7 w-[1.5px] bg-slate-200 hidden sm:block mx-1" />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Role badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${roleConfig.badgeBg}`}
                    aria-label={`Current role: ${lang === 'ta' && role === 'patient' ? roleConfig.labelTa : roleConfig.label}`}
                  >
                    {roleConfig.icon}
                    <span>{lang === 'ta' && role === 'patient' ? roleConfig.labelTa : roleConfig.label}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 hidden sm:block truncate max-w-md">
                  {getRoleSubtitle()}
                </p>
              </div>
            </div>

            {/* Center: Nav links (desktop only, staff portals) */}
            {role !== 'patient' && (
              <nav className="hidden lg:flex items-center gap-1" aria-label="Portal navigation">
                {/* Add role-specific nav items here if needed */}
              </nav>
            )}

            {/* Right: Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher — Only for Patient screens and Login */}
              {role === 'patient' && (
                <button
                  onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-full font-bold text-xs border border-slate-200 transition-all shadow-2xs cursor-pointer"
                  aria-label={lang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}
                >
                  <Globe className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                  <span className="leading-none">{lang === 'ta' ? 'English' : 'தமிழ் (Tamil)'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              )}

              {/* Notifications */}
              {role !== 'doctor' && (
                <div className="relative" ref={notifRef}>
                  <button
                    id="notifications-btn"
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={notifOpen}
                    aria-haspopup="true"
                  >
                    <Bell className="w-4 h-4" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white"
                        aria-label={`${unreadCount} unread notifications`}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifOpen && (
                    <div
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800 animate-fade-in-up"
                      role="dialog"
                      aria-label="Notifications panel"
                    >
                      {/* Panel header */}
                      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600">
                          System Notifications
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{filteredNotifs.length} total</span>
                          <button
                            onClick={() => setNotifOpen(false)}
                            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            aria-label="Close notifications"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Notification items */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100" role="list">
                        {filteredNotifs.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            <Bell className="w-6 h-6 mx-auto mb-2 opacity-30 text-slate-400" />
                            No notifications
                          </div>
                        ) : (
                          filteredNotifs.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 ${!n.read ? 'bg-sky-50/50' : ''}`}
                              role="listitem"
                            >
                              <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="font-semibold text-[12px] text-slate-800 truncate">
                                  {lang === 'ta' ? n.titleTa : n.title}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                  {lang === 'ta' ? n.messageTa : n.message}
                                </p>
                                <div className="text-[10px] text-slate-400 mt-1">{n.timestamp}</div>
                              </div>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                                aria-label={`Dismiss notification: ${n.title}`}
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

              {/* Logout button */}
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title={lang === 'ta' ? 'வெளியேறு' : 'Logout'}
                aria-label="Logout from portal"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer transition-all shadow-2xs"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pb-4 pt-2 shadow-lg animate-fade-in-up">
            <div className="space-y-1">
              {/* Role indicator */}
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                <div className={`flex items-center gap-1.5 text-xs font-bold text-slate-800`}>
                  {roleConfig.icon}
                  <span>{lang === 'ta' ? roleConfig.labelTa : roleConfig.label}</span>
                </div>
                <div className="ml-auto text-[11px] text-slate-500 font-medium">{getRoleSubtitle()}</div>
              </div>
              {/* Language toggle — Patient Only */}
              {role === 'patient' && (
                <button
                  onClick={() => { setLang(lang === 'ta' ? 'en' : 'ta'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[#0066FF]" />
                  <span>{lang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}</span>
                </button>
              )}
              {/* Emergency hotline */}
              <a
                href="tel:1800-425-4444"
                className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-[#00A272] hover:bg-emerald-50 text-sm font-medium transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Helpline: 1800-425-4444</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
