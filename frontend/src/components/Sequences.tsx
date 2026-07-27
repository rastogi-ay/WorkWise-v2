import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import '../styles/App.css';
import '../styles/Sequences.css';
import { createSequence, fetchSequencesCreditRate } from '../api/sequencesApi';
import { fetchCreditBalance } from '../api/creditsApi';
import { MailIcon, LayersIcon } from '../extras/icons';
import { AccessDeniedModal } from './AccessDeniedModal';
import { ErrorModal } from './ErrorModal';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { useEntitlement, getLoadingAndError, isAccessDenied } from '../hooks/useEntitlement';
import { CreditBalance } from './CreditBalance';
import { PageLoading } from '../extras/PageLoading';

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
  return SEQUENCE_NAME_POOL[Math.floor(Math.random() * SEQUENCE_NAME_POOL.length)];
}

export default function Sequences() {
  const { getToken } = useAuth();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dismissedPaywall, setDismissedPaywall] = useState(false);
  const [createDenied, setCreateDenied] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [currentUsage, setCurrentUsage] = useState<number | null>(null);
  const [creditRate, setCreditRate] = useState<number | null>(null);

  // Generating a sequence requires two independent entitlements:
  // 1. Credits (to render/spend the balance)
  // 2. Sequences access (to render the rate)
  const creditBalance = useEntitlement(() => fetchCreditBalance(getToken), [getToken]);
  const sequenceAccess = useEntitlement(() => fetchSequencesCreditRate(getToken), [getToken]);

  // Give user flexibility to what they want to do with entitlement statuses
  let modal: ReactNode = null;
  const { isLoading, hasError } = getLoadingAndError(creditBalance.status, sequenceAccess.status);

  if (hasError) {
    modal = <ErrorModal featureName="AI sequence generation" />;
  } else if (createDenied && !dismissedPaywall) {
    modal = (
      <InsufficientBalanceModal
        featureName="AI sequence generation"
        onClose={() => setDismissedPaywall(true)}
      />
    );
  } else if (sequenceAccess.status === 'denied') {
    modal = <AccessDeniedModal featureName="AI sequence generation" />;
  }

  useEffect(() => {
    if (!creditBalance.data || !sequenceAccess.data) return;
    setUsageLimit(creditBalance.data.usageLimit);
    setCurrentUsage(creditBalance.data.currentUsage);
    setCreditRate(sequenceAccess.data.rate);
  }, [creditBalance.data, sequenceAccess.data]);

  async function handleCreateSequence() {
    setIsCreating(true);
    try {
      const data = await createSequence(getToken);
      setUsageLimit(data.usageLimit);
      setCurrentUsage(data.currentUsage);
      setCreateDenied(false);
      setSequences((prev) => [
        {
          name: randomSequenceName(),
          status: 'Draft',
          sent: 0,
          openRate: '—',
        },
        ...prev,
      ]);
    } catch (error: unknown) {
      if (isAccessDenied(error)) {
        // hit the credit limit mid-session — surface the paywall
        setCreateDenied(true);
        setDismissedPaywall(false);
      } else {
        console.error('Failed to create sequence:', error);
      }
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="app sequences-page">
        <PageLoading />
      </div>
    );
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
            Generate intelligent marketing campaigns powered by advanced AI algorithms
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className={modal ? 'page-content page-content--blurred' : 'page-content'}>
          <div className="generator-panel">
            <CreditBalance usageLimit={usageLimit} currentUsage={currentUsage} />

            <div className="generator-panel__action">
              <button
                type="button"
                className="generate-button"
                onClick={handleCreateSequence}
                disabled={isCreating || creditRate === null}
              >
                {isCreating ? 'Generating…' : 'Generate AI Sequence'}
              </button>
              {creditRate !== null ? (
                <span className="rate-pill">
                  {creditRate} {creditRate === 1 ? 'credit' : 'credits'}
                </span>
              ) : (
                sequenceAccess.status !== 'loading' && (
                  <span className="rate-pill rate-pill--error">No rate found</span>
                )
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
                Generate your first AI-powered campaign. The engine analyzes market trends and
                builds a strategy in seconds.
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

        {modal}
      </div>
    </div>
  );
}
