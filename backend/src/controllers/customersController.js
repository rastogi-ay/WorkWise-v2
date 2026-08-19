import express from 'express';
import * as customersService from '../services/customersService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendHttpError } from '../httpErrors.js';

const router = express.Router();

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
  const { customerId, name, email } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    const customers = await customersService.addCustomer(req.clerkId, environmentName, {
      customerId,
      name,
      email,
    });
    return res.status(201).json({ customers });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to add customer.');
  }
}

async function update(req, res) {
  const { environmentName, customerId } = req.params;
  const { name, email } = req.body;

  if (name === undefined && email === undefined) {
    return res.status(400).json({ error: 'At least one of name or email must be provided' });
  }

  try {
    const customers = await customersService.updateCustomer(
      req.clerkId,
      environmentName,
      customerId,
      { name, email },
    );
    return res.status(200).json({ customers });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to update customer.');
  }
}

async function archive(req, res) {
  const { environmentName, customerId } = req.params;

  try {
    const customers = await customersService.archiveCustomer(
      req.clerkId,
      environmentName,
      customerId,
    );
    return res.status(200).json({ customers });
  } catch (error) {
    return sendHttpError(error, res, 'Failed to archive customer.');
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
router.patch('/:environmentName/:customerId', requireAuth, update);
router.post('/:environmentName/:customerId/archive', requireAuth, archive);

export default router;
