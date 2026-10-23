/**
 * ColdChain AI - Route Optimization Module
 * Evaluates transit time, heatwave exposure corridors, urban traffic congestion,
 * and emergency cold-hub fallback waypoints to deliver temperature-sensitive medicine safely.
 */

import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  Flame,
  Truck,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Building,
  Zap,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';
import { RouteOption } from '../../types/coldchain';
import { scoreRouteOption } from '../../utils/coldchainMath';

export const RouteOptimization: React.FC = () => {
  const { vehicles, shipments, weather } = useColdChain();

  // Route Planning Inputs
  const [selectedVehicleId, setSelectedVehicleId] = useState('V-104');
  const [selectedDestination, setSelectedDestination] = useState('HOSP-MEMORIAL');
  const [cargoType, setCargoType] = useState('vaccine');
  const [maxStops, setMaxStops] = useState(3);
  const [priority, setPriority] = useState<'critical' | 'high' | 'standard'>('critical');
  const [activeRouteId, setActiveRouteId] = useState<string>('route-opt-1');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(true);

  // Available Route Alternatives
  const [routes, setRoutes] = useState<RouteOption[]>([
    {
      id: 'route-opt-1',
      name: 'Primary Thermal Bypass (Via I-95 & Apex Cold Hub)',
      distanceKm: 28.4,
      durationMins: 38,
      weatherExposure: 'Low',
      trafficLevel: 'Light',
      deadlineFeasible: true,
      estimatedTempRisk: 'Low',
      fuelCostEst: 14.5,
      compositeScore: 92,
      waypoints: [],
      stops: [],
      isRecommended: true,
      hasColdHubOnWay: true,
      rationale:
        'Recommended: Bypasses dense midtown traffic choke-points, operates in open-air corridor (-2.2°C ambient reduction), and includes Apex Cryo-Storage Depot as an intermediate safety checkpoint.',
    },
    {
      id: 'route-opt-2',
      name: 'Direct Urban Arterial (Queens Midtown Expressway)',
      distanceKm: 22.1,
      durationMins: 54,
      weatherExposure: 'High',
      trafficLevel: 'Heavy',
      deadlineFeasible: true,
      estimatedTempRisk: 'High',
      fuelCostEst: 18.2,
      compositeScore: 64,
      waypoints: [],
      stops: [],
      isRecommended: false,
      hasColdHubOnWay: false,
      rationale:
        'Shorter physical distance but encounters 54 mins of bumper-to-bumper traffic under 35.5°C heat. Severe thermal strain on reefer compressor.',
    },
    {
      id: 'route-opt-3',
      name: 'Northern Parkway Secondary Corridor',
      distanceKm: 31.8,
      durationMins: 44,
      weatherExposure: 'Moderate',
      trafficLevel: 'Moderate',
      deadlineFeasible: true,
      estimatedTempRisk: 'Moderate',
      fuelCostEst: 16.0,
      compositeScore: 78,
      waypoints: [],
      stops: [],
      isRecommended: false,
      hasColdHubOnWay: false,
      rationale:
        'Acceptable travel time with moderate weather risk, but lacks immediate cold-hub storage access in case of compressor trip.',
    },
  ]);

  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Re-score based on inputs
      const scored = routes.map((r, i) => {
        const result = scoreRouteOption({
          distanceKm: r.distanceKm,
          durationMins: r.durationMins,
          weatherExposure: r.weatherExposure,
          trafficLevel: r.trafficLevel,
          hasColdHubOnWay: r.hasColdHubOnWay,
          cargoThermalSensitivity: priority === 'critical' ? 3 : 2,
        });
        return {
          ...r,
          compositeScore: result.score,
          isRecommended: i === 0,
        };
      });

      setRoutes(scored);
      setIsOptimizing(false);
      setOptimizationComplete(true);
    }, 600);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Intelligent Cold-Chain Route Optimization
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimizes delivery routes factoring in cargo thermal sensitivity, ambient heat corridors, traffic delays, and emergency cold hubs
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Evaluating Corridors...' : 'Optimize Delivery Route'}</span>
        </button>
      </div>

      {/* Main Grid: Parameters Form (Left) & Interactive Route Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Constraints & Parameters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            Route Planning Parameters
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Reefer Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.id}) - {v.currentTemp.toFixed(1)}°C
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Origin Warehouse</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                Metro BioLogistics Central Hub (Secaucus, NJ)
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Delivery Destination</label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HOSP-MEMORIAL">Memorial Regional Hospital Pharmacy Dock (NY-MEM-440)</option>
                <option value="HOSP-STJUDE">St. Jude Children's Research & Medical Center (NY-STJ-081)</option>
                <option value="HOSP-METRO">Metro Health University Hospital (NY-MHU-102)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo Sensitivity</label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="vaccine">mRNA Vaccine (2°C - 8°C)</option>
                  <option value="insulin">Insulin (2°C - 8°C)</option>
                  <option value="blood">Blood Products (1°C - 6°C)</option>
                  <option value="biologics">Biologics (2°C - 8°C)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="critical">Critical (Immediate)</option>
                  <option value="high">High Priority</option>
                  <option value="standard">Standard Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Permitted Stops</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={maxStops}
                  onChange={(e) => setMaxStops(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo Load</label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700">
                  480 kg (62% cap)
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Environmental Ambient Heat:</span>
                <span className="font-semibold text-amber-700">{weather.temp}°C ({weather.condition})</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Optimizer automatically routes through shaded river corridors to reduce condenser head pressure.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive High-Fidelity Route Map */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Live Multimodal Route Corridor Map
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing primary recommended path, alternate bypasses, and cold-storage depots
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <span className="w-3 h-1 bg-blue-600 rounded"></span> Primary
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <span className="w-3 h-1 bg-amber-400 border-b border-dashed border-amber-600"></span> Urban (Congested)
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-80 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 select-none">
            {/* Map Background Grid and River Simulation */}
            <svg viewBox="0 0 700 320" className="w-full h-full">
              {/* Dark Map Base Grid */}
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
              </defs>

              <rect width="700" height="320" fill="#0B132B" />
              <rect width="700" height="320" fill="url(#mapGrid)" />

              {/* Hudson / East River Geography Shape */}
              <path
                d="M 240 0 Q 260 120 280 200 T 320 320 L 370 320 Q 330 200 310 120 T 290 0 Z"
                fill="#132A46"
                opacity="0.8"
              />

              {/* City Street Vector Lines */}
              <path d="M 50 160 L 650 160" stroke="#1E293B" strokeWidth="1.5" />
              <path d="M 50 90 L 650 90" stroke="#1E293B" strokeWidth="1.2" />
              <path d="M 50 230 L 650 230" stroke="#1E293B" strokeWidth="1.2" />
              <path d="M 160 20 L 160 300" stroke="#1E293B" strokeWidth="1.5" />
              <path d="M 440 20 L 440 300" stroke="#1E293B" strokeWidth="1.5" />
              <path d="M 560 20 L 560 300" stroke="#1E293B" strokeWidth="1.5" />

              {/* Route 2: Direct Urban (Congested Red/Amber Path) */}
              <path
                d="M 120 200 L 250 200 L 330 180 L 440 180 L 520 140 L 580 130"
                fill="none"
                stroke={activeRouteId === 'route-opt-2' ? '#EF4444' : '#F59E0B'}
                strokeWidth={activeRouteId === 'route-opt-2' ? '4' : '2'}
                strokeDasharray="4 4"
                opacity="0.8"
              />

              {/* Route 1: Thermal Bypass via Apex Cold Hub (Safe Blue/Emerald Path) */}
              <path
                d="M 120 200 Q 180 120 280 90 T 420 90 L 480 100 L 580 130"
                fill="none"
                stroke={activeRouteId === 'route-opt-1' ? '#3B82F6' : '#60A5FA'}
                strokeWidth={activeRouteId === 'route-opt-1' ? '4.5' : '2.5'}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              />

              {/* Cold Hub Waypoint Marker (Apex Cryo-Depot) */}
              <g transform="translate(420, 90)">
                <circle r="14" fill="#0D9488" opacity="0.3" className="animate-ping" />
                <circle r="9" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="22" fill="#2DD4BF" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Apex Cold Hub
                </text>
              </g>

              {/* Origin Marker (Warehouse) */}
              <g transform="translate(120, 200)">
                <circle r="10" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="-14" fill="#93C5FD" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Warehouse Hub (Origin)
                </text>
              </g>

              {/* Destination Marker (Hospital) */}
              <g transform="translate(580, 130)">
                <circle r="12" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="-16" fill="#6EE7B7" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Hospital Receiving Dock
                </text>
              </g>

              {/* Moving Vehicle Pin */}
              <g transform="translate(280, 90)">
                <circle r="8" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="-12" fill="#FCD34D" fontSize="9" textAnchor="middle" fontWeight="bold">
                  {selectedVehicleId}
                </text>
              </g>
            </svg>

            {/* In-Map Telemetry Floating Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl text-xs text-white max-w-sm space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold text-white">{activeRoute.name}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  Score: {activeRoute.compositeScore}/100
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span>Dist: <strong className="text-white">{activeRoute.distanceKm} km</strong></span>
                <span>ETA: <strong className="text-white">{activeRoute.durationMins} mins</strong></span>
                <span>Risk: <strong className={activeRoute.estimatedTempRisk === 'Low' ? 'text-emerald-400' : 'text-red-400'}>{activeRoute.estimatedTempRisk}</strong></span>
              </div>
            </div>
          </div>

          {/* Rationale Callout */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Optimization Rationale:</strong> {activeRoute.rationale}
            </div>
          </div>
        </div>
      </div>

      {/* Route Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Multimodal Route Comparison Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked systematically by cold-chain safety integrity, traffic delays, and travel time
            </p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            3 Alternative Corridors Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Route Name</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Est. Travel Time</th>
                <th className="py-3 px-4">Weather Exposure</th>
                <th className="py-3 px-4">Traffic Level</th>
                <th className="py-3 px-4">Cold-Hub Backup</th>
                <th className="py-3 px-4">Temperature Risk</th>
                <th className="py-3 px-4">Route Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {routes.map((route) => {
                const isSelected = route.id === activeRouteId;

                return (
                  <tr
                    key={route.id}
                    onClick={() => setActiveRouteId(route.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {route.isRecommended && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Recommended
                          </span>
                        )}
                        <span className="text-slate-900 font-medium">{route.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{route.distanceKm} km</td>
                    <td className="py-3.5 px-4 font-mono">{route.durationMins} mins</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          route.weatherExposure === 'Low'
                            ? 'bg-emerald-50 text-emerald-700'
                            : route.weatherExposure === 'Moderate'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {route.weatherExposure}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{route.trafficLevel}</td>
                    <td className="py-3.5 px-4">
                      {route.hasColdHubOnWay ? (
                        <span className="text-teal-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Available (Apex)
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          route.estimatedTempRisk === 'Low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {route.estimatedTempRisk}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {route.compositeScore}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRouteId(route.id);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
