/**
 * ColdChain AI - Hospital Inventory Integration & EHR Bridge
 * Integrates directly with hospital pharmacy systems (Epic Hyperdrive, Cerner Millennium, Pyxis MedStation)
 * to automate cold-chain intake, FHIR R4 serialization, and automatic quarantine protocols.
 */

import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertOctagon,
  RotateCw,
  QrCode,
  CheckCircle2,
  FileCode,
  Package,
  ArrowRight,
  Database,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';

export const HospitalInventoryIntegration: React.FC = () => {
  const { hospitalInventories, syncHospitalInventory, shipments } = useColdChain();

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-STJUDE');
  const [showFhirModal, setShowFhirModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('01003006900142171727102310BN-88421-VAC');
  const [scanResult, setScanResult] = useState<string | null>(null);

  const selectedHospital =
    hospitalInventories.find((h) => h.hospitalId === selectedHospitalId) || hospitalInventories[0];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      syncHospitalInventory(selectedHospital.hospitalId);
      setIsSyncing(false);
    }, 500);
  };

  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    const match = selectedHospital.inboundBatches.find(
      (b) => barcodeInput.includes(b.batchNumber) || b.batchNumber.includes(barcodeInput)
    );

    if (match) {
      if (match.tempStatus === 'quarantined') {
        setScanResult(
          `ALERT: Batch ${match.batchNumber} matched but is QUARANTINED due to recorded temperature excursion. Hospital locker locked.`
        );
      } else {
        setScanResult(
          `SUCCESS: Batch ${match.batchNumber} verified! Temperature chain unbroken (${match.currentTemp.toFixed(1)}°C). Assigned to ${match.storageUnitAssigned}.`
        );
      }
    } else {
      setScanResult(`Batch barcode not found in active hospital dispatch manifests.`);
    }
  };

  // FHIR R4 Mock JSON
  const fhirPayload = {
    resourceType: 'SupplyDelivery',
    id: `supply-delivery-${selectedHospital.facilityCode.toLowerCase()}`,
    status: 'in-progress',
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/SupplyDelivery'],
      lastUpdated: new Date().toISOString(),
    },
    extension: [
      {
        url: 'http://coldchain.ai/fhir/StructureDefinition/continuous-telematics',
        valueQuantity: {
          value: selectedHospital.inboundBatches[0]?.currentTemp || 4.2,
          unit: 'degC',
          system: 'http://unitsofmeasure.org',
          code: 'Cel',
        },
      },
      {
        url: 'http://coldchain.ai/fhir/StructureDefinition/auto-quarantine-status',
        valueBoolean: selectedHospital.autoQuarantineActive,
      },
    ],
    receiver: [
      {
        display: selectedHospital.hospitalName,
        identifier: { system: 'http://hospital.org/facility-id', value: selectedHospital.facilityCode },
      },
    ],
    suppliedItem: selectedHospital.inboundBatches.map((b) => ({
      quantity: { value: b.doses, unit: 'doses' },
      itemCodeableConcept: {
        text: b.cargoName,
        coding: [{ system: 'http://hl7.org/fhir/sid/ndc', code: b.batchNumber }],
      },
    })),
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital Inventory & Pharmacy EHR Integration
            </h2>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              HL7 / FHIR R4 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronizes cold-chain telemetry with hospital inpatient formularies (Epic, Cerner, Pyxis) for zero-risk patient dispensing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFhirModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>View FHIR R4 JSON</span>
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing EHR...' : 'Sync Hospital Inventory'}</span>
          </button>
        </div>
      </div>

      {/* Hospital Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {hospitalInventories.map((hosp) => {
          const isSelected = hosp.hospitalId === selectedHospitalId;
          const quarantinedCount = hosp.inboundBatches.filter((b) => b.tempStatus === 'quarantined').length;

          return (
            <div
              key={hosp.hospitalId}
              onClick={() => setSelectedHospitalId(hosp.hospitalId)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 text-[10px] font-bold">{hosp.facilityCode}</span>
                <span className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {hosp.ehrSystem.split(' ')[0]} Connected
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{hosp.hospitalName}</h4>
              <p className="text-[11px] text-slate-500 truncate">{hosp.department}</p>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">
                  {hosp.inboundBatches.length} Inbound Shipments
                </span>
                {quarantinedCount > 0 ? (
                  <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
                    {quarantinedCount} Quarantined
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> All Safe
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hospital Terminal Health Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{selectedHospital.hospitalName}</h3>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {selectedHospital.ehrSystem}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                FHIR Endpoint: {selectedHospital.fhirEndpoint}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Last Bi-directional Handshake</span>
            <span className="text-xs font-mono font-bold text-slate-800">
              {selectedHospital.lastSyncTimestamp}
            </span>
          </div>
        </div>

        {/* Auto Quarantine Safety Protocol Callout */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-700">
              Automatic EHR Cold-Chain Quarantine Guard: <strong className="text-emerald-700">ENFORCED</strong>
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            If reefer breaches safe limits, batch is locked on hospital inventory before driver unloads.
          </span>
        </div>
      </div>

      {/* Inbound Batches & Intake Dock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inbound Medication & Vaccine Batches</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated intake verification and hospital cold-vault allocation
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {selectedHospital.inboundBatches.length} Active Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch Number & NDC</th>
                <th className="py-3 px-4">Medication / Vaccine</th>
                <th className="py-3 px-4">Payload Units</th>
                <th className="py-3 px-4">Telemetry Temp</th>
                <th className="py-3 px-4">Intake Status</th>
                <th className="py-3 px-4">Assigned Storage Vault</th>
                <th className="py-3 px-4">Estimated Dock Arrival</th>
                <th className="py-3 px-4 text-right">EHR Sync Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {selectedHospital.inboundBatches.map((batch) => {
                const isQuarantined = batch.tempStatus === 'quarantined';
                const isWarning = batch.tempStatus === 'excursion_warning';

                return (
                  <tr key={batch.batchNumber} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{batch.batchNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        FHIR ID: {batch.fhirMedicationId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{batch.cargoName}</div>
                      <div className="text-[10px] text-slate-400">
                        Shipment: {batch.shipmentId} ({batch.vehicleId})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">{batch.doses.toLocaleString()} doses</td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isQuarantined
                            ? 'bg-red-100 text-red-700 font-black'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {batch.currentTemp.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isQuarantined
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : isWarning
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isQuarantined
                          ? 'AUTO-QUARANTINED'
                          : isWarning
                          ? 'EXCURSION WARNING'
                          : 'SAFE INTAKE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {batch.storageUnitAssigned}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{batch.arrivalEta}</td>
                    <td className="py-3.5 px-4 text-right">
                      {isQuarantined ? (
                        <span className="text-[11px] text-red-600 font-semibold flex items-center justify-end gap-1">
                          <Lock className="w-3 h-3" /> Dispensing Locked
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Pre-cleared
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GS1 DataMatrix Barcode Verification Terminal */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-blue-600" />
          Hospital Receiving Dock GS1 Barcode Scanner Terminal
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Scan inbound container DataMatrix barcode to verify cold-chain integrity before accepting handover
        </p>

        <form onSubmit={handleScanBarcode} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan or paste GS1 barcode..."
            className="w-full sm:flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shrink-0"
          >
            Verify Cold-Chain Passcode
          </button>
        </form>

        {scanResult && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              scanResult.includes('QUARANTINED')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {scanResult.includes('QUARANTINED') ? (
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{scanResult}</span>
          </div>
        )}
      </div>

      {/* FHIR R4 JSON Modal */}
      {showFhirModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">HL7 FHIR R4 SupplyDelivery Resource</h3>
              </div>
              <button
                onClick={() => setShowFhirModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <pre className="mt-4 p-4 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-96 border border-slate-800">
              {JSON.stringify(fhirPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
