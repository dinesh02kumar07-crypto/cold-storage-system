/**
 * ColdChain AI - Crisp, High-Performance SVG Temperature Chart
 * Renders historical sensor readings, safe threshold boundary bands,
 * and future predictive forecast trajectories.
 */

import React, { useState } from 'react';

interface TempPoint {
  timeLabel: string;
  temp: number;
  isProjected?: boolean;
}

interface TempChartProps {
  data: TempPoint[];
  minSafe: number;
  maxSafe: number;
  criticalMax?: number;
  criticalMin?: number;
  height?: number;
  showProjection?: boolean;
  title?: string;
  subtitle?: string;
}

export const TempChart: React.FC<TempChartProps> = ({
  data,
  minSafe,
  maxSafe,
  criticalMax = 10,
  criticalMin = 0,
  height = 220,
  showProjection = true,
  title,
  subtitle,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TempPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-sm">
        No temperature telemetry available
      </div>
    );
  }

  // Determine chart bounds
  const temps = data.map((d) => d.temp);
  const minVal = Math.min(criticalMin - 0.5, ...temps);
  const maxVal = Math.max(criticalMax + 1.0, ...temps);
  const range = maxVal - minVal || 1;

  const width = 640;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  };

  // Safe zone rectangle
  const safeTopY = getY(maxSafe);
  const safeBottomY = getY(minSafe);
  const safeHeight = Math.max(0, safeBottomY - safeTopY);

  // Generate SVG path for actual and projected segments
  const actualPoints = data.filter((d) => !d.isProjected);
  const projectedPoints = data.filter((d) => d.isProjected);

  // Include the last actual point as the start of projection
  const projectionCombined = actualPoints.length > 0 && projectedPoints.length > 0
    ? [actualPoints[actualPoints.length - 1], ...projectedPoints]
    : projectedPoints;

  const buildPath = (pts: TempPoint[], offsetIndex: number = 0) => {
    if (pts.length === 0) return '';
    return pts
      .map((p, i) => {
        const x = getX(offsetIndex + i);
        const y = getY(p.temp);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const actualPath = buildPath(actualPoints, 0);
  const projectionPath = buildPath(projectionCombined, Math.max(0, actualPoints.length - 1));

  // Area under actual curve
  let actualAreaPath = '';
  if (actualPoints.length > 1) {
    const firstX = getX(0);
    const lastX = getX(actualPoints.length - 1);
    const bottomY = getY(minVal);
    actualAreaPath = `${actualPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-2">
          <div>
            {title && <h4 className="text-sm font-semibold text-slate-800">{title}</h4>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {hoveredPoint && (
            <div className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded shadow-sm">
              <span className="font-mono">{hoveredPoint.temp.toFixed(1)}°C</span> at {hoveredPoint.timeLabel}
              {hoveredPoint.isProjected && <span className="text-amber-300 ml-1">(Forecast)</span>}
            </div>
          )}
        </div>
      )}

      <div className="relative overflow-hidden bg-white rounded-lg border border-slate-200 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="safeBandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Safe Range Shaded Band */}
          <rect
            x={padding.left}
            y={safeTopY}
            width={chartWidth}
            height={safeHeight}
            fill="url(#safeBandGradient)"
            rx="2"
          />

          {/* Grid lines */}
          {[minVal, minSafe, (minSafe + maxSafe) / 2, maxSafe, maxVal].map((tVal, idx) => {
            const y = getY(tVal);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={tVal === maxSafe || tVal === minSafe ? '3 3' : '2 2'}
                  strokeWidth={tVal === maxSafe || tVal === minSafe ? '1.5' : '1'}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748B"
                  fontFamily="Inter, sans-serif"
                >
                  {tVal.toFixed(1)}°
                </text>
              </g>
            );
          })}

          {/* Upper Threshold Line (Red) */}
          <line
            x1={padding.left}
            y1={safeTopY}
            x2={width - padding.right}
            y2={safeTopY}
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={width - padding.right}
            y={safeTopY - 4}
            textAnchor="end"
            fontSize="9"
            fill="#EF4444"
            fontWeight="600"
          >
            Max Permitted ({maxSafe}°C)
          </text>

          {/* Lower Threshold Line (Blue) */}
          <line
            x1={padding.left}
            y1={safeBottomY}
            x2={width - padding.right}
            y2={safeBottomY}
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={width - padding.right}
            y={safeBottomY + 12}
            textAnchor="end"
            fontSize="9"
            fill="#3B82F6"
            fontWeight="600"
          >
            Min Permitted ({minSafe}°C)
          </text>

          {/* Actual Area */}
          {actualAreaPath && <path d={actualAreaPath} fill="url(#actualGradient)" />}

          {/* Actual Line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Projected Future Trajectory Line (Dashed Orange/Red) */}
          {showProjection && projectionPath && (
            <path
              d={projectionPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points */}
          {data.map((point, idx) => {
            const cx = getX(idx);
            const cy = getY(point.temp);
            const isExcursion = point.temp > maxSafe || point.temp < minSafe;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={point.isProjected ? 3.5 : 4}
                fill={isExcursion ? '#EF4444' : point.isProjected ? '#F59E0B' : '#2563EB'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-150 hover:r-6"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* X Axis Labels */}
          {data
            .filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1)
            .map((point, idx) => {
              const originalIndex = data.indexOf(point);
              const x = getX(originalIndex);
              return (
                <text
                  key={idx}
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94A3B8"
                  fontFamily="Inter, sans-serif"
                >
                  {point.timeLabel}
                </text>
              );
            })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 px-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
              <span>Observed Sensor Reading</span>
            </div>
            {showProjection && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-500"></span>
                <span className="text-amber-700 font-medium">Predictive Trajectory</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-emerald-100 border border-emerald-300 rounded-sm"></span>
              <span>Safe Zone ({minSafe}°C - {maxSafe}°C)</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Updated in real-time via IoT Telematics
          </div>
        </div>
      </div>
    </div>
  );
};
