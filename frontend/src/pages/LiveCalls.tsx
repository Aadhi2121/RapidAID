import React, { useState } from 'react';
import { AIAnalysisResult } from '../types';
import { callsApi, complaintsApi } from '../services/api';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sparkles,
  PhoneCall,
  User,
  MapPin,
  Building,
  UserCheck,
  AlertTriangle,
  GitMerge,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  Globe,
  Smile,
  ShieldCheck,
  Zap,
  Activity,
  Compass,
  Hourglass,
  Users,
  AlertCircle,
  FileAudio,
  Check,
  Info
} from 'lucide-react';

interface Props {
  onComplaintCreated: (id: string) => void;
}

export const LiveCalls: React.FC<Props> = ({ onComplaintCreated }) => {
  const [callerName, setCallerName] = useState<string>('Senthil Nathan');
  const [callerPhone, setCallerPhone] = useState<string>('+91 98401 23456');
  const [callerLocation, setCallerLocation] = useState<string>('Ward 12, Tondiarpet, Chennai');
  const [transcript, setTranscript] = useState<string>(
    'வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.'
  );
  const [selectedLang, setSelectedLang] = useState<string>('ta');
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transcriptionMeta, setTranscriptionMeta] = useState<{
    engine_used?: string;
    detected_language_name?: string;
    language?: string;
    confidence?: number;
    duration_seconds?: number;
    file_name?: string;
  } | null>({
    engine_used: 'Catalog Fallback — Demo',
    detected_language_name: 'Tamil',
    language: 'ta',
    confidence: 0.96,
    duration_seconds: 14.0,
    file_name: 'preset_tamil_water.wav',
  });
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [assignedOfficerId, setAssignedOfficerId] = useState<number | null>(null);

  const handleAudioSelected = (presetId: string, text: string, lang: string) => {
    setCustomAudioFile(null);
    setTranscript(text);
    setSelectedLang(lang);
    setTranscriptionError(null);

    const langNameMap: Record<string, string> = {
      ta: 'Tamil',
      hi: 'Hindi',
      en: 'English',
    };

    setTranscriptionMeta({
      engine_used: 'Catalog Fallback — Demo',
      detected_language_name: langNameMap[lang] || 'Tamil',
      language: lang,
      confidence: 0.96,
      duration_seconds: presetId === 'hindi_power' ? 18.0 : presetId === 'english_sewage' ? 16.0 : 14.0,
      file_name: `${presetId}.wav`,
    });

    if (presetId === 'tamil_water') {
      setCallerName('Senthil Nathan');
      setCallerPhone('+91 98401 23456');
      setCallerLocation('Ward 12, Tondiarpet, Chennai');
    } else if (presetId === 'hindi_power') {
      setCallerName('Rajesh Kumar');
      setCallerPhone('+91 98403 45678');
      setCallerLocation('Ward 8, Kolathur, Chennai');
    } else {
      setCallerName('Priya Ramanathan');
      setCallerPhone('+91 98402 34567');
      setCallerLocation('Anna Nagar West, Ward 104, Chennai');
    }
  };

  const handleFileUpload = async (file: File) => {
    setCustomAudioFile(file);
    setTranscriptionError(null);
    setIsTranscribing(true);

    try {
      // Send real audio file to backend /api/calls/transcribe
      const res = await callsApi.transcribe(file, selectedLang);
      
      const newTranscript = res.transcript || '';
      const newLang = res.language || selectedLang;
      if (newTranscript) {
        setTranscript(newTranscript);
      }
      if (newLang) {
        setSelectedLang(newLang);
      }

      setTranscriptionMeta({
        engine_used: res.engine_used || 'Whisper — Real',
        detected_language_name: res.detected_language_name || 'Detected',
        language: newLang,
        confidence: res.confidence || 0.95,
        duration_seconds: res.duration_seconds,
        file_name: file.name,
      });

      // Update caller location if file has location hints
      let updatedLocation = callerLocation;
      const lower = file.name.toLowerCase();
      if (lower.includes('ward 12') || lower.includes('tondiarpet')) {
        updatedLocation = 'Ward 12, Tondiarpet, Chennai';
        setCallerLocation('Ward 12, Tondiarpet, Chennai');
      } else if (lower.includes('ward 8') || lower.includes('kolathur')) {
        updatedLocation = 'Ward 8, Kolathur, Chennai';
        setCallerLocation('Ward 8, Kolathur, Chennai');
      } else if (lower.includes('anna nagar')) {
        updatedLocation = 'Anna Nagar West, Ward 104, Chennai';
        setCallerLocation('Anna Nagar West, Ward 104, Chennai');
      }

      // Automatically trigger complete AI intelligence pipeline on the transcribed text
      if (newTranscript.trim()) {
        setIsAnalyzing(true);
        try {
          const aiRes = await callsApi.analyze({
            text: newTranscript,
            language: newLang,
            location: updatedLocation,
            caller_name: callerName,
            caller_phone: callerPhone,
          });
          setAiResult(aiRes);
          if (aiRes.recommended_officer?.officer_id) {
            setAssignedOfficerId(aiRes.recommended_officer.officer_id);
          }
        } catch (aiErr: any) {
          console.error('AI pipeline error following upload:', aiErr);
          setTranscriptionError('Transcription succeeded, but AI analysis encountered an error. You can retry clicking "Run AI Intelligence Pipeline".');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to transcribe audio. Please try again.';
      setTranscriptionError(detail);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClearCustomFile = () => {
    setCustomAudioFile(null);
    setTranscriptionError(null);
    handleAudioSelected('tamil_water', 'வார்டு 12-ல் மூன்று நாட்களாக பல தெருக்களில் குடிநீர் விநியோகம் இல்லை. முந்தைய புகார்கள் புறக்கணிக்கப்பட்டன.', 'ta');
  };

  const handleRunAiAnalysis = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await callsApi.analyze({
        text: transcript,
        language: selectedLang,
        location: callerLocation,
        caller_name: callerName,
        caller_phone: callerPhone,
      });
      setAiResult(result);
      if (result.recommended_officer?.officer_id) {
        setAssignedOfficerId(result.recommended_officer.officer_id);
      }
    } catch (e) {
      console.error('AI pipeline error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateOfficialTicket = async () => {
    if (!transcript.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await complaintsApi.create({
        transcript: transcript,
        source: 'VOICE_CALL',
        language: selectedLang,
        citizen_name: callerName,
        citizen_phone: callerPhone,
        location_name: callerLocation,
        latitude: aiResult?.entities.latitude,
        longitude: aiResult?.entities.longitude,
      });

      // If officer was recommended/selected, dispatch them
      if (assignedOfficerId && created.id) {
        try {
          await complaintsApi.assign(created.id, assignedOfficerId, 'Auto-approved AI recommended officer dispatch.');
        } catch (e) {
          console.warn('Assign error:', e);
        }
      }

      onComplaintCreated(created.id);
    } catch (e) {
      console.error('Error creating complaint:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Live Citizen Call Intelligence Station
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-stage AI triage: Audio Ingestion → Whisper ASR → Translation → NLP → Priority (0–100) → SLA Predictor → Intelligent Routing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing || isTranscribing || !transcript.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-civic-600 to-cyan-500 hover:from-civic-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-civic-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isAnalyzing ? 'Executing AI Pipeline...' : 'Run AI Intelligence Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Caller Info, Audio Ingestion & Live Transcript (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Audio Player & Custom File Ingestion */}
          <AudioVisualizer
            onAudioSelected={handleAudioSelected}
            onFileUpload={handleFileUpload}
            customFile={customAudioFile}
            onClearCustomFile={handleClearCustomFile}
            isTranscribing={isTranscribing}
            transcriptionMeta={transcriptionMeta}
          />

          {/* Transcription Error Banner */}
          {transcriptionError && (
            <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold">Transcription Error</p>
                <p className="text-[11px] text-rose-300">{transcriptionError}</p>
              </div>
            </div>
          )}

          {/* Caller Details Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="h-4 w-4 text-civic-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Caller Telephony Metadata
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Citizen Name
                </label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-civic-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-civic-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Citizen Location / Ward
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={callerLocation}
                  onChange={(e) => setCallerLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white focus:border-civic-500 focus:outline-none"
                />
                <MapPin className="h-4 w-4 text-civic-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Transcript & Translation Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-civic-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Raw Voice Transcript (Citizen Vernacular)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isTranscribing && (
                  <span className="text-[10px] font-bold text-amber-400 animate-pulse flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    Transcribing...
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-civic-300 font-mono">
                  {selectedLang.toUpperCase()}
                </span>
              </div>
            </div>

            {transcriptionMeta && (
              <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      transcriptionMeta.engine_used?.toLowerCase().includes('whisper')
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-slate-400">ASR Mode:</span>
                  <span
                    className={`font-semibold font-mono ${
                      transcriptionMeta.engine_used?.toLowerCase().includes('whisper')
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {transcriptionMeta.engine_used}
                  </span>
                </div>
                <span className="text-slate-500 font-mono text-[10px] truncate max-w-[160px]">
                  {transcriptionMeta.file_name || 'audio stream'}
                </span>
              </div>
            )}

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isTranscribing}
                rows={4}
                placeholder={isTranscribing ? 'Processing audio stream with Whisper ASR...' : 'Incoming audio transcript will appear here (or edit freely)...'}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 focus:border-civic-500 focus:outline-none leading-relaxed disabled:opacity-50"
              />
            </div>

            {aiResult && aiResult.translated_transcript && (
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>English Translation (Normalized for Triage)</span>
                  <span className="text-emerald-400 font-mono">NLP Ready</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {aiResult.translated_transcript}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Complete 24-Field AI Analysis & Intelligent Routing Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!aiResult ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 min-h-[520px] flex flex-col items-center justify-center">
              <div className="p-4 rounded-2xl bg-civic-500/10 text-civic-400 border border-civic-500/20 animate-pulse">
                <Cpu className="h-10 w-10" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-bold text-white text-lg">AI Intelligence Pipeline Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload your own recording or pick a preset sample on the left, then click{' '}
                  <strong className="text-civic-300">"Run AI Intelligence Pipeline"</strong> to execute full classification, entity extraction, priority scoring, duplicate clustering, SLA forecasting, and officer routing.
                </p>
              </div>
              <button
                onClick={handleRunAiAnalysis}
                disabled={isTranscribing || !transcript.trim()}
                className="px-5 py-2.5 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold shadow flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Run AI Intelligence Pipeline</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Field 1-4: Structured AI Governance Summary & Priority Level */}
              <div className="rounded-xl border border-civic-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1 max-w-[70%]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-civic-400 block">
                      Structured AI Governance Summary
                    </span>
                    <h2 className="text-base font-bold text-white leading-snug">
                      {aiResult.summary}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge
                      level={aiResult.priority.priority_level}
                      score={aiResult.priority.priority_score}
                      showScore
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      Lang: <strong className="text-civic-300">{aiResult.language}</strong> ({Math.round(aiResult.language_confidence * 100)}% conf)
                    </span>
                  </div>
                </div>

                {/* Fields 5-10: Category, Subcategory, Severity, Urgency, Sentiment & Polarity Score */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                    <span className="font-bold text-white truncate block">{aiResult.category}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subcategory</span>
                    <span className="font-bold text-civic-300 truncate block">
                      {aiResult.subcategory} ({Math.round(aiResult.classification_confidence * 100)}%)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Severity / Urgency</span>
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {aiResult.severity} / {aiResult.urgency}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sentiment Score</span>
                    <span className="font-bold text-rose-300 flex items-center gap-1">
                      <Smile className="h-3 w-3 shrink-0" />
                      {aiResult.sentiment} ({aiResult.sentiment_score > 0 ? `+${aiResult.sentiment_score}` : aiResult.sentiment_score})
                    </span>
                  </div>
                </div>

                {/* Fields 11-13: Extracted Location, Duration, Estimated Affected Population */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-800/80">
                  <div className="p-2.5 rounded-lg border border-slate-800/70 bg-slate-950/60 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-civic-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Extracted Location</span>
                      <span className="font-bold text-white">
                        {aiResult.entities.location_name} ({aiResult.entities.ward})
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        GPS: {aiResult.entities.latitude?.toFixed(4)}, {aiResult.entities.longitude?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-800/70 bg-slate-950/60 flex items-center gap-2">
                    <Hourglass className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration Reported</span>
                      <span className="font-bold text-slate-200">
                        {aiResult.entities.duration || 'Unspecified'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Asset: {aiResult.entities.infrastructure_type || 'Civic'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-800/70 bg-slate-950/60 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Affected Population</span>
                      <span className="font-bold text-indigo-300">
                        ~{aiResult.affected_population} Residents
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {aiResult.entities.has_recurrence_claim ? 'Repeat Grievance' : 'Single Outage Area'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields 18-23: Explainable Priority Engine & SLA Risk Diagnostics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Explainable Priority Card (Fields 18, 19, 20) */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-400" />
                      Priority Engine Score
                    </span>
                    <span className="text-lg font-black font-mono text-rose-400">
                      {aiResult.priority.priority_score}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {aiResult.priority.reasoning}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Severity Weight (30%):</span>
                      <span className="font-mono text-white">{aiResult.priority.breakdown.severity_component} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Urgency Weight (25%):</span>
                      <span className="font-mono text-white">{aiResult.priority.breakdown.urgency_component} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SLA Risk Weight (20%):</span>
                      <span className="font-mono text-white">{aiResult.priority.breakdown.sla_risk_component} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Population Weight (15%):</span>
                      <span className="font-mono text-white">{aiResult.priority.breakdown.population_component} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Recurrence Factor (10%):</span>
                      <span className="font-mono text-white">{aiResult.priority.breakdown.recurrence_component} pts</span>
                    </div>
                  </div>
                </div>

                {/* SLA Resolution & Risk Diagnostics (Fields 21, 22, 23) */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-civic-400" />
                      SLA Resolution Predictor
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        aiResult.sla.sla_risk === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : aiResult.sla.sla_risk === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {aiResult.sla.sla_risk} Risk
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Predicted Resolution</span>
                      <span className="text-xl font-black font-mono text-white">
                        {aiResult.sla.predicted_resolution_hours} Hours
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block">Statutory SLA Target</span>
                      <span className="text-xl font-black font-mono text-civic-400">
                        {aiResult.sla.department_sla_hours} Hours
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                    {aiResult.sla.reasoning}
                  </p>
                </div>
              </div>

              {/* Fields 14, 15: Semantic & Geospatial Duplicate Detection */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <GitMerge className="h-4 w-4 text-indigo-400" />
                    Duplicate & Cluster Detection ({aiResult.duplicates.length} Matches Found)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    TF-IDF Cosine Similarity + Haversine (2km)
                  </span>
                </div>

                {aiResult.duplicates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No existing duplicate grievances identified in this locality.</p>
                ) : (
                  <div className="space-y-2">
                    {aiResult.duplicates.map((dup) => (
                      <div
                        key={dup.complaint_id}
                        className="p-3 rounded-lg border border-indigo-900/60 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white font-mono">{dup.complaint_id}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-200">
                              {Math.round(dup.similarity_score * 100)}% Similarity
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1">{dup.reason}</p>
                        </div>
                        <span className="text-xs text-indigo-300 font-semibold shrink-0">
                          {dup.distance_km} km away
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fields 16, 17 & 24: Department & Officer Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department Recommendation (Fields 16, 17) */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-civic-400">
                      <Building className="h-4 w-4" />
                      <span>Recommended Department</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-civic-900 text-civic-200 font-mono">
                      {Math.round(aiResult.recommended_department.confidence * 100)}% Match
                    </span>
                  </div>
                  <p className="font-bold text-white text-sm">
                    {aiResult.recommended_department.department_name}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {aiResult.recommended_department.reasoning}
                  </p>
                </div>

                {/* Officer Recommendation (Field 24) */}
                <div className="p-4 rounded-xl border border-teal-800/60 bg-teal-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-teal-400">
                      <UserCheck className="h-4 w-4" />
                      <span>Recommended Officer</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-900 text-teal-200 font-mono">
                      {Math.round(aiResult.recommended_officer.confidence * 100)}% Match
                    </span>
                  </div>
                  <p className="font-bold text-white text-sm">
                    {aiResult.recommended_officer.officer_name}
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {aiResult.recommended_officer.reasoning}
                  </p>
                </div>
              </div>

              {/* Final Submit / Create Ticket Bar */}
              <div className="p-5 rounded-xl border border-civic-700 bg-civic-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <h4 className="font-bold text-white text-sm">Create Formal Municipal Work Order</h4>
                  <p className="text-xs text-slate-300">
                    Saves ticket with full AI audit records, notifies assigned field engineer, and tracks statutory SLA.
                  </p>
                </div>

                <button
                  onClick={handleCreateOfficialTicket}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-civic-600 to-cyan-500 hover:from-civic-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-civic-600/40 flex items-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSubmitting ? 'Registering Ticket...' : 'Register Complaint Ticket'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

