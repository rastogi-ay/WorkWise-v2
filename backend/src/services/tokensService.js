import { AI_TOKENS_FEATURE_ID } from '../stigg/constants.js';
import { FeatureDeniedError } from '../httpErrors.js';
import { getNumericEntitlement, reportUsage } from '../stigg/stiggClient.js';

function randomTokenUsage(usageLimit) {
  if (!usageLimit) {
    return Math.floor(Math.random() * 451) + 50; // no known limit — fall back to a flat 50-500
  }
  const min = Math.max(1, Math.round(usageLimit * 0.25));
  const max = Math.max(min + 1, Math.round(usageLimit * 0.5));
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getTokensUsage(serverApiKey, customerId) {
  const entitlement = await getNumericEntitlement(serverApiKey, customerId, AI_TOKENS_FEATURE_ID);
  if (!entitlement.isGranted) {
    throw new FeatureDeniedError(
      `Customer ${customerId} does not have access to AI tokens`,
      entitlement,
    );
  }
  return { usageLimit: entitlement.usageLimit, currentUsage: entitlement.currentUsage };
}

// Reports a randomized token spend for one AI interaction. usageLimit only scales the
// random amount; it is not re-read from Stigg here.
async function reportTokenUsage(serverApiKey, customerId, usageLimit) {
  const tokensUsed = randomTokenUsage(usageLimit);
  const usage = await reportUsage(serverApiKey, customerId, AI_TOKENS_FEATURE_ID, tokensUsed);

  return { currentUsage: usage.currentUsage };
}

export { getTokensUsage, reportTokenUsage };
