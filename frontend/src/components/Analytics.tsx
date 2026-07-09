import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Analytics.css';
import { fetchAnalytics } from '../api/analyticsApi';

export default function Analytics() {
  const { getToken } = useAuth();
  const [hiddenMessage, setHiddenMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const { hiddenMessage } = await fetchAnalytics(getToken);
        setHiddenMessage(hiddenMessage);
      } catch (error: unknown) {
        setHiddenMessage(null);
        const message =
          error instanceof Error ? error.message : 'Request failed';
        toast.error(message, {
          toastId: 'analytics-error',
        });
      }
    }

    loadPage();
  }, [getToken]);

  return (
    <div className="app analytics-page">
      <h1>Analytics</h1>
      <div className="analytics-content-wrapper">
        <div
          className={
            hiddenMessage
              ? 'analytics-content'
              : 'analytics-content analytics-content--blurred'
          }
        >
          <div className="analytics-cards">
            <div className="analytics-card">
              <span className="analytics-card__label">Analytics</span>
              <span className="analytics-card__value">
                {hiddenMessage ? hiddenMessage : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
