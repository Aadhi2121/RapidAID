import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  Inbox,
  UserCheck,
  User,
  MapPin,
  TrendingUp,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'live-calls'
  | 'complaints'
  | 'officer-dashboard'
  | 'citizen-portal'
  | 'hotspots'
  | 'analytics';

interface Props {
  currentView: NavItem;
  onNavigate: (view: NavItem) => void;
}

export const Sidebar: React.FC<Props> = ({ currentView, onNavigate }) => {
  const navItems: { id: NavItem; label: string; icon: any; badge?: string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Admin Command', icon: LayoutDashboard },
    {
      id: 'live-calls',
      label: 'Live Call Intelligence',
      icon: PhoneCall,
      badge: 'LIVE',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800/80 animate-pulse',
    },
    { id: 'complaints', label: 'Complaints Queue', icon: Inbox },
    { id: 'officer-dashboard', label: 'Officer Dashboard', icon: UserCheck },
    { id: 'citizen-portal', label: 'Citizen Portal', icon: User },
    { id: 'hotspots', label: 'Hotspot Map', icon: MapPin, badge: 'Chennai' },
    { id: 'analytics', label: 'Predictive Governance', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 border-b border-slate-800 flex items-center gap-3 px-6">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-civic-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-civic-500/20">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <span className="font-extrabold text-white text-lg tracking-tight">CivicAI</span>
          <span className="block text-[10px] uppercase font-bold tracking-widest text-civic-400">
            Intelligence Platform
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-civic-600 text-white shadow-md shadow-civic-600/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Mission Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
            <ShieldAlert className="h-4 w-4 text-civic-400" />
            <span>Civic Resilience 2026</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            AI-assisted triage ensuring rapid municipal resolution under strict statutory SLAs.
          </p>
        </div>
      </div>
    </aside>
  );
};
