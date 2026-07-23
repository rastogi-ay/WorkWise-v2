import { TrendingUpIcon, ClockIcon, LayoutIcon } from './icons';

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export interface LinePoint {
  hour: string;
  value: number;
}

export const STATS = [
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

export const APP_DISTRIBUTION: DonutDatum[] = [
  { label: 'VS Code', value: 45, color: 'var(--chart-1)' },
  { label: 'Chrome', value: 25, color: 'var(--chart-2)' },
  { label: 'Slack', value: 15, color: 'var(--chart-3)' },
  { label: 'Terminal', value: 10, color: 'var(--chart-4)' },
  { label: 'Other', value: 5, color: 'var(--chart-5)' },
];

export const PRODUCTIVITY_PATTERN: LinePoint[] = [
  { hour: '9AM', value: 85 },
  { hour: '10AM', value: 92 },
  { hour: '11AM', value: 78 },
  { hour: '12PM', value: 65 },
  { hour: '1PM', value: 45 },
  { hour: '2PM', value: 88 },
  { hour: '3PM', value: 95 },
  { hour: '4PM', value: 85 },
];

export const PEAK_PRODUCTIVITY_POINT = PRODUCTIVITY_PATTERN.reduce(
  (max, point) => (point.value > max.value ? point : max),
  PRODUCTIVITY_PATTERN[0],
);

export function formatHourLabel(hour: string) {
  const match = hour.match(/^(\d+)(AM|PM)$/);
  if (!match) return hour;
  return `${match[1]}:00 ${match[2]}`;
}
