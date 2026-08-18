import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'rose' | 'amber' | 'emerald' | 'indigo' | 'purple';
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp = true,
  color = 'blue',
}) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-400 border-blue-500/20',
    rose: 'from-rose-500/10 to-rose-500/0 text-rose-400 border-rose-500/20',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-400 border-amber-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-400 border-emerald-500/20',
    indigo: 'from-indigo-500/10 to-indigo-500/0 text-indigo-400 border-indigo-500/20',
    purple: 'from-purple-500/10 to-purple-500/0 text-purple-400 border-purple-500/20',
  };

  const iconBg = {
    blue: 'bg-blue-500/10 text-blue-400',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-b ${colorMap[color]} bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-sans">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              trendUp ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950 text-rose-300 border border-rose-800/50'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 leading-relaxed truncate">{subtitle}</p>
      )}
    </div>
  );
};
