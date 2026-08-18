import express from 'express';
import * as customersService from '../services/customersService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendHttpError } from '../httpErrors.js';

const router = express.Router();

// TODO: realizing that this probably shouldn't be stored in MongoDB.
// instead, we can just query Stigg for the relevant list of customers and then
// provide information on each one. Like ID, plan, metadata, etc.
// this way, the customers can automatically be in sync
// will require API calls but that's fine... no need to worry about DB matching
// but you can still customer management from the app
// add customer, delete (archive) customer, (probably no need for update)
async function list(req, res) {
  try {
    const customers = await customersService.listCustomers(req.clerkId, req.params.environmentName);
    return res.status(200).json({ customers });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to list customers.');
  }
}

async function add(req, res) {
  const { environmentName } = req.params;
  const { customerId, firstName, lastName, email } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    const customers = await customersService.addCustomer(req.clerkId, environmentName, customerId, {
      firstName,
      lastName,
      email,
    });
    return res.status(201).json({ customers });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to add customer.');
  }
}

async function setActive(req, res) {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    const customers = await customersService.setActiveCustomer(
      req.clerkId,
      req.params.environmentName,
      customerId,
    );
    return res.status(200).json({ customers });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to set active customer.');
  }
}

router.get('/:environmentName', requireAuth, list);
router.post('/:environmentName', requireAuth, add);
router.put('/:environmentName', requireAuth, setActive);

export default router;
