import React, { useState } from 'react';
import { AlertOctagon, X, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  complaintId: string;
  onClose: () => void;
  onEscalate: (reason: string) => Promise<void>;
}

export const EscalateModal: React.FC<Props> = ({
  isOpen,
  complaintId,
  onClose,
  onEscalate,
}) => {
  const [reason, setReason] = useState<string>('SLA breach imminent due to complex technical pipeline replacement. Requires senior zonal engineer intervention.');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onEscalate(reason);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-rose-900/60 bg-slate-900 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Escalate Grievance Priority</h3>
            <p className="text-xs text-slate-400">Target Ticket: {complaintId}</p>
          </div>
        </div>

        <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg flex items-start gap-2 mb-4 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            Escalation elevates priority score to <strong>CRITICAL</strong>, triggers high-priority supervisor notifications, and fast-tracks administrative review.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Escalation Audit Justification
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
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
              disabled={loading || !reason.trim()}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md flex items-center gap-1.5"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>{loading ? 'Escalating...' : 'Confirm Escalation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
