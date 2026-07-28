import { CREDIT_CURRENCY } from '../stigg/stiggFeatures.js';
import { getCreditEntitlement } from '../stigg/stiggClient.js';

async function getCreditBalance(customerId) {
  return getCreditEntitlement(customerId, CREDIT_CURRENCY);
}

export { getCreditBalance };
