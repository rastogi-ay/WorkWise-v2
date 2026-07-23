import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import '../styles/App.css';
import '../styles/Analytics.css';
import { fetchAnalytics } from '../api/analyticsApi';
import { ClockIcon } from '../extras/icons';
import {
  STATS,
  APP_DISTRIBUTION,
  PRODUCTIVITY_PATTERN,
  PEAK_PRODUCTIVITY_POINT,
  formatHourLabel,
} from '../extras/analyticsData';
import { DonutChart } from '../extras/DonutChart';
import { LineChart } from '../extras/LineChart';
import { AccessDeniedModal } from './AccessDeniedModal';
import { useEntitlement } from '../hooks/useEntitlement';

export default function Analytics() {
  const { getToken } = useAuth();
  const analytics = useEntitlement(() => fetchAnalytics(getToken), [getToken]);
  const [animate, setAnimate] = useState(false);

  const hasAccess = analytics.status === 'granted';
  const loadError = analytics.status === 'error';
  const denied = analytics.status === 'denied';
  const showModal = loadError || denied;

  useEffect(() => {
    if (!hasAccess) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [hasAccess]);

  return (
    <div className="app analytics-page">
      <h1 className="analytics-title">Analytics</h1>
      <div className="page-content-wrapper">
        <div className={showModal ? 'page-content page-content--blurred' : 'page-content'}>
          <div className="analytics-cards">
            {STATS.map((stat, index) => (
              <div
                className={animate ? 'analytics-card analytics-card--in' : 'analytics-card'}
                key={stat.key}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="analytics-card__icon">
                  <stat.Icon size={20} />
                </span>
                <div className="analytics-card__text">
                  <span className="analytics-card__label">{stat.label}</span>
                  <span className="analytics-card__value">{stat.value}</span>
                  <span className={`analytics-card__pill analytics-card__pill--${stat.tone}`}>
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
                  Peak: {formatHourLabel(PEAK_PRODUCTIVITY_POINT.hour)}
                </span>
              </div>
              <div className="line-chart-wrap">
                <LineChart data={PRODUCTIVITY_PATTERN} animate={animate} />
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <AccessDeniedModal
            status={loadError ? 'error' : 'denied'}
            featureName="detailed productivity insights and analytics"
          />
        )}
      </div>
    </div>
  );
}
