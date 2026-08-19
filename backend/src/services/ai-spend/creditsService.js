import { CREDIT_CURRENCY } from '../../stigg/constants.js';
import { getCreditEntitlement } from '../../stigg/stiggClient.js';

async function getCreditBalance(serverApiKey, customerId) {
  // no FeatureDeniedError here; user will always have ability to view credit balance
  const entitlement = await getCreditEntitlement(serverApiKey, customerId, CREDIT_CURRENCY);
  return { usageLimit: entitlement.usageLimit, currentUsage: entitlement.currentUsage };
}

export { getCreditBalance };
