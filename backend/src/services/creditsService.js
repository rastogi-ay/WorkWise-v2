import { CREDIT_CURRENCY } from '../stigg/constants.js';
import { getCreditEntitlement } from '../stigg/stiggClient.js';

async function getCreditBalance(serverApiKey, customerId) {
  return getCreditEntitlement(serverApiKey, customerId, CREDIT_CURRENCY);
}

export { getCreditBalance };
