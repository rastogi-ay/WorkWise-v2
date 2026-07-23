import {
  SEQUENCES_FEATURE_ID,
  FeatureDeniedError,
} from '../stigg/stiggFeatures.js';
import { estimateCreditUsage, reportUsage } from '../stigg/stiggService.js';

async function createSequence(customerId) {
  const estimatedUsage = await estimateCreditUsage(
    customerId,
    SEQUENCES_FEATURE_ID,
    1,
  );
  if (estimatedUsage.wouldOverdraft) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have sufficient credits to generate a sequence`,
    );
  }

  const reportedUsage = await reportUsage(customerId, SEQUENCES_FEATURE_ID, 1);
  return reportedUsage;
}

async function getSequencesCreditRate(customerId) {
  // automatically solves for edge case where customer is subscribed to multiple plans w/ same consumption rate
  // ex. customer subscribed to plan 1: each sequence costs 4 credits. Also plan 2: each sequence costs 2 credits
  // overall, customer should only be charged 2 credits for each sequence
  const estimatedUsage = await estimateCreditUsage(
    customerId,
    SEQUENCES_FEATURE_ID,
    1,
  );
  const creditRate = estimatedUsage.breakdown[0].cost;
  if (creditRate === null) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have a credit rate configured for sequences`,
    );
  }
  return creditRate;
}

export { createSequence, getSequencesCreditRate };
