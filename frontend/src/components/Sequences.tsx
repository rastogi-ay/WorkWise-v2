import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Sequences.css';
import { createSequence, fetchSequencesCreditRate } from '../api/sequencesApi';
import { fetchCreditBalance } from '../api/creditsApi';

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
  const [animate, setAnimate] = useState(false);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dismissedCreditsModal, setDismissedCreditsModal] = useState(false);

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
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const balance = usage ? (usage.usageLimit ?? 0) - (usage.currentUsage ?? 0) : 0;
  const showCreditsModal = hasAccess === false && !dismissedCreditsModal;

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
      <h1>Sequences</h1>
      <div className="sequences-content-wrapper">
        {showCreditsModal && (
          <div className="sequences-modal-backdrop">
            <div className="sequences-modal">
              <button
                type="button"
                className="sequences-modal__close"
                onClick={() => setDismissedCreditsModal(true)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="sequences-modal__title">Not enough credits</h2>
              <p className="sequences-modal__body">
                Creating a sequence requires{' '}
                {creditRate !== null ? creditRate : '—'} credits, but you
                currently have {balance} credit{balance === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
        )}
        <div className="sequences-content">
          {usage &&
            (() => {
              const limit = usage.usageLimit ?? 0;
              const used = usage.currentUsage ?? 0;
              const percentUsed =
                limit > 0
                  ? Math.min(100, Math.max(0, (used / limit) * 100))
                  : 0;

              return (
                <div className="sequences-usage">
                  <div className="sequences-usage__header">
                    <span className="sequences-usage__label">
                      Credit balance
                    </span>
                    <span className="sequences-usage__value">
                      {limit - used}
                    </span>
                  </div>
                  <div className="sequences-usage-bar">
                    <div
                      className="sequences-usage-bar__fill"
                      style={{ width: animate ? `${percentUsed}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })()}

          <div className="sequences-create">
            <button
              type="button"
              className="sequences-create__button"
              onClick={handleCreateSequence}
              disabled={isCreating || creditRate === null}
            >
              {isCreating ? 'Creating…' : 'New Sequence'}
            </button>
            {creditRate !== null ? (
              <span className="sequences-create__rate">
                Costs {creditRate} {creditRate === 1 ? 'credit' : 'credits'}
              </span>
            ) : (
              <span className="sequences-create__rate">
                Sequence cost unavailable
              </span>
            )}
          </div>

          <div className="sequences-list">
            {sequences.map((sequence, index) => (
              <div
                className={
                  animate ? 'sequence-card sequence-card--in' : 'sequence-card'
                }
                key={`${sequence.name}-${index}`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
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
        </div>
      </div>
    </div>
  );
}
