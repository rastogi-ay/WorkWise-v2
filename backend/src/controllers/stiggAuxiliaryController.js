import express from 'express';
import { getIntegrationsCount } from '../stigg/stiggClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { resolveStiggContext } from '../middleware/resolveStiggContext.js';
import { sendHttpError } from '../httpErrors.js';

const router = express.Router();

// TODO: review this + relevant service route
// goes directly to stiggClient.js file; no dedicated service w/ business logic
// should only be used for simple information lookup from Stigg

async function fetchBillingIntegrationStatus(req, res) {
  try {
    const totalCount = await getIntegrationsCount(req.stiggServerApiKey);
    const billingIntegrationExists = totalCount > 0;
    console.log('Billing Integration Exists:', billingIntegrationExists);
    return res.status(200).json({ billingIntegrationExists });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to get billing integration status.');
  }
}

router.get('/billing-status', requireAuth, resolveStiggContext, fetchBillingIntegrationStatus);
export default router;
