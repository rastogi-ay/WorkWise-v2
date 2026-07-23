import express from 'express';
import * as creditsService from '../services/creditsService.js';
import { FeatureDeniedError } from '../stigg/stiggFeatures.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function fetchCreditBalance(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const entitlement = await creditsService.getCreditBalance(customerId);
    console.log('Credits Entitlement:', entitlement);
    return res.status(200).json({
      access: true,
      usageLimit: entitlement.usageLimit,
      currentUsage: entitlement.currentUsage,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({
        access: false,
        error: 'You do not have access to credits. Please upgrade your plan.',
      });
    }
    console.error('Failed to get credit balance:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to get credit balance',
    });
  }
}

router.get('/', requireAuth, fetchCreditBalance);
export default router;
