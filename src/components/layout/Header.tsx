/**
 * ColdChain AI - Enterprise Header Bar
 */

import React, { useState, useEffect } from 'react';
import {
  ThermometerSnowflake,
  Search,
  Bell,
  Clock,
  Zap,
  RotateCcw,
  User,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Database,
  Cloud,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useColdChain } from '../../context/ColdChainContext';
import { UserRole } from '../../types/coldchain';
import { SUPABASE_CONFIG, SUPABASE_SQL_SCHEMA } from '../../services/supabaseService';

export const Header: React.FC = () => {
  const {
    userRole,
    setUserRole,
    searchQuery,
    setSearchQuery,
    alerts,
    selectedVehicleId,
    simulateTempSpike,
    resetDemoData,
    setActiveTab,
    mobileNavOpen,
    setMobileNavOpen,
    supabaseStatus,
    isSyncingSupabase,
    syncDataToSupabase,
    refreshSupabaseStatus,
  } = useColdChain();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter((a) => a.status === 'new');

  const roleLabels: Record<UserRole, string> = {
    fleet_manager: 'Fleet Manager',
    admin: 'Logistics Administrator',
    logistics_agent: 'Delivery Agent',
    driver: 'Field Driver',
    hospital_pharmacist: 'Hospital Pharmacist',
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
          <ThermometerSnowflake className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">ColdChain AI</h1>
            <span className="text-[9px] sm:text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Live</span> Telematics
            </span>
            <button
              onClick={() => setShowSupabaseModal(true)}
              title="Supabase Cloud Database (Click to view project details & sync)"
              className="hidden lg:flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200 cursor-pointer transition-colors"
            >
              <Database className="w-3 h-3 text-teal-600" />
              <span>Supabase ({SUPABASE_CONFIG.region})</span>
            </button>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1">Smart Medicine Transportation & Spoilage Prediction Platform</p>
        </div>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vehicles, vaccines, batch numbers, hospitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Hackathon Quick Demo Trigger */}
        <button
          onClick={() => simulateTempSpike(selectedVehicleId, 1.8)}
          title="Simulate +1.8°C refrigerator temperature surge to trigger 20-30 min predictive early warning"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>Simulate Temp Surge (+1.8°C)</span>
        </button>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || '08:45:00 AM'}</span>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={resetDemoData}
          title="Reset to initial clean demo data"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Reset Demo Data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-slate-800">
                    Active Telematics Alerts ({alerts.length})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('alerts');
                    setShowNotifications(false);
                  }}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setActiveTab('alerts');
                      setShowNotifications(false);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                        )}
                        <span className="text-xs font-semibold text-slate-800">
                          {alert.vehicleName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {alert.leadTimeMinutes > 0 ? `${alert.leadTimeMinutes}m warning` : 'Immediate'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      {alert.recommendedAction}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                      <span>{alert.cargoName}</span>
                      <span className="font-mono text-slate-700 font-semibold">{alert.currentTemp.toFixed(1)}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                {roleLabels[userRole]}
              </div>
              <div className="text-[9px] text-slate-400">Demo User</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role Profile
              </div>
              {(Object.keys(roleLabels) as UserRole[]).map((roleKey) => (
                <button
                  key={roleKey}
                  onClick={() => {
                    setUserRole(roleKey);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    userRole === roleKey
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{roleLabels[roleKey]}</span>
                  {userRole === roleKey && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Supabase Cloud Connection Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Supabase Cloud Database Connection</h3>
                  <p className="text-xs text-slate-500">Persistent PostgreSQL backend & live telemetry replication</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Status Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Connection Status</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    supabaseStatus.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {supabaseStatus.connected ? 'Active & Reachable' : 'Connecting'}
                </span>
              </div>
              <div className="text-xs text-slate-700 font-medium">
                {supabaseStatus.message}
                {supabaseStatus.latencyMs > 0 && ` (${supabaseStatus.latencyMs}ms roundtrip latency)`}
              </div>
            </div>

            {/* Project Parameters */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Project Name:</span>
                <span className="font-semibold text-slate-800">{SUPABASE_CONFIG.projectName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Project ID:</span>
                <span className="font-mono font-bold text-teal-700">{SUPABASE_CONFIG.projectId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Region:</span>
                <span className="font-semibold text-slate-800">{SUPABASE_CONFIG.region} (Singapore)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">REST API URL:</span>
                <span className="font-mono text-slate-700 truncate max-w-[280px]">{SUPABASE_CONFIG.restApiUrl}</span>
              </div>
            </div>

            {/* Feedback message */}
            {syncFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied to Clipboard!' : 'Copy SQL Schema Script'}</span>
              </button>

              <button
                onClick={async () => {
                  const res = await syncDataToSupabase();
                  setSyncFeedback(res.message);
                  setTimeout(() => setSyncFeedback(null), 4000);
                }}
                disabled={isSyncingSupabase}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Cloud className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                <span>{isSyncingSupabase ? 'Pushing Data...' : 'Sync Fleet to Supabase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
