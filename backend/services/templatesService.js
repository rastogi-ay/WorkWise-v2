import { TEMPLATES_FEATURE_ID, FeatureDeniedError } from '../stigg/stigg.js';

async function getTemplates(customerId) {
  const entitlement = await stiggClient.getMeteredEntitlement({
    customerId,
    featureId: TEMPLATES_FEATURE_ID,
  });

  return {
    currentUsage: entitlement.currentUsage,
    usageLimit: entitlement.usageLimit,
  };
}

async function saveTemplate(customerId) {
  const entitlement = await stiggClient.getMeteredEntitlement({
    customerId,
    featureId: TEMPLATES_FEATURE_ID,
    options: { requestedUsage: 1 },
  });
  console.log('Templates Entitlement:', entitlement);

  if (!entitlement.hasAccess) {
    throw new FeatureDeniedError();
  }

  const reportUsage = await stiggClient.reportUsage({
    customerId,
    featureId: TEMPLATES_FEATURE_ID,
    value: 1,
  });
  console.log('Reported Usage of Template:', reportUsage);
  const newCurrentUsage = entitlement.currentUsage + 1;

  return {
    message: 'Template creation successfully reported to Stigg',
    currentUsage: newCurrentUsage,
  };
}

export { getTemplates, saveTemplate };
