import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Analytics.css';
import { fetchAnalytics } from '../api/analyticsApi';

const STATS = [
  { label: 'Total Users', prefix: '', value: 12483, suffix: '', trend: '+8.2%' },
  { label: 'Active Sessions', prefix: '', value: 342, suffix: '', trend: '+3.1%' },
  { label: 'Revenue', prefix: '$', value: 48210, suffix: '', trend: '+12.4%' },
  { label: 'Conversion Rate', prefix: '', value: 4.7, suffix: '%', trend: '-0.3%' },
];

const CHART_BARS = [40, 65, 30, 80, 55, 90, 70, 45, 85, 60, 95, 75];

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

  return (
    <div className="app analytics-page">
      <h1>Analytics</h1>
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
                key={stat.label}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="analytics-card__label">{stat.label}</span>
                <span className="analytics-card__value">
                  {stat.prefix}
                  {stat.value.toLocaleString()}
                  {stat.suffix}
                </span>
                <span
                  className={
                    stat.trend.startsWith('-')
                      ? 'analytics-card__trend analytics-card__trend--down'
                      : 'analytics-card__trend analytics-card__trend--up'
                  }
                >
                  {stat.trend}
                </span>
              </div>
            ))}
          </div>

          <div className="analytics-chart">
            <span className="analytics-chart__label">
              Usage over the last 12 weeks
            </span>
            <div className="analytics-chart__bars">
              {CHART_BARS.map((height, index) => (
                <div className="analytics-chart__bar-track" key={index}>
                  <div
                    className="analytics-chart__bar"
                    style={{
                      height: animate ? `${height}%` : '0%',
                      transitionDelay: `${index * 40}ms`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
