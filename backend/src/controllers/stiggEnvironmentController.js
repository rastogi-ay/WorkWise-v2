import express from 'express';
import { getIntegrationsCount } from '../stigg/stiggService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function fetchBillingIntegrationStatus(req, res) {
  const customerId = req.stiggCustomerId;

  try {
    const totalCount = await getIntegrationsCount(customerId);
    const billingIntegrationExists = totalCount > 0;
    console.log('Billing Integration Exists:', billingIntegrationExists);
    return res.status(200).json({ billingIntegrationExists });
  } catch (error) {
    console.error('Failed to get billing integration status:', error);
    return res.status(500).json({ error: 'Failed to get billing integration status.' });
  }
}

router.get('/billing-status', requireAuth, fetchBillingIntegrationStatus);
export default router;
