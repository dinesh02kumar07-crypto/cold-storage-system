/**
 * ColdChain AI - Ambient Weather & Environmental Thermal Load Module
 * Forecasts ambient heatwaves along transit corridors and computes
 * mechanical compressor head-pressure multipliers.
 */

import React, { useState } from 'react';
import {
  CloudSun,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  RotateCw,
  AlertTriangle,
  Zap,
  Gauge,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';

export const AmbientWeather: React.FC = () => {
  const { weather, refreshWeather, vehicles } = useColdChain();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      refreshWeather();
      setIsRefreshing(false);
    }, 450);
  };

  // Weather points along transit corridor
  const corridorStations = [
    {
      location: 'Metro BioLogistics Hub (Secaucus, NJ)',
      temp: weather.temp - 1.2,
      condition: 'Sunny',
      humidity: weather.humidity - 4,
      reeferStress: 'Moderate (+18%)',
    },
    {
      location: 'Midtown Hudson Corridor (Waystation)',
      temp: weather.temp + 1.8,
      condition: 'Extreme Heat Haze',
      humidity: weather.humidity + 5,
      reeferStress: 'Severe (+38%)',
    },
    {
      location: 'Memorial Hospital Intake Bay (York Ave)',
      temp: weather.temp + 0.4,
      condition: 'Scattered Clouds',
      humidity: weather.humidity,
      reeferStress: 'Moderate (+22%)',
    },
    {
      location: 'St. Jude Children Research Receiving (71st St)',
      temp: weather.temp - 0.2,
      condition: 'Partly Cloudy',
      humidity: weather.humidity - 2,
      reeferStress: 'Normal (+10%)',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Ambient Weather & Thermal Environment Telemetry
            </h2>
            <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
              OpenMeteo / WeatherAPI Live Adapter
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Microclimate monitoring along transit corridors to predict condenser thermal load spikes
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Fetching Telemetry...' : 'Refresh Weather API'}</span>
        </button>
      </div>

      {/* Main Weather Hero Card */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-blue-50/40 p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Sun className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Corridor Macro Station
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  High Ambient Heat Advisory
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{weather.city}</h3>
              <p className="text-xs text-slate-600 font-medium">{weather.condition} • Sun UV Index: {weather.uvIndex}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-6">
            <div>
              <div className="text-4xl font-black font-mono text-slate-900">{weather.temp.toFixed(1)}°C</div>
              <div className="text-xs text-slate-500">Feels like: {weather.feelsLike.toFixed(1)}°C</div>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Humidity: <strong>{weather.humidity}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                <span>Wind: <strong>{weather.windSpeedKmH} km/h</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                <span>Rain Risk: <strong>{weather.rainProbabilityPercent}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Thermal Refrigeration Impact Banner */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-slate-700">
              Reefer Compressor Thermal Load Multiplier: <strong className="text-amber-800">{weather.refrigLoadImpact}</strong>
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            High ambient air increases compressor delta-T by +27.4°C, reducing battery run-time on electric reefers.
          </span>
        </div>
      </div>

      {/* Hourly Forecast along Corridor */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Hourly Weather Forecast (Corridor Transit Timeline)</h3>
        <p className="text-xs text-slate-500 mb-4">
          Anticipated ambient temperature progression across the delivery schedule
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {weather.forecast.map((fc, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                fc.temp >= 35
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 block">{fc.hour}</span>
              <CloudSun className="w-6 h-6 text-amber-500 mx-auto my-2" />
              <span className="text-lg font-bold font-mono text-slate-900 block">{fc.temp.toFixed(1)}°C</span>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">{fc.condition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Corridor Station Microclimate Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Waypoint & Receiving Dock Microclimates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific environmental measurements at origin, intermediate choke-points, and hospital intake bays
            </p>
          </div>
          <span className="text-xs text-slate-400">4 Microstations Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Station Location</th>
                <th className="py-3 px-4">Current Temp</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Relative Humidity</th>
                <th className="py-3 px-4">Compressor Thermal Stress</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {corridorStations.map((station, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    {station.location}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{station.temp.toFixed(1)}°C</td>
                  <td className="py-3.5 px-4">{station.condition}</td>
                  <td className="py-3.5 px-4 font-mono">{station.humidity}%</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        station.reeferStress.includes('Severe')
                          ? 'bg-red-100 text-red-800'
                          : station.reeferStress.includes('Moderate')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {station.reeferStress}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Online
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
