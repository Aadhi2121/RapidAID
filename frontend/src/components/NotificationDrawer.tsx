import React, { useState, useEffect } from 'react';
import { NotificationItem } from '../types';
import { notificationsApi } from '../services/api';
import { Bell, X, CheckCheck, AlertTriangle, UserCheck, Clock, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectComplaint?: (id: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectComplaint,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const list = await notificationsApi.getAll();
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markItemRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-civic-400" />
          <h3 className="font-bold text-white text-base">Civic Intelligence Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            title="Mark all as read"
            className="flex items-center gap-1 text-xs text-civic-400 hover:text-civic-300 font-semibold px-2 py-1 rounded hover:bg-slate-800"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark read</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-10">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-10">No recent notifications.</div>
        ) : (
          notifications.map((n) => {
            const isAlert = n.type === 'CRITICAL_ALERT' || n.type === 'SLA_WARNING';
            return (
              <div
                key={n.id}
                onClick={() => {
                  markItemRead(n.id);
                  if (n.complaint_id && onSelectComplaint) {
                    onSelectComplaint(n.complaint_id);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  !n.read
                    ? isAlert
                      ? 'border-rose-800/80 bg-rose-950/30'
                      : 'border-civic-800/80 bg-civic-950/30'
                    : 'border-slate-800 bg-slate-950/60 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isAlert ? 'text-rose-300' : 'text-civic-300'}`}>
                    {n.title}
                  </span>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-civic-400 ring-2 ring-slate-900"></span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2">{n.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{n.complaint_id ? `Ticket: ${n.complaint_id}` : 'System'}</span>
                  <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
