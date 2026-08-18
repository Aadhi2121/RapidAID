import React, { useState } from 'react';
import { Complaint } from '../types';
import { complaintsApi } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LifecycleTimeline } from '../components/LifecycleTimeline';
import { AudioVisualizer } from '../components/AudioVisualizer';
import {
  User,
  PhoneCall,
  Search,
  CheckCircle2,
  Clock,
  Building,
  MapPin,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface Props {
  onSelectComplaint?: (id: string) => void;
}

export const CitizenPortal: React.FC<Props> = ({ onSelectComplaint }) => {
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'TRACK'>('SUBMIT');

  // Submission Form State
  const [name, setName] = useState<string>('Senthil Nathan');
  const [phone, setPhone] = useState<string>('+91 98401 23456');
  const [location, setLocation] = useState<string>('Ward 12, Tondiarpet, Chennai');
  const [language, setLanguage] = useState<string>('ta');
  const [complaintText, setComplaintText] = useState<string>(
    'வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);

  // Tracking State
  const [trackQuery, setTrackQuery] = useState<string>('CIVIC-2026-0001');
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleAudioSelected = (presetId: string, text: string, lang: string) => {
    setComplaintText(text);
    setLanguage(lang);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmitting(true);
    try {
      const created = await complaintsApi.create({
        transcript: complaintText,
        source: 'WEB_PORTAL',
        language: language,
        citizen_name: name,
        citizen_phone: phone,
        location_name: location,
      });
      setSubmittedTicket(created);
      setTrackedComplaint(created);
      setActiveTab('TRACK');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackingLoading(true);
    setTrackError(null);
    try {
      const result = await complaintsApi.getById(trackQuery.trim());
      setTrackedComplaint(result);
    } catch (err) {
      setTrackError(`Ticket '${trackQuery}' not found. Please verify your reference number.`);
      setTrackedComplaint(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Citizen Banner */}
      <div className="rounded-2xl border border-civic-800/80 bg-gradient-to-r from-slate-900 via-civic-950 to-slate-950 p-6 lg:p-8 relative shadow-xl text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-500/15 border border-civic-500/30 text-civic-300 text-xs font-semibold">
          <User className="h-3.5 w-3.5" />
          <span>Greater Chennai Citizen Grievance Redressal</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Citizen Voice & Grievance Service
        </h1>
        <p className="text-xs lg:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Submit complaints in your preferred language (Tamil, Hindi, English). Our AI instantly translates, routes, and predicts resolution times under municipal charters.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setActiveTab('SUBMIT')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SUBMIT'
                ? 'bg-civic-600 text-white shadow-lg shadow-civic-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Submit New Grievance
          </button>
          <button
            onClick={() => {
              setActiveTab('TRACK');
              if (!trackedComplaint) {
                // Auto load sample
                complaintsApi.getById('CIVIC-2026-0001').then(setTrackedComplaint).catch(() => {});
              }
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TRACK'
                ? 'bg-civic-600 text-white shadow-lg shadow-civic-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Track Existing Grievance
          </button>
        </div>
      </div>

      {activeTab === 'SUBMIT' ? (
        /* Submission Form View */
        <div className="space-y-6">
          <AudioVisualizer onAudioSelected={handleAudioSelected} />

          <form onSubmit={handleFormSubmit} className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider border-b border-slate-800 pb-3">
              Citizen Contact & Grievance Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-civic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Mobile Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-civic-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Ward / Area</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="e.g., Ward 12, Tondiarpet, Chennai"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-civic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-civic-500 focus:outline-none cursor-pointer"
                >
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Describe Your Issue (Speak in Audio above or type below)
              </label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={4}
                required
                placeholder="Detail the location, duration, and nature of the grievance..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-civic-500 focus:outline-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !complaintText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-civic-600 to-cyan-500 hover:from-civic-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-civic-600/30 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting & Analyzing Grievance...' : 'Submit Citizen Grievance'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Tracking View */
        <div className="space-y-6">
          {/* Tracking Search Input */}
          <form onSubmit={handleTrackSubmit} className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Enter Ticket Reference ID (e.g. CIVIC-2026-0001)..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:border-civic-500 focus:outline-none"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-5 py-2.5 rounded-lg bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              <span>{trackingLoading ? 'Searching...' : 'Track Ticket'}</span>
            </button>
          </form>

          {trackError && (
            <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/40 text-rose-300 text-xs">
              {trackError}
            </div>
          )}

          {trackedComplaint && (
            <div className="space-y-6 animate-fadeIn">
              {/* Ticket Overview Card */}
              <div className="rounded-xl border border-civic-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs text-civic-400 font-bold block">
                      {trackedComplaint.id}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      {trackedComplaint.summary || trackedComplaint.transcript}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge
                      level={trackedComplaint.priority_level}
                      score={trackedComplaint.priority_score}
                      showScore
                    />
                    <StatusBadge status={trackedComplaint.status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <Building className="h-3 w-3 text-civic-400" />
                      Assigned Department
                    </span>
                    <span className="font-bold text-white block">
                      {trackedComplaint.department_name || 'Greater Chennai Corporation'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-civic-400" />
                      Expected Resolution
                    </span>
                    <span className="font-bold text-emerald-400 block font-mono">
                      Within {trackedComplaint.sla_hours} Hours (by {new Date(new Date(trackedComplaint.created_at).getTime() + trackedComplaint.sla_hours * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-civic-400" />
                      Location
                    </span>
                    <span className="font-bold text-slate-200 block truncate">
                      {trackedComplaint.location_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Lifecycle Progression */}
              <LifecycleTimeline
                currentStatus={trackedComplaint.status}
                events={trackedComplaint.events || []}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
