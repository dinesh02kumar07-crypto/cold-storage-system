/**
 * ColdChain AI - Smart Medicine Transportation & Spoilage Prediction Platform
 * Master Application Shell
 */

import React from 'react';
import { ColdChainProvider, useColdChain } from './context/ColdChainContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { TemperatureMonitoring } from './components/temperature/TemperatureMonitoring';
import { SpoilagePrediction } from './components/prediction/SpoilagePrediction';
import { RouteOptimization } from './components/routing/RouteOptimization';
import { LiveVehicleTracking } from './components/tracking/LiveVehicleTracking';
import { AmbientWeather } from './components/weather/AmbientWeather';
import { ComplianceLogs } from './components/compliance/ComplianceLogs';
import { SpoilageRiskAnalysis } from './components/risk/SpoilageRiskAnalysis';
import { AlertsAndNotifications } from './components/alerts/AlertsAndNotifications';
import { HospitalInventoryIntegration } from './components/hospital/HospitalInventoryIntegration';
import { SettingsPage } from './components/settings/SettingsPage';

const AppContent: React.FC = () => {
  const { activeTab } = useColdChain();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'temperature_monitoring':
        return <TemperatureMonitoring />;
      case 'spoilage_prediction':
        return <SpoilagePrediction />;
      case 'route_optimization':
        return <RouteOptimization />;
      case 'live_tracking':
        return <LiveVehicleTracking />;
      case 'ambient_weather':
        return <AmbientWeather />;
      case 'compliance_logs':
        return <ComplianceLogs />;
      case 'spoilage_risk_analysis':
        return <SpoilageRiskAnalysis />;
      case 'alerts':
        return <AlertsAndNotifications />;
      case 'hospital_inventory':
        return <HospitalInventoryIntegration />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-16">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ColdChainProvider>
      <AppContent />
    </ColdChainProvider>
  );
}
