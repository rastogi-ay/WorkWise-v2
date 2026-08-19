import express from 'express';
import * as chatbotService from '../../services/pages/chatbotService.js';
import { sendHttpError } from '../../httpErrors.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { resolveStiggContext } from '../../middleware/resolveStiggContext.js';

const router = express.Router();

async function sendChatMessage(req, res) {
  const { history, dimensions } = req.body;
  const lastMessage = history?.at(-1);

  if (!lastMessage?.text?.trim()) {
    return res.status(400).json({ error: 'Message must not be empty.' });
  }

  try {
    const result = await chatbotService.sendChatMessage(
      req.stiggServerApiKey,
      req.customerId,
      history,
      dimensions,
    );
    return res.status(200).json(result);
  } catch (error) {
    return sendHttpError(error, res, 'Failed to send chat message.');
  }
}

router.post('/', requireAuth, resolveStiggContext, sendChatMessage);
export default router;
