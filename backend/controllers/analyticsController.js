import express from 'express';
import * as analyticsService from '../services/analyticsService.js';
import { FeatureDeniedError } from '../stigg/stiggFeatures.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function fetchAnalytics(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const entitlement = await analyticsService.getAnalytics(customerId);
    console.log("Analytics Entitlement:", entitlement);
    return res.status(200).json({
      access: true,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({
        access: false,
        error: 'You do not have access to analytics. Please upgrade your plan.',
      });
    }
    console.error('Failed to get analytics:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to get analytics',
    });
  }
}

router.get('/', requireAuth, fetchAnalytics);
export default router;
