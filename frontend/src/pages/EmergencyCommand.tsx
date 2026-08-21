import React, { useState, useEffect } from 'react';
import {
  EmergencyIncident,
  EmergencyResource,
  Hospital,
  HospitalCapacityOverview,
  PatientEmergencyRecord,
  ResourceDispatch,
  GlobalAllocationResult,
  EmergencyAnalytics,
  EmergencyMode,
  PriorityLevel,
} from '../types';
import { emergencyApi } from '../services/api';
import { EmergencyMap } from '../components/EmergencyMap';
import {
  Siren,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Activity,
  HeartPulse,
  Truck,
  Building2,
  Users,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Navigation,
  Sparkles,
  AlertCircle,
  Radio,
  ArrowRight,
  TrendingUp,
  MapPin,
  Stethoscope,
  Wind,
  Shield,
  Layers,
  ChevronRight,
  XCircle,
  Info,
} from 'lucide-react';

export const EmergencyCommand: React.FC = () => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);
  const [allocating, setAllocating] = useState<boolean>(false);
  const [mode, setMode] = useState<EmergencyMode>('DISASTER');
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalCapacity, setHospitalCapacity] = useState<HospitalCapacityOverview | null>(null);
  const [patients, setPatients] = useState<PatientEmergencyRecord[]>([]);
  const [dispatches, setDispatches] = useState<ResourceDispatch[]>([]);
  const [allocationResult, setAllocationResult] = useState<GlobalAllocationResult | null>(null);
  const [analytics, setAnalytics] = useState<EmergencyAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ALLOCATION' | 'HOSPITALS' | 'FLEET' | 'CASUALTIES' | 'MAP'>('OVERVIEW');
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [patientFilter, setPatientFilter] = useState<string>('ALL');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Load all emergency data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        modeData,
        incData,
        resData,
        hospCapData,
        patData,
        dspData,
        allocData,
        anData,
      ] = await Promise.all([
        emergencyApi.getMode(),
        emergencyApi.getIncidents(),
        emergencyApi.getResources(),
        emergencyApi.getHospitalsCapacity(),
        emergencyApi.getPatients(),
        emergencyApi.getDispatches(),
        emergencyApi.allocate(),
        emergencyApi.getAnalytics(),
      ]);

      setMode(modeData.current_mode);
      setIncidents(incData);
      setResources(resData);
      setHospitalCapacity(hospCapData);
      setHospitals(hospCapData.hospitals || []);
      setPatients(patData);
      setDispatches(dspData);
      setAllocationResult(allocData);
      setAnalytics(anData);

      if (incData.length > 0 && !selectedIncident) {
        setSelectedIncident(incData[0]);
      }
    } catch (err) {
      console.error('Error loading emergency data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Mode switcher handler
  const handleModeChange = async (newMode: EmergencyMode) => {
    try {
      const res = await emergencyApi.setMode(
        newMode,
        `Operational mode switched to ${newMode} by Admin Commissioner`,
        'Admin Commissioner'
      );
      setMode(res.current_mode);
      setNotificationBanner(`Emergency Mode shifted to ${newMode}`);
      setTimeout(() => setNotificationBanner(null), 4000);
      loadAllData();
    } catch (err) {
      console.error('Failed to change mode:', err);
    }
  };

  // Trigger disaster scenario reset
  const handleResetScenario = async () => {
    try {
      setResetting(true);
      const res = await emergencyApi.resetScenario();
      setMode(res.emergency_mode);
      setNotificationBanner('Disaster Simulation Scenario Initialized: 3 Incidents & 25 Casualties Loaded');
      setTimeout(() => setNotificationBanner(null), 5000);
      await loadAllData();
    } catch (err) {
      console.error('Error resetting scenario:', err);
    } finally {
      setResetting(false);
    }
  };

  // Re-run AI allocation
  const handleRunAllocation = async () => {
    try {
      setAllocating(true);
      const res = await emergencyApi.allocate();
      setAllocationResult(res);
      setNotificationBanner('AI Resource Allocation & Hospital Routing recalculation complete');
      setTimeout(() => setNotificationBanner(null), 4000);
    } catch (err) {
      console.error('Error running allocation:', err);
    } finally {
      setAllocating(false);
    }
  };

  // Confirm a dispatch recommendation
  const handleConfirmDispatch = async (item: any) => {
    try {
      await emergencyApi.confirmDispatch(
        {
          incident_id: item.incident_id,
          resource_id: item.resource_id,
          status: 'DISPATCHED',
          reasoning: item.reasoning,
          eta_minutes: item.eta_minutes,
        },
        'Admin Commissioner'
      );
      setNotificationBanner(`Unit ${item.resource_name} dispatched to ${item.incident_title}`);
      setTimeout(() => setNotificationBanner(null), 4000);
      loadAllData();
    } catch (err) {
      console.error('Error confirming dispatch:', err);
    }
  };

  // Update dispatch status
  const handleUpdateDispatchStatus = async (dspId: string, newStatus: string) => {
    try {
      await emergencyApi.updateDispatchStatus(dspId, newStatus);
      loadAllData();
    } catch (err) {
      console.error('Error updating dispatch status:', err);
    }
  };

  // Update patient location demo
  const handleSimulatePatientTelemetry = async (patId: string) => {
    try {
      await emergencyApi.updatePatientLocation(patId, {
        current_latitude: 13.0680,
        current_longitude: 80.2620,
        location_source: 'AMBULANCE_GPS',
        location_confidence: 'HIGH',
        rescue_status: 'TRANSPORTING',
        notes: 'In-transit vitals stabilized via continuous mobile mechanical ventilation',
      });
      setNotificationBanner(`Updated live telemetry for casualty ${patId}`);
      setTimeout(() => setNotificationBanner(null), 3000);
      loadAllData();
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (patientFilter !== 'ALL' && p.triage_status !== patientFilter) return false;
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase();
      const matchId = p.id.toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      const matchInc = p.emergency_id.toLowerCase().includes(q);
      if (!matchId && !matchNotes && !matchInc) return false;
    }
    return true;
  });

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'MEDIUM':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/80';
      default:
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    }
  };

  if (loading && !incidents.length) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            Synchronizing rapidAID Emergency Command Center & Fleet Telemetry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans">
      {/* Toast Notification Banner */}
      {notificationBanner && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-emerald-800 bg-slate-900 shadow-2xl flex items-center gap-3 text-xs text-emerald-300 animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{notificationBanner}</span>
        </div>
      )}

      {/* TOP EMERGENCY HEADER BANNER */}
      <div
        className={`rounded-2xl border p-6 lg:p-8 relative overflow-hidden shadow-2xl transition-all ${
          mode === 'DISASTER'
            ? 'border-rose-800/90 bg-gradient-to-r from-rose-950/90 via-slate-950 to-slate-950'
            : mode === 'HIGH_ALERT'
            ? 'border-amber-800/90 bg-gradient-to-r from-amber-950/80 via-slate-950 to-slate-950'
            : mode === 'ELEVATED'
            ? 'border-sky-800/80 bg-gradient-to-r from-sky-950/70 via-slate-950 to-slate-950'
            : 'border-slate-800 bg-slate-900/90'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <Siren className="h-4 w-4 text-rose-400 animate-pulse" />
                <span>rapidAID Emergency Command Center</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                Greater Chennai Municipal Jurisdiction
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Emergency Response & Intelligent Resource Allocation
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              Multi-incident global priority triage, clinical hospital capacity routing, conflict resolution, and automated fleet dispatch for mass casualty disaster events.
            </p>
          </div>

          {/* Action Center: Mode Selector & Disaster Simulation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Emergency Mode Selector */}
            <div className="bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
              {(['NORMAL', 'ELEVATED', 'HIGH_ALERT', 'DISASTER'] as EmergencyMode[]).map((m) => {
                const isActive = mode === m;
                const activeClasses =
                  m === 'DISASTER'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 font-bold'
                    : m === 'HIGH_ALERT'
                    ? 'bg-amber-600 text-white font-bold'
                    : m === 'ELEVATED'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-emerald-600 text-white font-bold';

                return (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                      isActive
                        ? activeClasses
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Simulate Disaster Button */}
            <button
              onClick={handleResetScenario}
              disabled={resetting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 border border-rose-400/30"
            >
              <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Simulating...' : 'SIMULATE DISASTER SCENARIO'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CITYWIDE KPI STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Active Incidents</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">{analytics?.active_incidents || incidents.length}</span>
            <span className="text-[10px] text-rose-400 font-bold">3 Major</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-800/80 bg-rose-950/30 space-y-1">
          <span className="text-[10px] text-rose-300 font-semibold block uppercase">Total Casualties</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-200 font-mono">{analytics?.total_casualties || 53}</span>
            <span className="text-[10px] text-rose-400 font-bold">Citywide</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-800 bg-rose-950/50 space-y-1">
          <span className="text-[10px] text-rose-300 font-semibold block uppercase">Critical Cases</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-300 font-mono">{analytics?.critical_casualties || 12}</span>
            <span className="text-[10px] text-rose-400 font-bold animate-pulse">ICU Tier</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-800/80 bg-amber-950/30 space-y-1">
          <span className="text-[10px] text-amber-300 font-semibold block uppercase">Trapped Victims</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-200 font-mono">{analytics?.trapped_victims || 3}</span>
            <span className="text-[10px] text-amber-400 font-bold">Heavy Rescue</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sky-800/80 bg-slate-900/80 space-y-1">
          <span className="text-[10px] text-sky-400 font-semibold block uppercase">Ambulances Avail</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">
              {analytics?.available_ambulances ?? 5} / {analytics?.total_ambulances ?? 5}
            </span>
            <span className="text-[10px] text-sky-400 font-mono">ALS/BLS</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-orange-800/80 bg-slate-900/80 space-y-1">
          <span className="text-[10px] text-orange-400 font-semibold block uppercase">Fire / Rescue Avail</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">
              {analytics?.available_fire_units ?? 6} / {analytics?.total_fire_units ?? 6}
            </span>
            <span className="text-[10px] text-orange-400 font-mono">Specialized</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-800/80 bg-slate-900/80 space-y-1">
          <span className="text-[10px] text-emerald-300 font-semibold block uppercase">Available ICU Beds</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-300 font-mono">
              {hospitalCapacity?.available_icu_beds ?? 30} / {hospitalCapacity?.total_icu_beds ?? 163}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">4 Hubs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">ER Avg Occupancy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">{hospitalCapacity?.avg_occupancy || 78.5}%</span>
            <span className="text-[10px] text-slate-400 font-mono">Network</span>
          </div>
        </div>
      </div>

      {/* MODULE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Command Overview', icon: Layers },
          { id: 'ALLOCATION', label: 'AI Resource Allocation', icon: Zap, badge: 'AUTO-OPTIMIZE' },
          { id: 'HOSPITALS', label: 'Hospital Routing & Capacity', icon: Building2 },
          { id: 'FLEET', label: 'Fleet Telemetry', icon: Truck },
          { id: 'CASUALTIES', label: 'Casualty Tracker', icon: Users, badge: `${patients.length} ANONYMOUS` },
          { id: 'MAP', label: 'Tactical GIS Map', icon: MapPin },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-civic-600 text-white shadow-lg shadow-civic-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: COMMAND OVERVIEW */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Priority Queue & Incident Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Active Incidents List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                    <span>Emergency Priority Queue (Ranked by AI Engine)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Transparent formula: Casualty Severity (45) + Hazards (25) + Geography (15) + System Stress (15)
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Mode: <strong className="text-rose-300">{mode}</strong>
                </span>
              </div>

              <div className="space-y-3">
                {incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const priColor = getPriorityColor(inc.priority_level);
                  const routing = allocationResult?.hospital_routings?.[inc.id];

                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500/80 bg-rose-950/20 ring-2 ring-rose-500/30 shadow-xl'
                          : 'border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-rose-400">{inc.id}</span>
                          <span className="text-xs font-bold text-slate-400">•</span>
                          <h4 className="font-bold text-white text-sm">{inc.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${priColor}`}>
                            {inc.priority_level} PRIORITY ({inc.priority_score}/100)
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{inc.description}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60 font-mono text-xs">
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block uppercase">Casualties</span>
                          <span className="font-bold text-white">{inc.injured_count} Total</span>
                        </div>
                        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50">
                          <span className="text-[10px] text-rose-400 block uppercase">Critical Cases</span>
                          <span className="font-bold text-rose-300">{inc.critical_count} ICU Needed</span>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/50">
                          <span className="text-[10px] text-amber-400 block uppercase">Trapped / Risk</span>
                          <span className="font-bold text-amber-300">{inc.trapped_count} Extrication</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block uppercase">Location</span>
                          <span className="font-bold text-slate-300 truncate block text-[11px]">{inc.location_name}</span>
                        </div>
                      </div>

                      {/* Hospital Routing Snippet */}
                      {routing && routing.recommended_hospital && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>
                              Optimal Hospital:{' '}
                              <strong className="text-white">{routing.recommended_hospital.name}</strong>
                            </span>
                          </div>
                          <span className="text-emerald-300 font-mono font-bold">
                            ETA: {routing.eta_minutes} min • {routing.recommended_hospital.available_icu_beds} ICU Beds Avail
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Incident Detailed Explainability */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-civic-400" />
                <span>AI Decision Engine Explainability</span>
              </h3>

              {selectedIncident ? (
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Incident Evaluation Profile
                    </span>
                    <h4 className="font-bold text-white text-base mt-0.5">{selectedIncident.title}</h4>
                    <span className="text-xs text-slate-400 font-mono">{selectedIncident.id}</span>
                  </div>

                  {/* Priority Breakdown Gauges */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Priority Score Breakdown (Total: {selectedIncident.priority_score}/100)
                    </span>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Casualty & Triage Severity:</span>
                          <span className="font-bold text-rose-300">
                            {Math.min(45, Math.round(selectedIncident.critical_count * 4 + selectedIncident.trapped_count * 3.5 + selectedIncident.injured_count * 0.5))} / 45
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{
                              width: `${(Math.min(45, selectedIncident.critical_count * 4 + selectedIncident.trapped_count * 3.5 + selectedIncident.injured_count * 0.5) / 45) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Hazard Dynamics (Fire/Collapse/Hazmat):</span>
                          <span className="font-bold text-amber-300">
                            {selectedIncident.collapse_risk === 'HIGH' || selectedIncident.fire_severity === 'HIGH' ? 21 : 12} / 25
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${((selectedIncident.collapse_risk === 'HIGH' || selectedIncident.fire_severity === 'HIGH' ? 21 : 12) / 25) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Geographic & Road Blockages:</span>
                          <span className="font-bold text-sky-300">
                            {selectedIncident.road_accessibility === 'BLOCKED' ? 14 : 9} / 15
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{
                              width: `${((selectedIncident.road_accessibility === 'BLOCKED' ? 14 : 9) / 15) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>System Stress & Emergency Mode ({mode}):</span>
                          <span className="font-bold text-purple-300">14 / 15</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '93%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Required Capabilities Tag List */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Required Unit Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIncident.required_capabilities?.map((cap, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-civic-300 font-bold"
                        >
                          {cap.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Map Shortcut */}
                  <button
                    onClick={() => setActiveTab('MAP')}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-civic-400" />
                    <span>View on Tactical GIS Map</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 text-center text-slate-400 text-xs">
                  Select an incident from the queue to inspect AI priority scoring reasons.
                </div>
              )}
            </div>
          </div>

          {/* Embedded Tactical Map View in Overview */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-civic-400" />
              <span>Real-Time Geospatial Telemetry</span>
            </h3>
            <EmergencyMap
              incidents={incidents}
              resources={resources}
              hospitals={hospitals}
              patients={patients}
              allocationResult={allocationResult}
              onSelectIncident={(id) => {
                const match = incidents.find((inc) => inc.id === id);
                if (match) setSelectedIncident(match);
              }}
              height="450px"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: AI RESOURCE ALLOCATION & CONFLICT / SHORTAGE RESOLUTION */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'ALLOCATION' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span>Multi-Incident Global Resource Allocation Engine</span>
              </h3>
              <p className="text-xs text-slate-400">
                Optimizes dispatch across concurrent emergencies, resolves scarce asset conflicts, and flags fleet capacity shortages.
              </p>
            </div>
            <button
              onClick={handleRunAllocation}
              disabled={allocating}
              className="px-4 py-2 rounded-xl bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${allocating ? 'animate-spin' : ''}`} />
              <span>{allocating ? 'Optimizing...' : 'Recompute Global Allocation'}</span>
            </button>
          </div>

          {/* Conflict Alerts & Shortage Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Resource Conflicts */}
            <div className="p-5 rounded-2xl border border-amber-800/80 bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm border-b border-amber-800/40 pb-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span>Resource Conflict Detections ({allocationResult?.conflicts?.length || 0})</span>
              </div>

              {allocationResult?.conflicts && allocationResult.conflicts.length > 0 ? (
                <div className="space-y-2.5">
                  {allocationResult.conflicts.map((c, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-amber-800/60 bg-slate-950/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-amber-400">{c.resource_id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {c.resource_type}
                        </span>
                      </div>
                      <p className="text-slate-200 font-semibold leading-relaxed">{c.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No competing resource conflicts currently detected.
                </div>
              )}
            </div>

            {/* Resource Shortages */}
            <div className="p-5 rounded-2xl border border-rose-800/80 bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm border-b border-rose-800/40 pb-2">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <span>Fleet & Capacity Shortage Alerts ({allocationResult?.shortages?.length || 0})</span>
              </div>

              {allocationResult?.shortages && allocationResult.shortages.length > 0 ? (
                <div className="space-y-2.5">
                  {allocationResult.shortages.map((s, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-rose-800/60 bg-slate-950/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-rose-400">{s.capability.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          DEFICIT: -{s.deficit} UNITS
                        </span>
                      </div>
                      <p className="text-slate-200 font-semibold leading-relaxed">{s.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Fleet capacity meets current emergency demand thresholds.
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Mitigation Recommendations */}
          {allocationResult?.mitigations && allocationResult.mitigations.length > 0 && (
            <div className="p-5 rounded-2xl border border-civic-800/80 bg-civic-950/30 space-y-3">
              <div className="flex items-center gap-2 text-civic-300 font-bold text-sm">
                <Shield className="h-5 w-5 text-civic-400" />
                <span>AI Tactical Mitigation Protocols</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {allocationResult.mitigations.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-start gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Dispatches Table */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-white text-base">Optimal Dispatch Recommendations</h4>
                <p className="text-xs text-slate-400">Ranks available fleet by equipment compatibility & travel time</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {allocationResult?.allocated_dispatches?.length || 0} Units Recommended
              </span>
            </div>

            <div className="space-y-3">
              {allocationResult?.allocated_dispatches?.map((disp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-sky-400">{disp.resource_id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-bold text-white text-sm">{disp.resource_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {disp.resource_type}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans leading-relaxed">{disp.reasoning}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Target: <strong className="text-white">{disp.incident_title}</strong></span>
                      <span>•</span>
                      <span>ETA: <strong className="text-emerald-400">{disp.eta_minutes} min</strong></span>
                      <span>•</span>
                      <span>Suitability: <strong className="text-civic-300">{disp.suitability_score}/100</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmDispatch(disp)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 shadow-md"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Authorize Dispatch</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: HOSPITAL CAPACITY & INTELLIGENT ROUTING */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'HOSPITALS' && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <span>Hospital Network Capacity & Clinical Routing</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates ICU availability, trauma readiness, and active occupancy to prevent single-hospital saturation during mass casualties.
            </p>
          </div>

          {/* Hospital Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hospitals.map((h) => {
              const icuColor =
                h.available_icu_beds <= 1
                  ? 'text-rose-400 bg-rose-950/40 border-rose-800'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-800';

              return (
                <div
                  key={h.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">{h.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Lat: {h.latitude.toFixed(4)}, Lng: {h.longitude.toFixed(4)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        h.status === 'ACCEPTING'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${icuColor}`}>
                      <span className="text-[11px] font-bold">Available ICU Beds:</span>
                      <span className="text-base font-black">
                        {h.available_icu_beds} / {h.icu_beds}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      <span>Available ER Beds:</span>
                      <span className="font-bold text-white">
                        {h.available_emergency_beds} / {h.emergency_beds}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      <span>Available Ventilators:</span>
                      <span className="font-bold text-sky-300">
                        {h.available_ventilators} / {h.ventilators}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      <span>Operating Theatres:</span>
                      <span className="font-bold text-white">{h.operating_theatre_availability} Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      <span>ER Department Occupancy:</span>
                      <span className="font-bold text-amber-300">{h.emergency_department_occupancy}%</span>
                    </div>
                  </div>

                  {h.trauma_capability && (
                    <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 pt-2 border-t border-slate-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Designated Level-1 Trauma Facility</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explainable Routing Decisions per Incident */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-white text-base">
                Explainable Clinical Hospital Routing Decisions
              </h4>
              <p className="text-xs text-slate-400">
                Demonstrates dynamic capacity routing and why saturated/insufficient facilities are bypassed.
              </p>
            </div>

            <div className="space-y-4">
              {incidents.map((inc) => {
                const routing = allocationResult?.hospital_routings?.[inc.id];
                if (!routing) return null;

                return (
                  <div key={inc.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-xs">
                        {inc.title} ({inc.critical_count} Critical Patients)
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-300">
                        Recommended: {routing.recommended_hospital?.name} (Score: {routing.hospital_score}/100, ETA: {routing.eta_minutes}m)
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      {routing.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {routing.bypassed_hospitals && routing.bypassed_hospitals.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 space-y-1 text-xs">
                        <span className="text-[11px] font-bold text-amber-300 block uppercase">
                          Bypassed Facilities & Clinical Rationale:
                        </span>
                        {routing.bypassed_hospitals.map((b, bi) => (
                          <p key={bi} className="text-slate-300">
                            • <strong className="text-white">{b.hospital_name}</strong> (ETA {b.eta_minutes}m):{' '}
                            <span className="text-amber-200">{b.reason}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: FLEET TELEMETRY */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'FLEET' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-sky-400" />
                <span>Municipal Emergency Fleet Telemetry</span>
              </h3>
              <p className="text-xs text-slate-400">
                Live location, specialized medical/rescue gear, and real-time mission status.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{resources.length} Fleet Units Monitored</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-sky-400">{r.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {r.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.status === 'AVAILABLE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : r.status === 'DISPATCHED' || r.status === 'EN_ROUTE'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{r.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Station: {r.location} • Lat: {r.latitude.toFixed(4)}, Lng: {r.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {r.oxygen_capability && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      Oxygen Support
                    </span>
                  )}
                  {r.ventilator_capability && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                      Transport Ventilator
                    </span>
                  )}
                  {r.paramedic_capability && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Advanced Paramedic
                    </span>
                  )}
                  {r.heavy_rescue_capability && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 font-bold">
                      Heavy Extrication Rig
                    </span>
                  )}
                  {r.hazmat_capability && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      Hazmat Neutralizer
                    </span>
                  )}
                  {r.ladder_capability && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                      54m Aerial Ladder
                    </span>
                  )}
                </div>

                {r.current_assignment && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-mono flex items-center justify-between">
                    <span>Mission: {r.current_assignment}</span>
                    <span className="text-[10px] text-slate-500">ASSIGNED</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 5: ANONYMOUS CASUALTY TRACKER (PAT-1001..25) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'CASUALTIES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <h3 className="font-extrabold text-white text-lg">Anonymous Casualty & Patient Telemetry</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  SIMULATED RECORDS (PAT-1001..25)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-source location tracking (Caller GPS, Device GPS, Ambulance GPS, Hospital Location) without PII leakage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search PAT-ID or Notes..."
                className="bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-white focus:outline-none w-48"
              />

              <select
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Triage (25)</option>
                <option value="CRITICAL">Critical (12)</option>
                <option value="MODERATE">Moderate (8)</option>
                <option value="MINOR">Minor (5)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="p-3.5">Patient ID</th>
                  <th className="p-3.5">Incident</th>
                  <th className="p-3.5">Triage</th>
                  <th className="p-3.5">Rescue Status</th>
                  <th className="p-3.5">Location Source</th>
                  <th className="p-3.5">Ambulance</th>
                  <th className="p-3.5">Destination Hospital</th>
                  <th className="p-3.5">Ventilator</th>
                  <th className="p-3.5">Clinical Notes</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredPatients.map((p) => {
                  const triageColor =
                    p.triage_status === 'CRITICAL'
                      ? 'text-rose-300 bg-rose-950/60 border-rose-800'
                      : p.triage_status === 'MODERATE'
                      ? 'text-amber-300 bg-amber-950/60 border-amber-800'
                      : 'text-emerald-300 bg-emerald-950/60 border-emerald-800';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white">{p.id}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">{p.emergency_id}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${triageColor}`}>
                          {p.triage_status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">{p.rescue_status}</td>
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] text-sky-400">{p.location_source}</div>
                        <div className="text-[10px] text-slate-500">{p.location_confidence} Confidence</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">{p.assigned_ambulance || '—'}</td>
                      <td className="p-3.5 text-slate-200 font-semibold">{p.destination_hospital || '—'}</td>
                      <td className="p-3.5">
                        {p.ventilator_requirement ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                            REQUIRED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">NO</span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-[11px] text-slate-300" title={p.notes}>
                        {p.notes}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSimulatePatientTelemetry(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-civic-300 text-[10px] font-bold font-mono transition-colors"
                        >
                          Simulate GPS
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 6: TACTICAL GIS MAP */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'MAP' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-400" />
                <span>Geospatial Tactical Map & Multi-Layer Telemetry</span>
              </h3>
              <p className="text-xs text-slate-400">
                Interactive OpenStreetMap & CartoDB Dark tactical visualization of Chennai emergency grid.
              </p>
            </div>
          </div>

          <EmergencyMap
            incidents={incidents}
            resources={resources}
            hospitals={hospitals}
            patients={patients}
            allocationResult={allocationResult}
            onSelectIncident={(id) => {
              const match = incidents.find((inc) => inc.id === id);
              if (match) setSelectedIncident(match);
            }}
            height="620px"
          />
        </div>
      )}

      {/* PREDICTIVE INSIGHTS BAR (Always visible at bottom) */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-civic-300 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-civic-400" />
            <span>rapidAID AI Predictive Governance & Early Warnings</span>
          </div>
          <span className="text-[10px] font-mono uppercase text-slate-500">
            Automated Forecasting Models
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {analytics?.predictive_insights?.map((ins, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1.5 text-xs">
              <span className="font-bold text-rose-300 block">{ins.title}</span>
              <p className="text-slate-300 leading-snug">{ins.description}</p>
              <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span>{ins.recommended_action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmergencyCommand;
