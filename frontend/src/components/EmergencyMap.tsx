import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import {
  EmergencyIncident,
  EmergencyResource,
  Hospital,
  PatientEmergencyRecord,
  GlobalAllocationResult,
} from '../types';
import {
  ShieldAlert,
  Building2,
  Ambulance,
  Flame,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Truck,
  Users,
  Navigation,
  Info,
} from 'lucide-react';

interface Props {
  incidents: EmergencyIncident[];
  resources: EmergencyResource[];
  hospitals: Hospital[];
  patients?: PatientEmergencyRecord[];
  allocationResult?: GlobalAllocationResult | null;
  onSelectIncident?: (id: string) => void;
  height?: string;
}

const CHENNAI_CENTER: [number, number] = [13.0604, 80.2496];

export const EmergencyMap: React.FC<Props> = ({
  incidents,
  resources,
  hospitals,
  patients = [],
  allocationResult,
  onSelectIncident,
  height = '560px',
}) => {
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showResources, setShowResources] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showPatients, setShowPatients] = useState<boolean>(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterPriority !== 'ALL' && inc.priority_level !== filterPriority) return false;
    return true;
  });

  const getIncidentColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#f43f5e'; // Rose
      case 'HIGH':
        return '#f59e0b'; // Amber
      case 'MEDIUM':
        return '#38bdf8'; // Sky
      default:
        return '#10b981';
    }
  };

  const getHospitalColor = (h: Hospital) => {
    if (h.status === 'FULL' || h.emergency_department_occupancy >= 90) return '#ef4444';
    if (h.status === 'LIMITED' || h.available_icu_beds <= 2) return '#f59e0b';
    return '#10b981';
  };

  const getResourceColor = (r: EmergencyResource) => {
    if (r.category === 'AMBULANCE') {
      return r.resource_type === 'VENTILATOR_AMBULANCE' ? '#a855f7' : '#0284c7';
    }
    if (r.heavy_rescue_capability) return '#ea580c';
    if (r.hazmat_capability) return '#eab308';
    return '#e11d48';
  };

  const getTriageColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return '#f43f5e';
      case 'MODERATE':
        return '#f59e0b';
      case 'MINOR':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
      {/* Top Map Control & Legend Bar */}
      <div className="p-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                rapidAID Geospatial Tactical Map
              </h4>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 animate-pulse">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visualizing {incidents.length} active emergencies, {resources.length} units, {hospitals.length} hospitals, and {patients.length} casualties
            </p>
          </div>
        </div>

        {/* Layer Toggles & Priority Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 ${
                showIncidents
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Incidents ({filteredIncidents.length})</span>
            </button>

            <button
              onClick={() => setShowResources(!showResources)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 ${
                showResources
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Truck className="h-3 w-3" />
              <span>Fleet ({resources.length})</span>
            </button>

            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 ${
                showHospitals
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              onClick={() => setShowPatients(!showPatients)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 ${
                showPatients
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="h-3 w-3" />
              <span>Casualties ({patients.length})</span>
            </button>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div style={{ height, width: '100%' }} className="relative z-0">
        <MapContainer
          center={CHENNAI_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', backgroundColor: '#090e17' }}
        >
          {/* CartoDB Dark Matter tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> | rapidAID Command'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* 1. RENDER ACTIVE EMERGENCY INCIDENTS */}
          {showIncidents &&
            filteredIncidents.map((inc) => {
              const color = getIncidentColor(inc.priority_level);
              const routing = allocationResult?.hospital_routings?.[inc.id];
              return (
                <React.Fragment key={`inc-${inc.id}`}>
                  {/* Outer Pulsing Aura for Critical Incidents */}
                  {inc.priority_level === 'CRITICAL' && (
                    <CircleMarker
                      center={[inc.latitude, inc.longitude]}
                      radius={26}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.15,
                        weight: 1,
                        dashArray: '4, 4',
                      }}
                    />
                  )}

                  {/* Inner Tactical Marker */}
                  <CircleMarker
                    center={[inc.latitude, inc.longitude]}
                    radius={inc.priority_level === 'CRITICAL' ? 14 : 10}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: color,
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                      <span className="font-bold text-xs">
                        {inc.title} ({inc.priority_score}/100)
                      </span>
                    </Tooltip>

                    <Popup className="emergency-leaflet-popup">
                      <div className="p-3.5 space-y-2.5 max-w-sm text-slate-100 font-sans text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-mono font-bold text-rose-400">{inc.id}</span>
                          <span
                            className="font-bold px-2 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: `${color}25`, color }}
                          >
                            {inc.priority_level} PRIORITY ({inc.priority_score}/100)
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-white leading-tight">{inc.title}</h4>
                        <p className="text-[11px] text-slate-300 leading-snug">{inc.description}</p>

                        <div className="grid grid-cols-3 gap-1.5 py-1 bg-slate-950 p-2 rounded-lg border border-slate-800 text-center font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Injured</span>
                            <span className="font-bold text-white text-xs">{inc.injured_count}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-rose-400 block">Critical</span>
                            <span className="font-bold text-rose-300 text-xs">{inc.critical_count}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-400 block">Trapped</span>
                            <span className="font-bold text-amber-300 text-xs">{inc.trapped_count}</span>
                          </div>
                        </div>

                        {routing && routing.recommended_hospital && (
                          <div className="p-2.5 rounded-lg border border-emerald-800/70 bg-emerald-950/40 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                              <span>Optimal Hospital Route:</span>
                              <span className="font-mono">ETA: {routing.eta_minutes}m</span>
                            </div>
                            <p className="font-bold text-white text-xs">
                              {routing.recommended_hospital.name}
                            </p>
                            <p className="text-[10px] text-slate-300">
                              {routing.reasons?.[1] || 'Sufficient clinical ICU capacity'}
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">
                            SIMULATED DATA • rapidAID
                          </span>
                          {onSelectIncident && (
                            <button
                              onClick={() => onSelectIncident(inc.id)}
                              className="text-civic-400 hover:text-civic-300 font-bold underline"
                            >
                              View Command
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}

          {/* 2. RENDER NETWORK HOSPITALS */}
          {showHospitals &&
            hospitals.map((h) => {
              const color = getHospitalColor(h);
              return (
                <CircleMarker
                  key={`hosp-${h.id}`}
                  center={[h.latitude, h.longitude]}
                  radius={11}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]}>
                    <span className="font-bold text-xs">
                      🏥 {h.name} (ICU: {h.available_icu_beds}/{h.icu_beds})
                    </span>
                  </Tooltip>

                  <Popup>
                    <div className="p-3 space-y-2 max-w-xs text-slate-100 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-white">{h.name}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          {h.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-2 rounded border border-slate-800 text-center font-mono text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Avail ICU</span>
                          <span
                            className={`font-bold ${
                              h.available_icu_beds <= 1 ? 'text-rose-400' : 'text-emerald-300'
                            }`}
                          >
                            {h.available_icu_beds}/{h.icu_beds}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Avail ER</span>
                          <span className="font-bold text-white">
                            {h.available_emergency_beds}/{h.emergency_beds}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Vents</span>
                          <span className="font-bold text-sky-300">
                            {h.available_ventilators}/{h.ventilators}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>Occupancy:</span>
                        <span className="font-mono font-bold text-white">
                          {h.emergency_department_occupancy}%
                        </span>
                      </div>

                      {h.trauma_capability && (
                        <div className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Designated Level-1 Trauma Capability</span>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                        SIMULATED DATA • Network Facility
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* 3. RENDER EMERGENCY FLEET (Ambulances & Fire Units) */}
          {showResources &&
            resources.map((r) => {
              const color = getResourceColor(r);
              return (
                <CircleMarker
                  key={`res-${r.id}`}
                  center={[r.latitude, r.longitude]}
                  radius={7}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: color,
                    fillOpacity: 0.95,
                    weight: 1.5,
                  }}
                >
                  <Tooltip direction="bottom" offset={[0, 8]}>
                    <span className="font-bold text-[11px]">
                      {r.name} ({r.status})
                    </span>
                  </Tooltip>

                  <Popup>
                    <div className="p-2.5 space-y-1.5 text-slate-100 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="font-mono font-bold text-sky-400">{r.id}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {r.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs">{r.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        Station: {r.location} | Type: {r.resource_type}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.oxygen_capability && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            Oxygen
                          </span>
                        )}
                        {r.ventilator_capability && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                            Ventilator
                          </span>
                        )}
                        {r.paramedic_capability && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Paramedic
                          </span>
                        )}
                        {r.heavy_rescue_capability && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            Heavy Rescue
                          </span>
                        )}
                        {r.hazmat_capability && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                            Hazmat
                          </span>
                        )}
                      </div>

                      {r.current_assignment && (
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-amber-300 font-mono">
                          Assigned to: {r.current_assignment}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* 4. RENDER CASUALTIES (PAT-1001..25) */}
          {showPatients &&
            patients
              .filter((p) => p.current_latitude && p.current_longitude)
              .map((p) => {
                const color = getTriageColor(p.triage_status);
                return (
                  <CircleMarker
                    key={`pat-${p.id}`}
                    center={[p.current_latitude!, p.current_longitude!]}
                    radius={4.5}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.8,
                      weight: 1,
                    }}
                  >
                    <Tooltip direction="bottom" offset={[0, 6]}>
                      <span className="font-mono text-[10px]">
                        {p.id} [{p.triage_status}]
                      </span>
                    </Tooltip>

                    <Popup>
                      <div className="p-2 space-y-1 text-slate-100 text-xs font-sans">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-mono font-bold text-white">{p.id}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${color}25`, color }}
                          >
                            {p.triage_status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{p.notes}</p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Source: {p.location_source} ({p.location_confidence} Conf)
                        </div>
                        {p.ventilator_requirement && (
                          <span className="text-[9px] font-bold text-rose-400 block">
                            ⚠️ Ventilator Required
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono block">
                          SIMULATED ANONYMOUS TELEMETRY
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
        </MapContainer>
      </div>

      {/* Bottom Status Legend */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Critical Emergency / Triage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>High Priority / Limited Bed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Hospital Accepting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span>Ambulance Unit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span>Fire / Heavy Rescue</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
          <Info className="h-3 w-3" />
          <span>All GPS coordinates and telemetry represent simulated emergency benchmark data.</span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyMap;
