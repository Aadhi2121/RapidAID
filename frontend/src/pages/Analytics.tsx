import React, { useState, useEffect } from 'react';
import { AnalyticsOverview, AnalyticsTrends } from '../types';
import { analyticsApi } from '../services/api';
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  Clock,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
  GitMerge,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [ov, tr] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getTrends(),
        ]);
        setOverview(ov);
        setTrends(tr);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading || !overview || !trends) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-civic-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Running predictive governance models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-civic-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Predictive Governance & Statistical Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Proactive early warnings for category surges, recurring failure clusters, and department SLA breach forecasting.
          </p>
        </div>
      </div>

      {/* Category Surge & Growth Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-sm">Rapidly Escalating Complaint Categories</h3>
            <p className="text-xs text-slate-400">Week-over-week grievance velocity comparison</p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-civic-400 border border-slate-700">
            Automated Surge Detection
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {trends.category_growth.map((cat, idx) => {
            const isSpike = cat.status === 'Spiking';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-2 ${
                  isSpike
                    ? 'border-rose-800/80 bg-rose-950/30'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <span className="font-bold text-xs text-white block truncate">{cat.category}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono">{cat.thisWeek}</span>
                  <span
                    className={`text-xs font-bold flex items-center ${
                      cat.growth.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {cat.growth.startsWith('+') ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {cat.growth}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Last Week: {cat.lastWeek}</span>
                  <span className={`font-bold ${isSpike ? 'text-rose-300' : 'text-slate-400'}`}>
                    {cat.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Governance Insights Matrix */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-civic-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Predictive AI Governance Diagnoses & Prescriptions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overview.insights.map((ins) => (
            <div
              key={ins.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {ins.title}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ins.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {ins.severity} SEVERITY
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {ins.description}
              </p>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase text-civic-400 block">
                  AI Prescriptive Strategy
                </span>
                <p className="text-slate-200">{ins.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Forecast Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm">Grievance Inflow vs Resolution Trajectory</h3>
          <p className="text-xs text-slate-400">Daily historical resolution rates</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.daily_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="total" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="critical" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
