import { CREDIT_CURRENCY, FeatureDeniedError } from '../stigg/stiggFeatures.js';
import { getCreditEntitlement } from '../stigg/stiggService.js';

async function getCreditBalance(customerId) {
  const entitlement = await getCreditEntitlement(customerId, CREDIT_CURRENCY);
  if (!entitlement.isGranted) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have access to credits: ${entitlement.accessDeniedReason ?? 'no entitlement found'}`,
    );
  }
  return entitlement;
}

export { getCreditBalance };
