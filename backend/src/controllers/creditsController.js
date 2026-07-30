import express from 'express';
import * as creditsService from '../services/creditsService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';
import { sendHttpError } from '../httpErrors.js';

const router = express.Router();

async function fetchCreditBalance(req, res) {
  try {
    const balance = await creditsService.getCreditBalance(req.stiggServerApiKey, req.customerId);
    return res.status(200).json(balance);
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get credit balance.');
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchCreditBalance);
export default router;
