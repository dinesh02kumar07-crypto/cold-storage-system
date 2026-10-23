/**
 * ColdChain AI - System Settings & Telematics Configuration
 * Manages temperature thresholds by cargo type, 20-30m alert lead times,
 * notification endpoints, sensor ingestion protocols, and units.
 */

import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Bell,
  CloudSun,
  Navigation,
  Radio,
  Save,
  CheckCircle2,
  Shield,
  Server,
  Zap,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(25);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [telemetryIntervalSec, setTelemetryIntervalSec] = useState(15);
  const [weatherProvider, setWeatherProvider] = useState('OpenWeather / OpenMeteo High-Resolution');
  const [routingProvider, setRoutingProvider] = useState('OSRM + Multi-criteria Heat Corridor Optimizer');
  const [predictionModelEndpoint, setPredictionModelEndpoint] = useState('https://ml-edge.coldchain.ai/v2/thermal-predict');
  const [smsWebhook, setSmsWebhook] = useState('+1 (555) 019-2834 (Twilio SMS Gateway)');
  const [hospitalFhirWebhook, setHospitalFhirWebhook] = useState('https://epic-proxy.coldchain.ai/fhir/r4/SupplyDelivery');

  // Cargo Presets
  const [thresholds, setThresholds] = useState({
    vaccineMin: 2.0,
    vaccineMax: 8.0,
    insulinMin: 2.0,
    insulinMax: 8.0,
    bloodMin: 1.0,
    bloodMax: 6.0,
    biologicsMin: 2.0,
    biologicsMax: 8.0,
    mrnaMin: -80.0,
    mrnaMax: -20.0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('System settings and telematics configuration saved successfully!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Telematics Config</h2>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              ColdChain Core v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pharmaceutical safety tolerances, predictive alert lead times, and API integration adapters
          </p>
        </div>

        {toastMessage && (
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Temperature Thresholds by Cargo Type */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            Pharmaceutical Cargo Temperature Threshold Presets
          </h3>
          <p className="text-xs text-slate-500">
            Complies with WHO Technical Report Series No. 961 Annex 9 and USP &lt;1079&gt;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Standard Vaccines */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Standard Vaccines & Inactivated Antigens</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.vaccineMin}
                    onChange={(e) => setThresholds({ ...thresholds, vaccineMin: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Max Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.vaccineMax}
                    onChange={(e) => setThresholds({ ...thresholds, vaccineMax: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Recombinant Insulin */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Recombinant Human Insulin</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.insulinMin}
                    onChange={(e) => setThresholds({ ...thresholds, insulinMin: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Max Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.insulinMax}
                    onChange={(e) => setThresholds({ ...thresholds, insulinMax: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Blood Products */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Packed Red Blood Cells (PRBC)</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.bloodMin}
                    onChange={(e) => setThresholds({ ...thresholds, bloodMin: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Max Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.bloodMax}
                    onChange={(e) => setThresholds({ ...thresholds, bloodMax: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Monoclonal Antibodies */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Biologics & Monoclonal Antibodies</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.biologicsMin}
                    onChange={(e) => setThresholds({ ...thresholds, biologicsMin: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Max Limit (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={thresholds.biologicsMax}
                    onChange={(e) => setThresholds({ ...thresholds, biologicsMax: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Predictive Alert Lead Time Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            Predictive Early Warning Lead Time Target
          </h3>
          <p className="text-xs text-slate-500">
            Window of time required to dispatch corrective interventions before thermal boundary breach
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Configured Lead-Time Target:</span>
              <span className="text-base font-bold font-mono text-blue-600 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-lg">
                {leadTimeMinutes} Minutes Ahead
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="1"
              value={leadTimeMinutes}
              onChange={(e) => setLeadTimeMinutes(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>15 min (Tight Urban)</span>
              <span className="font-semibold text-slate-600">20–30 min (Optimal Standard)</span>
              <span>45 min (Interstate Transit)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Telematics & API Adapters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            Telematics & Cloud Integration Adapters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Weather Service Provider</label>
              <input
                type="text"
                value={weatherProvider}
                onChange={(e) => setWeatherProvider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Routing & Highway Thermal Engine</label>
              <input
                type="text"
                value={routingProvider}
                onChange={(e) => setRoutingProvider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Predictive Spoilage ML Endpoint</label>
              <input
                type="text"
                value={predictionModelEndpoint}
                onChange={(e) => setPredictionModelEndpoint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver SMS Gateway Webhook</label>
                <input
                  type="text"
                  value={smsWebhook}
                  onChange={(e) => setSmsWebhook(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospital FHIR R4 Inbound Dispatch</label>
                <input
                  type="text"
                  value={hospitalFhirWebhook}
                  onChange={(e) => setHospitalFhirWebhook(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Presets</span>
          </button>
        </div>
      </form>
    </div>
  );
};
