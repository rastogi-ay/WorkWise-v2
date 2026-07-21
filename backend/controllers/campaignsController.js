import express from 'express';
import * as campaignsService from '../services/campaignsService.js';
import { FeatureDeniedError } from '../stigg/stiggFeatures.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function addCampaign(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const usage = await campaignsService.createCampaign(customerId);
    console.log('Campaigns Usage:', usage);
    return res.status(201).json({
      access: true,
      usageLimit: usage.credit.usageLimit,
      currentUsage: usage.credit.currentUsage,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({
        access: false,
        error: 'You have reached your credit limit. Please upgrade your plan.',
      });
    }
    console.error('Failed to create campaign:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to create campaign',
    });
  }
}

async function fetchCampaignsCreditRate(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const rate = await campaignsService.getCampaignsCreditRate(customerId);
    console.log('Campaigns Credit Rate:', rate);
    return res.status(200).json({
      amount: rate.amount,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({
        access: false,
        error: 'No credit rate found on subscribed plan.',
      });
    }
    console.error('Failed to get campaign credit rate:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to get campaign credit rate',
    });
  }
}

router.post('/', requireAuth, addCampaign);
router.get('/rate', requireAuth, fetchCampaignsCreditRate);
export default router;
