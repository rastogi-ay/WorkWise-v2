import { ANALYTICS_FEATURE_ID, FeatureDeniedError } from '../stigg/constants.js';
import { getBooleanEntitlement } from '../stigg/stiggClient.js';

async function getAnalytics(serverApiKey, customerId) {
  const entitlement = await getBooleanEntitlement(serverApiKey, customerId, ANALYTICS_FEATURE_ID);
  if (!entitlement.isGranted) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have access to analytics`,
      entitlement,
    );
  }
  return entitlement;
}

export { getAnalytics };
