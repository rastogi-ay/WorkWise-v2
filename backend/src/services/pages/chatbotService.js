import { getTokensUsage, reportTokenUsage } from '../ai-spend/tokensService.js';
import { checkTokenBudget } from '../ai-spend/governanceService.js';
import { generateChatReply } from '../../gemini/geminiClient.js';

async function sendChatMessage(serverApiKey, customerId, history, dimensions) {
  // Gate on whether the customer has any allowance left *before* this message. Once
  // granted, the in-flight reply is allowed to complete even if the reported usage
  // pushes them over the limit — the next send is what gets blocked.
  const { usageLimit } = await getTokensUsage(serverApiKey, customerId);

  // Second, narrower gate: the governed entity the caller is acting as. Skipped when no entity was
  // supplied — governance is opt-in, and an unselected user must not lock the chatbot for everyone.
  await checkTokenBudget(serverApiKey, customerId, dimensions);

  const reply = await generateChatReply(history);
  const { currentUsage } = await reportTokenUsage(
    serverApiKey,
    customerId,
    usageLimit, // needed for randomization
    dimensions, // attributes the spend to the acting entity and every ancestor
  );

  return {
    reply,
    currentUsage,
  };
}

export { sendChatMessage };
