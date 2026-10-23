/**
 * ColdChain AI - Domain Types and Data Contracts
 */

export type UserRole = 
  | 'admin'
  | 'fleet_manager'
  | 'logistics_agent'
  | 'driver'
  | 'hospital_pharmacist';

export type VehicleStatus = 'in_transit' | 'idle' | 'warning' | 'critical' | 'completed';

export type CoolingStatus = 'optimal' | 'degraded' | 'malfunction' | 'off';

export type DoorStatus = 'closed' | 'open';

export type RiskLevel = 'normal' | 'low' | 'moderate' | 'high' | 'critical';

export type CargoCategory = 
  | 'vaccine'
  | 'insulin'
  | 'blood'
  | 'biologics'
  | 'oncology';

export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'warehouse' | 'hospital' | 'clinic' | 'cold_hub';
  contactPerson?: string;
  contactPhone?: string;
}

export interface CargoItem {
  id: string;
  name: string;
  category: CargoCategory;
  minTemp: number; // e.g. 2
  maxTemp: number; // e.g. 8
  criticalMaxTemp: number; // e.g. 10
  criticalMinTemp: number; // e.g. 0
  q10SensitivityFactor: number; // Biochemical degradation rate factor (usually 1.8 - 2.5)
  shelfLifeHoursAtExcursion: number; // Hours before irreversible molecular denaturing
  batchNumber: string;
  quantityDoses: number;
  targetHospital: string;
  hospitalFacilityId: string;
  packagingType: 'Active Reefer' | 'VIP Shipper (Vacuum Insulated)' | 'Phase Change Material (PCM)';
}

export interface TempReading {
  id: string;
  shipmentId: string;
  vehicleId: string;
  timestamp: string; // ISO string
  internalTemp: number;
  ambientTemp: number;
  humidity: number;
  doorOpen: boolean;
  coolingStatus: CoolingStatus;
  source: 'iot_sensor' | 'manual' | 'simulated';
  sensorId: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: VehicleStatus;
  model: string;
  refrigType: string;
  coolingStatus: CoolingStatus;
  doorStatus: DoorStatus;
  batteryOrFuelPercent: number;
  insulationRating: 'High' | 'Standard' | 'Degraded';
  currentTemp: number;
  currentHumidity: number;
  ambientTemp: number;
  lastUpdate: string;
  currentLat: number;
  currentLng: number;
  speedKmH: number;
  assignedShipmentId?: string;
}

export interface StopPoint {
  id: string;
  locationName: string;
  lat: number;
  lng: number;
  type: 'warehouse' | 'hospital' | 'cold_hub';
  plannedArrival: string;
  actualArrival?: string;
  status: 'pending' | 'arrived' | 'completed' | 'skipped';
  hospitalFacilityId?: string;
  dosesToDeliver?: number;
}

export interface Shipment {
  id: string;
  trackingCode: string;
  vehicleId: string;
  cargo: CargoItem;
  origin: LocationPoint;
  destination: LocationPoint;
  stops: StopPoint[];
  startTime: string;
  estimatedArrival: string;
  actualArrival?: string;
  status: 'in_transit' | 'delivered' | 'quarantined' | 'diverted';
  currentTemp: number;
  tempHistory: TempReading[];
  excursionMinutes: number; // time spent outside [minTemp, maxTemp]
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  rateOfTempChange: number; // °C per minute
  estimatedBreachMinutes: number | null; // e.g., 25 mins
  leadTimeMinutes: number | null;
  recommendedAction: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  vehicleId: string;
  vehicleName: string;
  shipmentId: string;
  cargoName: string;
  currentTemp: number;
  safeRange: [number, number];
  predictedBreachTime: string;
  leadTimeMinutes: number;
  riskScore: number;
  severity: 'warning' | 'critical' | 'immediate';
  recommendedAction: string;
  status: 'new' | 'acknowledged' | 'assigned' | 'resolved';
  assignedTo?: string;
  resolvedAt?: string;
  notificationChannels: {
    smsDelivered: boolean;
    whatsappDelivered: boolean;
    hospitalNotified: boolean;
  };
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  durationMins: number;
  weatherExposure: 'Low' | 'Moderate' | 'High';
  trafficLevel: 'Light' | 'Moderate' | 'Heavy';
  deadlineFeasible: boolean;
  estimatedTempRisk: 'Low' | 'Moderate' | 'High';
  fuelCostEst: number;
  compositeScore: number; // 0-100 (higher is better)
  waypoints: [number, number][];
  stops: StopPoint[];
  isRecommended: boolean;
  rationale: string;
  hasColdHubOnWay: boolean;
}

export interface ComplianceLog {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  shipmentId: string;
  cargoType: string;
  cargoQuantity: number;
  pickupTime: string;
  deliveryLocation: string;
  arrivalTime: string;
  departureTime: string;
  doorOpenTime: string;
  doorCloseTime: string;
  doorOpenDurationMins: number;
  tempBeforeOpen: number;
  tempAfterClose: number;
  status: 'compliant' | 'minor_excursion' | 'flagged' | 'completed';
  notes: string;
  auditHash: string;
  verifiedBy?: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  windSpeedKmH: number;
  rainProbabilityPercent: number;
  uvIndex: number;
  refrigLoadImpact: 'Normal' | 'Moderate (+15% load)' | 'Severe (+35% load)';
  forecast: {
    hour: string;
    temp: number;
    condition: string;
  }[];
}

export interface HospitalInventorySync {
  hospitalId: string;
  hospitalName: string;
  facilityCode: string;
  department: string;
  ehrSystem: 'Epic Systems (Hyperdrive)' | 'Oracle Cerner Millennium' | 'BD Pyxis MedStation ES' | 'Meditech Expanse';
  lastSyncTimestamp: string;
  fhirEndpoint: string;
  inboundBatches: {
    batchNumber: string;
    cargoName: string;
    shipmentId: string;
    vehicleId: string;
    doses: number;
    tempStatus: 'safe' | 'excursion_warning' | 'quarantined';
    currentTemp: number;
    arrivalEta: string;
    storageUnitAssigned: string;
    fhirMedicationId: string;
  }[];
  autoQuarantineActive: boolean;
}
