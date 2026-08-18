import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { HotspotPoint } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { MapPin, AlertTriangle, Layers, Filter } from 'lucide-react';

interface Props {
  hotspots: HotspotPoint[];
  onSelectComplaint?: (id: string) => void;
  height?: string;
}

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

export const LeafletHotspotMap: React.FC<Props> = ({
  hotspots,
  onSelectComplaint,
  height = '500px',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(hotspots.map((h) => h.category)))];
  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredHotspots = hotspots.filter((h) => {
    if (selectedCategory !== 'ALL' && h.category !== selectedCategory) return false;
    if (selectedPriority !== 'ALL' && h.priority_level !== selectedPriority) return false;
    return true;
  });

  const getMarkerColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#f43f5e'; // Rose
      case 'HIGH':
        return '#f59e0b'; // Amber
      case 'MEDIUM':
        return '#38bdf8'; // Sky
      case 'LOW':
        return '#10b981'; // Emerald
      default:
        return '#38bdf8';
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Map Control Bar */}
      <div className="p-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-civic-500/10 text-civic-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Chennai Geospatial Intelligence Map
            </h4>
            <p className="text-[11px] text-slate-400">
              Showing {filteredHotspots.length} geo-referenced complaints & cluster density
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Filter className="h-3 w-3 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              {priorities.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-slate-200">
                  {p === 'ALL' ? 'All Priorities' : `${p} Priority`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Map Body */}
      <div style={{ height }} className="w-full relative z-0">
        <MapContainer
          center={CHENNAI_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Free OpenStreetMap Dark CartoDB Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {filteredHotspots.map((point) => {
            const color = getMarkerColor(point.priority_level);
            const radius = point.priority_level === 'CRITICAL' ? 12 : point.priority_level === 'HIGH' ? 10 : 8;

            return (
              <CircleMarker
                key={point.id}
                center={[point.latitude, point.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: '#ffffff',
                  weight: 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="text-xs font-semibold">
                    <span>{point.id}</span> — {point.ward}
                  </div>
                </Tooltip>

                <Popup>
                  <div className="p-1 space-y-2 min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <span className="font-bold text-xs text-white">{point.id}</span>
                      <PriorityBadge level={point.priority_level} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-200">{point.category}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-civic-400" />
                        <span>{point.location_name}</span>
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 line-clamp-2">
                      {point.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge status={point.status} />
                      {onSelectComplaint && (
                        <button
                          onClick={() => onSelectComplaint(point.id)}
                          className="text-xs font-semibold text-civic-400 hover:text-civic-300 underline"
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 shadow-lg text-xs space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Priority Density
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-rose-300">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Critical
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> High
            </span>
            <span className="flex items-center gap-1 text-[11px] text-sky-300">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400"></span> Medium
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span> Low
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
