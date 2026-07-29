import express from 'express';
import * as creditsService from '../services/creditsService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';
import { sendHttpError } from '../httpErrors.js';

const router = express.Router();

async function fetchCreditBalance(req, res) {
  try {
    const entitlement = await creditsService.getCreditBalance(
      req.stiggServerApiKey,
      req.customerId,
    );
    console.log('Credits Entitlement:', entitlement);
    return res.status(200).json({
      usageLimit: entitlement.usageLimit,
      currentUsage: entitlement.currentUsage,
    });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get credit balance.');
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchCreditBalance);
export default router;
