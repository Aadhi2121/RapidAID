import React, { useState, useEffect } from 'react';
import { Complaint } from '../types';
import { complaintsApi } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LifecycleTimeline } from '../components/LifecycleTimeline';
import { AssignModal } from '../components/AssignModal';
import { EscalateModal } from '../components/EscalateModal';
import { ResolveModal } from '../components/ResolveModal';
import { MergeModal } from '../components/MergeModal';
import {
  ArrowLeft,
  PhoneCall,
  User,
  MapPin,
  Building,
  UserCheck,
  Clock,
  AlertTriangle,
  GitMerge,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Smile,
  ShieldCheck,
  FileText,
  Radio,
  Zap,
} from 'lucide-react';

interface Props {
  complaintId: string;
  onBack: () => void;
}

export const ComplaintDetail: React.FC<Props> = ({ complaintId, onBack }) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState<boolean>(false);
  const [isResolveOpen, setIsResolveOpen] = useState<boolean>(false);
  const [isMergeOpen, setIsMergeOpen] = useState<boolean>(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await complaintsApi.getById(complaintId);
      setComplaint(data);
    } catch (e) {
      console.error('Error loading complaint detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [complaintId]);

  const handleAssign = async (officerId: number, notes?: string) => {
    await complaintsApi.assign(complaintId, officerId, notes);
    await fetchDetail();
  };

  const handleEscalate = async (reason: string) => {
    await complaintsApi.escalate(complaintId, reason);
    await fetchDetail();
  };

  const handleResolve = async (notes: string, resolvedBy?: string) => {
    await complaintsApi.resolve(complaintId, notes, resolvedBy);
    await fetchDetail();
  };

  const handleMerge = async (targetId: string, reason: string) => {
    await complaintsApi.merge(complaintId, targetId, reason);
    await fetchDetail();
  };

  if (loading || !complaint) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-civic-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Retrieving ticket {complaintId}...</p>
        </div>
      </div>
    );
  }

  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {complaint.id}
              </h1>
              <PriorityBadge
                level={complaint.priority_level}
                score={complaint.priority_score}
                showScore
              />
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registered on {new Date(complaint.created_at).toLocaleString('en-IN')} via {complaint.source}
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isResolved && (
            <>
              <button
                onClick={() => setIsAssignOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-teal-800/80 bg-teal-950/60 hover:bg-teal-900/80 text-teal-200 text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span>{complaint.assigned_officer_id ? 'Reassign Officer' : 'Assign Officer'}</span>
              </button>

              <button
                onClick={() => setIsEscalateOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-rose-800/80 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
              >
                <AlertOctagon className="h-4 w-4" />
                <span>Escalate</span>
              </button>

              <button
                onClick={() => {
                  setMergeTargetId('CIVIC-2026-0001');
                  setIsMergeOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-indigo-800/80 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
              >
                <GitMerge className="h-4 w-4" />
                <span>Merge Duplicate</span>
              </button>

              <button
                onClick={() => setIsResolveOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Resolve Ticket</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid: Left Column Details & Right Column Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: AI Intelligence & Entities (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Structured Summary */}
          <div className="rounded-xl border border-civic-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-civic-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-civic-400">
                AI Executive Summary
              </h3>
            </div>
            <p className="text-sm lg:text-base font-semibold text-white leading-relaxed">
              {complaint.summary || complaint.transcript}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                <span className="font-bold text-white">{complaint.category}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subcategory</span>
                <span className="font-bold text-civic-300">{complaint.subcategory || 'General'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Civic Impact</span>
                <span className="font-bold text-amber-300">~{complaint.affected_population} people</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sentiment</span>
                <span className="font-bold text-rose-300">{complaint.sentiment}</span>
              </div>
            </div>
          </div>

          {/* Voice Transcript & Translation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-civic-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Citizen Audio Transcript ({complaint.language})
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
              "{complaint.transcript}"
            </div>

            {complaint.translation && complaint.translation !== complaint.transcript && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-civic-400">
                  Standardized English Translation
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  "{complaint.translation}"
                </p>
              </div>
            )}
          </div>

          {/* Priority & SLA Reasoning Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Priority Diagnostics
                </span>
                <span className="font-mono font-bold text-rose-400">
                  {complaint.priority_score}/100
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Calculated using weighted multi-factor formula: Severity (30%), Urgency (25%), SLA Risk (20%), Impact (15%), Recurrence (10%).
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-civic-400" />
                  SLA Target & Risk
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    complaint.sla_risk === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {complaint.sla_risk} Risk
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1">
                <span className="text-slate-400">Statutory Deadline:</span>
                <span className="font-mono font-bold text-white">{complaint.sla_hours} Hours</span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400">Estimated Resolution:</span>
                <span className="font-mono font-bold text-civic-300">
                  {complaint.predicted_resolution_hours} Hours
                </span>
              </div>
            </div>
          </div>

          {/* Department & Officer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-civic-400">
                <Building className="h-4 w-4" />
                <span>Assigned Municipal Department</span>
              </div>
              <p className="font-bold text-white text-xs">
                {complaint.department_name || 'Greater Chennai Corporation'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-teal-800/50 bg-teal-950/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-teal-400">
                <UserCheck className="h-4 w-4" />
                <span>Assigned Field Officer</span>
              </div>
              <p className="font-bold text-white text-xs">
                {complaint.assigned_officer_name || 'Pending Dispatch'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Full Lifecycle Progression & Event History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <LifecycleTimeline
            currentStatus={complaint.status}
            events={complaint.events || []}
          />
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        isOpen={isAssignOpen}
        complaintId={complaint.id}
        departmentId={complaint.department_id}
        locationName={complaint.location_name}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={handleAssign}
      />

      <EscalateModal
        isOpen={isEscalateOpen}
        complaintId={complaint.id}
        onClose={() => setIsEscalateOpen(false)}
        onEscalate={handleEscalate}
      />

      <ResolveModal
        isOpen={isResolveOpen}
        complaintId={complaint.id}
        onClose={() => setIsResolveOpen(false)}
        onResolve={handleResolve}
      />

      <MergeModal
        isOpen={isMergeOpen}
        sourceComplaintId={complaint.id}
        targetComplaintId={mergeTargetId}
        onClose={() => setIsMergeOpen(false)}
        onMerge={handleMerge}
      />
    </div>
  );
};
