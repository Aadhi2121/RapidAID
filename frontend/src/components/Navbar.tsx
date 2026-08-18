import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { notificationsApi } from '../services/api';
import {
  Bell,
  Sparkles,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Activity,
  Radio,
} from 'lucide-react';

interface Props {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenNotifications }) => {
  const { user, role, switchRole, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await notificationsApi.getAll();
        const unread = notifs.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (e) {
        // fallback
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin Commissioner', desc: 'Full citywide command & SLA control' },
    { role: 'OFFICER', label: 'Field Officer', desc: 'Department dispatch & resolution' },
    { role: 'CALL_OPERATOR', label: 'Control Room Operator', desc: 'Live call ingestion & AI triage' },
    { role: 'CITIZEN', label: 'Citizen Portal', desc: 'Voice/text complaint tracking' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
      {/* Left Status & Branding info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>AI Engine: Operational</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
          <Sparkles className="h-3 w-3 text-civic-400" />
          <span>Whisper • Multilingual NLP • Geospatial</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Shield className="h-3.5 w-3.5 text-civic-400" />
            <span className="hidden md:inline text-slate-400">Role:</span>
            <span className="font-bold text-white">{role}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Switch Demo Persona
              </div>
              <div className="py-1 space-y-1">
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                      role === r.role
                        ? 'bg-civic-950 text-civic-300 font-bold border border-civic-800'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Badge */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-8 w-8 rounded-full bg-civic-600/30 border border-civic-500/50 flex items-center justify-center text-civic-300 font-bold text-xs">
            {user?.name ? user.name[0] : 'C'}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-white truncate max-w-[130px]">{user?.name || 'Commissioner'}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.email || 'admin@civicai.local'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
