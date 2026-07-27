import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paywall, Checkout, SubscribeIntentionType } from '@stigg/react-sdk';
import '@stigg/react-sdk/dist/styles.css';
import '../styles/App.css';
import '../styles/PaywallPage.css';
import { UnlockIcon } from '../extras/icons';
import { WORKWISE_AI_PRODUCT_ID, WORKWISE_PLANNER_PRODUCT_ID } from '../stigg/constants';

export const PRICING_URL_BY_PRODUCT_ID: Record<string, string> = {
  [WORKWISE_AI_PRODUCT_ID]: '/pricing/ai',
  [WORKWISE_PLANNER_PRODUCT_ID]: '/pricing/planner',
};

interface PaywallPageProps {
  productId: string;
  title: string;
  subtitle: string;
}

export function PaywallPage({ productId, title, subtitle }: PaywallPageProps) {
  const navigate = useNavigate();
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [billingIntegrationExists, setBillingIntegrationExists] = useState(false);

  return (
    <div className="app app--wide">
      <div className="page-header">
        <span className="page-header__icon">
          <UnlockIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content">
          {checkoutPlanId ? (
            <Checkout
              planId={checkoutPlanId}
              onCheckoutCompleted={async ({ success }) => {
                if (success) {
                  navigate('/');
                } else {
                  setCheckoutPlanId(null);
                }
              }}
            />
          ) : (
            <Paywall
              productId={productId}
              onPlanSelected={({ plan, intentionType }) => {
                switch (intentionType) {
                  case SubscribeIntentionType.START_TRIAL:
                  case SubscribeIntentionType.UPGRADE_PLAN:
                    setCheckoutPlanId(plan.id);
                    break;
                  case SubscribeIntentionType.DOWNGRADE_PLAN:
                    setCheckoutPlanId(plan.id);
                    break;
                  default:
                    break;
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
