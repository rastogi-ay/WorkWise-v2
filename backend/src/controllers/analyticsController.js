import express from 'express';
import * as analyticsService from '../services/analyticsService.js';
import { FeatureDeniedError } from '../stigg/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';

const router = express.Router();

async function fetchAnalytics(req, res) {
  try {
    const entitlement = await analyticsService.getAnalytics(req.stiggServerApiKey, req.customerId);
    // TODO: revisit logging; what would be most useful to engineers?
    console.log('Analytics Entitlement:', entitlement);
    return res.status(200).json({});
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({});
    }
    console.error('Failed to get analytics:', error);
    return res.status(500).json({
      error: 'Failed to get analytics.',
    });
  }
}

router.get('/', requireAuth, resolveStiggContext, fetchAnalytics);
export default router;
