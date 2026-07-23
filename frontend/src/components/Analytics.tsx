import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Analytics.css';
import { fetchAnalytics } from '../api/analyticsApi';
import { ClockIcon } from '../extras/icons';
import { STATS, APP_DISTRIBUTION, PRODUCTIVITY_PATTERN, formatHourLabel } from '../extras/analyticsData';
import { DonutChart } from '../extras/DonutChart';
import { LineChart } from '../extras/LineChart';

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
