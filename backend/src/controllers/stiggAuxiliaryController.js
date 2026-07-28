import express from 'express';
import { getIntegrationsCount } from '../stigg/stiggClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';

const router = express.Router();

// goes directly to stiggClient.js file; no dedicated service w/ business logic
// should only be used for simple information lookup from Stigg

async function fetchBillingIntegrationStatus(req, res) {
  try {
    const totalCount = await getIntegrationsCount(req.stiggServerApiKey);
    const billingIntegrationExists = totalCount > 0;
    console.log('Billing Integration Exists:', billingIntegrationExists);
    return res.status(200).json({ billingIntegrationExists });
  } catch (error) {
    console.error('Failed to get billing integration status:', error);
    return res.status(500).json({ error: 'Failed to get billing integration status.' });
  }
}

router.get('/billing-status', requireAuth, resolveStiggContext, fetchBillingIntegrationStatus);
export default router;
