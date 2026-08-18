import React, { useState } from 'react';
import { GitMerge, X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  sourceComplaintId: string;
  targetComplaintId: string;
  similarityScore?: number;
  onClose: () => void;
  onMerge: (targetId: string, reason: string) => Promise<void>;
}

export const MergeModal: React.FC<Props> = ({
  isOpen,
  sourceComplaintId,
  targetComplaintId,
  similarityScore = 0.92,
  onClose,
  onMerge,
}) => {
  const [targetId, setTargetId] = useState<string>(targetComplaintId || 'CIVIC-2026-0001');
  const [reason, setReason] = useState<string>(
    `Confirmed duplicate incident of same infrastructure failure (${Math.round(similarityScore * 100)}% semantic match). Merging ticket into master complaint to prevent duplicate dispatch.`
  );
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    setLoading(true);
    try {
      await onMerge(targetId, reason);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-indigo-900/60 bg-slate-900 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GitMerge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Merge Duplicate Complaint</h3>
            <p className="text-xs text-slate-400">Merging: {sourceComplaintId}</p>
          </div>
        </div>

        <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-lg flex items-start gap-2 mb-4 text-xs text-indigo-200">
          <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            This action links this duplicate ticket to the primary master ticket, aggregates citizen population data, and closes the duplicate ticket with an audit trail.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Master Complaint ID (Target)
            </label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Merge Audit Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
              disabled={loading || !targetId.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md flex items-center gap-1.5"
            >
              <GitMerge className="h-4 w-4" />
              <span>{loading ? 'Merging...' : 'Approve & Merge Tickets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
