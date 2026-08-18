import React, { useState, useEffect } from 'react';
import { Complaint, PriorityLevel } from '../types';
import { complaintsApi } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Inbox,
  Search,
  Filter,
  ArrowUpDown,
  PhoneCall,
  Globe,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

interface Props {
  onSelectComplaint: (id: string) => void;
  onNavigateToCalls: () => void;
}

export const Complaints: React.FC<Props> = ({ onSelectComplaint, onNavigateToCalls }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedPriority !== 'ALL') params.priority_level = selectedPriority;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const data = await complaintsApi.getAll(params);
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [selectedCategory, selectedPriority, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const categories = [
    'ALL',
    'Water Supply',
    'Electricity',
    'Roads & Infrastructure',
    'Garbage / Sanitation',
    'Drainage',
    'Public Transport',
    'Healthcare',
    'Public Safety',
    'Street Lighting',
    'Government Services',
  ];

  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = [
    'ALL',
    'RECEIVED',
    'AI_ANALYZED',
    'DEPARTMENT_ASSIGNED',
    'OFFICER_ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'ESCALATED',
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            City Grievance & Complaint Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, and inspect AI-triaged complaints across all municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToCalls}
            className="px-4 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold shadow flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Ingest New Call</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, keyword, locality, or transcript..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-civic-500 focus:outline-none"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-civic-500 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {c === 'ALL' ? 'All Sectors / Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-civic-500 focus:outline-none cursor-pointer"
            >
              {priorities.map((p) => (
                <option key={p} value={p} className="bg-slate-900">
                  {p === 'ALL' ? 'All Priorities' : `${p} Priority`}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-civic-500 focus:outline-none cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="bg-slate-900">
                  {s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Category & AI Summary</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">SLA Deadline</th>
                <th className="py-3.5 px-4">Assigned Dept / Officer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading complaints directory...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                    No complaints match current filter criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const dateStr = new Date(c.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectComplaint(c.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{c.id}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-civic-400 font-mono">
                            {c.language?.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                          {dateStr}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-white">{c.category}</span>
                          {c.subcategory && (
                            <span className="text-slate-400 text-[11px]">/ {c.subcategory}</span>
                          )}
                        </div>
                        <p className="text-slate-300 line-clamp-1 text-[11px]">
                          {c.summary || c.transcript}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-200 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-civic-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{c.location_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ~{c.affected_population} impacted
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge level={c.priority_level} score={c.priority_score} showScore />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${
                            c.sla_risk === 'HIGH' ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>{c.sla_hours}h SLA</span>
                        </span>
                        <span
                          className={`text-[9px] block font-bold mt-0.5 ${
                            c.sla_risk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {c.sla_risk} Risk ({c.predicted_resolution_hours}h est)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="font-medium text-slate-200 truncate text-[11px]">
                          {c.department_name || 'Pending Assignment'}
                        </p>
                        <p className="text-[10px] text-teal-400 truncate mt-0.5">
                          {c.assigned_officer_name ? `Eng: ${c.assigned_officer_name}` : 'Unassigned'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectComplaint(c.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-civic-300 text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
