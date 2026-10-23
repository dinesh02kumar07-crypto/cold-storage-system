/**
 * ColdChain AI - Central State Management & Business Logic Context
 * Synchronizes all pages, real-time alerts, telematics simulation, and hospital EHR inventory.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Vehicle,
  Shipment,
  Alert,
  ComplianceLog,
  WeatherData,
  HospitalInventorySync,
  UserRole,
  TempReading,
  CoolingStatus,
} from '../types/coldchain';
import {
  INITIAL_VEHICLES,
  INITIAL_SHIPMENTS,
  INITIAL_ALERTS,
  INITIAL_COMPLIANCE_LOGS,
  INITIAL_WEATHER,
  INITIAL_HOSPITAL_INVENTORIES,
} from '../data/mockData';
import {
  calculateRateOfChange,
  generateProjectionCurve,
  calculateBreachPrediction,
  calculateSpoilageRiskScore,
} from '../utils/coldchainMath';
import {
  testSupabaseConnection,
  persistReadingToSupabase,
  persistVehicleToSupabase,
  persistAlertToSupabase,
  persistComplianceLogToSupabase,
  syncFullStateToSupabase,
  SUPABASE_CONFIG,
} from '../services/supabaseService';

export type NavigationPage =
  | 'overview'
  | 'temperature_monitoring'
  | 'spoilage_prediction'
  | 'route_optimization'
  | 'live_tracking'
  | 'ambient_weather'
  | 'compliance_logs'
  | 'spoilage_risk_analysis'
  | 'alerts'
  | 'hospital_inventory'
  | 'settings';

interface ColdChainContextType {
  activeTab: NavigationPage;
  setActiveTab: (tab: NavigationPage) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  vehicles: Vehicle[];
  shipments: Shipment[];
  alerts: Alert[];
  complianceLogs: ComplianceLog[];
  weather: WeatherData;
  hospitalInventories: HospitalInventorySync[];

  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  selectedShipmentId: string;
  setSelectedShipmentId: (id: string) => void;

  // Real-time operations
  addVehicle: (vehicleData: Partial<Vehicle>) => void;
  createShipment: (shipmentData: Partial<Shipment>) => void;
  saveSensorReading: (reading: {
    vehicleId: string;
    internalTemp: number;
    ambientTemp: number;
    humidity: number;
    doorOpen: boolean;
    coolingStatus: CoolingStatus;
    source: 'iot_sensor' | 'manual' | 'simulated';
    sensorId: string;
  }) => void;

  simulateTempSpike: (vehicleId: string, deltaDegrees: number) => void;
  toggleDoorStatus: (vehicleId: string) => void;
  setVehicleCoolingStatus: (vehicleId: string, status: CoolingStatus) => void;

  acknowledgeAlert: (alertId: string) => void;
  assignAlert: (alertId: string, assignee: string) => void;
  resolveAlert: (alertId: string) => void;

  recordComplianceLog: (log: Omit<ComplianceLog, 'id' | 'auditHash'>) => void;
  completeDelivery: (shipmentId: string) => void;

  refreshWeather: () => void;
  resetDemoData: () => void;
  syncHospitalInventory: (hospitalId: string) => void;

  // Telematics Simulation controls
  isSimulating: boolean;
  simulationSpeed: number; // 1, 2, 5
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;

  // Derived statistics for executive dashboard
  dashboardStats: {
    activeVehiclesCount: number;
    safeVehiclesCount: number;
    highRiskShipmentsCount: number;
    deliveriesCompletedToday: number;
  };

  // Supabase Cloud Integration
  supabaseStatus: {
    connected: boolean;
    message: string;
    latencyMs: number;
    lastChecked: string;
    projectId: string;
    region: string;
  };
  isSyncingSupabase: boolean;
  syncDataToSupabase: () => Promise<{ success: boolean; message: string }>;
  refreshSupabaseStatus: () => Promise<void>;
}

const ColdChainContext = createContext<ColdChainContextType | undefined>(undefined);

export const ColdChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationPage>('overview');
  const [userRole, setUserRole] = useState<UserRole>('fleet_manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>(INITIAL_COMPLIANCE_LOGS);
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [hospitalInventories, setHospitalInventories] = useState<HospitalInventorySync[]>(INITIAL_HOSPITAL_INVENTORIES);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('V-104');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('SHP-9002');

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState({
    connected: false,
    message: 'Testing connection to Supabase...',
    latencyMs: 0,
    lastChecked: '',
    projectId: SUPABASE_CONFIG.projectId,
    region: SUPABASE_CONFIG.region,
  });
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  const refreshSupabaseStatus = async () => {
    const result = await testSupabaseConnection();
    setSupabaseStatus({
      connected: result.connected,
      message: result.message,
      latencyMs: result.latencyMs,
      lastChecked: result.lastChecked,
      projectId: SUPABASE_CONFIG.projectId,
      region: SUPABASE_CONFIG.region,
    });
  };

  useEffect(() => {
    refreshSupabaseStatus();
  }, []);

  const syncDataToSupabase = async () => {
    setIsSyncingSupabase(true);
    const res = await syncFullStateToSupabase(vehicles, alerts, complianceLogs);
    await refreshSupabaseStatus();
    setIsSyncingSupabase(false);
    return res;
  };

  // Sync selected shipment when vehicle changes
  useEffect(() => {
    const v = vehicles.find((item) => item.id === selectedVehicleId);
    if (v && v.assignedShipmentId) {
      setSelectedShipmentId(v.assignedShipmentId);
    }
  }, [selectedVehicleId, vehicles]);

  // Derived dashboard metrics from actual dynamic state
  const dashboardStats = useMemo(() => {
    const activeVehicles = vehicles.filter((v) => v.status !== 'completed' && v.status !== 'idle');
    const safeVehicles = vehicles.filter((v) => {
      const shp = shipments.find((s) => s.vehicleId === v.id);
      if (!shp) return true;
      return (
        shp.currentTemp >= shp.cargo.minTemp &&
        shp.currentTemp <= shp.cargo.maxTemp &&
        shp.riskScore < 50
      );
    });

    const highRiskShipments = shipments.filter(
      (s) => s.status !== 'delivered' && (s.riskLevel === 'high' || s.riskLevel === 'critical' || s.riskScore >= 60)
    );

    const completed = shipments.filter((s) => s.status === 'delivered').length;

    return {
      activeVehiclesCount: activeVehicles.length,
      safeVehiclesCount: safeVehicles.length,
      highRiskShipmentsCount: highRiskShipments.length,
      deliveriesCompletedToday: completed,
    };
  }, [vehicles, shipments]);

  // Add a new vehicle to fleet
  const addVehicle = (vehicleData: Partial<Vehicle>) => {
    const newId = `V-${100 + vehicles.length + 1}`;
    const newVehicle: Vehicle = {
      id: newId,
      name: vehicleData.name || `BioReefer Unit ${vehicles.length + 1}`,
      plateNumber: vehicleData.plateNumber || `CC-${Math.floor(100 + Math.random() * 900)}-NY`,
      driverId: `DRV-${800 + vehicles.length + 1}`,
      driverName: vehicleData.driverName || 'Alex Mercer',
      driverPhone: vehicleData.driverPhone || '+1 (555) 789-0123',
      status: 'in_transit',
      model: vehicleData.model || 'ThermoKing Hybrid Reefer 2026',
      refrigType: vehicleData.refrigType || 'TK MultiTemp Active Chill',
      coolingStatus: 'optimal',
      doorStatus: 'closed',
      batteryOrFuelPercent: 95,
      insulationRating: vehicleData.insulationRating || 'High',
      currentTemp: vehicleData.currentTemp ?? 4.0,
      currentHumidity: 45,
      ambientTemp: weather.temp,
      lastUpdate: 'Just now',
      currentLat: 40.7180,
      currentLng: -73.9900,
      speedKmH: 45,
    };

    setVehicles((prev) => [newVehicle, ...prev]);
    setSelectedVehicleId(newId);
  };

  // Create a new shipment
  const createShipment = (shipmentData: Partial<Shipment>) => {
    const newId = `SHP-${9000 + shipments.length + 1}`;
    const targetVehicle = vehicles.find((v) => v.id === shipmentData.vehicleId) || vehicles[0];

    const cargo = shipmentData.cargo || {
      id: `CRG-00${shipments.length + 1}`,
      name: 'Varicella-Zoster Live Vaccine',
      category: 'vaccine',
      minTemp: 2.0,
      maxTemp: 8.0,
      criticalMaxTemp: 10.0,
      criticalMinTemp: 0.0,
      q10SensitivityFactor: 2.2,
      shelfLifeHoursAtExcursion: 8,
      batchNumber: `BN-${Math.floor(10000 + Math.random() * 90000)}-VAC`,
      quantityDoses: 1500,
      targetHospital: "St. Jude Children's Research & Medical Center",
      hospitalFacilityId: 'HOSP-STJUDE',
      packagingType: 'VIP Shipper (Vacuum Insulated)',
    };

    const newShipment: Shipment = {
      id: newId,
      trackingCode: `MED-2026-${9000 + shipments.length + 1}-VAC`,
      vehicleId: targetVehicle.id,
      cargo,
      origin: shipmentData.origin || {
        id: 'LOC-HUB-01',
        name: 'Metro BioLogistics Central Hub',
        address: '100 Terminal Way, Secaucus, NJ',
        lat: 40.7128,
        lng: -74.0060,
        type: 'warehouse',
      },
      destination: shipmentData.destination || {
        id: 'LOC-HOSP-01',
        name: cargo.targetHospital,
        address: '500 E 71st St, New York, NY',
        lat: 40.7306,
        lng: -73.9352,
        type: 'hospital',
      },
      stops: shipmentData.stops || [],
      startTime: new Date().toISOString(),
      estimatedArrival: '12:30 PM',
      status: 'in_transit',
      currentTemp: targetVehicle.currentTemp || 4.2,
      tempHistory: [
        {
          id: `R-${Date.now()}`,
          shipmentId: newId,
          vehicleId: targetVehicle.id,
          timestamp: new Date().toISOString(),
          internalTemp: targetVehicle.currentTemp || 4.2,
          ambientTemp: weather.temp,
          humidity: 46,
          doorOpen: false,
          coolingStatus: 'optimal',
          source: 'iot_sensor',
          sensorId: 'SNS-AUTO-01',
        },
      ],
      excursionMinutes: 0,
      riskScore: 10,
      riskLevel: 'normal',
      rateOfTempChange: 0,
      estimatedBreachMinutes: null,
      leadTimeMinutes: null,
      recommendedAction: 'Shipment registered. Initial refrigeration check passed.',
    };

    setShipments((prev) => [newShipment, ...prev]);
    // Associate vehicle
    setVehicles((prev) =>
      prev.map((v) => (v.id === targetVehicle.id ? { ...v, assignedShipmentId: newId, status: 'in_transit' } : v))
    );
    setSelectedShipmentId(newId);
    setSelectedVehicleId(targetVehicle.id);
  };

  // Save new sensor reading & update entire ecosystem dynamically
  const saveSensorReading = (readingInput: {
    vehicleId: string;
    internalTemp: number;
    ambientTemp: number;
    humidity: number;
    doorOpen: boolean;
    coolingStatus: CoolingStatus;
    source: 'iot_sensor' | 'manual' | 'simulated';
    sensorId: string;
  }) => {
    const timestamp = new Date().toISOString();
    const readingId = `RDG-${Date.now()}`;

    const newReading: TempReading = {
      id: readingId,
      shipmentId: '',
      vehicleId: readingInput.vehicleId,
      timestamp,
      internalTemp: readingInput.internalTemp,
      ambientTemp: readingInput.ambientTemp,
      humidity: readingInput.humidity,
      doorOpen: readingInput.doorOpen,
      coolingStatus: readingInput.coolingStatus,
      source: readingInput.source,
      sensorId: readingInput.sensorId,
    };

    // Asynchronously sync reading & updated vehicle to Supabase
    persistReadingToSupabase(newReading).catch(() => {});
    const targetVeh = vehicles.find((v) => v.id === readingInput.vehicleId);
    if (targetVeh) {
      persistVehicleToSupabase({
        ...targetVeh,
        currentTemp: readingInput.internalTemp,
        ambientTemp: readingInput.ambientTemp,
        coolingStatus: readingInput.coolingStatus,
      }).catch(() => {});
    }

    // Update vehicle
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== readingInput.vehicleId) return v;
        let vStatus = v.status;
        if (readingInput.coolingStatus === 'malfunction') vStatus = 'critical';
        else if (readingInput.coolingStatus === 'degraded' || readingInput.doorOpen) vStatus = 'warning';
        else vStatus = 'in_transit';

        return {
          ...v,
          currentTemp: readingInput.internalTemp,
          ambientTemp: readingInput.ambientTemp,
          currentHumidity: readingInput.humidity,
          coolingStatus: readingInput.coolingStatus,
          doorStatus: readingInput.doorOpen ? 'open' : 'closed',
          lastUpdate: 'Just now',
          status: vStatus,
        };
      })
    );

    // Update shipment and trigger predictive alert engine
    setShipments((prev) =>
      prev.map((s) => {
        if (s.vehicleId !== readingInput.vehicleId) return s;

        newReading.shipmentId = s.id;
        const updatedHistory = [...s.tempHistory, newReading];

        // 1. Calculate rate of change
        const rate = calculateRateOfChange(updatedHistory);

        // 2. Generate 120m projection curve
        const projectionCurve = generateProjectionCurve(
          readingInput.internalTemp,
          readingInput.ambientTemp,
          readingInput.coolingStatus,
          readingInput.doorOpen,
          'Standard',
          120,
          5
        );

        // 3. Check breach prediction
        const breach = calculateBreachPrediction(
          readingInput.internalTemp,
          s.cargo.minTemp,
          s.cargo.maxTemp,
          projectionCurve
        );

        // 4. Update excursion duration
        let excursion = s.excursionMinutes;
        if (readingInput.internalTemp > s.cargo.maxTemp || readingInput.internalTemp < s.cargo.minTemp) {
          excursion += 5; // increment excursion time
        }

        // 5. Calculate transparent spoilage risk score
        const risk = calculateSpoilageRiskScore(
          readingInput.internalTemp,
          s.cargo.minTemp,
          s.cargo.maxTemp,
          excursion,
          rate,
          s.cargo.q10SensitivityFactor
        );

        // 6. Alert generation when conditions warrant
        if (breach.is20To30MinWarning || breach.isImmediateWarning || risk.score >= 60) {
          const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
          const severity: Alert['severity'] = breach.isImmediateWarning || risk.score >= 80 ? 'critical' : 'warning';

          const newAlert: Alert = {
            id: alertId,
            timestamp: new Date().toISOString(),
            vehicleId: s.vehicleId,
            vehicleName: vehicles.find((v) => v.id === s.vehicleId)?.name || s.vehicleId,
            shipmentId: s.id,
            cargoName: s.cargo.name,
            currentTemp: readingInput.internalTemp,
            safeRange: [s.cargo.minTemp, s.cargo.maxTemp],
            predictedBreachTime: breach.estimatedBreachMinutes
              ? `In ${breach.estimatedBreachMinutes} mins`
              : 'Imminent',
            leadTimeMinutes: breach.leadTimeMinutes || 0,
            riskScore: risk.score,
            severity,
            recommendedAction:
              breach.is20To30MinWarning
                ? `20-30m Predictive Warning: Refrigerator temperature trending upward (+${rate}°C/min). Inspect cooling vents, minimize door cycles, or prepare reroute to cold hub.`
                : breach.isImmediateWarning
                ? `IMMEDIATE WARNING: Safe temperature limit breach imminent (<20m). Reroute to nearest hospital receiving dock or activate emergency dry-ice.`
                : `Elevated thermal hazard detected (${risk.score}/100). Check compressor operation.`,
            status: 'new',
            notificationChannels: {
              smsDelivered: true,
              whatsappDelivered: true,
              hospitalNotified: true,
            },
          };

          setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
          persistAlertToSupabase(newAlert).catch(() => {});

          // Update Hospital EHR inventory if risk is elevated
          setHospitalInventories((prevHosp) =>
            prevHosp.map((hosp) => ({
              ...hosp,
              inboundBatches: hosp.inboundBatches.map((batch) => {
                if (batch.shipmentId === s.id) {
                  return {
                    ...batch,
                    currentTemp: readingInput.internalTemp,
                    tempStatus: risk.score >= 80 ? 'quarantined' : 'excursion_warning',
                    storageUnitAssigned: risk.score >= 80 ? 'QUARANTINE ISOLATION LOCKER' : batch.storageUnitAssigned,
                  };
                }
                return batch;
              }),
            }))
          );
        }

        return {
          ...s,
          currentTemp: readingInput.internalTemp,
          tempHistory: updatedHistory,
          excursionMinutes: excursion,
          rateOfTempChange: rate,
          riskScore: risk.score,
          riskLevel: risk.level,
          estimatedBreachMinutes: breach.estimatedBreachMinutes,
          leadTimeMinutes: breach.leadTimeMinutes,
          recommendedAction: breach.warningMessage,
        };
      })
    );
  };

  // Instant simulation of temperature spike for hackathon evaluation
  const simulateTempSpike = (vehicleId: string, deltaDegrees: number) => {
    const v = vehicles.find((item) => item.id === vehicleId);
    if (!v) return;

    const newTemp = Math.round((v.currentTemp + deltaDegrees) * 10) / 10;
    saveSensorReading({
      vehicleId,
      internalTemp: newTemp,
      ambientTemp: v.ambientTemp,
      humidity: v.currentHumidity + 4,
      doorOpen: deltaDegrees > 1.5,
      coolingStatus: deltaDegrees > 2 ? 'malfunction' : deltaDegrees > 0.8 ? 'degraded' : 'optimal',
      source: 'simulated',
      sensorId: 'SNS-SIM-SPIKE',
    });
  };

  // Toggle Door Status
  const toggleDoorStatus = (vehicleId: string) => {
    const v = vehicles.find((item) => item.id === vehicleId);
    if (!v) return;
    const isNowOpen = v.doorStatus !== 'open';
    saveSensorReading({
      vehicleId,
      internalTemp: isNowOpen ? v.currentTemp + 0.4 : v.currentTemp,
      ambientTemp: v.ambientTemp,
      humidity: v.currentHumidity,
      doorOpen: isNowOpen,
      coolingStatus: v.coolingStatus,
      source: 'simulated',
      sensorId: 'SNS-DOOR-TRIGGER',
    });
  };

  // Set Cooling Status
  const setVehicleCoolingStatus = (vehicleId: string, status: CoolingStatus) => {
    const v = vehicles.find((item) => item.id === vehicleId);
    if (!v) return;
    saveSensorReading({
      vehicleId,
      internalTemp: status === 'malfunction' ? v.currentTemp + 0.8 : v.currentTemp,
      ambientTemp: v.ambientTemp,
      humidity: v.currentHumidity,
      doorOpen: v.doorStatus === 'open',
      coolingStatus: status,
      source: 'manual',
      sensorId: 'SNS-COMPRESSOR',
    });
  };

  // Alert management actions
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
    );
  };

  const assignAlert = (alertId: string, assignee: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'assigned', assignedTo: assignee } : a))
    );
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date().toLocaleTimeString() } : a
      )
    );
  };

  // Record driver compliance log
  const recordComplianceLog = (logData: Omit<ComplianceLog, 'id' | 'auditHash'>) => {
    const newId = `LOG-${Math.floor(7000 + Math.random() * 2000)}`;
    const randomHash = '0x' + Math.random().toString(16).substring(2, 12);
    const newLog: ComplianceLog = {
      ...logData,
      id: newId,
      auditHash: randomHash,
    };
    setComplianceLogs((prev) => [newLog, ...prev]);
    persistComplianceLogToSupabase(newLog).catch(() => {});
  };

  // Complete a delivery
  const completeDelivery = (shipmentId: string) => {
    const targetShipment = shipments.find((s) => s.id === shipmentId);
    if (!targetShipment) return;

    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId
          ? {
              ...s,
              status: 'delivered',
              actualArrival: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : s
      )
    );

    setVehicles((prev) =>
      prev.map((v) => (v.id === targetShipment.vehicleId ? { ...v, status: 'completed', speedKmH: 0 } : v))
    );

    // Record compliance log automatically
    recordComplianceLog({
      driverId: vehicles.find((v) => v.id === targetShipment.vehicleId)?.driverId || 'DRV-UNKNOWN',
      driverName: vehicles.find((v) => v.id === targetShipment.vehicleId)?.driverName || 'Driver',
      vehicleId: targetShipment.vehicleId,
      shipmentId,
      cargoType: targetShipment.cargo.name,
      cargoQuantity: targetShipment.cargo.quantityDoses,
      pickupTime: targetShipment.startTime.slice(0, 16).replace('T', ' '),
      deliveryLocation: targetShipment.destination.name,
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      departureTime: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doorOpenTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doorCloseTime: new Date(Date.now() + 6 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doorOpenDurationMins: 6,
      tempBeforeOpen: targetShipment.currentTemp,
      tempAfterClose: targetShipment.currentTemp + 0.3,
      status: targetShipment.riskScore > 60 ? 'flagged' : 'compliant',
      notes: `Delivery finalized at ${targetShipment.destination.name}. Hospital chain of custody transfer verified.`,
      verifiedBy: 'Hospital Intake Pharmacist',
    });
  };

  // Weather refresh
  const refreshWeather = () => {
    const delta = (Math.random() - 0.5) * 1.2;
    setWeather((prev) => ({
      ...prev,
      temp: Math.round((prev.temp + delta) * 10) / 10,
      feelsLike: Math.round((prev.feelsLike + delta * 1.1) * 10) / 10,
      humidity: Math.min(95, Math.max(30, Math.round(prev.humidity + (Math.random() - 0.5) * 4))),
    }));
  };

  // Hospital EHR manual sync
  const syncHospitalInventory = (hospitalId: string) => {
    setHospitalInventories((prev) =>
      prev.map((h) =>
        h.hospitalId === hospitalId
          ? {
              ...h,
              lastSyncTimestamp: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} EDT`,
            }
          : h
      )
    );
  };

  // Reset demo data
  const resetDemoData = () => {
    setVehicles(INITIAL_VEHICLES);
    setShipments(INITIAL_SHIPMENTS);
    setAlerts(INITIAL_ALERTS);
    setComplianceLogs(INITIAL_COMPLIANCE_LOGS);
    setWeather(INITIAL_WEATHER);
    setHospitalInventories(INITIAL_HOSPITAL_INVENTORIES);
    setSelectedVehicleId('V-104');
    setSelectedShipmentId('SHP-9002');
  };

  // Telematics Simulation loop
  const startSimulation = () => setIsSimulating(true);
  const pauseSimulation = () => setIsSimulating(false);
  const resumeSimulation = () => setIsSimulating(true);
  const resetSimulation = () => {
    setIsSimulating(false);
    resetDemoData();
  };

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'completed') return v;
          // Step coordinates slightly toward target
          const latDelta = (Math.random() - 0.48) * 0.001 * simulationSpeed;
          const lngDelta = (Math.random() - 0.45) * 0.001 * simulationSpeed;
          return {
            ...v,
            currentLat: v.currentLat + latDelta,
            currentLng: v.currentLng + lngDelta,
            speedKmH: Math.max(20, Math.min(65, Math.round(v.speedKmH + (Math.random() - 0.5) * 6))),
            lastUpdate: 'Just now (simulated GPS)',
          };
        })
      );
    }, 2000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed]);

  return (
    <ColdChainContext.Provider
      value={{
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        searchQuery,
        setSearchQuery,
        mobileNavOpen,
        setMobileNavOpen,
        vehicles,
        shipments,
        alerts,
        complianceLogs,
        weather,
        hospitalInventories,
        selectedVehicleId,
        setSelectedVehicleId,
        selectedShipmentId,
        setSelectedShipmentId,
        addVehicle,
        createShipment,
        saveSensorReading,
        simulateTempSpike,
        toggleDoorStatus,
        setVehicleCoolingStatus,
        acknowledgeAlert,
        assignAlert,
        resolveAlert,
        recordComplianceLog,
        completeDelivery,
        refreshWeather,
        resetDemoData,
        syncHospitalInventory,
        isSimulating,
        simulationSpeed,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        resetSimulation,
        setSimulationSpeed,
        dashboardStats,
        supabaseStatus,
        isSyncingSupabase,
        syncDataToSupabase,
        refreshSupabaseStatus,
      }}
    >
      {children}
    </ColdChainContext.Provider>
  );
};

export const useColdChain = () => {
  const context = useContext(ColdChainContext);
  if (!context) {
    throw new Error('useColdChain must be used within a ColdChainProvider');
  }
  return context;
};
