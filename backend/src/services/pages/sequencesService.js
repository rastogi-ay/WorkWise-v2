import { SEQUENCES_FEATURE_ID } from '../../stigg/constants.js';
import { FeatureDeniedError } from '../../httpErrors.js';
import { estimateCreditUsage, reportUsage } from '../../stigg/stiggClient.js';

async function createSequence(serverApiKey, customerId) {
  const estimatedUsage = await estimateCreditUsage(
    serverApiKey,
    customerId,
    SEQUENCES_FEATURE_ID,
    1,
  );
  // TODO: to add soft limits, a few options:
  // first, preface: soft limits should live in creditsService.js + tokensService.js
  // since they're directly returning the entitlements (they are responsible)
  //
  if (estimatedUsage.wouldOverdraft) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have sufficient credits to generate a sequence`,
      estimatedUsage,
    );
  }

  const reportedUsage = await reportUsage(serverApiKey, customerId, SEQUENCES_FEATURE_ID, 1);
  return { currentUsage: reportedUsage.credit.currentUsage };
}

async function getSequencesCost(serverApiKey, customerId) {
  // instead of doing an extra entitlement check for sequences, this will not return a "cost" if the user isn't entitled
  // also, automatically solves for edge case where customer is subscribed to multiple plans w/ same cost
  const estimatedUsage = await estimateCreditUsage(
    serverApiKey,
    customerId,
    SEQUENCES_FEATURE_ID,
    1,
  );
  const cost = estimatedUsage?.breakdown?.[0]?.cost;
  if (cost == null) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have a cost configured for sequences`,
    );
  }
  return cost;
}

export { createSequence, getSequencesCost };
