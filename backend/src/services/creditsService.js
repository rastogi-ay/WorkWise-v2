import { CREDIT_CURRENCY } from '../stigg/constants.js';
import { getCreditEntitlement } from '../stigg/stiggClient.js';

async function getCreditBalance(serverApiKey, customerId) {
  // no FeatureDeniedError here; user will always have ability to view credit balance
  return getCreditEntitlement(serverApiKey, customerId, CREDIT_CURRENCY);
  // TODO: add soft limits
}

export { getCreditBalance };
