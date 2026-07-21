import {
  ANALYTICS_FEATURE_ID,
  FeatureDeniedError,
} from '../stigg/stiggFeatures.js';
import { getBooleanEntitlement } from '../stigg/stiggService.js';

async function getAnalytics(customerId) {
  const entitlement = await getBooleanEntitlement(
    customerId,
    ANALYTICS_FEATURE_ID,
  );
  if (!entitlement.isGranted) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have access to analytics: ${entitlement.accessDeniedReason ?? 'no entitlement found'}`,
    );
  }
  return entitlement;
}

export { getAnalytics };
