import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Analytics.css';
import { fetchAnalytics } from '../api/analyticsApi';
import { TrendingUpIcon, ClockIcon, LayoutIcon } from '../styles/icons';

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface LinePoint {
  hour: string;
  value: number;
}

const STATS = [
  {
    key: 'productivity',
    label: 'Weekly Productivity',
    value: '82%',
    Icon: TrendingUpIcon,
    delta: '+5% vs average',
    tone: 'positive' as const,
  },
  {
    key: 'focus',
    label: 'Focus Time',
    value: '32.5h',
    Icon: ClockIcon,
    delta: '40h goal',
    tone: 'neutral' as const,
  },
  {
    key: 'app',
    label: 'Most Used App',
    value: 'VS Code',
    Icon: LayoutIcon,
    delta: '45% of time',
    tone: 'neutral' as const,
  },
];

const APP_DISTRIBUTION: DonutDatum[] = [
  { label: 'VS Code', value: 45, color: 'var(--chart-1)' },
  { label: 'Chrome', value: 25, color: 'var(--chart-2)' },
  { label: 'Slack', value: 15, color: 'var(--chart-3)' },
  { label: 'Terminal', value: 10, color: 'var(--chart-4)' },
  { label: 'Other', value: 5, color: 'var(--chart-5)' },
];

const PRODUCTIVITY_PATTERN: LinePoint[] = [
  { hour: '9AM', value: 85 },
  { hour: '10AM', value: 92 },
  { hour: '11AM', value: 78 },
  { hour: '12PM', value: 65 },
  { hour: '1PM', value: 45 },
  { hour: '2PM', value: 88 },
  { hour: '3PM', value: 95 },
  { hour: '4PM', value: 85 },
];

function formatHourLabel(hour: string) {
  const match = hour.match(/^(\d+)(AM|PM)$/);
  if (!match) return hour;
  return `${match[1]}:00 ${match[2]}`;
}

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function DonutChart({ data, animate }: { data: DonutDatum[]; animate: boolean }) {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const labelRadius = radius + strokeWidth / 2 + 16;

  function polarPoint(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + r * Math.sin(rad), y: center - r * Math.cos(rad) };
  }

  let cumulative = 0;
  const segments = data.map((datum) => {
    const segmentLength = (datum.value / 100) * circumference;
    const offset = cumulative;
    cumulative += segmentLength;
    const midAngle = ((offset + segmentLength / 2) / circumference) * 360;
    return { ...datum, segmentLength, offset, midAngle };
  });

  return (
    <div className="donut-chart">
      <svg viewBox={`0 0 ${size} ${size}`} className="donut-chart__svg">
        <g transform={`rotate(-90 ${center} ${center})`}>
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={
                animate
                  ? `${segment.segmentLength} ${circumference - segment.segmentLength}`
                  : `0 ${circumference}`
              }
              strokeDashoffset={-segment.offset}
              style={{
                transition: `stroke-dasharray 700ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 90}ms`,
              }}
            />
          ))}
        </g>
        {segments.map((segment, index) => {
          const pos = polarPoint(segment.midAngle, labelRadius);
          return (
            <text
              key={`${segment.label}-label`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="donut-chart__label"
              style={{
                fill: segment.color,
                opacity: animate ? 1 : 0,
                transition: `opacity 300ms ease ${500 + index * 90}ms`,
              }}
            >
              {segment.value}%
            </text>
          );
        })}
      </svg>
      <ul className="donut-chart__legend">
        {data.map((datum) => (
          <li key={datum.label}>
            <span className="donut-chart__legend-dot" style={{ backgroundColor: datum.color }} />
            {datum.label} ({datum.value}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineChart({ data, animate }: { data: LinePoint[]; animate: boolean }) {
  const width = 640;
  const height = 280;
  const paddingLeft = 42;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 28;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const maxValue = 100;
  const stepX = plotWidth / (data.length - 1);

  const points = data.map((datum, index) => ({
    x: paddingLeft + index * stepX,
    y: paddingTop + plotHeight * (1 - datum.value / maxValue),
    ...datum,
  }));

  const linePath = buildSmoothPath(points);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart__svg">
      {gridLines.map((tick) => {
        const y = paddingTop + plotHeight * (1 - tick / 100);
        return (
          <g key={tick}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="line-chart__grid"
            />
            <text x={paddingLeft - 10} y={y} textAnchor="end" dominantBaseline="middle" className="line-chart__axis-label">
              {tick}%
            </text>
          </g>
        );
      })}
      {points.map((point, index) => (
        <text
          key={point.hour}
          x={point.x}
          y={height - 6}
          textAnchor="middle"
          className="line-chart__axis-label"
          style={{ opacity: index === 0 || index === points.length - 1 || index % 2 === 1 ? 1 : 0.7 }}
        >
          {point.hour}
        </text>
      ))}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        className="line-chart__line"
        strokeDasharray={pathLength}
        strokeDashoffset={animate ? 0 : pathLength}
        style={{
          transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {points.map((point, index) => (
        <circle
          key={point.hour}
          cx={point.x}
          cy={point.y}
          r={4}
          className="line-chart__dot"
          style={{
            opacity: animate ? 1 : 0,
            transition: `opacity 300ms ease ${900 + index * 60}ms`,
          }}
        >
          <title>{`${point.hour}: ${point.value}%`}</title>
        </circle>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const { getToken } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        await fetchAnalytics(getToken);
        setHasAccess(true);
      } catch (error: unknown) {
        setHasAccess(false);
        const message =
          error instanceof Error ? error.message : 'Request failed';
        toast.error(message, {
          toastId: 'analytics-error',
        });
      }
    }

    loadPage();
  }, [getToken]);

  useEffect(() => {
    if (!hasAccess) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [hasAccess]);

  const peak = PRODUCTIVITY_PATTERN.reduce(
    (max, point) => (point.value > max.value ? point : max),
    PRODUCTIVITY_PATTERN[0],
  );

  return (
    <div className="app analytics-page">
      <h1 className="analytics-title">Analytics</h1>
      <div className="analytics-content-wrapper">
        <div
          className={
            hasAccess
              ? 'analytics-content'
              : 'analytics-content analytics-content--blurred'
          }
        >
          <div className="analytics-cards">
            {STATS.map((stat, index) => (
              <div
                className={
                  animate ? 'analytics-card analytics-card--in' : 'analytics-card'
                }
                key={stat.key}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="analytics-card__icon">
                  <stat.Icon size={20} />
                </span>
                <div className="analytics-card__text">
                  <span className="analytics-card__label">{stat.label}</span>
                  <span className="analytics-card__value">{stat.value}</span>
                  <span
                    className={`analytics-card__pill analytics-card__pill--${stat.tone}`}
                  >
                    {stat.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="analytics-panels">
            <div className="analytics-panel">
              <h2 className="analytics-panel__title">Application Distribution</h2>
              <DonutChart data={APP_DISTRIBUTION} animate={animate} />
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel__header">
                <h2 className="analytics-panel__title">Daily Productivity Pattern</h2>
                <span className="analytics-panel__peak">
                  <ClockIcon size={14} />
                  Peak: {formatHourLabel(peak.hour)}
                </span>
              </div>
              <div className="line-chart-wrap">
                <LineChart data={PRODUCTIVITY_PATTERN} animate={animate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
