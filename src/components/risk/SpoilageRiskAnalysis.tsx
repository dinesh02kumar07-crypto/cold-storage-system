/**
 * ColdChain AI - Spoilage Risk Analysis Table & Detailed Inspection Drawer
 * Multi-dimensional filtering, dynamic sorting, CSV export,
 * and slide-over panel with individual shipment thermal curves.
 */

import React, { useState } from 'react';
import {
  TrendingDown,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  X,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';
import { Shipment, RiskLevel } from '../../types/coldchain';
import { TempChart } from '../charts/TempChart';

export const SpoilageRiskAnalysis: React.FC = () => {
  const { shipments, vehicles, setSelectedVehicleId, setActiveTab } = useColdChain();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortField, setSortField] = useState<'riskScore' | 'currentTemp' | 'excursionMinutes'>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default descending (highest risk first)

  const [selectedDrawerShipment, setSelectedDrawerShipment] = useState<Shipment | null>(null);

  // Sorting and Filtering
  const processedShipments = [...shipments]
    .filter((s) => {
      const matchSearch =
        !search ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.cargo.name.toLowerCase().includes(search.toLowerCase()) ||
        s.vehicleId.toLowerCase().includes(search.toLowerCase()) ||
        s.destination.name.toLowerCase().includes(search.toLowerCase());

      const matchCategory = filterCategory === 'all' || s.cargo.category === filterCategory;
      const matchRisk = filterRisk === 'all' || s.riskLevel === filterRisk;

      return matchSearch && matchCategory && matchRisk;
    })
    .sort((a, b) => {
      let valA = a[sortField] || 0;
      let valB = b[sortField] || 0;
      if (sortAsc) return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const handleExportCSV = () => {
    const headers = [
      'Shipment ID',
      'Vehicle ID',
      'Medicine Name',
      'Category',
      'Current Temp (°C)',
      'Safe Min (°C)',
      'Safe Max (°C)',
      'Temp Rate (°C/min)',
      'Excursion Minutes',
      'Breach Horizon (min)',
      'Risk Score (0-100)',
      'Risk Level',
      'Destination',
      'ETA',
      'Recommended Action',
    ];

    const rows = shipments.map((s) => [
      s.id,
      s.vehicleId,
      `"${s.cargo.name}"`,
      s.cargo.category,
      s.currentTemp.toFixed(1),
      s.cargo.minTemp,
      s.cargo.maxTemp,
      s.rateOfTempChange.toFixed(3),
      s.excursionMinutes,
      s.estimatedBreachMinutes ?? 'None',
      s.riskScore,
      s.riskLevel,
      `"${s.destination.name}"`,
      s.estimatedArrival,
      `"${s.recommendedAction.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coldchain_spoilage_risk_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBadge = (level: RiskLevel, score: number) => {
    if (level === 'critical' || score >= 80) {
      return (
        <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          {score}/100 Critical
        </span>
      );
    }
    if (level === 'high' || score >= 60) {
      return (
        <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          {score}/100 High
        </span>
      );
    }
    if (level === 'moderate' || score >= 35) {
      return (
        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          {score}/100 Moderate
        </span>
      );
    }
    return (
      <span className="text-xs font-medium text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
        {score}/100 Safe
      </span>
    );
  };

  // Drawer Chart Data
  const drawerChartData = selectedDrawerShipment
    ? [
        { timeLabel: '09:00', temp: Math.max(1, selectedDrawerShipment.currentTemp - 0.8) },
        { timeLabel: '09:30', temp: Math.max(1, selectedDrawerShipment.currentTemp - 0.3) },
        { timeLabel: '10:00 (Now)', temp: selectedDrawerShipment.currentTemp },
        { timeLabel: '+20m (Proj)', temp: selectedDrawerShipment.currentTemp + 0.6, isProjected: true },
        { timeLabel: '+40m (Proj)', temp: selectedDrawerShipment.currentTemp + 1.4, isProjected: true },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Spoilage Risk Analysis & Excursion Matrix
            </h2>
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
              Q10 Kinetic Degradation Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent risk quantification integrating thermal breach velocity, duration, and formulation molecular sensitivity
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV Analysis</span>
        </button>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search shipment ID, medicine, vehicle, hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
            >
              <option value="all">All Medicines</option>
              <option value="vaccine">Vaccines</option>
              <option value="insulin">Insulin</option>
              <option value="blood">Blood Products</option>
              <option value="oncology">Oncology Biologics</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Risk Level:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical (80+)</option>
              <option value="high">High (60-79)</option>
              <option value="moderate">Moderate (35-59)</option>
              <option value="normal">Normal / Safe</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Sort By:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
            >
              <option value="riskScore">Highest Risk Score</option>
              <option value="currentTemp">Current Temperature</option>
              <option value="excursionMinutes">Excursion Duration</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? 'Ascending' : 'Descending'}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-mono text-xs cursor-pointer"
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Spoilage Risk Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Shipment & Vehicle</th>
                <th className="py-3 px-4">Cargo & Permitted Range</th>
                <th className="py-3 px-4">Current Temp</th>
                <th className="py-3 px-4">Rate of Rise</th>
                <th className="py-3 px-4">Excursion Duration</th>
                <th className="py-3 px-4">Predicted Breach Horizon</th>
                <th className="py-3 px-4">Spoilage Risk Score</th>
                <th className="py-3 px-4">Destination & ETA</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {processedShipments.map((shipment) => {
                const vehicle = vehicles.find((v) => v.id === shipment.vehicleId);
                const isBreached =
                  shipment.currentTemp > shipment.cargo.maxTemp || shipment.currentTemp < shipment.cargo.minTemp;

                return (
                  <tr
                    key={shipment.id}
                    className={`transition-colors cursor-pointer ${
                      shipment.riskScore >= 80 ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedDrawerShipment(shipment)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">{shipment.id}</div>
                      <div className="text-[11px] text-slate-400">
                        {shipment.vehicleId} • {vehicle?.name || 'Reefer'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{shipment.cargo.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Safe: {shipment.cargo.minTemp}°C - {shipment.cargo.maxTemp}°C (Batch: {shipment.cargo.batchNumber})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isBreached
                            ? 'bg-red-100 text-red-700 font-black'
                            : shipment.currentTemp > 6.5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {shipment.currentTemp.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={shipment.rateOfTempChange > 0.04 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {shipment.rateOfTempChange > 0 ? `+${shipment.rateOfTempChange}` : shipment.rateOfTempChange} °C/m
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {shipment.excursionMinutes > 0 ? (
                        <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          {shipment.excursionMinutes} mins
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">0 mins (Nominal)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {shipment.estimatedBreachMinutes !== null ? (
                        <span
                          className={`font-semibold font-mono px-2 py-0.5 rounded text-[11px] ${
                            shipment.estimatedBreachMinutes <= 30
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          ~{shipment.estimatedBreachMinutes} mins
                        </span>
                      ) : (
                        <span className="text-slate-400">No breach</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getRiskBadge(shipment.riskLevel, shipment.riskScore)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 truncate max-w-[160px]">
                        {shipment.destination.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ETA: {shipment.estimatedArrival}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrawerShipment(shipment);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Shipment Inspection Drawer */}
      {selectedDrawerShipment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Shipment Risk Diagnostic
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedDrawerShipment.cargo.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedDrawerShipment.id} • Vehicle: {selectedDrawerShipment.vehicleId}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDrawerShipment(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Risk Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Current Reefer Reading</span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                    {selectedDrawerShipment.currentTemp.toFixed(1)}°C
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Safe Range: {selectedDrawerShipment.cargo.minTemp}°C - {selectedDrawerShipment.cargo.maxTemp}°C
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Spoilage Risk Score</span>
                  <div className="text-2xl font-black font-mono mt-1 text-slate-900">
                    {selectedDrawerShipment.riskScore}
                    <span className="text-sm font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-amber-700">
                    {selectedDrawerShipment.riskLevel} Level
                  </div>
                </div>
              </div>

              {/* Drawer Chart */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Thermal Trajectory & Safe Band</h4>
                <TempChart
                  data={drawerChartData}
                  minSafe={selectedDrawerShipment.cargo.minTemp}
                  maxSafe={selectedDrawerShipment.cargo.maxTemp}
                  height={190}
                  showProjection={true}
                />
              </div>

              {/* Formulation Parameters */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Biochemical Storage Factors:</div>
                <div className="flex justify-between text-slate-600">
                  <span>Q10 Reaction Multiplier:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedDrawerShipment.cargo.q10SensitivityFactor}x
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Critical Degradation Ceiling:</span>
                  <span className="font-mono font-bold text-red-600">
                    {selectedDrawerShipment.cargo.criticalMaxTemp}°C
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Authorized Hospital:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {selectedDrawerShipment.destination.name}
                  </span>
                </div>
              </div>

              {/* Prescriptive Guidance */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-blue-700" />
                  Recommended Operational Action
                </span>
                <p className="text-blue-950 text-[11px] leading-relaxed">
                  {selectedDrawerShipment.recommendedAction}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedVehicleId(selectedDrawerShipment.vehicleId);
                  setActiveTab('spoilage_prediction');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Predictive Model</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSelectedDrawerShipment(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
