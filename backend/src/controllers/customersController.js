import express from 'express';
import * as customersService from '../services/customersService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

async function list(req, res) {
  try {
    const customers = await customersService.listCustomers(req.clerkId, req.params.environmentName);
    return res.status(200).json({ customers });
  } catch (error) {
    console.error('Failed to list customers:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function add(req, res) {
  const { customerId, firstName, lastName, email } = req.body;

  try {
    const customers = await customersService.addCustomer(
      req.clerkId,
      req.params.environmentName,
      customerId,
      { firstName, lastName, email },
    );
    return res.status(201).json({ customers });
  } catch (error) {
    console.error('Failed to add customer:', error);
    return res.status(400).json({ error: error.message });
  }
}

async function setActive(req, res) {
  try {
    const customers = await customersService.setActiveCustomer(
      req.clerkId,
      req.params.environmentName,
      req.body.customerId,
    );
    return res.status(200).json({ customers });
  } catch (error) {
    console.error('Failed to set active customer:', error);
    return res.status(400).json({ error: error.message });
  }
}

router.get('/:environmentName', requireAuth, list);
router.post('/:environmentName', requireAuth, add);
router.put('/:environmentName', requireAuth, setActive);

export default router;
