import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Campaigns.css';
import { createCampaign, fetchCampaignsCreditRate } from '../api/campaignsApi';
import { fetchCreditBalance } from '../api/creditsApi';

interface CampaignsUsage {
  usageLimit: number | null;
  currentUsage: number | null;
}

interface Campaign {
  name: string;
  status: string;
  sent: number;
  openRate: string;
}

const CAMPAIGN_NAME_POOL = [
  'Summer Sale Blast',
  'Product Launch Teaser',
  'Re-engagement Drip',
  'Holiday Promo',
  'Flash Weekend Deal',
  'New Feature Announcement',
  'Customer Win-Back',
  'VIP Early Access',
];

function randomCampaignName() {
  return CAMPAIGN_NAME_POOL[
    Math.floor(Math.random() * CAMPAIGN_NAME_POOL.length)
  ];
}

export default function Campaigns() {
  const { getToken } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<CampaignsUsage | null>(null);
  const [creditRate, setCreditRate] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
        const data = await fetchCampaignsCreditRate(getToken);
        setCreditRate(data.amount);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Request failed';
        toast.error(message, {
          toastId: 'campaigns-rate-error',
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

  async function handleCreateCampaign() {
    setIsCreating(true);
    try {
      const data = await createCampaign(getToken);
      setUsage({
        usageLimit: data.usageLimit,
        currentUsage: data.currentUsage,
      });
      setCampaigns((prev) => [
        { name: randomCampaignName(), status: 'Draft', sent: 0, openRate: '—' },
        ...prev,
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create campaign';
      toast.error(message, {
        toastId: 'create-campaign-error',
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="app campaigns-page">
      <h1>Campaigns</h1>
      <div className="campaigns-content-wrapper">
        {showCreditsModal && (
          <div className="campaigns-modal-backdrop">
            <div className="campaigns-modal">
              <button
                type="button"
                className="campaigns-modal__close"
                onClick={() => setDismissedCreditsModal(true)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="campaigns-modal__title">Not enough credits</h2>
              <p className="campaigns-modal__body">
                Creating a campaign requires{' '}
                {creditRate !== null ? creditRate : '—'} credits, but you
                currently have {balance} credit{balance === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
        )}
        <div className="campaigns-content">
          {usage &&
            (() => {
              const limit = usage.usageLimit ?? 0;
              const used = usage.currentUsage ?? 0;
              const percentUsed =
                limit > 0
                  ? Math.min(100, Math.max(0, (used / limit) * 100))
                  : 0;

              return (
                <div className="campaigns-usage">
                  <div className="campaigns-usage__header">
                    <span className="campaigns-usage__label">
                      Credit balance
                    </span>
                    <span className="campaigns-usage__value">
                      {limit - used}
                    </span>
                  </div>
                  <div className="campaigns-usage-bar">
                    <div
                      className="campaigns-usage-bar__fill"
                      style={{ width: animate ? `${percentUsed}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })()}

          <div className="campaigns-create">
            <button
              type="button"
              className="campaigns-create__button"
              onClick={handleCreateCampaign}
              disabled={isCreating || creditRate === null}
            >
              {isCreating ? 'Creating…' : 'New Campaign'}
            </button>
            {creditRate !== null ? (
              <span className="campaigns-create__rate">
                Costs {creditRate} {creditRate === 1 ? 'credit' : 'credits'}
              </span>
            ) : (
              <span className="campaigns-create__rate">
                Campaign cost unavailable
              </span>
            )}
          </div>

          <div className="campaigns-list">
            {campaigns.map((campaign, index) => (
              <div
                className={
                  animate ? 'campaign-card campaign-card--in' : 'campaign-card'
                }
                key={`${campaign.name}-${index}`}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="campaign-card__header">
                  <span className="campaign-card__name">{campaign.name}</span>
                  <span
                    className={`campaign-card__status campaign-card__status--${campaign.status.toLowerCase()}`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <div className="campaign-card__stats">
                  <span>{campaign.sent.toLocaleString()} sent</span>
                  <span>{campaign.openRate} open rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
