import React, { useState } from 'react';
import { CheckCircle2, X, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  complaintId: string;
  onClose: () => void;
  onResolve: (notes: string, resolvedBy?: string) => Promise<void>;
}

export const ResolveModal: React.FC<Props> = ({
  isOpen,
  complaintId,
  onClose,
  onResolve,
}) => {
  const [notes, setNotes] = useState<string>('Field technical crew arrived on-site. Repaired damaged supply pipeline and restored normal municipal water pressure. Verified zero leaks with Ward Line Inspector.');
  const [resolvedBy, setResolvedBy] = useState<string>('Er. K. Natarajan (Field Engineer)');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await onResolve(notes, resolvedBy);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-emerald-900/60 bg-slate-900 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Mark Complaint Resolved</h3>
            <p className="text-xs text-slate-400">Target Ticket: {complaintId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Resolved By (Officer / Team Lead)
            </label>
            <input
              type="text"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Field Completion Report / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
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
              disabled={loading || !notes.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? 'Resolving...' : 'Complete & Close Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
