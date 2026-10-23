import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRateOfChange,
  generateProjectionCurve,
  calculateBreachPrediction,
  calculateSpoilageRiskScore,
  scoreRouteOption,
} from './coldchainMath';

test('calculateRateOfChange computes positive warming slope accurately', () => {
  const history = [
    { timestamp: '2026-10-23T10:00:00Z', internalTemp: 4.0 },
    { timestamp: '2026-10-23T10:05:00Z', internalTemp: 4.5 },
    { timestamp: '2026-10-23T10:10:00Z', internalTemp: 5.0 },
    { timestamp: '2026-10-23T10:15:00Z', internalTemp: 5.5 },
  ];
  const rate = calculateRateOfChange(history);
  // (5.5 - 4.0) / 15 minutes = 0.1 °C/min
  assert.equal(rate, 0.1);
});

test('calculateRateOfChange handles stable temperatures with near-zero slope', () => {
  const history = [
    { timestamp: '2026-10-23T10:00:00Z', internalTemp: 4.2 },
    { timestamp: '2026-10-23T10:05:00Z', internalTemp: 4.2 },
    { timestamp: '2026-10-23T10:10:00Z', internalTemp: 4.2 },
  ];
  const rate = calculateRateOfChange(history);
  assert.equal(rate, 0);
});

test('generateProjectionCurve projects rising temperature when compressor is off in hot ambient', () => {
  const currentTemp = 5.0;
  const ambientTemp = 35.0;
  const curve = generateProjectionCurve(currentTemp, ambientTemp, 'off', false, 'Standard', 60, 10);

  assert.equal(curve.length, 7); // 0, 10, 20, 30, 40, 50, 60 mins
  assert.equal(curve[0].temp, 5.0);
  // With compressor off and ambient 35°C, temperature must increase over time
  assert.ok(curve[curve.length - 1].temp > currentTemp);
});

test('calculateBreachPrediction detects 20-30 minute early warning trigger correctly', () => {
  // Mock a curve that crosses 8.0°C at minute 25
  const mockCurve = [
    { minute: 0, temp: 6.0 },
    { minute: 10, temp: 6.8 },
    { minute: 20, temp: 7.6 },
    { minute: 25, temp: 8.2 }, // crosses 8°C!
    { minute: 30, temp: 8.8 },
  ];

  const prediction = calculateBreachPrediction(6.0, 2.0, 8.0, mockCurve);
  assert.equal(prediction.breachType, 'upper');
  assert.equal(prediction.estimatedBreachMinutes, 25);
  assert.equal(prediction.is20To30MinWarning, true);
  assert.equal(prediction.isImmediateWarning, false);
});

test('calculateBreachPrediction marks immediate warning if breach is under 20 minutes', () => {
  const mockCurve = [
    { minute: 0, temp: 7.5 },
    { minute: 10, temp: 8.3 }, // crosses at 10m
    { minute: 20, temp: 9.1 },
  ];

  const prediction = calculateBreachPrediction(7.5, 2.0, 8.0, mockCurve);
  assert.equal(prediction.estimatedBreachMinutes, 10);
  assert.equal(prediction.is20To30MinWarning, false);
  assert.equal(prediction.isImmediateWarning, true);
});

test('calculateSpoilageRiskScore returns low risk for nominal 4°C vaccine temperature', () => {
  const result = calculateSpoilageRiskScore(4.0, 2.0, 8.0, 0, 0, 2.0);
  assert.ok(result.score <= 15);
  assert.equal(result.level, 'normal');
});

test('calculateSpoilageRiskScore elevates to critical when exceeding safe limit for prolonged duration', () => {
  const result = calculateSpoilageRiskScore(9.5, 2.0, 8.0, 25, 0.12, 2.5);
  assert.ok(result.score >= 80);
  assert.equal(result.level, 'critical');
});

test('scoreRouteOption ranks safer routes higher than heat-exposed routes', () => {
  const safeRoute = scoreRouteOption({
    distanceKm: 42,
    durationMins: 45,
    weatherExposure: 'Low',
    trafficLevel: 'Light',
    hasColdHubOnWay: true,
    cargoThermalSensitivity: 2,
  });

  const riskyRoute = scoreRouteOption({
    distanceKm: 38,
    durationMins: 55,
    weatherExposure: 'High',
    trafficLevel: 'Heavy',
    hasColdHubOnWay: false,
    cargoThermalSensitivity: 2,
  });

  assert.ok(safeRoute.score > riskyRoute.score);
});
