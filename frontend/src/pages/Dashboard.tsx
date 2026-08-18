import React, { useState, useEffect } from 'react';
import { AnalyticsOverview, AnalyticsTrends, Complaint } from '../types';
import { analyticsApi, complaintsApi } from '../services/api';
import { StatCard } from '../components/StatCard';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  GitMerge,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Building,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface Props {
  onNavigateToCalls: () => void;
  onNavigateToComplaints: () => void;
  onSelectComplaint: (id: string) => void;
}

const PIE_COLORS = ['#0284c7', '#38bdf8', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#a855f7'];

export const Dashboard: React.FC<Props> = ({
  onNavigateToCalls,
  onNavigateToComplaints,
  onSelectComplaint,
}) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ov, tr, comps] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getTrends(),
          complaintsApi.getAll({ limit: 6 }),
        ]);
        setOverview(ov);
        setTrends(tr);
        setRecentComplaints(comps);
      } catch (e) {
        console.error('Error fetching dashboard metrics:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !overview) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-civic-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Aggregating Municipal Civic Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Top Banner with Live Call CTAs */}
      <div className="rounded-2xl border border-civic-800/80 bg-gradient-to-r from-civic-950 via-slate-900 to-slate-950 p-6 lg:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-civic-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-500/15 border border-civic-500/30 text-civic-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real-Time Citizen Call Intelligence</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Greater Chennai Municipal Command Center
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              Transforming incoming citizen voice complaints in Tamil, Hindi & English into structured government action with automated duplicate clustering and SLA breach prevention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToCalls}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-civic-600 to-cyan-500 hover:from-civic-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-civic-600/30 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch Live Call Screen</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onNavigateToComplaints}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              View Complaints Registry
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Complaints"
          value={overview.total_complaints}
          subtitle="All recorded grievances"
          icon={Inbox}
          trend="+12% today"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Active Cases"
          value={overview.active_complaints}
          subtitle="Under triage / field work"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Critical Emergencies"
          value={overview.critical_complaints}
          subtitle="Priority score ≥ 80/100"
          icon={AlertTriangle}
          trend="Immediate Action"
          trendUp={false}
          color="rose"
        />
        <StatCard
          title="SLA Compliance"
          value={`${overview.sla_compliance_rate}%`}
          subtitle="Within statutory charter"
          icon={CheckCircle2}
          trend="Target: 95%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${overview.avg_resolution_hours}h`}
          subtitle="Department mean"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Duplicate Clusters"
          value={overview.duplicate_count}
          subtitle="Multi-caller matches"
          icon={GitMerge}
          color="purple"
        />
      </div>

      {/* Predictive Governance Insights Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            AI Predictive Governance Alerts & Outbreak Warnings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overview.insights.map((ins) => (
            <div
              key={ins.id}
              className={`p-4 rounded-xl border backdrop-blur-sm space-y-2.5 transition-all hover:scale-[1.01] ${
                ins.severity === 'CRITICAL'
                  ? 'border-rose-800/80 bg-rose-950/30'
                  : ins.severity === 'HIGH'
                  ? 'border-amber-800/80 bg-amber-950/30'
                  : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    ins.severity === 'CRITICAL'
                      ? 'bg-rose-900 text-rose-200'
                      : 'bg-amber-900 text-amber-200'
                  }`}
                >
                  {ins.type.replace(/_/g, ' ')}
                </span>
              </div>

              <h3 className="font-bold text-white text-xs">{ins.title}</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">{ins.description}</p>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-medium text-civic-300">
                <strong>Recommended Action:</strong> {ins.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">7-Day Grievance Trend & Inflow</h3>
              <p className="text-xs text-slate-400">Total vs Resolved vs Critical Complaints</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-civic-500"></span> Total
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Resolved
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Critical
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trends && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.daily_trends}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="total" stroke="#0284c7" fillOpacity={1} fill="url(#totalGrad)" />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#resolvedGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm">Complaint Category Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution across municipal sectors</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview.category_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {overview.category_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
            {overview.category_distribution.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="truncate">{c.name}: <strong>{c.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Distribution & Sentiment Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Bar Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm">Department Workload Distribution</h3>
            <p className="text-xs text-slate-400">Total cases handled per civic agency</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.department_distribution} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citizen Sentiment Bar Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm">Citizen Sentiment Analysis</h3>
            <p className="text-xs text-slate-400">Emotional tone detected across voice transcripts</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-4">
            {overview.sentiment_distribution.map((s) => {
              const colors: Record<string, { bg: string; text: string; bar: string }> = {
                POSITIVE: { bg: 'bg-emerald-950/50 border-emerald-800', text: 'text-emerald-300', bar: 'bg-emerald-500' },
                NEUTRAL: { bg: 'bg-slate-950 border-slate-800', text: 'text-slate-300', bar: 'bg-slate-500' },
                FRUSTRATED: { bg: 'bg-amber-950/50 border-amber-800', text: 'text-amber-300', bar: 'bg-amber-500' },
                ANGRY: { bg: 'bg-rose-950/50 border-rose-800', text: 'text-rose-300', bar: 'bg-rose-500' },
                DISTRESSED: { bg: 'bg-purple-950/50 border-purple-800', text: 'text-purple-300', bar: 'bg-purple-500' },
              };
              const c = colors[s.name] || colors.NEUTRAL;
              return (
                <div key={s.name} className={`p-3 rounded-xl border ${c.bg} text-center space-y-1`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {s.name}
                  </span>
                  <p className={`text-xl font-extrabold ${c.text}`}>{s.value}</p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${c.bar}`}
                      style={{ width: `${(s.value / overview.total_complaints) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            *Sentiment scores inform priority scoring and escalate supervisor notifications when prolonged citizen distress is identified.
          </p>
        </div>
      </div>

      {/* Recent High Priority Complaints Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Recent Active Grievance Queue</h3>
            <p className="text-xs text-slate-400">Live incoming complaints from citizens and operators</p>
          </div>
          <button
            onClick={onNavigateToComplaints}
            className="text-xs font-bold text-civic-400 hover:text-civic-300 flex items-center gap-1"
          >
            <span>View All ({overview.total_complaints})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Ticket ID</th>
                <th className="pb-3">Category & Summary</th>
                <th className="pb-3">Location / Ward</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">SLA Risk</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-200">{c.id}</td>
                  <td className="py-3 max-w-xs">
                    <p className="font-bold text-white truncate">{c.category}</p>
                    <p className="text-slate-400 truncate text-[11px]">{c.summary || c.transcript}</p>
                  </td>
                  <td className="py-3 text-slate-300 font-medium">{c.location_name}</td>
                  <td className="py-3">
                    <PriorityBadge level={c.priority_level} score={c.priority_score} showScore />
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.sla_risk === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {c.sla_risk} Risk
                    </span>
                  </td>
                  <td className="py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectComplaint(c.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-civic-300 text-xs font-semibold transition-colors"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
