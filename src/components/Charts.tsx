import { useMemo } from 'react';
import type { CrowdDensity } from '@/types';
import { densityColor } from '@/lib/utils';

export function LineChart({
  data,
  height = 200,
  color = '#1c66f5',
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const width = 760;
  const padding = { top: 16, right: 16, bottom: 32, left: 40 };
  const { points, areaPath, maxVal, minVal, stepX } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], areaPath: '', maxVal: 0, minVal: 0, stepX: 0 };
    }
    const max = Math.max(...data.map((d) => d.value), 1);
    const min = 0;
    const range = max - min || 1;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const sx = innerW / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => {
      const x = padding.left + i * sx;
      const y = padding.top + innerH - ((d.value - min) / range) * innerH;
      return { x, y, ...d };
    });
    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    const ap = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${
      padding.top + innerH
    } L ${pts[0].x.toFixed(1)} ${padding.top + innerH} Z`;
    return { points: pts, areaPath: ap, maxVal: max, minVal: min, stepX: sx };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const innerH = height - padding.top - padding.bottom;
  const ticks = 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const val = (maxVal / ticks) * (ticks - i);
        const y = padding.top + (innerH / ticks) * i;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              className="stroke-gray-200 dark:stroke-gray-800"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-gray-400 text-[10px]"
            >
              {Math.round(val)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#lineGrad)" />
      <path
        d={points
          .map(
            (p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
          )
          .join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => {
        const show = data.length <= 20 || i % Math.ceil(data.length / 10) === 0;
        return (
          <g key={i}>
            {show && (
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="fill-gray-400 text-[10px]"
              >
                {p.label}
              </text>
            )}
            <circle cx={p.x} cy={p.y} r="3" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

export function BarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number; color?: string; density?: CrowdDensity }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-around gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 50);
        const color = d.color || densityColor(d.density || 'Low').hex;
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {d.value}
            </span>
            <div
              className="w-full max-w-[60px] rounded-t-lg transition-all duration-500 hover:opacity-80"
              style={{
                height: `${Math.max(4, h)}px`,
                background: `linear-gradient(180deg, ${color}, ${color}cc)`,
              }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  data,
  size = 180,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2;
  const stroke = 24;
  const innerRadius = radius - stroke;
  const circumference = 2 * Math.PI * innerRadius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            className="fill-none stroke-gray-100 dark:stroke-gray-800"
            strokeWidth={stroke}
          />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * circumference;
              const seg = (
                <circle
                  key={i}
                  cx={radius}
                  cy={radius}
                  r={innerRadius}
                  className="fill-none transition-all duration-500"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${circumference - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {total}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total
          </span>
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {d.label}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = '#1c66f5',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
