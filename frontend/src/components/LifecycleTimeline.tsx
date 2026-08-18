import React from 'react';
import { ComplaintEvent, ComplaintStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Building,
  UserCheck,
  Wrench,
  AlertOctagon,
  GitMerge,
  FileCheck2,
  PhoneCall,
} from 'lucide-react';

interface Props {
  currentStatus: ComplaintStatus;
  events?: ComplaintEvent[];
}

const LIFECYCLE_STEPS: { status: ComplaintStatus; label: string; icon: any }[] = [
  { status: 'RECEIVED', label: 'Call Received', icon: PhoneCall },
  { status: 'AI_ANALYZED', label: 'AI Intelligence', icon: Cpu },
  { status: 'DEPARTMENT_ASSIGNED', label: 'Dept Routed', icon: Building },
  { status: 'OFFICER_ASSIGNED', label: 'Officer Assigned', icon: UserCheck },
  { status: 'IN_PROGRESS', label: 'Field Action', icon: Wrench },
  { status: 'RESOLVED', label: 'Work Resolved', icon: CheckCircle2 },
  { status: 'CITIZEN_CONFIRMED', label: 'Citizen Confirmed', icon: FileCheck2 },
];

const STEP_ORDER: Record<string, number> = {
  RECEIVED: 1,
  AI_ANALYZED: 2,
  CLASSIFIED: 2,
  DEPARTMENT_ASSIGNED: 3,
  OFFICER_ASSIGNED: 4,
  IN_PROGRESS: 5,
  RESOLVED: 6,
  CITIZEN_CONFIRMED: 7,
  CLOSED: 8,
  ESCALATED: 99,
};

export const LifecycleTimeline: React.FC<Props> = ({ currentStatus, events = [] }) => {
  const currentStepNum = STEP_ORDER[currentStatus] || 1;
  const isEscalated = currentStatus === 'ESCALATED';

  return (
    <div className="space-y-6">
      {/* Horizontal Step Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lifecycle Progression
          </h4>
          {isEscalated && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
              <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
              PRIORITY ESCALATED
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const stepNum = STEP_ORDER[step.status];
            const isPassed = !isEscalated && currentStepNum >= stepNum;
            const isCurrent = !isEscalated && currentStatus === step.status;
            const StepIcon = step.icon;

            return (
              <div
                key={step.status}
                className={`relative flex flex-col items-center text-center p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-civic-500 bg-civic-950/60 ring-1 ring-civic-500/30'
                    : isPassed
                    ? 'border-slate-700 bg-slate-800/60'
                    : 'border-slate-800/60 bg-slate-950/30 opacity-60'
                }`}
              >
                <div
                  className={`p-2 rounded-full mb-1.5 ${
                    isCurrent
                      ? 'bg-civic-500 text-white animate-bounce'
                      : isPassed
                      ? 'bg-emerald-900/60 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                  {step.label}
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                  Step {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Audit Event Trail */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-civic-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Immutable Audit Trail & Event History ({events.length} events)
          </h4>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No lifecycle events recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {events.map((ev) => {
              const dateStr = new Date(ev.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div key={ev.id} className="relative group">
                  {/* Event Marker */}
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-slate-900 bg-civic-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 hover:border-slate-700 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{dateStr}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-900 pt-1.5">
                      <span>Logged by: {ev.created_by}</span>
                      <span>ID: #{ev.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
