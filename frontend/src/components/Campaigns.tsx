import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Campaigns.css';
import { createCampaign, fetchCampaignsCreditRate } from '../api/campaignsApi';
import { fetchCreditBalance } from '../api/creditsApi';
import { MegaphoneIcon, CoinIcon, ChartIcon } from '../extras/icons';

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
    const id = requestAnimationFrame(() => setAnimateBar(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const limit = usage?.usageLimit ?? 0;
  const used = usage?.currentUsage ?? 0;
  const percentUsed = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
  const showCreditsBanner = hasAccess === false && !dismissedCreditsBanner;

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
      <div className="page-header">
        <span className="page-header__icon">
          <MegaphoneIcon />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">AI Campaign Generator</h1>
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
            generate more campaigns.
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
            onClick={handleCreateCampaign}
            disabled={isCreating || creditRate === null}
          >
            {isCreating ? 'Generating…' : 'Generate AI Campaign'}
          </button>
          {creditRate !== null && (
            <span className="rate-pill">
              {creditRate} {creditRate === 1 ? 'credit' : 'credits'}
            </span>
          )}
        </div>
      </div>

      <h2 className="section-title">Generated Campaigns</h2>

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">
            <ChartIcon size={22} />
          </span>
          <p className="empty-state__title">No campaigns yet</p>
          <p className="empty-state__body">
            Generate your first AI-powered campaign. The engine analyzes
            market trends and builds a strategy in seconds.
          </p>
        </div>
      ) : (
        <div className="campaigns-list">
          {campaigns.map((campaign, index) => (
            <div className="campaign-card" key={`${campaign.name}-${index}`}>
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
      )}
    </div>
  );
}
