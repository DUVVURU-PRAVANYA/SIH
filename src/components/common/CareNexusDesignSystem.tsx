/**
 * CareNexus Design System
 * Reusable components for the Government Hospital Patient Flow Portal
 * Brand: Connected Care. Healthier Tomorrow.
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ChevronRight,
  Activity,
  Wifi,
} from 'lucide-react';

// ================================================================
// BRAND CONSTANTS
// ================================================================

export const BRAND = {
  name: 'CareNexus',
  tagline: '',
  fullName: 'CareNexus',
  subtitle: 'Government Hospital Patient Flow & Queue Management',
  govLabel: 'Dept. of Health & Family Welfare',
  hotline: '1800-425-4444',
} as const;

// ================================================================
// WAYFINDING COLOR SYSTEM
// Color must ALWAYS be paired with text label (never color alone)
// ================================================================

export type PathColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';

export const PATH_CONFIG: Record<PathColor, {
  label: string;
  labelTa: string;
  cssClass: string;
  dotColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}> = {
  yellow: {
    label: 'Registration',
    labelTa: 'பதிவு',
    cssClass: 'cn-path-yellow',
    dotColor: 'bg-amber-500',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
  },
  blue: {
    label: 'OPD / Consultation',
    labelTa: 'OPD / ஆலோசனை',
    cssClass: 'cn-path-blue',
    dotColor: 'bg-blue-600',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
  },
  orange: {
    label: 'Radiology / Imaging',
    labelTa: 'ஸ்கேன் / இமேஜிங்',
    cssClass: 'cn-path-orange',
    dotColor: 'bg-orange-500',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
  },
  green: {
    label: 'Laboratory',
    labelTa: 'ஆய்வகம்',
    cssClass: 'cn-path-green',
    dotColor: 'bg-green-600',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
  },
  purple: {
    label: 'Pharmacy',
    labelTa: 'மருந்தகம்',
    cssClass: 'cn-path-purple',
    dotColor: 'bg-violet-600',
    borderColor: 'border-violet-300',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-800',
  },
  red: {
    label: 'Emergency',
    labelTa: 'அவசர சிகிச்சை',
    cssClass: 'cn-path-red',
    dotColor: 'bg-red-600',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
  },
};

// ================================================================
// SECTION HEADER — Government portal style with orange accent bar
// ================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  className = '',
}) => (
  <div className={`cn-section-header ${className}`}>
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-[#1A2B42] tracking-tight">{title}</h2>
        {badge && (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#F2F5F9] text-[#5A6D84] border border-[#D5DDE8] rounded-full">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-[#647A96] mt-0.5 font-normal">{subtitle}</p>
      )}
    </div>
  </div>
);

// ================================================================
// STATUS BADGE — Accessible (icon + text, never color alone)
// ================================================================

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'live';

interface StatusBadgeProps {
  type: StatusType;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

const STATUS_CLASSES: Record<StatusType, string> = {
  success: 'cn-badge cn-badge-success',
  warning: 'cn-badge cn-badge-warning',
  danger:  'cn-badge cn-badge-danger',
  info:    'cn-badge cn-badge-info',
  neutral: 'cn-badge cn-badge-neutral',
  live:    'cn-badge cn-badge-live',
};

const STATUS_ICONS: Record<StatusType, React.ReactNode> = {
  success: <CheckCircle2 className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  danger:  <AlertTriangle className="w-3 h-3" />,
  info:    <Info className="w-3 h-3" />,
  neutral: <Clock className="w-3 h-3" />,
  live:    <span className="cn-live-dot" aria-hidden="true" />,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  label,
  icon,
  className = '',
}) => (
  <span className={`${STATUS_CLASSES[type]} ${className}`} role="status">
    {icon || STATUS_ICONS[type]}
    <span>{label}</span>
  </span>
);

// ================================================================
// PATH COLOR BADGE — Wayfinding indicator (color + text)
// ================================================================

interface PathBadgeProps {
  color: PathColor;
  lang?: 'en' | 'ta';
  showIcon?: boolean;
  className?: string;
}

export const PathBadge: React.FC<PathBadgeProps> = ({
  color,
  lang = 'en',
  showIcon = true,
  className = '',
}) => {
  const cfg = PATH_CONFIG[color];
  return (
    <span className={`cn-badge ${cfg.cssClass} ${className}`}>
      {showIcon && <span className={`w-2 h-2 rounded-full ${cfg.dotColor} opacity-80`} aria-hidden="true" />}
      <span>{lang === 'ta' ? cfg.labelTa : cfg.label}</span>
    </span>
  );
};

// ================================================================
// SERVICE CARD — Government portal service tile
// ================================================================

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  titleTa?: string;
  description: string;
  badge?: string;
  onClick?: () => void;
  lang?: 'en' | 'ta';
  disabled?: boolean;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  titleTa,
  description,
  badge,
  onClick,
  lang = 'en',
  disabled = false,
  className = '',
}) => (
  <div
    className={`cn-service-card group ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    onClick={!disabled ? onClick : undefined}
    role={!disabled ? 'button' : undefined}
    tabIndex={!disabled ? 0 : undefined}
    onKeyDown={!disabled && onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    aria-disabled={disabled}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 rounded-lg bg-[#F2F5F9] border border-[#D5DDE8] flex items-center justify-center text-[#1B4F8C] transition-all group-hover:bg-[#1B4F8C] group-hover:text-white group-hover:border-[#1B4F8C]">
        {icon}
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F2F5F9] text-[#5A6D84] border border-[#D5DDE8] rounded font-mono">
          {badge}
        </span>
      )}
    </div>
    <h3 className="font-bold text-[14px] text-[#1A2B42] group-hover:text-[#1B4F8C] transition-colors leading-tight">
      {lang === 'ta' && titleTa ? titleTa : title}
    </h3>
    <p className="text-xs text-[#647A96] mt-1.5 leading-relaxed">{description}</p>
    <div className="mt-4 pt-3 border-t border-[#D5DDE8]/60 flex items-center justify-between text-xs font-bold text-[#1B4F8C] group-hover:text-[#0D7A6E] transition-colors">
      <span>Access Service</span>
      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
    </div>
  </div>
);

// ================================================================
// STAT CARD — KPI metric display
// ================================================================

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'navy' | 'teal' | 'orange' | 'green';
  className?: string;
}

const STAT_COLORS = {
  navy:   'text-[#0A2342] border-l-4 border-[#0A2342]',
  teal:   'text-[#0D7A6E] border-l-4 border-[#0D7A6E]',
  orange: 'text-[#E8620F] border-l-4 border-[#E8620F]',
  green:  'text-[#166534] border-l-4 border-[#166534]',
};

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  trend,
  trendValue,
  color = 'navy',
  className = '',
}) => (
  <div className={`cn-stat-card pl-4 ${STAT_COLORS[color]} ${className}`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="cn-stat-value">{value}</div>
        <div className="cn-stat-label">{label}</div>
        {trend && trendValue && (
          <div className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${
            trend === 'up' ? 'text-green-700' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            <Activity className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
      {icon && (
        <div className="p-2.5 bg-[#F2F5F9] rounded-lg border border-[#D5DDE8] text-[#1B4F8C]">
          {icon}
        </div>
      )}
    </div>
  </div>
);

// ================================================================
// QUEUE CARD — Live queue status display
// ================================================================

interface QueueCardProps {
  tokenNumber: string;
  nowServing?: string;
  peopleAhead?: number;
  estimatedWait?: number;
  departmentName: string;
  status: string;
  pathColor?: PathColor;
  lang?: 'en' | 'ta';
  className?: string;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  tokenNumber,
  nowServing,
  peopleAhead = 0,
  estimatedWait = 0,
  departmentName,
  status,
  pathColor = 'blue',
  lang = 'en',
  className = '',
}) => {
  const cfg = PATH_CONFIG[pathColor];
  return (
    <div className={`cn-card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="cn-live-dot" aria-hidden="true" />
          <span className="text-xs font-bold text-[#647A96] uppercase tracking-wider">Live Queue</span>
        </div>
        <PathBadge color={pathColor} lang={lang} />
      </div>

      <div className="text-center py-2">
        <div className="text-xs text-[#647A96] mb-1">Your Token</div>
        <div className="cn-token-display text-2xl">{tokenNumber}</div>
        <div className="text-sm font-semibold text-[#3D5170] mt-2">{departmentName}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#D5DDE8]">
        <div className="text-center">
          <div className="text-lg font-bold text-[#0A2342] font-mono">{peopleAhead}</div>
          <div className="text-[11px] text-[#647A96]">Ahead</div>
        </div>
        <div className="text-center border-x border-[#D5DDE8]">
          <div className="text-lg font-bold text-[#0A2342] font-mono">{estimatedWait}m</div>
          <div className="text-[11px] text-[#647A96]">Est. Wait</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[#0A2342] font-mono truncate">{nowServing || '—'}</div>
          <div className="text-[11px] text-[#647A96]">Now Serving</div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ANNOUNCEMENT CARD — System notice / patient notification
// ================================================================

interface AnnouncementCardProps {
  title: string;
  titleTa?: string;
  message: string;
  messageTa?: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  timestamp?: string;
  lang?: 'en' | 'ta';
  onDismiss?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  title,
  titleTa,
  message,
  messageTa,
  type,
  timestamp,
  lang = 'en',
  onDismiss,
}) => {
  const displayTitle = lang === 'ta' && titleTa ? titleTa : title;
  const displayMessage = lang === 'ta' && messageTa ? messageTa : message;

  return (
    <div className={`cn-announcement-card ${type}`} role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {type === 'critical' || type === 'warning' ? (
              <AlertTriangle className={`w-4 h-4 ${type === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
            ) : type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-700" />
            ) : (
              <Info className="w-4 h-4 text-blue-700" />
            )}
          </div>
          <div>
            <div className="font-bold text-sm text-[#1A2B42]">{displayTitle}</div>
            <p className="text-xs text-[#3D5170] mt-0.5 leading-relaxed">{displayMessage}</p>
            {timestamp && (
              <div className="text-[11px] text-[#8FA3BD] mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timestamp}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[#8FA3BD] hover:text-[#1A2B42] transition-colors shrink-0 p-1"
            aria-label="Dismiss notification"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ================================================================
// EMERGENCY BANNER — Full-width critical alert
// ================================================================

interface EmergencyBannerProps {
  message: string;
  lang?: 'en' | 'ta';
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  message,
  lang = 'en',
}) => (
  <div className="cn-emergency-banner" role="alert" aria-live="assertive">
    <div className="flex items-center justify-center gap-3">
      <AlertTriangle className="w-4 h-4 text-red-200" aria-hidden="true" />
      <span>{message}</span>
      <AlertTriangle className="w-4 h-4 text-red-200" aria-hidden="true" />
    </div>
  </div>
);

// ================================================================
// JOURNEY TIMELINE — Patient stage visualization
// ================================================================

export type JourneyStageType = 'registration' | 'doctor' | 'diagnostic' | 'pharmacy' | 'completed';

interface JourneyStage {
  type: JourneyStageType;
  label: string;
  labelTa?: string;
  status: 'completed' | 'current' | 'pending';
  tokenNumber?: string;
  room?: string;
  block?: string;
  pathColor?: PathColor;
}

interface JourneyTimelineProps {
  stages: JourneyStage[];
  lang?: 'en' | 'ta';
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  stages,
  lang = 'en',
}) => (
  <div className="w-full overflow-x-auto py-2">
    <div className="flex items-start min-w-max gap-0">
      {stages.map((stage, idx) => (
        <React.Fragment key={stage.type}>
          <div className="flex flex-col items-center gap-2 px-1" style={{ minWidth: 100 }}>
            {/* Icon circle */}
            <div className={`cn-journey-step-icon ${stage.status}`} aria-label={`${stage.label}: ${stage.status}`}>
              {stage.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : stage.status === 'current' ? (
                <Activity className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5 text-[#8FA3BD]" />
              )}
            </div>
            {/* Label */}
            <div className="text-center">
              <div className={`text-[11px] font-bold ${
                stage.status === 'completed' ? 'text-[#0D7A6E]' :
                stage.status === 'current' ? 'text-[#0A2342]' :
                'text-[#8FA3BD]'
              }`}>
                {lang === 'ta' && stage.labelTa ? stage.labelTa : stage.label}
              </div>
              {stage.tokenNumber && (
                <div className="text-[10px] font-mono text-[#647A96] mt-0.5">{stage.tokenNumber}</div>
              )}
              {stage.room && stage.status === 'current' && (
                <div className="text-[10px] text-[#E8620F] font-medium mt-0.5">{stage.room}</div>
              )}
            </div>
          </div>
          {idx < stages.length - 1 && (
            <div
              className={`cn-journey-connector ${stage.status === 'completed' ? 'completed' : ''}`}
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ================================================================
// REALTIME CONNECTION INDICATOR
// ================================================================

interface RealtimeIndicatorProps {
  connected: boolean;
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  connected,
  className = '',
}) => (
  <div className={`flex items-center gap-1.5 text-xs ${className}`} aria-label={connected ? 'Live updates active' : 'Connecting to live updates'}>
    {connected ? (
      <>
        <span className="cn-live-dot" aria-hidden="true" />
        <span className="text-green-700 font-medium hidden sm:inline">Live</span>
        <Wifi className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
      </>
    ) : (
      <>
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" aria-hidden="true" />
        <span className="text-amber-700 font-medium hidden sm:inline">Connecting...</span>
      </>
    )}
  </div>
);

// ================================================================
// PORTAL WRAPPER — Common portal layout shell
// ================================================================

interface PortalWrapperProps {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PortalWrapper: React.FC<PortalWrapperProps> = ({
  title,
  subtitle,
  headerRight,
  children,
  className = '',
}) => (
  <div className={`flex-1 flex flex-col min-h-0 ${className}`}>
    {/* Portal sub-header */}
    <div className="bg-white border-b border-[#D5DDE8] px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1A2B42] tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#647A96] mt-0.5">{subtitle}</p>
          )}
        </div>
        {headerRight && (
          <div className="flex items-center gap-3">{headerRight}</div>
        )}
      </div>
    </div>
    {/* Portal content */}
    <div className="flex-1 min-h-0 overflow-auto">
      {children}
    </div>
  </div>
);

// ================================================================
// GOVERNMENT FOOTER
// ================================================================

interface GovernmentFooterProps {
  onNavigate?: (route: string) => void;
  lang?: 'en' | 'ta';
}

export const GovernmentFooter: React.FC<GovernmentFooterProps> = ({
  onNavigate,
  lang = 'en',
}) => (
  <footer className="bg-[#0A2342] text-white border-t border-white/10" role="contentinfo">
    {/* Main footer content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand column */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            {/* CareNexus logo mark */}
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16M4 12h16" stroke="#0D7A6E" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">{BRAND.name}</span>
            </div>
          </div>
          {BRAND.tagline ? <p className="text-xs text-white/60 leading-relaxed mb-4">{BRAND.tagline}</p> : null}
          <p className="text-xs text-white/50">{BRAND.subtitle}</p>
        </div>

        {/* Patient Services */}
        <div>
          <h3 className="font-bold text-sm text-white/90 mb-3 uppercase tracking-wider text-[11px]">Patient Services</h3>
          <ul className="space-y-2">
            {['Patient Login', 'Get Token', 'Track Journey', 'Appointments', 'Reports'].map(item => (
              <li key={item}>
                <span className="text-xs text-white/60 hover:text-white/90 transition-colors cursor-default">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hospital Services */}
        <div>
          <h3 className="font-bold text-sm text-white/90 mb-3 uppercase tracking-wider text-[11px]">Hospital Services</h3>
          <ul className="space-y-2">
            {['OPD Consultation', 'Diagnostics & Imaging', 'Central Pharmacy', 'PHC Referrals', 'Emergency Services'].map(item => (
              <li key={item}>
                <span className="text-xs text-white/60 hover:text-white/90 transition-colors cursor-default">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Help & Accessibility */}
        <div>
          <h3 className="font-bold text-sm text-white/90 mb-3 uppercase tracking-wider text-[11px]">Help & Support</h3>
          <ul className="space-y-2">
            {['Accessibility', 'Privacy Policy', 'Terms of Use', 'Contact Us', 'Emergency'].map(item => (
              <li key={item}>
                <span className="text-xs text-white/60 hover:text-white/90 transition-colors cursor-default">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[11px] text-white/50 mb-1">24×7 Helpline</div>
            <div className="font-mono font-bold text-sm text-[#0D7A6E]">{BRAND.hotline}</div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/10 py-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40">
        <div>
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.subtitle}
        </div>
        <div className="flex items-center gap-4">
          <span>EN</span>
          <span className="text-white/20">|</span>
          <span>தமிழ்</span>
          <span className="text-white/20">|</span>
          <span>Accessibility</span>
          <span className="text-white/20">|</span>
          <span>Privacy</span>
        </div>
      </div>
    </div>
  </footer>
);

// ================================================================
// DIRECTORY CARD — For doctor/department directory tiles
// ================================================================

interface DirectoryCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  meta?: string;
  badge?: string;
  badgeType?: StatusType;
  onClick?: () => void;
  className?: string;
}

export const DirectoryCard: React.FC<DirectoryCardProps> = ({
  icon,
  title,
  description,
  meta,
  badge,
  badgeType = 'neutral',
  onClick,
  className = '',
}) => (
  <div
    className={`cn-card p-4 cursor-pointer group transition-all hover:shadow-md ${className}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#F2F5F9] border border-[#D5DDE8] flex items-center justify-center text-[#1B4F8C] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-[#1A2B42] group-hover:text-[#1B4F8C] transition-colors leading-tight">
            {title}
          </h3>
          {badge && <StatusBadge type={badgeType} label={badge} />}
        </div>
        {description && (
          <p className="text-xs text-[#647A96] mt-1 leading-relaxed">{description}</p>
        )}
        {meta && (
          <div className="text-[11px] text-[#8FA3BD] mt-1.5 font-medium">{meta}</div>
        )}
      </div>
    </div>
  </div>
);
