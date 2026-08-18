import React from 'react';
import { ComplaintStatus } from '../types';

interface Props {
  status: ComplaintStatus | string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const norm = (status || 'RECEIVED').toUpperCase();

  const statusConfig: Record<string, { label: string; classes: string }> = {
    RECEIVED: {
      label: 'Received',
      classes: 'bg-slate-800/80 text-slate-300 border-slate-700',
    },
    AI_ANALYZED: {
      label: 'AI Analyzed',
      classes: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/70',
    },
    CLASSIFIED: {
      label: 'Classified',
      classes: 'bg-blue-950/80 text-blue-300 border-blue-800/70',
    },
    DEPARTMENT_ASSIGNED: {
      label: 'Dept Assigned',
      classes: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/70',
    },
    OFFICER_ASSIGNED: {
      label: 'Officer Assigned',
      classes: 'bg-teal-950/80 text-teal-300 border-teal-800/70',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      classes: 'bg-amber-950/80 text-amber-300 border-amber-800/70',
    },
    RESOLVED: {
      label: 'Resolved',
      classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/70',
    },
    CITIZEN_CONFIRMED: {
      label: 'Citizen Confirmed',
      classes: 'bg-green-950/80 text-green-300 border-green-800/70',
    },
    CLOSED: {
      label: 'Closed / Merged',
      classes: 'bg-zinc-800/80 text-zinc-400 border-zinc-700',
    },
    ESCALATED: {
      label: 'Escalated',
      classes: 'bg-rose-950/80 text-rose-300 border-rose-800/80 ring-1 ring-rose-500/20',
    },
  };

  const current = statusConfig[norm] || { label: norm, classes: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${current.classes}`}>
      {current.label}
    </span>
  );
};
