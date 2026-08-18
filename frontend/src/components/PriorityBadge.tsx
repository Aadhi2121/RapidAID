import React from 'react';
import { PriorityLevel } from '../types';

interface Props {
  level: PriorityLevel | string;
  score?: number;
  showScore?: boolean;
}

export const PriorityBadge: React.FC<Props> = ({ level, score, showScore = false }) => {
  const norm = (level || 'MEDIUM').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (norm === 'CRITICAL') {
    colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/80 ring-1 ring-rose-500/30';
    dotColor = 'bg-rose-400 animate-ping';
  } else if (norm === 'HIGH') {
    colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    dotColor = 'bg-amber-400';
  } else if (norm === 'MEDIUM') {
    colorClasses = 'bg-sky-950/80 text-sky-300 border-sky-800/80';
    dotColor = 'bg-sky-400';
  } else if (norm === 'LOW') {
    colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    dotColor = 'bg-emerald-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="relative flex h-2 w-2">
        {norm === 'CRITICAL' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      <span>{norm}</span>
      {showScore && score !== undefined && (
        <span className="font-mono ml-0.5 opacity-85">({Math.round(score)})</span>
      )}
    </span>
  );
};
