import { getTokensUsage, reportTokenUsage } from './tokensService.js';
import { generateChatReply } from '../gemini/geminiClient.js';

async function sendChatMessage(serverApiKey, customerId, history) {
  // Gate on whether the customer has any allowance left *before* this message. Once
  // granted, the in-flight reply is allowed to complete even if the reported usage
  // pushes them over the limit — the next send is what gets blocked.
  const { usageLimit } = await getTokensUsage(serverApiKey, customerId);

  const reply = await generateChatReply(history);
  const { currentUsage } = await reportTokenUsage(
    serverApiKey,
    customerId,
    usageLimit, // needed for randomization
  );

  return {
    reply,
    currentUsage,
  };
}

export { sendChatMessage };
