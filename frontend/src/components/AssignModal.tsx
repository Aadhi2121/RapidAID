import React, { useState, useEffect } from 'react';
import { Officer } from '../types';
import { officersApi } from '../services/api';
import { UserCheck, X, Check, Building, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  complaintId: string;
  departmentId?: number;
  locationName?: string;
  onClose: () => void;
  onAssigned: (officerId: number, notes?: string) => Promise<void>;
}

export const AssignModal: React.FC<Props> = ({
  isOpen,
  complaintId,
  departmentId,
  locationName,
  onClose,
  onAssigned,
}) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setFetching(true);
        try {
          const list = await officersApi.getAll(departmentId);
          setOfficers(list);
          if (list.length > 0) {
            setSelectedOfficerId(list[0].id);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setFetching(false);
        }
      };
      load();
    }
  }, [isOpen, departmentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerId) return;
    setLoading(true);
    try {
      await onAssigned(selectedOfficerId, notes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Assign Field Officer</h3>
            <p className="text-xs text-slate-400">Target Ticket: {complaintId}</p>
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading department officer directory...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Available Field Officer
              </label>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {officers.map((off) => {
                  const isSelected = selectedOfficerId === off.id;
                  return (
                    <div
                      key={off.id}
                      onClick={() => setSelectedOfficerId(off.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-teal-500 bg-teal-950/40 text-white ring-1 ring-teal-500/30'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{off.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              off.status === 'AVAILABLE'
                                ? 'bg-emerald-950 text-emerald-300'
                                : off.status === 'ON_FIELD'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {off.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {off.department_name} • Active Cases: <span className="font-mono text-white">{off.active_cases}</span> • SLA: <span className="font-mono text-emerald-400">{off.sla_compliance}%</span>
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-teal-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assignment Instructions / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Immediate priority inspection required. Coordinate with local ward line inspector."
                rows={2}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedOfficerId}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md flex items-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
