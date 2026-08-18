import React, { useState, useEffect } from 'react';
import { AnalyticsHotspots } from '../types';
import { analyticsApi } from '../services/api';
import { LeafletHotspotMap } from '../components/LeafletHotspotMap';
import {
  MapPin,
  AlertTriangle,
  Layers,
  Building,
  TrendingUp,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface Props {
  onSelectComplaint: (id: string) => void;
}

export const Hotspots: React.FC<Props> = ({ onSelectComplaint }) => {
  const [data, setData] = useState<AnalyticsHotspots | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHotspots = async () => {
      try {
        setLoading(true);
        const result = await analyticsApi.getHotspots();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadHotspots();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-civic-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Rendering Chennai geospatial coordinates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-civic-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Geospatial Hotspot & Density Analysis
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time GIS cluster visualization of citizen grievances across Greater Chennai wards.
          </p>
        </div>
      </div>

      {/* Critical Hotspot Zones Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Zonal High-Density Hotspot Clusters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.critical_zones.map((zone, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-rose-900/60 bg-gradient-to-b from-rose-950/30 to-slate-900 shadow-md space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{zone.zone}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900 text-rose-200 uppercase">
                  {zone.risk} Risk
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-rose-400">
                  {zone.cluster_size}
                </span>
                <span className="text-xs text-slate-400">active complaints</span>
              </div>

              <p className="text-[11px] text-slate-300 border-t border-slate-800/80 pt-1.5">
                <strong>Primary Failure:</strong> {zone.primary_issue}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
        <LeafletHotspotMap
          hotspots={data.hotspots}
          onSelectComplaint={onSelectComplaint}
          height="600px"
        />
      </div>
    </div>
  );
};
