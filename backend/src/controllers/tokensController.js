import express from 'express';
import * as tokensService from '../services/tokensService.js';
import { sendHttpError } from '../httpErrors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';

const router = express.Router();

async function fetchTokensUsage(req, res) {
  try {
    const entitlement = await tokensService.getTokensUsage(req.stiggServerApiKey, req.customerId);
    return res.status(200).json({
      usageLimit: entitlement.usageLimit,
      currentUsage: entitlement.currentUsage,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get AI tokens usage.');
  }
}

async function sendChatMessage(req, res) {
  const { history } = req.body;
  const lastMessage = history?.at(-1);

  if (!lastMessage?.text?.trim()) {
    return res.status(400).json({ error: 'Message must not be empty.' });
  }

  try {
    const result = await tokensService.sendChatMessage(
      req.stiggServerApiKey,
      req.customerId,
      history,
    );
    return res.status(200).json(result);
  } catch (error) {
    return sendHttpError(error, res, 'Failed to send chat message.');
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchTokensUsage);
router.post('/', requireAuth, resolveStiggContext, sendChatMessage);
export default router;
