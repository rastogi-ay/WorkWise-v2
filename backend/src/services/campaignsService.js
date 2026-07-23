import {
  CAMPAIGNS_FEATURE_ID,
  FeatureDeniedError,
} from '../stigg/stiggFeatures.js';
import { estimateCreditUsage, reportUsage } from '../stigg/stiggService.js';

async function createCampaign(customerId) {
  const estimatedUsage = await estimateCreditUsage(
    customerId,
    CAMPAIGNS_FEATURE_ID,
    1,
  );
  if (estimatedUsage.wouldOverdraft) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have sufficient credits to generate a campaign`,
      estimatedUsage
    );
  }

  const reportedUsage = await reportUsage(customerId, CAMPAIGNS_FEATURE_ID, 1);
  return reportedUsage;
}

async function getCampaignsCreditRate(customerId) {
  // instead of doing an entitlement check on top, this method will not return a "cost" if the user isn't entitled
  // also, automatically solves for edge case where customer is subscribed to multiple plans w/ same consumption rate
  const estimatedUsage = await estimateCreditUsage(
    customerId,
    CAMPAIGNS_FEATURE_ID,
    1,
  );
  const creditRate = estimatedUsage.breakdown[0].cost;
  if (creditRate == null) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have a credit rate configured for campaigns`,
    );
  }
  return creditRate;
}

export { createCampaign, getCampaignsCreditRate };
