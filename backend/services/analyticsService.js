import { ANALYTICS_FEATURE_ID, FeatureDeniedError } from '../stigg/stigg.js';

async function getAnalytics(customerId) {
  const response = await fetch(`${STIGG_BASE_URL}/credits/grants`, {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.STIGG_SERVER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: customerId,
      displayName: 'Synchronous Credits',
      amount: 10,
      grantType: 'PROMOTIONAL',
      currencyId: 'cred-type-credit',
      comment: 'Refund for Batch #2895',
    }),
  });

  console.log('Analytics Entitlement:', response);
  if (!entitlement.hasAccess) {
    throw new FeatureDeniedError();
  }
  return {
    hiddenMessage:
      "Hidden message: Welcome to the analytics dashboard — you're in!",
  };
}

export { getAnalytics };
