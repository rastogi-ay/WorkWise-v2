import { PaywallPage } from './PaywallPage';
import { WORKWISE_AI_PRODUCT_ID } from '../stigg/constants';

export default function WorkWiseAIPaywall() {
  return (
    <PaywallPage
      productId={WORKWISE_AI_PRODUCT_ID}
      title="Pricing"
      subtitle="Choose a plan that unlocks more of WorkWise AI."
    />
  );
}
