import express from 'express';
import * as analyticsService from '../services/analyticsService.js';
import { FeatureDeniedError } from '../stigg/stigg.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function fetchAnalytics(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const data = await analyticsService.getAnalytics(customerId);
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      return res
        .status(403)
        .json({
          error:
            'You do not have access to analytics. Please upgrade your plan.',
        });
    }
    console.error('Failed to get analytics:', error);
    return res.status(500).json({ error: 'Failed to get analytics' });
  }
}

router.get('/', requireAuth, fetchAnalytics);
export default router;
