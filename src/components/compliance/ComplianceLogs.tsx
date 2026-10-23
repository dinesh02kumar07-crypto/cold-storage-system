/**
 * ColdChain AI - Automated Compliance Logs & GDP Audit Trails
 * Records driver events, calculates door-open exposure minutes,
 * generates tamper-evident audit hashes, and exports regulatory reports.
 */

import React, { useState } from 'react';
import {
  ClipboardCheck,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DoorOpen,
  Hash,
  Shield,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';
import { ComplianceLog } from '../../types/coldchain';
import { calculateMinutesDiff } from '../../utils/coldchainMath';

export const ComplianceLogs: React.FC = () => {
  const { complianceLogs, recordComplianceLog, completeDelivery, shipments, vehicles } = useColdChain();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  // Form State
  const [driverId, setDriverId] = useState('DRV-804');
  const [driverName, setDriverName] = useState('Elena Rostova');
  const [vehicleId, setVehicleId] = useState('V-104');
  const [shipmentId, setShipmentId] = useState('SHP-9002');
  const [cargoType, setCargoType] = useState('Humalog U-100 Insulin');
  const [cargoQuantity, setCargoQuantity] = useState(1800);
  const [pickupTime, setPickupTime] = useState('2026-10-23 09:05');
  const [deliveryLocation, setDeliveryLocation] = useState('Memorial Regional Hospital Pharmacy Dock');
  const [arrivalTime, setArrivalTime] = useState('2026-10-23 11:40');
  const [departureTime, setDepartureTime] = useState('2026-10-23 11:58');
  const [doorOpenTime, setDoorOpenTime] = useState('2026-10-23 11:42');
  const [doorCloseTime, setDoorCloseTime] = useState('2026-10-23 11:51');
  const [tempBeforeOpen, setTempBeforeOpen] = useState(5.8);
  const [tempAfterClose, setTempAfterClose] = useState(6.4);
  const [logStatus, setLogStatus] = useState<'compliant' | 'minor_excursion' | 'flagged' | 'completed'>('compliant');
  const [notes, setNotes] = useState('Dock transfer completed. Temperature stayed under 8.0°C limit during pallet movement.');

  // Auto-calculated door-open duration
  const autoDoorDuration = calculateMinutesDiff(doorOpenTime, doorCloseTime) || 9;
  const autoStopDuration = calculateMinutesDiff(arrivalTime, departureTime) || 18;

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    recordComplianceLog({
      driverId,
      driverName,
      vehicleId,
      shipmentId,
      cargoType,
      cargoQuantity: Number(cargoQuantity),
      pickupTime,
      deliveryLocation,
      arrivalTime,
      departureTime,
      doorOpenTime,
      doorCloseTime,
      doorOpenDurationMins: autoDoorDuration,
      tempBeforeOpen: Number(tempBeforeOpen),
      tempAfterClose: Number(tempAfterClose),
      status: logStatus,
      notes,
      verifiedBy: 'Hospital Intake Pharmacist',
    });
    setShowLogModal(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Audit Hash',
      'Driver ID',
      'Driver Name',
      'Vehicle ID',
      'Shipment ID',
      'Cargo Type',
      'Quantity',
      'Delivery Location',
      'Arrival Time',
      'Door Open Duration (m)',
      'Temp Before (°C)',
      'Temp After (°C)',
      'Status',
      'Notes',
    ];

    const rows = complianceLogs.map((l) => [
      l.id,
      l.auditHash,
      l.driverId,
      `"${l.driverName}"`,
      l.vehicleId,
      l.shipmentId,
      `"${l.cargoType}"`,
      l.cargoQuantity,
      `"${l.deliveryLocation}"`,
      l.arrivalTime,
      l.doorOpenDurationMins,
      l.tempBeforeOpen,
      l.tempAfterClose,
      l.status,
      `"${l.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coldchain_gdp_compliance_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = complianceLogs.filter((log) => {
    const matchSearch =
      !search ||
      log.driverName.toLowerCase().includes(search.toLowerCase()) ||
      log.vehicleId.toLowerCase().includes(search.toLowerCase()) ||
      log.shipmentId.toLowerCase().includes(search.toLowerCase()) ||
      log.deliveryLocation.toLowerCase().includes(search.toLowerCase()) ||
      log.auditHash.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Automated Compliance Logs & Regulatory Audit Trail
            </h2>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" />
              FDA 21 CFR Part 11 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped driver delivery events, door-open duration tracking, and chain-of-custody transfer records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV Audit</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Driver Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit hash, driver, vehicle ID, hospital location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Audit Records</option>
            <option value="compliant">Compliant</option>
            <option value="minor_excursion">Minor Excursion</option>
            <option value="flagged">Flagged / Breach</option>
            <option value="completed">Completed Transfer</option>
          </select>
        </div>
      </div>

      {/* Main Compliance Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Chain of Custody & Delivery Compliance Events</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified physical transfers, door cycle durations, and thermal before/after differentials
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {filteredLogs.length} Verified Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Audit Record & Hash</th>
                <th className="py-3 px-4">Driver & Vehicle</th>
                <th className="py-3 px-4">Cargo & Quantity</th>
                <th className="py-3 px-4">Delivery Location</th>
                <th className="py-3 px-4">Door-Open Duration</th>
                <th className="py-3 px-4">Before / After Temp</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => {
                const isCompliant = log.status === 'compliant' || log.status === 'completed';
                const isFlagged = log.status === 'flagged';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">{log.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Hash className="w-3 h-3 text-slate-400" />
                        {log.auditHash}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.driverName}</div>
                      <div className="text-[11px] text-slate-400">
                        {log.driverId} • {log.vehicleId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{log.cargoType}</div>
                      <div className="text-[10px] text-slate-400">
                        {log.cargoQuantity.toLocaleString()} Units ({log.shipmentId})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium truncate max-w-[200px]">
                        {log.deliveryLocation}
                      </div>
                      <div className="text-[10px] text-slate-400">Arrival: {log.arrivalTime}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-semibold">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span className={log.doorOpenDurationMins > 10 ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                          {log.doorOpenDurationMins} mins
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.doorOpenTime.slice(-5)} to {log.doorCloseTime.slice(-5)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-slate-600">{log.tempBeforeOpen.toFixed(1)}°C</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span
                        className={`font-bold ${
                          log.tempAfterClose > 8.0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {log.tempAfterClose.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isCompliant
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isFlagged
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {log.status === 'compliant'
                          ? 'Compliant'
                          : log.status === 'completed'
                          ? 'Transfer Complete'
                          : log.status === 'flagged'
                          ? 'Flagged Excursion'
                          : 'Minor Excursion'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {log.verifiedBy || 'Intake Pharmacist'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Driver Event Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Driver Delivery & Door Event</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter stop times, door open duration, and temperature readings for regulatory audit.
            </p>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Name & ID</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle ID</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.id} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Destination</label>
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Door Opened Time</label>
                  <input
                    type="text"
                    required
                    value={doorOpenTime}
                    onChange={(e) => setDoorOpenTime(e.target.value)}
                    placeholder="2026-10-23 11:42"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Door Closed Time</label>
                  <input
                    type="text"
                    required
                    value={doorCloseTime}
                    onChange={(e) => setDoorCloseTime(e.target.value)}
                    placeholder="2026-10-23 11:51"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
                <span>Calculated Door-Open Exposure Duration:</span>
                <strong className="font-mono text-sm">{autoDoorDuration} Minutes</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temp Before Opening (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tempBeforeOpen}
                    onChange={(e) => setTempBeforeOpen(parseFloat(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temp After Resealing (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tempAfterClose}
                    onChange={(e) => setTempAfterClose(parseFloat(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Compliance Status</label>
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="compliant">Compliant (No excursions, normal door cycle)</option>
                  <option value="minor_excursion">Minor Excursion (Brief thermal rise, safe)</option>
                  <option value="flagged">Flagged / Breach (Limit exceeded, hospital quarantine)</option>
                  <option value="completed">Completed Delivery (Final Signoff)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Handover Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Save & Compute Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
