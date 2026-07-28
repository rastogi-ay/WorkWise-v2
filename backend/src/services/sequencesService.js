import { SEQUENCES_FEATURE_ID, FeatureDeniedError } from '../stigg/stiggFeatures.js';
import { estimateCreditUsage, reportUsage } from '../stigg/stiggClient.js';

async function createSequence(customerId) {
  const estimatedUsage = await estimateCreditUsage(customerId, SEQUENCES_FEATURE_ID, 1);
  if (estimatedUsage.wouldOverdraft) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have sufficient credits to generate a sequence`,
      estimatedUsage,
    );
  }

  const reportedUsage = await reportUsage(customerId, SEQUENCES_FEATURE_ID, 1);
  return reportedUsage;
}

async function getSequencesCreditRate(customerId) {
  // instead of doing an entitlement check on top, this method will not return a "cost" if the user isn't entitled
  // also, automatically solves for edge case where customer is subscribed to multiple plans w/ same consumption rate
  const estimatedUsage = await estimateCreditUsage(customerId, SEQUENCES_FEATURE_ID, 1);
  const creditRate = estimatedUsage?.breakdown?.[0]?.cost;
  if (creditRate == null) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have a credit rate configured for sequences`,
    );
  }
  return creditRate;
}

export { createSequence, getSequencesCreditRate };
