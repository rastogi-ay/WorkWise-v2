import {
  CAMPAIGNS_FEATURE_ID,
  CREDIT_RATE_MAPPINGS,
  FeatureDeniedError,
  WORKWISE_AI_PRODUCT_ID
} from '../stigg/stiggFeatures.js';
import {
  estimateCreditUsage,
  getCreditRate,
  getSubscriptions,
  reportUsage,
} from '../stigg/stiggService.js';

async function createCampaign(customerId) {
  const estimatedUsage = await estimateCreditUsage(
    customerId,
    CAMPAIGNS_FEATURE_ID,
    1,
  );
  if (estimatedUsage.wouldOverdraft) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have sufficient credits to generate a campaign`,
    );
  }

  const reportedUsage = await reportUsage(customerId, CAMPAIGNS_FEATURE_ID, 1);
  return reportedUsage;
}

async function getCampaignsCreditRate(customerId) {
  const subscriptions = await getSubscriptions(customerId);
  // TODO: better way to do this function? I don't love that I'm filtering using "ai"
  const planId = subscriptions
    .filter((sub) => sub.planId.includes("ai"))
    .map((sub) => sub.planId);
  // assumes that the user is subscribed to only one plan with the relevant credit rate
  if (planId.length > 1) {
    throw new Error("More than one credit rate detected for campaigns");
  }
  // TODO: once featureRefId becomes available, remove this
  const internalFeatureId = CREDIT_RATE_MAPPINGS[CAMPAIGNS_FEATURE_ID];
  const creditRate = await getCreditRate(customerId, internalFeatureId, planId[0]);
  if (creditRate === null) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have a credit rate configured for campaigns`,
    );
  }
  return creditRate;
}

export { createCampaign, getCampaignsCreditRate };
