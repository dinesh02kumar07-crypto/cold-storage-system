/**
 * ColdChain AI - Live Vehicle Tracking & Telematics Simulation
 * Interactive GPS tracking map, dynamic waypoint animation,
 * telematics telemetry HUD, and simulation controls.
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  MapPin,
  Truck,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';

export const LiveVehicleTracking: React.FC = () => {
  const {
    vehicles,
    shipments,
    selectedVehicleId,
    setSelectedVehicleId,
    isSimulating,
    simulationSpeed,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    setSimulationSpeed,
  } = useColdChain();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedShipment =
    shipments.find((s) => s.vehicleId === selectedVehicle.id) || shipments[0];

  const isTempBreached =
    selectedShipment &&
    (selectedVehicle.currentTemp > selectedShipment.cargo.maxTemp ||
      selectedVehicle.currentTemp < selectedShipment.cargo.minTemp);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Live Vehicle Telematics & GPS Fleet Tracking
            </h2>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Simulated Telematics Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial positioning, continuous temperature telemetry, and dynamic arrival estimations
          </p>
        </div>

        {/* Playback & Speed Controls */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Simulation</span>
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-amber-100 hover:bg-amber-200 rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              <Pause className="w-3.5 h-3.5 fill-slate-800" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            title="Reset Simulation Positions"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-2 py-1 text-[11px] font-mono font-bold rounded cursor-pointer transition-colors ${
                  simulationSpeed === spd
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) + Vehicle Telemetry HUD (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Vector GPS Map */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Live Telematics Map View</h3>
            </div>
            <span className="text-xs text-slate-400">
              {vehicles.length} Active GPS Transponders
            </span>
          </div>

          {/* Map Surface */}
          <div className="relative w-full h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none">
            <svg viewBox="0 0 720 440" className="w-full h-full">
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" />
                </pattern>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="720" height="440" fill="#0A0F1D" />
              <rect width="720" height="440" fill="url(#gridPattern)" />

              {/* Waterways / River Corridors */}
              <path
                d="M 270 0 Q 290 180 320 280 T 360 440 L 410 440 Q 370 280 340 180 T 320 0 Z"
                fill="#132338"
                opacity="0.9"
              />

              {/* Arterial Roadways */}
              <path d="M 40 220 L 680 220" stroke="#1E293B" strokeWidth="2" />
              <path d="M 40 110 L 680 110" stroke="#1E293B" strokeWidth="1.5" />
              <path d="M 40 330 L 680 330" stroke="#1E293B" strokeWidth="1.5" />
              <path d="M 180 20 L 180 420" stroke="#1E293B" strokeWidth="2" />
              <path d="M 500 20 L 500 420" stroke="#1E293B" strokeWidth="2" />

              {/* Active Route Polylines */}
              <path
                d="M 120 280 Q 200 160 300 120 T 520 100 L 600 140"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                opacity="0.7"
              />

              {/* Warehouse Origin Pin */}
              <g transform="translate(120, 280)">
                <circle r="12" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="24" fill="#93C5FD" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Central Hub
                </text>
              </g>

              {/* Emergency Cold Hub Marker */}
              <g transform="translate(420, 110)">
                <circle r="16" fill="#0D9488" opacity="0.3" className="animate-ping" />
                <circle r="10" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="-14" fill="#2DD4BF" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Apex Cryo-Hub
                </text>
              </g>

              {/* Hospital Delivery Destination Pins */}
              <g transform="translate(600, 140)">
                <circle r="13" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="-16" fill="#6EE7B7" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Memorial Hospital
                </text>
              </g>
              <g transform="translate(560, 300)">
                <circle r="11" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                <text x="0" y="22" fill="#6EE7B7" fontSize="10" textAnchor="middle" fontWeight="bold">
                  St. Jude Hospital
                </text>
              </g>

              {/* Render All Vehicles on Map */}
              {vehicles.map((v, i) => {
                // Coordinate projection formula to map coordinates
                const x = 180 + ((v.currentLng + 74.0) / 0.08) * 350 + i * 20;
                const y = 80 + ((40.8 - v.currentLat) / 0.08) * 260 + i * 25;
                const isSelected = v.id === selectedVehicleId;
                const isCrit = v.status === 'critical';
                const isWarn = v.status === 'warning';

                const color = isCrit ? '#EF4444' : isWarn ? '#F59E0B' : '#3B82F6';

                return (
                  <g
                    key={v.id}
                    transform={`translate(${Math.max(50, Math.min(670, x))}, ${Math.max(40, Math.min(390, y))})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedVehicleId(v.id)}
                  >
                    {isSelected && (
                      <circle r="22" fill={color} opacity="0.25" className="animate-ping" />
                    )}
                    <circle
                      r={isSelected ? 14 : 10}
                      fill={color}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 3 : 2}
                      filter="url(#glow)"
                    />
                    <text
                      x="0"
                      y={isSelected ? -18 : -14}
                      fill={isSelected ? '#FFFFFF' : '#CBD5E1'}
                      fontSize={isSelected ? '11' : '9'}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {v.id} ({v.currentTemp.toFixed(1)}°)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom In-Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Normal Transit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 20-30m Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Excursion
              </span>
              <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Apex Cold Hub
              </span>
            </div>
          </div>
        </div>

        {/* Selected Vehicle Telematics HUD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Vehicle Telemetry HUD
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedVehicle.name}</h3>
                <span className="text-xs text-slate-500 font-mono">
                  ID: {selectedVehicle.id} • Plate: {selectedVehicle.plateNumber}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-xl ${
                  isTempBreached ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Truck className="w-6 h-6" />
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Cargo Temp</span>
                <div
                  className={`text-xl font-bold font-mono mt-1 ${
                    isTempBreached ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {selectedVehicle.currentTemp.toFixed(1)}°C
                </div>
                <div className="text-[10px] text-slate-500">
                  Safe: {selectedShipment.cargo.minTemp}°C - {selectedShipment.cargo.maxTemp}°C
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Speed & Battery</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {selectedVehicle.speedKmH} km/h
                </div>
                <div className="text-[10px] text-slate-500">
                  Battery/Fuel: {selectedVehicle.batteryOrFuelPercent}%
                </div>
              </div>
            </div>

            {/* Driver & Shipment Details */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Driver:</span>
                <span className="font-semibold text-slate-800">{selectedVehicle.driverName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Driver Phone:</span>
                <span className="font-mono text-slate-700">{selectedVehicle.driverPhone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Medicine Payload:</span>
                <span className="font-semibold text-slate-800">{selectedShipment.cargo.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Next Destination:</span>
                <span className="font-semibold text-blue-700 truncate max-w-[170px]">
                  {selectedShipment.destination.name}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Est. Arrival (ETA):</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedShipment.estimatedArrival}
                </span>
              </div>
            </div>

            {/* Stops Checklist */}
            <div className="mt-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Route Stop Sequence
              </span>
              <div className="space-y-1.5 text-xs">
                {selectedShipment.stops.length > 0 ? (
                  selectedShipment.stops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="p-2 bg-slate-50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">
                          {stop.locationName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          stop.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {stop.status === 'completed' ? 'Departed' : stop.plannedArrival}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs italic">Direct point-to-point transit</div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Transponder Lat: {selectedVehicle.currentLat.toFixed(4)}, Lng: {selectedVehicle.currentLng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
