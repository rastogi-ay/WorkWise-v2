import express from 'express';
import * as campaignsService from '../services/campaignsService.js';
import { FeatureDeniedError } from '../stigg/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';

const router = express.Router();

async function addCampaign(req, res) {
  try {
    const usage = await campaignsService.createCampaign(req.stiggServerApiKey, req.customerId);
    console.log('Campaigns Usage:', usage);
    return res.status(201).json({
      usageLimit: usage.credit.usageLimit,
      currentUsage: usage.credit.currentUsage,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({});
    }
    console.error('Failed to create campaign:', error);
    return res.status(500).json({
      access: false,
      error: 'Failed to create campaign.',
    });
  }
}

async function fetchCampaignsCreditRate(req, res) {
  try {
    const rate = await campaignsService.getCampaignsCreditRate(
      req.stiggServerApiKey,
      req.customerId,
    );
    console.log('Campaigns Credit Rate:', rate);
    return res.status(200).json({
      rate,
    });
  } catch (error) {
    if (error instanceof FeatureDeniedError) {
      console.log(error.message);
      return res.status(403).json({});
    }
    console.error('Failed to get campaign credit rate:', error);
    return res.status(500).json({
      error: 'Failed to get campaign credit rate.',
    });
  }
}

router.post('/', requireAuth, resolveStiggContext, addCampaign);
router.get('/rate', requireAuth, resolveStiggContext, fetchCampaignsCreditRate);
export default router;
