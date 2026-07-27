import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import '../styles/App.css';
import '../styles/Campaigns.css';
import { createCampaign, fetchCampaignsCreditRate } from '../api/campaignsApi';
import { fetchCreditBalance } from '../api/creditsApi';
import { MegaphoneIcon, ChartIcon } from '../extras/icons';
import { AccessDeniedModal } from './AccessDeniedModal';
import { ErrorModal } from './ErrorModal';
import { InsufficientBalanceModal } from './InsufficientBalanceModal';
import { useEntitlement, getLoadingAndError, isAccessDenied } from '../hooks/useEntitlement';
import { CreditBalance } from './CreditBalance';
import { PageLoading } from '../extras/PageLoading';

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
  return CAMPAIGN_NAME_POOL[Math.floor(Math.random() * CAMPAIGN_NAME_POOL.length)];
}

export default function Campaigns() {
  const { getToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dismissedPaywall, setDismissedPaywall] = useState(false);
  const [createDenied, setCreateDenied] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);
  const [currentUsage, setCurrentUsage] = useState<number | null>(null);
  const [creditRate, setCreditRate] = useState<number | null>(null);

  // Generating a campaign requires two independent entitlements:
  // 1. Credits (to render/spend the balance)
  // 2. Campaigns access (to render the rate)
  const creditBalance = useEntitlement(() => fetchCreditBalance(getToken), [getToken]);
  const campaignAccess = useEntitlement(() => fetchCampaignsCreditRate(getToken), [getToken]);

  // Give user flexibility to what they want to do with entitlement statuses
  let modal: ReactNode = null;
  const { isLoading, hasError } = getLoadingAndError(creditBalance.status, campaignAccess.status);

  if (hasError) {
    modal = <ErrorModal featureName="AI campaign generation" />;
  } else if (createDenied && !dismissedPaywall) {
    modal = (
      <InsufficientBalanceModal
        featureName="AI campaign generation"
        onClose={() => setDismissedPaywall(true)}
      />
    );
  } else if (campaignAccess.status === 'denied') {
    modal = <AccessDeniedModal featureName="AI campaign generation" />;
  }

  useEffect(() => {
    if (!creditBalance.data || !campaignAccess.data) return;
    setUsageLimit(creditBalance.data.usageLimit);
    setCurrentUsage(creditBalance.data.currentUsage);
    setCreditRate(campaignAccess.data.rate);
  }, [creditBalance.data, campaignAccess.data]);

  async function handleCreateCampaign() {
    setIsCreating(true);
    try {
      const data = await createCampaign(getToken);
      setUsageLimit(data.usageLimit);
      setCurrentUsage(data.currentUsage);
      setCreateDenied(false);
      setCampaigns((prev) => [
        {
          name: randomCampaignName(),
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
        console.error('Failed to create campaign:', error);
      }
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="app campaigns-page">
        <PageLoading />
      </div>
    );
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
                onClick={handleCreateCampaign}
                disabled={isCreating || creditRate === null}
              >
                {isCreating ? 'Generating…' : 'Generate AI Campaign'}
              </button>
              {creditRate !== null ? (
                <span className="rate-pill">
                  {creditRate} {creditRate === 1 ? 'credit' : 'credits'}
                </span>
              ) : (
                campaignAccess.status !== 'loading' && (
                  <span className="rate-pill rate-pill--error">No rate found</span>
                )
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
                Generate your first AI-powered campaign. The engine analyzes market trends and
                builds a strategy in seconds.
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

        {modal}
      </div>
    </div>
  );
}
