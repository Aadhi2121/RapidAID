import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus } from '../types';
import { complaintsApi } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ResolveModal } from '../components/ResolveModal';
import { EscalateModal } from '../components/EscalateModal';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  Calendar,
  ArrowRight,
  Filter,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface Props {
  onSelectComplaint: (id: string) => void;
}

export const OfficerDashboard: React.FC<Props> = ({ onSelectComplaint }) => {
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'SLA_RISK' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  // Action state
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState<boolean>(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState<boolean>(false);

  const fetchOfficerCases = async () => {
    try {
      setLoading(true);
      const data = await complaintsApi.getAll();
      // Filter cases assigned to water / general officer (officer ID 1 or 2 for demo)
      setAssignedComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficerCases();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    try {
      await complaintsApi.update(id, { status: newStatus, notes: `Officer updated status to ${newStatus}` });
      await fetchOfficerCases();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveSubmit = async (notes: string, resolvedBy?: string) => {
    if (!selectedComplaintId) return;
    await complaintsApi.resolve(selectedComplaintId, notes, resolvedBy);
    await fetchOfficerCases();
  };

  const handleEscalateSubmit = async (reason: string) => {
    if (!selectedComplaintId) return;
    await complaintsApi.escalate(selectedComplaintId, reason);
    await fetchOfficerCases();
  };

  const activeCases = assignedComplaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const criticalCases = assignedComplaints.filter((c) => c.priority_level === 'CRITICAL' && c.status !== 'RESOLVED');
  const slaRiskCases = assignedComplaints.filter((c) => c.sla_risk === 'HIGH' && c.status !== 'RESOLVED');
  const resolvedCases = assignedComplaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

  const filteredList = assignedComplaints.filter((c) => {
    if (filterTab === 'CRITICAL') return c.priority_level === 'CRITICAL' && c.status !== 'RESOLVED';
    if (filterTab === 'SLA_RISK') return c.sla_risk === 'HIGH' && c.status !== 'RESOLVED';
    if (filterTab === 'IN_PROGRESS') return c.status === 'IN_PROGRESS';
    if (filterTab === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'CLOSED';
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Officer Profile Header */}
      <div className="rounded-2xl border border-teal-800/60 bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-950 p-6 lg:p-8 relative shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Officer Operational Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Er. S. Selvakumar — Field Operations Engineer
            </h1>
            <p className="text-xs text-slate-300">
              Chennai Metro Water & Sewerage Board (CMWSSB) • Jurisdiction: Ward 12 & North Zonal Division
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">SLA Rating</span>
              <span className="text-lg font-black text-emerald-400">98.1%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Active Caseload</span>
              <span className="text-lg font-black text-white">{activeCases.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'ALL'
              ? 'bg-civic-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All Assigned ({assignedComplaints.length})
        </button>
        <button
          onClick={() => setFilterTab('CRITICAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterTab === 'CRITICAL'
              ? 'bg-rose-600 text-white shadow'
              : 'text-rose-400 hover:bg-rose-950/50'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Critical Emergency ({criticalCases.length})</span>
        </button>
        <button
          onClick={() => setFilterTab('SLA_RISK')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterTab === 'SLA_RISK'
              ? 'bg-amber-600 text-white shadow'
              : 'text-amber-400 hover:bg-amber-950/50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>High SLA Risk ({slaRiskCases.length})</span>
        </button>
        <button
          onClick={() => setFilterTab('IN_PROGRESS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'IN_PROGRESS'
              ? 'bg-teal-600 text-white shadow'
              : 'text-teal-400 hover:bg-teal-950/50'
          }`}
        >
          In Progress ({assignedComplaints.filter((c) => c.status === 'IN_PROGRESS').length})
        </button>
        <button
          onClick={() => setFilterTab('RESOLVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === 'RESOLVED'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-emerald-400 hover:bg-emerald-950/50'
          }`}
        >
          Resolved Cases ({resolvedCases.length})
        </button>
      </div>

      {/* Priority Work Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading work orders...</div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 italic">
            No work orders currently match this filter.
          </div>
        ) : (
          filteredList.map((c) => {
            const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
            return (
              <div
                key={c.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white">{c.id}</span>
                    <PriorityBadge level={c.priority_level} score={c.priority_score} showScore />
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{c.category}</h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {c.summary || c.transcript}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-civic-400 shrink-0" />
                      <span className="truncate">{c.location_name}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>SLA: {c.sla_hours}h</span>
                      <span className={c.sla_risk === 'HIGH' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {c.sla_risk} Risk ({c.predicted_resolution_hours}h est)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <StatusBadge status={c.status} />

                  <div className="flex items-center gap-1.5">
                    {!isResolved && c.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'IN_PROGRESS')}
                        title="Accept and Start Work"
                        className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
                      >
                        Accept Work
                      </button>
                    )}

                    {!isResolved && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedComplaintId(c.id);
                            setIsEscalateOpen(true);
                          }}
                          title="Escalate Case"
                          className="p-1.5 rounded border border-rose-800 text-rose-300 hover:bg-rose-950"
                        >
                          <AlertOctagon className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedComplaintId(c.id);
                            setIsResolveOpen(true);
                          }}
                          title="Complete Resolution"
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Resolve</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onSelectComplaint(c.id)}
                      className="px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {selectedComplaintId && (
        <>
          <ResolveModal
            isOpen={isResolveOpen}
            complaintId={selectedComplaintId}
            onClose={() => setIsResolveOpen(false)}
            onResolve={handleResolveSubmit}
          />
          <EscalateModal
            isOpen={isEscalateOpen}
            complaintId={selectedComplaintId}
            onClose={() => setIsEscalateOpen(false)}
            onEscalate={handleEscalateSubmit}
          />
        </>
      )}
    </div>
  );
};
