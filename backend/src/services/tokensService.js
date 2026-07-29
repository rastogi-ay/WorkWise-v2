import { AI_TOKENS_FEATURE_ID } from '../stigg/constants.js';
import { FeatureDeniedError } from '../httpErrors.js';
import { getNumericEntitlement, reportUsage } from '../stigg/stiggClient.js';
import { generateChatReply } from '../gemini/geminiClient.js';

function randomTokenUsage(usageLimit) {
  if (!usageLimit || usageLimit <= 0) {
    return Math.floor(Math.random() * 451) + 50; // no known limit — fall back to a flat 50-500
  }
  const min = Math.max(1, Math.round(usageLimit * 0.1));
  const max = Math.max(min + 1, Math.round(usageLimit * 0.25));
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
  return entitlement;
}

async function sendChatMessage(serverApiKey, customerId, history) {
  const entitlement = await getNumericEntitlement(serverApiKey, customerId, AI_TOKENS_FEATURE_ID);
  if (!entitlement.isGranted) {
    throw new FeatureDeniedError(`Customer ${customerId} is out of AI tokens`, entitlement);
  }

  const reply = await generateChatReply(history);
  const tokensUsed = randomTokenUsage(entitlement.usageLimit);

  const usage = await reportUsage(serverApiKey, customerId, AI_TOKENS_FEATURE_ID, tokensUsed);

  return {
    reply,
    tokensUsed,
    // reporting usage can't change the limit, so the pre-report entitlement still holds.
    // TODO: might change^^
    usageLimit: entitlement.usageLimit,
    currentUsage: usage.currentUsage,
  };
}

export { getTokensUsage, sendChatMessage };
