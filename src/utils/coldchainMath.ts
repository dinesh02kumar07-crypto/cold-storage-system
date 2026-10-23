/**
 * ColdChain AI - Core Thermal Physics & Spoilage Prediction Mathematics
 * Pure, deterministic functions decoupled from UI for testability and model integration.
 */

import { CoolingStatus, TempReading, RiskLevel } from '../types/coldchain';

/**
 * Calculates rate of temperature change in °C per minute from reading history.
 * Uses linear regression over the last N readings for smooth, deterministic trends.
 */
export function calculateRateOfChange(history: Pick<TempReading, 'timestamp' | 'internalTemp'>[]): number {
  if (!history || history.length < 2) return 0;

  // Take up to last 10 readings
  const sample = history.slice(-10);
  const t0 = new Date(sample[0].timestamp).getTime() / 60000; // in minutes

  let sumT = 0;
  let sumTemp = 0;
  let sumT2 = 0;
  let sumTTemp = 0;
  const n = sample.length;

  for (let i = 0; i < n; i++) {
    const t = new Date(sample[i].timestamp).getTime() / 60000 - t0;
    const temp = sample[i].internalTemp;
    sumT += t;
    sumTemp += temp;
    sumT2 += t * t;
    sumTTemp += t * temp;
  }

  const denominator = n * sumT2 - sumT * sumT;
  if (Math.abs(denominator) < 1e-6) return 0;

  const slope = (n * sumTTemp - sumT * sumTemp) / denominator;
  const rounded = Math.round(slope * 1000) / 1000;
  return rounded === 0 ? 0 : rounded;
}

/**
 * Simulates thermal trajectory over a time horizon using Newton's law of cooling
 * augmented with active refrigeration cooling power and convective door air exchange.
 *
 * dT/dt = -k * (T - T_ambient) + Q_cooling
 */
export function generateProjectionCurve(
  currentTemp: number,
  ambientTemp: number,
  coolingStatus: CoolingStatus,
  doorOpen: boolean,
  insulationRating: 'High' | 'Standard' | 'Degraded' = 'Standard',
  minutesHorizon: number = 120,
  stepMinutes: number = 5
): { minute: number; temp: number }[] {
  // Realistic thermal heat transfer coefficient (k in min^-1) for insulated reefer body
  let k = 0.0016; // standard reefer
  if (insulationRating === 'High') k = 0.0010;
  if (insulationRating === 'Degraded') k = 0.0028;

  // Door ajar increases convective heat influx significantly
  if (doorOpen) {
    k *= 4.0;
  }

  // Active refrigeration cooling pull (in °C/min)
  let qCooling = 0;
  if (coolingStatus === 'optimal') {
    const targetSetPoint = 4.0;
    qCooling = -k * (ambientTemp - targetSetPoint) - 0.04 * (currentTemp - targetSetPoint);
  } else if (coolingStatus === 'degraded') {
    // 35% diminished cooling capacity
    qCooling = -0.006;
  } else if (coolingStatus === 'malfunction' || coolingStatus === 'off') {
    qCooling = 0; // compressor failure
  }

  const points: { minute: number; temp: number }[] = [];
  let temp = currentTemp;

  points.push({ minute: 0, temp: Math.round(temp * 10) / 10 });

  const numSteps = Math.floor(minutesHorizon / stepMinutes);
  for (let i = 1; i <= numSteps; i++) {
    const dt = stepMinutes;
    const heatInflux = k * (ambientTemp - temp);
    const dTemp = (heatInflux + qCooling) * dt;
    temp += dTemp;

    temp = Math.max(-90, Math.min(60, temp));

    points.push({
      minute: i * stepMinutes,
      temp: Math.round(temp * 10) / 10,
    });
  }

  return points;
}

export interface BreachPredictionResult {
  estimatedBreachMinutes: number | null;
  breachType: 'upper' | 'lower' | 'none';
  breachTemp: number | null;
  leadTimeMinutes: number | null;
  is20To30MinWarning: boolean;
  isImmediateWarning: boolean;
  warningMessage: string;
}

/**
 * Evaluates whether cargo will breach safe limits, and specifically checks for
 * the critical 20-30 minute early warning window requested for cold-chain safety.
 */
export function calculateBreachPrediction(
  currentTemp: number,
  minTemp: number,
  maxTemp: number,
  projectionPoints: { minute: number; temp: number }[]
): BreachPredictionResult {
  // Already in excursion?
  if (currentTemp > maxTemp) {
    return {
      estimatedBreachMinutes: 0,
      breachType: 'upper',
      breachTemp: currentTemp,
      leadTimeMinutes: 0,
      is20To30MinWarning: false,
      isImmediateWarning: true,
      warningMessage: `CRITICAL: Current temperature (${currentTemp.toFixed(1)}°C) is already above permitted limit (${maxTemp}°C).`,
    };
  }

  if (currentTemp < minTemp) {
    return {
      estimatedBreachMinutes: 0,
      breachType: 'lower',
      breachTemp: currentTemp,
      leadTimeMinutes: 0,
      is20To30MinWarning: false,
      isImmediateWarning: true,
      warningMessage: `CRITICAL: Current temperature (${currentTemp.toFixed(1)}°C) is already below minimum limit (${minTemp}°C). Freezing hazard.`,
    };
  }

  // Search projection curve for future breach
  for (const point of projectionPoints) {
    if (point.minute === 0) continue;

    if (point.temp >= maxTemp) {
      const minutes = point.minute;
      const is20To30 = minutes >= 18 && minutes <= 35;
      const isImmediate = minutes < 18;

      return {
        estimatedBreachMinutes: minutes,
        breachType: 'upper',
        breachTemp: point.temp,
        leadTimeMinutes: minutes,
        is20To30MinWarning: is20To30,
        isImmediateWarning: isImmediate,
        warningMessage: is20To30
          ? `PREDICTIVE ALERT: Temperature projected to reach ${point.temp.toFixed(1)}°C and breach limit (${maxTemp}°C) in ${minutes} minutes. Early intervention required.`
          : isImmediate
          ? `URGENT WARNING: Temperature projected to breach limit in under 20 minutes (${minutes}m)! Immediate cooling action needed.`
          : `Advisory: Projected limit breach in ${minutes} minutes if current warming trend persists.`,
      };
    }

    if (point.temp <= minTemp) {
      const minutes = point.minute;
      const is20To30 = minutes >= 18 && minutes <= 35;
      const isImmediate = minutes < 18;

      return {
        estimatedBreachMinutes: minutes,
        breachType: 'lower',
        breachTemp: point.temp,
        leadTimeMinutes: minutes,
        is20To30MinWarning: is20To30,
        isImmediateWarning: isImmediate,
        warningMessage: is20To30
          ? `PREDICTIVE ALERT: Cargo temperature approaching freezing threshold (${minTemp}°C) in ${minutes} minutes.`
          : isImmediate
          ? `URGENT WARNING: Freezing risk predicted in ${minutes} minutes!`
          : `Advisory: Potential sub-temperature breach in ${minutes} minutes.`,
      };
    }
  }

  return {
    estimatedBreachMinutes: null,
    breachType: 'none',
    breachTemp: null,
    leadTimeMinutes: null,
    is20To30MinWarning: false,
    isImmediateWarning: false,
    warningMessage: 'Thermal trajectory stable within safe operational parameters.',
  };
}

/**
 * Transparent, multi-factor Spoilage Risk Score (0 - 100).
 */
export function calculateSpoilageRiskScore(
  currentTemp: number,
  minTemp: number,
  maxTemp: number,
  excursionMinutes: number = 0,
  rateOfChange: number = 0,
  q10Sensitivity: number = 2.0
): { score: number; level: RiskLevel; biochemicalDegradationEstimate: string } {
  let score = 8; // Base baseline

  const range = maxTemp - minTemp;
  const midPoint = (maxTemp + minTemp) / 2;

  if (currentTemp > maxTemp) {
    const deltaAbove = currentTemp - maxTemp;
    score += 55 + Math.min(35, deltaAbove * 14);
  } else if (currentTemp < minTemp) {
    const deltaBelow = minTemp - currentTemp;
    score += 60 + Math.min(35, deltaBelow * 16);
  } else {
    // Inside safe band: smooth proximity curve
    const distanceFromCenter = Math.abs(currentTemp - midPoint);
    const maxPossibleDist = range / 2;
    const ratio = distanceFromCenter / maxPossibleDist; // 0 at center, 1.0 at limit

    if (ratio > 0.5) {
      // Accelerates as it nears edge: 0.5 -> +10, 0.7 -> +25, 0.95 -> +45
      const edgeProximity = (ratio - 0.5) / 0.5;
      score += Math.round(edgeProximity * edgeProximity * 45);
    }
  }

  // Rate of change acceleration component (°C/min)
  if (rateOfChange > 0.02) {
    score += Math.min(30, Math.round(rateOfChange * 250));
  } else if (rateOfChange < -0.02) {
    score += Math.min(20, Math.round(Math.abs(rateOfChange) * 150));
  }

  // Excursion duration penalty
  if (excursionMinutes > 0) {
    score += Math.min(35, Math.round(excursionMinutes * 1.5));
  }

  // Q10 sensitivity multiplier
  const sensitivityMultiplier = q10Sensitivity / 2.0;
  score = Math.round(score * sensitivityMultiplier);

  // Clamp 0 - 100
  score = Math.max(0, Math.min(100, score));

  let level: RiskLevel = 'normal';
  if (score >= 80) level = 'critical';
  else if (score >= 60) level = 'high';
  else if (score >= 35) level = 'moderate';
  else if (score >= 20) level = 'low';

  let biochemicalDegradationEstimate = 'Minimal protein conformational change (<0.1% loss of potency). Safe for administration.';
  if (score >= 80) {
    biochemicalDegradationEstimate = 'High risk of irreversible protein denaturation and antigen precipitation. Batch quarantine mandatory upon hospital arrival.';
  } else if (score >= 60) {
    biochemicalDegradationEstimate = 'Accelerated degradation rate (~3-5x baseline). Immediate cold-restoration may preserve batch integrity.';
  } else if (score >= 35) {
    biochemicalDegradationEstimate = 'Slight kinetic rate elevation. Total cumulative thermal budget remaining: ~4.5 hours.';
  }

  return {
    score,
    level,
    biochemicalDegradationEstimate,
  };
}

/**
 * Multi-criteria route scoring engine.
 * Ranks routes by duration, weather heat load, traffic hazard, and emergency cold hub availability.
 */
export function scoreRouteOption(params: {
  distanceKm: number;
  durationMins: number;
  weatherExposure: 'Low' | 'Moderate' | 'High';
  trafficLevel: 'Light' | 'Moderate' | 'Heavy';
  hasColdHubOnWay: boolean;
  cargoThermalSensitivity: number; // 1-3
}): { score: number; rationale: string } {
  const { distanceKm, durationMins, weatherExposure, trafficLevel, hasColdHubOnWay, cargoThermalSensitivity } = params;

  let baseScore = 100;

  // Duration penalty (longer transit = longer exposure)
  baseScore -= Math.min(30, (durationMins / 60) * 12);

  // Weather exposure penalty
  if (weatherExposure === 'High') baseScore -= 18 * cargoThermalSensitivity;
  else if (weatherExposure === 'Moderate') baseScore -= 8 * cargoThermalSensitivity;

  // Traffic risk (idling in heat with reefer engine)
  if (trafficLevel === 'Heavy') baseScore -= 22;
  else if (trafficLevel === 'Moderate') baseScore -= 10;

  // Cold hub safety bonus
  if (hasColdHubOnWay) baseScore += 12;

  const score = Math.max(10, Math.min(100, Math.round(baseScore)));

  let rationale = 'Optimal route balancing shortest transit time with minimal thermal exposure.';
  if (hasColdHubOnWay && weatherExposure === 'High') {
    rationale = 'Recommended for temperature-sensitive cargo due to bypass of heat corridor and waypoint access to Cold Storage Hub.';
  } else if (trafficLevel === 'Heavy') {
    rationale = 'Caution: Route encounters heavy urban traffic; reefer thermal load will increase significantly during stops.';
  }

  return { score, rationale };
}

/**
 * Calculates time duration between two ISO or HH:MM timestamps in minutes.
 */
export function calculateMinutesDiff(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}
