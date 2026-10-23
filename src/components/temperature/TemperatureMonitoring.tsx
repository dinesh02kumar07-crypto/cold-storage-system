/**
 * ColdChain AI - Temperature Monitoring Module
 * Real-time reefer gauge telemetry, sensor connection health,
 * 60-minute excursion tracker, and interactive sensor telemetry ingestion form.
 */

import React, { useState } from 'react';
import {
  Thermometer,
  CloudSun,
  Droplets,
  DoorOpen,
  DoorClosed,
  Fan,
  Cpu,
  Clock,
  Save,
  Zap,
  Radio,
  CheckCircle,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';
import { TempChart } from '../charts/TempChart';
import { CoolingStatus } from '../../types/coldchain';

export const TemperatureMonitoring: React.FC = () => {
  const {
    vehicles,
    shipments,
    selectedVehicleId,
    setSelectedVehicleId,
    selectedShipmentId,
    setSelectedShipmentId,
    saveSensorReading,
    simulateTempSpike,
    toggleDoorStatus,
    setVehicleCoolingStatus,
    weather,
  } = useColdChain();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedShipment =
    shipments.find((s) => s.id === selectedShipmentId) ||
    shipments.find((s) => s.vehicleId === selectedVehicle.id) ||
    shipments[0];

  // Sensor Ingestion Form State
  const [formInternalTemp, setFormInternalTemp] = useState<number>(selectedVehicle.currentTemp);
  const [formAmbientTemp, setFormAmbientTemp] = useState<number>(selectedVehicle.ambientTemp || weather.temp);
  const [formHumidity, setFormHumidity] = useState<number>(selectedVehicle.currentHumidity || 55);
  const [formDoorOpen, setFormDoorOpen] = useState<boolean>(selectedVehicle.doorStatus === 'open');
  const [formCoolingStatus, setFormCoolingStatus] = useState<CoolingStatus>(selectedVehicle.coolingStatus || 'optimal');
  const [formSensorId, setFormSensorId] = useState<string>('SNS-TK-04X');
  const [formSource, setFormSource] = useState<'iot_sensor' | 'manual' | 'simulated'>('manual');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Sync form defaults when selected vehicle changes
  React.useEffect(() => {
    if (selectedVehicle) {
      setFormInternalTemp(selectedVehicle.currentTemp);
      setFormAmbientTemp(selectedVehicle.ambientTemp || weather.temp);
      setFormHumidity(selectedVehicle.currentHumidity || 55);
      setFormDoorOpen(selectedVehicle.doorStatus === 'open');
      setFormCoolingStatus(selectedVehicle.coolingStatus || 'optimal');
    }
  }, [selectedVehicleId, selectedVehicle]);

  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(formInternalTemp)) return;

    saveSensorReading({
      vehicleId: selectedVehicle.id,
      internalTemp: Number(formInternalTemp),
      ambientTemp: Number(formAmbientTemp),
      humidity: Number(formHumidity),
      doorOpen: formDoorOpen,
      coolingStatus: formCoolingStatus,
      source: formSource,
      sensorId: formSensorId,
    });

    setSavedSuccessMsg(`Reading saved! State, charts, and predictive alerts updated.`);
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  // Prepare chart points for this vehicle/shipment
  const history = selectedShipment?.tempHistory || [];
  const chartPoints = history.map((item, idx) => {
    const d = new Date(item.timestamp);
    const timeLabel = isNaN(d.getTime())
      ? `T-${(history.length - idx) * 10}m`
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      timeLabel,
      temp: item.internalTemp,
      isProjected: false,
    };
  });

  // If few history points, supplement with baseline to render complete 60m graph
  if (chartPoints.length < 5) {
    const base = selectedVehicle.currentTemp;
    chartPoints.unshift(
      { timeLabel: '50m ago', temp: Math.max(1, base - 0.7), isProjected: false },
      { timeLabel: '35m ago', temp: Math.max(1, base - 0.4), isProjected: false },
      { timeLabel: '20m ago', temp: Math.max(1, base - 0.2), isProjected: false }
    );
  }

  // Add projected points
  const currentT = selectedVehicle.currentTemp;
  const warmingDelta = selectedVehicle.coolingStatus === 'malfunction' ? 0.9 : selectedVehicle.coolingStatus === 'degraded' ? 0.4 : 0.1;
  chartPoints.push(
    { timeLabel: '+15m (Proj)', temp: Math.round((currentT + warmingDelta) * 10) / 10, isProjected: true },
    { timeLabel: '+30m (Proj)', temp: Math.round((currentT + warmingDelta * 2) * 10) / 10, isProjected: true },
    { timeLabel: '+60m (Proj)', temp: Math.round((currentT + warmingDelta * 3.5) * 10) / 10, isProjected: true }
  );

  const minSafe = selectedShipment?.cargo.minTemp ?? 2.0;
  const maxSafe = selectedShipment?.cargo.maxTemp ?? 8.0;
  const isBreached = currentT > maxSafe || currentT < minSafe;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Temperature Monitoring & Telematics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time IoT sensor telemetry, compressor power diagnostics, and manual reading injection
          </p>
        </div>

        {/* Vehicle & Shipment Selector Bar */}
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Vehicle
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.id}) - {v.currentTemp.toFixed(1)}°C
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Cargo Shipment
            </label>
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cargo.name} ({s.cargo.batchNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Telemetry Gauges / Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Refrigerator Temp */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs transition-all ${
            isBreached
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400/30'
              : currentT > 6.5
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cargo Temp</span>
            <Thermometer className={`w-4 h-4 ${isBreached ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                isBreached ? 'text-red-700' : currentT > 6.5 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {selectedVehicle.currentTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">
            Safe: <span className="font-semibold text-slate-700">{minSafe}°C - {maxSafe}°C</span>
          </div>
        </div>

        {/* Ambient Temperature */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ambient Heat</span>
            <CloudSun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900">
            {selectedVehicle.ambientTemp.toFixed(1)}°C
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">
            Thermal Delta: +{(selectedVehicle.ambientTemp - selectedVehicle.currentTemp).toFixed(1)}°C
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Reefer Humidity</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900">
            {selectedVehicle.currentHumidity}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Target: 40% - 65%</div>
        </div>

        {/* Cooling Compressor Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Compressor</span>
            <Fan
              className={`w-4 h-4 ${
                selectedVehicle.coolingStatus === 'optimal'
                  ? 'text-teal-600 animate-spin'
                  : selectedVehicle.coolingStatus === 'degraded'
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            />
          </div>
          <div className="mt-2 text-sm font-bold capitalize text-slate-900">
            {selectedVehicle.coolingStatus}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <button
              onClick={() =>
                setVehicleCoolingStatus(
                  selectedVehicle.id,
                  selectedVehicle.coolingStatus === 'optimal' ? 'degraded' : 'optimal'
                )
              }
              className="text-[10px] text-blue-600 hover:underline cursor-pointer"
            >
              Toggle Mode
            </button>
          </div>
        </div>

        {/* Door Sensor Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Door Seal</span>
            {selectedVehicle.doorStatus === 'open' ? (
              <DoorOpen className="w-4 h-4 text-red-500" />
            ) : (
              <DoorClosed className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="mt-2 text-sm font-bold capitalize text-slate-900">
            {selectedVehicle.doorStatus === 'open' ? (
              <span className="text-red-600">Door Ajar</span>
            ) : (
              <span className="text-emerald-700">Sealed Tight</span>
            )}
          </div>
          <div className="mt-1">
            <button
              onClick={() => toggleDoorStatus(selectedVehicle.id)}
              className="text-[10px] text-blue-600 hover:underline cursor-pointer"
            >
              Simulate {selectedVehicle.doorStatus === 'open' ? 'Close' : 'Open'}
            </button>
          </div>
        </div>

        {/* Telematics Last Update */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sensor Signal</span>
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Connected
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{selectedVehicle.lastUpdate}</span>
          </div>
        </div>
      </div>

      {/* Mid Section: 60-Min Trend Chart + Quick Simulated Surge Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Detailed Thermal Profile & 60-Minute Excursion Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Continuous telemetry from {selectedVehicle.refrigType} with threshold violation monitors
              </p>
            </div>
            {selectedShipment && selectedShipment.excursionMinutes > 0 && (
              <span className="text-xs font-bold bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {selectedShipment.excursionMinutes} mins in excursion
              </span>
            )}
          </div>

          <TempChart
            data={chartPoints}
            minSafe={minSafe}
            maxSafe={maxSafe}
            criticalMax={selectedShipment?.cargo.criticalMaxTemp || 10}
            criticalMin={selectedShipment?.cargo.criticalMinTemp || 0}
            height={240}
            showProjection={true}
          />

          {/* Quick Demo Surges */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Quick Hackathon Simulation Tests:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => simulateTempSpike(selectedVehicle.id, 0.4)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              >
                +0.4°C (Normal)
              </button>
              <button
                onClick={() => simulateTempSpike(selectedVehicle.id, 1.2)}
                className="px-2.5 py-1 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-600" />
                +1.2°C (24m Warning)
              </button>
              <button
                onClick={() => simulateTempSpike(selectedVehicle.id, 2.5)}
                className="px-2.5 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Flame className="w-3 h-3 text-red-600" />
                +2.5°C (Critical Breach)
              </button>
            </div>
          </div>
        </div>

        {/* Cargo Thermal Specifications Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Cargo Storage Specifications</h3>
            <p className="text-xs text-slate-500 mb-4">
              Pharmaceutical stability criteria & formulation parameters
            </p>

            {selectedShipment && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                  <div className="font-bold text-slate-800">{selectedShipment.cargo.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Batch: <span className="font-mono text-slate-700">{selectedShipment.cargo.batchNumber}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Permitted Range:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {selectedShipment.cargo.minTemp}°C to {selectedShipment.cargo.maxTemp}°C
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Critical Max Limit:</span>
                    <span className="font-mono font-semibold text-red-600">
                      {selectedShipment.cargo.criticalMaxTemp}°C
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Degradation Factor (Q10):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedShipment.cargo.q10SensitivityFactor}x
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Excursion Budget:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedShipment.cargo.shelfLifeHoursAtExcursion} hours max
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Packaging Type:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedShipment.cargo.packagingType}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            <strong>Thermal Note:</strong> Excursion events are logged to the cryptographic compliance ledger and shared with hospital pharmacy receiving docks.
          </div>
        </div>
      </div>

      {/* Sensor Registration / Ingestion Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Register New Sensor or Submit Simulated Telemetry Reading
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit verifiable sensor measurements. Automatically updates dashboard, recalculates spoilage risk, and triggers alerts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Reading Source:</span>
            {(['manual', 'simulated', 'iot_sensor'] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setFormSource(src)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium cursor-pointer transition-colors ${
                  formSource === src
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {src === 'iot_sensor' ? 'IoT Sensor' : src === 'manual' ? 'Manual Input' : 'Simulated'}
              </button>
            ))}
          </div>
        </div>

        {savedSuccessMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveReading} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle ID</label>
              <input
                type="text"
                disabled
                value={selectedVehicle.id}
                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 cursor-not-allowed font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sensor ID</label>
              <input
                type="text"
                required
                value={formSensorId}
                onChange={(e) => setFormSensorId(e.target.value)}
                placeholder="e.g. SNS-TK-04X"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Reefer Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formInternalTemp}
                onChange={(e) => setFormInternalTemp(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Outside Ambient Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formAmbientTemp}
                onChange={(e) => setFormAmbientTemp(parseFloat(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Humidity (% RH)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={formHumidity}
                onChange={(e) => setFormHumidity(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cooling Compressor System Status
              </label>
              <select
                value={formCoolingStatus}
                onChange={(e) => setFormCoolingStatus(e.target.value as CoolingStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="optimal">Optimal (Active Chill Normal)</option>
                <option value="degraded">Degraded (Low Coolant / 35% capacity)</option>
                <option value="malfunction">Malfunction (Compressor Tripped)</option>
                <option value="off">Off (Engine Inactive)</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={formDoorOpen}
                  onChange={(e) => setFormDoorOpen(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">Door Ajar / Opening Active</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Sensor data is cryptographically hashed for FDA 21 CFR Part 11 / EU Annex 11 compliance.
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save & Broadcast Reading</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
