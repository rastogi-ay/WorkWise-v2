import { PaywallPage } from './PaywallPage';
import { WORKWISE_PLANNER_PRODUCT_ID } from '../stigg/constants';

export default function WorkWisePlannerPaywall() {
  return (
    <PaywallPage
      productId={WORKWISE_PLANNER_PRODUCT_ID}
      title="Pricing"
      subtitle="Choose a plan that unlocks more of WorkWise Planner."
    />
  );
}
