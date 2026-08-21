import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Cpu, Shield, ArrowRight, Lock, Mail } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const { login, switchRole } = useAuth();
  const [email, setEmail] = useState<string>('admin@civicai.local');
  const [password, setPassword] = useState<string>('civicai123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (role: UserRole) => {
    setLoading(true);
    try {
      await switchRole(role);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-civic-600 to-cyan-400 items-center justify-center text-white shadow-xl shadow-civic-500/20 mb-2">
            <Cpu className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">rapidAID Command Station</h1>
          <p className="text-xs text-slate-400">AI-Powered Citizen Call Intelligence & Emergency Resource Allocation</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-civic-500 focus:outline-none"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-civic-500 focus:outline-none"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-civic-600 hover:bg-civic-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-civic-600/30 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Instant Hackathon Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPersona('ADMIN')}
                className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <span className="font-bold text-white block">Commissioner</span>
                <span className="text-[10px] text-slate-400">admin@civicai.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('CALL_OPERATOR')}
                className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <span className="font-bold text-white block">Call Operator</span>
                <span className="text-[10px] text-slate-400">operator@civicai.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('OFFICER')}
                className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <span className="font-bold text-white block">Field Officer</span>
                <span className="text-[10px] text-slate-400">officer@civicai.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('CITIZEN')}
                className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <span className="font-bold text-white block">Citizen Portal</span>
                <span className="text-[10px] text-slate-400">citizen@civicai.local</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
