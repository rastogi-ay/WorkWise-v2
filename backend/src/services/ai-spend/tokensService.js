import { randomUUID } from 'node:crypto';
import { GOVERNED_CURRENCY } from '../../stigg/constants.js';
import { FeatureDeniedError } from '../../httpErrors.js';
import { consumeCredits, getCreditEntitlement } from '../../stigg/stiggClient.js';

function randomTokenUsage(usageLimit) {
  if (!usageLimit) {
    return Math.floor(Math.random() * 451) + 50; // no known limit — fall back to a flat 50-500
  }
  const min = Math.max(1, Math.round(usageLimit * 0.25));
  const max = Math.max(min + 1, Math.round(usageLimit * 0.5));
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// The account-level allowance for AI, read from the token credit currency. Tokens are a credit
// currency rather than a metered feature, so there is no feature entitlement to check — this mirrors
// sequencesService.js, which likewise gates on a credit balance.
async function getTokensUsage(serverApiKey, customerId) {
  const entitlement = await getCreditEntitlement(serverApiKey, customerId, GOVERNED_CURRENCY);
  if (!entitlement.isGranted) {
    // EntitlementNotFound means the currency isn't granted on the plan at all — a setup gap rather
    // than a drained balance, and the two need different fixes. Name the reason so it's obvious.
    const reason =
      entitlement.accessDeniedReason === 'EntitlementNotFound'
        ? `${GOVERNED_CURRENCY} is not granted on their plan`
        : (entitlement.accessDeniedReason ?? 'no access');
    throw new FeatureDeniedError(
      `Customer ${customerId} has no AI token allowance — ${reason}`,
      entitlement,
    );
  }
  return { usageLimit: entitlement.usageLimit, currentUsage: entitlement.currentUsage };
}

// Reports a randomized token spend for one AI interaction. usageLimit only scales the random amount;
// it is not re-read from Stigg here. dimensions, when present, attributes the spend to a governed
// entity and its ancestors.
//
// The amount is deducted straight from the token pool, so it is already denominated in tokens —
// there's no feature meter or consumption mapping in between to scale it.
async function reportTokenUsage(serverApiKey, customerId, usageLimit, dimensions) {
  const tokensUsed = randomTokenUsage(usageLimit);
  const usage = await consumeCredits(
    serverApiKey,
    customerId,
    GOVERNED_CURRENCY,
    tokensUsed,
    randomUUID(),
    dimensions,
  );

  return { currentUsage: usage?.credit?.currentUsage ?? null };
}

export { getTokensUsage, reportTokenUsage };
