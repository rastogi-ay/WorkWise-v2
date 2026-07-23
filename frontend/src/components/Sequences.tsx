import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Sequences.css';
import { createSequence, fetchSequencesCreditRate } from '../api/sequencesApi';
import { fetchCreditBalance } from '../api/creditsApi';
import { MailIcon, CoinIcon, LayersIcon } from '../extras/icons';

interface SequencesUsage {
  usageLimit: number | null;
  currentUsage: number | null;
}

interface Sequence {
  name: string;
  status: string;
  sent: number;
  openRate: string;
}

const SEQUENCE_NAME_POOL = [
  'Welcome Onboarding Drip',
  'Trial Ending Reminder',
  'Post-Purchase Follow-Up',
  'Abandoned Cart Recovery',
  'Renewal Reminder',
  'Feature Adoption Nudge',
  'Win-Back Sequence',
  'VIP Nurture Track',
];

function randomSequenceName() {
  return SEQUENCE_NAME_POOL[
    Math.floor(Math.random() * SEQUENCE_NAME_POOL.length)
  ];
}

export default function Sequences() {
  const { getToken } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<SequencesUsage | null>(null);
  const [creditRate, setCreditRate] = useState<number | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dismissedCreditsBanner, setDismissedCreditsBanner] = useState(false);
  const [animateBar, setAnimateBar] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        const data = await fetchCreditBalance(getToken);
        setUsage({
          usageLimit: data.usageLimit,
          currentUsage: data.currentUsage,
        });
        setHasAccess(true);
      } catch {
        setHasAccess(false);
      }
    }

    async function loadCreditRate() {
      try {
        const data = await fetchSequencesCreditRate(getToken);
        setCreditRate(data.amount);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Request failed';
        toast.error(message, {
          toastId: 'sequences-rate-error',
        });
      }
    }

    loadPage();
    loadCreditRate();
  }, [getToken]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimateBar(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const limit = usage?.usageLimit ?? 0;
  const used = usage?.currentUsage ?? 0;
  const percentUsed = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
  const showCreditsBanner = hasAccess === false && !dismissedCreditsBanner;

  async function handleCreateSequence() {
    setIsCreating(true);
    try {
      const data = await createSequence(getToken);
      setUsage({
        usageLimit: data.usageLimit,
        currentUsage: data.currentUsage,
      });
      setSequences((prev) => [
        { name: randomSequenceName(), status: 'Draft', sent: 0, openRate: '—' },
        ...prev,
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create sequence';
      toast.error(message, {
        toastId: 'create-sequence-error',
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="app sequences-page">
      <div className="page-header">
        <span className="page-header__icon">
          <MailIcon />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">AI Sequence Generator</h1>
          <p className="page-header__subtitle">
            Generate intelligent marketing campaigns powered by advanced AI
            algorithms
          </p>
        </div>
      </div>

      {showCreditsBanner && (
        <div className="credits-banner">
          <span>
            You&apos;ve reached your credit limit. Upgrade your plan to
            generate more sequences.
          </span>
          <button
            type="button"
            className="credits-banner__close"
            onClick={() => setDismissedCreditsBanner(true)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="generator-panel">
        {usage && (
          <div className="credit-stat">
            <span className="credit-stat__icon">
              <CoinIcon />
            </span>
            <div className="credit-stat__text">
              <span className="credit-stat__label">Platform credits</span>
              <span className="credit-stat__value">
                {used} / {limit}
              </span>
              <div className="credit-stat__bar">
                <div
                  className="credit-stat__bar-fill"
                  style={{ width: animateBar ? `${percentUsed}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="generator-panel__action">
          <button
            type="button"
            className="generate-button"
            onClick={handleCreateSequence}
            disabled={isCreating || creditRate === null}
          >
            {isCreating ? 'Generating…' : 'Generate AI Sequence'}
          </button>
          {creditRate !== null && (
            <span className="rate-pill">
              {creditRate} {creditRate === 1 ? 'credit' : 'credits'}
            </span>
          )}
        </div>
      </div>

      <h2 className="section-title">Generated Sequences</h2>

      {sequences.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">
            <LayersIcon size={22} />
          </span>
          <p className="empty-state__title">No sequences yet</p>
          <p className="empty-state__body">
            Generate your first AI-powered campaign. The engine analyzes
            market trends and builds a strategy in seconds.
          </p>
        </div>
      ) : (
        <div className="sequences-list">
          {sequences.map((sequence, index) => (
            <div className="sequence-card" key={`${sequence.name}-${index}`}>
              <div className="sequence-card__header">
                <span className="sequence-card__name">{sequence.name}</span>
                <span
                  className={`sequence-card__status sequence-card__status--${sequence.status.toLowerCase()}`}
                >
                  {sequence.status}
                </span>
              </div>
              <div className="sequence-card__stats">
                <span>{sequence.sent.toLocaleString()} sent</span>
                <span>{sequence.openRate} open rate</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
