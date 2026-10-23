/**
 * ColdChain AI - Executive Overview Dashboard
 * Real-time fleet health, 20-30 min predictive early warning banner,
 * active shipment matrix, and 60-minute thermal trend telemetry.
 */

import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';
import { TempChart } from '../charts/TempChart';
import { VehicleStatus, RiskLevel } from '../../types/coldchain';

export const OverviewDashboard: React.FC = () => {
  const {
    vehicles,
    shipments,
    alerts,
    dashboardStats,
    setSelectedVehicleId,
    setSelectedShipmentId,
    setActiveTab,
    addVehicle,
    createShipment,
    simulateTempSpike,
    searchQuery,
  } = useColdChain();

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddShipmentModal, setShowAddShipmentModal] = useState(false);

  // New vehicle form state
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newDriver, setNewDriver] = useState('');

  // New shipment form state
  const [shipmentVehicleId, setShipmentVehicleId] = useState(vehicles[0]?.id || '');
  const [cargoName, setCargoName] = useState('Moderna Spikevax mRNA Vaccine');
  const [minSafeTemp, setMinSafeTemp] = useState(2.0);
  const [maxSafeTemp, setMaxSafeTemp] = useState(8.0);
  const [doses, setDoses] = useState(2000);
  const [destinationHospital, setDestinationHospital] = useState("St. Jude Children's Research & Medical Center");

  // Filtered vehicles by global search
  const filteredVehicles = vehicles.filter((v) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const shp = shipments.find((s) => s.vehicleId === v.id);
    return (
      v.name.toLowerCase().includes(query) ||
      v.id.toLowerCase().includes(query) ||
      v.plateNumber.toLowerCase().includes(query) ||
      v.driverName.toLowerCase().includes(query) ||
      shp?.cargo.name.toLowerCase().includes(query) ||
      shp?.destination.name.toLowerCase().includes(query)
    );
  });

  // Top predictive or critical alert
  const urgentAlert = alerts.find((a) => a.severity === 'critical' || a.severity === 'warning');

  // Chart data for selected or first vehicle
  const activeShipment = shipments.find((s) => s.vehicleId === 'V-104') || shipments[0];
  const chartPoints = [
    { timeLabel: '09:00', temp: 5.0 },
    { timeLabel: '09:15', temp: 5.4 },
    { timeLabel: '09:30', temp: 5.9 },
    { timeLabel: '09:45', temp: 6.3 },
    { timeLabel: '10:00 (Now)', temp: activeShipment?.currentTemp || 6.8 },
    { timeLabel: '+15m', temp: (activeShipment?.currentTemp || 6.8) + 0.6, isProjected: true },
    { timeLabel: '+25m (Breach)', temp: (activeShipment?.currentTemp || 6.8) + 1.3, isProjected: true },
    { timeLabel: '+40m', temp: (activeShipment?.currentTemp || 6.8) + 2.0, isProjected: true },
  ];

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleName) return;
    addVehicle({
      name: newVehicleName,
      plateNumber: newPlate || `CC-${Math.floor(100 + Math.random() * 900)}-NY`,
      driverName: newDriver || 'Alex Mercer',
      currentTemp: 4.0,
    });
    setShowAddVehicleModal(false);
    setNewVehicleName('');
    setNewPlate('');
    setNewDriver('');
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    createShipment({
      vehicleId: shipmentVehicleId,
      cargo: {
        id: `CRG-${Date.now()}`,
        name: cargoName,
        category: 'vaccine',
        minTemp: Number(minSafeTemp),
        maxTemp: Number(maxSafeTemp),
        criticalMaxTemp: Number(maxSafeTemp) + 2,
        criticalMinTemp: Math.max(-10, Number(minSafeTemp) - 2),
        q10SensitivityFactor: 2.2,
        shelfLifeHoursAtExcursion: 10,
        batchNumber: `BN-${Math.floor(10000 + Math.random() * 90000)}-VAC`,
        quantityDoses: Number(doses),
        targetHospital: destinationHospital,
        hospitalFacilityId: 'HOSP-STJUDE',
        packagingType: 'VIP Shipper (Vacuum Insulated)',
      },
    });
    setShowAddShipmentModal(false);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'in_transit':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">In Transit</span>;
      case 'warning':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Warning</span>;
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Critical</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Normal / Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Idle</span>;
    }
  };

  const getRiskBadge = (level: RiskLevel, score: number) => {
    if (level === 'critical' || score >= 80) {
      return <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">{score}/100 Critical</span>;
    }
    if (level === 'high' || score >= 60) {
      return <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{score}/100 High Risk</span>;
    }
    if (level === 'moderate' || score >= 35) {
      return <span className="text-xs font-medium text-amber-700 bg-amber-50/50 px-2 py-0.5 rounded">{score}/100 Moderate</span>;
    }
    return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{score}/100 Safe</span>;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cold-chain telematics, predictive spoilage forecasting, and hospital dispatch
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Vehicle</span>
          </button>
          <button
            onClick={() => setShowAddShipmentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Shipment</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Vehicles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Vehicles</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{dashboardStats.activeVehiclesCount}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-blue-600 font-semibold">{vehicles.length} total</span> fleet units
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Vehicles Within Safe Temperature */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Safe Temperature</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{dashboardStats.safeVehiclesCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
              <span className="font-semibold">
                {Math.round((dashboardStats.safeVehiclesCount / (vehicles.length || 1)) * 100)}%
              </span>{' '}
              within compliance limits
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* High-Risk Shipments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High-Risk Shipments</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{dashboardStats.highRiskShipmentsCount}</div>
            <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
              <span>{urgentAlert ? 'Action Required' : 'Monitored'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Deliveries Completed Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered Today</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{dashboardStats.deliveriesCompletedToday}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Hospital intake verified</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Real-time Predictive Early Warning Banner (20-30 min window highlight) */}
      {urgentAlert && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-l-4 border-amber-500 p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {urgentAlert.leadTimeMinutes > 0 ? `${urgentAlert.leadTimeMinutes}-Minute Early Warning` : 'Active Excursion'}
                </span>
                <span className="text-xs text-slate-500 font-mono">{urgentAlert.id}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                {urgentAlert.vehicleName}: {urgentAlert.cargoName} approaching threshold
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
                Current: <strong className="font-mono text-slate-800">{urgentAlert.currentTemp.toFixed(1)}°C</strong> (Safe: {urgentAlert.safeRange[0]}°C - {urgentAlert.safeRange[1]}°C). {urgentAlert.recommendedAction}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedVehicleId(urgentAlert.vehicleId);
                setActiveTab('spoilage_prediction');
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Inspect Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedVehicleId(urgentAlert.vehicleId);
                setActiveTab('route_optimization');
              }}
              className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Reroute to Cold Hub
            </button>
          </div>
        </div>
      )}

      {/* Mid Visualizations Grid: 60-min Temperature Trends + Spoilage Risk breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 60-min Temperature Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Fleet Telematics: 60-Minute Temperature Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Observing {activeShipment?.vehicleId} ({activeShipment?.cargo.name}) with 30m predictive extrapolation
              </p>
            </div>
            <button
              onClick={() => simulateTempSpike('V-104', 0.6)}
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>+0.6°C Sensor Pulse</span>
            </button>
          </div>

          <TempChart
            data={chartPoints}
            minSafe={activeShipment?.cargo.minTemp ?? 2.0}
            maxSafe={activeShipment?.cargo.maxTemp ?? 8.0}
            height={220}
            showProjection={true}
          />
        </div>

        {/* Spoilage Risk Distribution & Quick Telematics Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Spoilage Risk by Vehicle
            </h3>
            <p className="text-xs text-slate-500 mb-4">Calculated from thermal kinetic rate & duration</p>

            <div className="space-y-3">
              {vehicles.map((v) => {
                const shp = shipments.find((s) => s.vehicleId === v.id);
                const score = shp?.riskScore || 5;
                const barColor =
                  score >= 80 ? 'bg-red-500' : score >= 60 ? 'bg-amber-500' : score >= 35 ? 'bg-amber-400' : 'bg-emerald-500';

                return (
                  <div key={v.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{v.name}</span>
                      <span className="font-mono text-slate-600 font-medium">{score}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Delivery Status Distribution</span>
              <span className="font-semibold text-slate-700">
                {dashboardStats.deliveriesCompletedToday} / {shipments.length} Complete
              </span>
            </div>
            <div className="w-full flex h-2 rounded-full overflow-hidden bg-slate-100">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(dashboardStats.deliveriesCompletedToday / (shipments.length || 1)) * 100}%` }}
              ></div>
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${(dashboardStats.activeVehiclesCount / (shipments.length || 1)) * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> In Transit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Fleet Status Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Active Fleet & Telematics Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant sensor readings, cargo thresholds, and predicted risk scores across active routes
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {filteredVehicles.length} Vehicles Displayed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Cargo Type</th>
                <th className="py-3 px-4">Reefer Temp</th>
                <th className="py-3 px-4">Safe Range</th>
                <th className="py-3 px-4">Predicted Risk</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">ETA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVehicles.map((vehicle) => {
                const shp = shipments.find((s) => s.vehicleId === vehicle.id);
                const isTempBreached =
                  shp && (vehicle.currentTemp > shp.cargo.maxTemp || vehicle.currentTemp < shp.cargo.minTemp);

                return (
                  <tr key={vehicle.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{vehicle.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {vehicle.id} • Driver: {vehicle.driverName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {shp ? (
                        <div>
                          <span className="font-medium text-slate-800">{shp.cargo.name}</span>
                          <div className="text-[10px] text-slate-400">
                            Batch: {shp.cargo.batchNumber} ({shp.cargo.quantityDoses.toLocaleString()} doses)
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No active shipment</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isTempBreached
                            ? 'bg-red-100 text-red-700 font-bold animate-pulse'
                            : vehicle.currentTemp > 6.0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {vehicle.currentTemp.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {shp ? `${shp.cargo.minTemp}°C - ${shp.cargo.maxTemp}°C` : '--'}
                    </td>
                    <td className="py-3.5 px-4">
                      {shp ? getRiskBadge(shp.riskLevel, shp.riskScore) : '--'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium truncate max-w-[180px]">
                        {shp?.destination.name || 'Depot'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {shp?.estimatedArrival || '--'}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(vehicle.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedVehicleId(vehicle.id);
                          if (shp) setSelectedShipmentId(shp.id);
                          setActiveTab('temperature_monitoring');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Refrigerated Vehicle</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a new active thermal reefer van with IoT telemetry sensors.
            </p>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BioReefer Unit 6"
                  value={newVehicleName}
                  onChange={(e) => setNewVehicleName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    placeholder="e.g. CC-404-NY"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Mercer"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Shipment Modal */}
      {showAddShipmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Register Medicine Shipment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure temperature threshold limits, packaging type, and hospital destination.
            </p>

            <form onSubmit={handleCreateShipment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Vehicle</label>
                <select
                  value={shipmentVehicleId}
                  onChange={(e) => setShipmentVehicleId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id}) - Current: {v.currentTemp.toFixed(1)}°C
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine / Cargo Name</label>
                <input
                  type="text"
                  required
                  value={cargoName}
                  onChange={(e) => setCargoName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Safe (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minSafeTemp}
                    onChange={(e) => setMinSafeTemp(parseFloat(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Safe (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxSafeTemp}
                    onChange={(e) => setMaxSafeTemp(parseFloat(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dose Units</label>
                  <input
                    type="number"
                    value={doses}
                    onChange={(e) => setDoses(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Destination</label>
                <select
                  value={destinationHospital}
                  onChange={(e) => setDestinationHospital(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="St. Jude Children's Research & Medical Center">
                    St. Jude Children's Research & Medical Center
                  </option>
                  <option value="Memorial Regional Hospital Pharmacy Dock">
                    Memorial Regional Hospital Pharmacy Dock
                  </option>
                  <option value="Metro Health University Hospital">
                    Metro Health University Hospital
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddShipmentModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Register & Assign Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
