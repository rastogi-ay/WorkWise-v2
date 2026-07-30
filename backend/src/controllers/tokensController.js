import express from 'express';
import * as tokensService from '../services/tokensService.js';
import { sendHttpError } from '../httpErrors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';

const router = express.Router();

async function fetchTokensUsage(req, res) {
  try {
    const usage = await tokensService.getTokensUsage(req.stiggServerApiKey, req.customerId);
    return res.status(200).json(usage);
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get AI tokens usage.');
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchTokensUsage);
export default router;
