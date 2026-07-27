import express from 'express';
import * as creditsService from '../services/creditsService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function fetchCreditBalance(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const entitlement = await creditsService.getCreditBalance(customerId);
    console.log('Credits Entitlement:', entitlement);
    return res.status(200).json({
      usageLimit: entitlement.usageLimit,
      currentUsage: entitlement.currentUsage,
    });
    // no FeatureDeniedError here; user will always have ability to view credit balance
  } catch (error) {
    console.error('Failed to get credit balance:', error);
    return res.status(500).json({
      error: 'Failed to get credit balance',
    });
  }
}

router.get('/', requireAuth, fetchCreditBalance);
export default router;
