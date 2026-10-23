/**
 * ColdChain AI - Left Enterprise Navigation Sidebar
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Thermometer,
  BrainCircuit,
  Navigation,
  MapPin,
  CloudSun,
  ClipboardCheck,
  TrendingDown,
  Bell,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useColdChain, NavigationPage } from '../../context/ColdChainContext';

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ElementType;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, hospitalInventories, mobileNavOpen, setMobileNavOpen } =
    useColdChain();
  const [collapsed, setCollapsed] = useState(false);

  const unreadAlerts = alerts.filter((a) => a.status === 'new').length;

  const totalInboundBatches = hospitalInventories.reduce(
    (acc, curr) => acc + curr.inboundBatches.length,
    0
  );

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'temperature_monitoring', label: 'Temperature Monitoring', icon: Thermometer },
    { id: 'spoilage_prediction', label: 'Spoilage Prediction', icon: BrainCircuit },
    { id: 'route_optimization', label: 'Route Optimization', icon: Navigation },
    { id: 'live_tracking', label: 'Live Vehicle Tracking', icon: MapPin },
    { id: 'ambient_weather', label: 'Ambient Weather', icon: CloudSun },
    { id: 'compliance_logs', label: 'Compliance Logs', icon: ClipboardCheck },
    { id: 'spoilage_risk_analysis', label: 'Spoilage Risk Analysis', icon: TrendingDown },
    {
      id: 'alerts',
      label: 'Alerts & Notifications',
      icon: Bell,
      badge: unreadAlerts > 0 ? unreadAlerts : undefined,
    },
    {
      id: 'hospital_inventory',
      label: 'Hospital Inventory Sync',
      icon: Building2,
      badge: totalInboundBatches > 0 ? totalInboundBatches : undefined,
      highlight: true,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40"
        />
      )}

      <aside
        className={`fixed md:sticky top-[61px] inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between select-none h-[calc(100vh-61px)] ${
          mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-64 md:w-18' : 'w-64'}`}
      >
      {/* Navigation Links */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-3">
          {!collapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Fleet Operations
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer ml-auto"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!collapsed && (
                <span className="truncate text-left flex-1">{item.label}</span>
              )}

              {/* Badges */}
              {item.badge !== undefined && !collapsed && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    item.id === 'alerts'
                      ? 'bg-red-500 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Collapsed dot indicator */}
              {collapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Telematics & Compliance Status */}
      <div className="p-3 border-t border-slate-100">
        {!collapsed ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800">IoT Telematics Grid</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center justify-between">
                <span>Active Reefer Sensors:</span>
                <span className="font-mono font-semibold text-slate-700">5 / 5 Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>EHR Integration:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> FHIR R4 Ready
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
