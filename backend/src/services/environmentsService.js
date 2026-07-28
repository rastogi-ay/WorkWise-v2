import { User } from '../models/User.js';

function toSafeEnvironmentList(user) {
  const environments = user.environments ?? new Map();
  return Array.from(environments.entries()).map(([name, env]) => ({
    name,
    clientApiKey: env.clientApiKey,
    isActive: name === user.activeEnvironment,
  }));
}

async function listEnvironments(clerkId) {
  const user = await User.findOne({ clerkId });
  return user ? toSafeEnvironmentList(user) : [];
}

async function addEnvironment(clerkId, name, { clientApiKey, serverApiKey }) {
  if (!name || !clientApiKey || !serverApiKey) {
    throw new Error('name, clientApiKey, and serverApiKey are required');
  }
  if (!clientApiKey.startsWith('client')) {
    throw new Error('clientApiKey must start with "client"');
  }
  if (!serverApiKey.startsWith('server')) {
    throw new Error('serverApiKey must start with "server"');
  }

  const existing = await User.findOne({ clerkId });
  if (!existing) throw new Error('User not found');
  if ((existing.environments ?? new Map()).has(name)) {
    throw new Error(`Environment "${name}" already exists`);
  }

  const user = await User.findOneAndUpdate(
    { clerkId },
    { $set: { [`environments.${name}`]: { clientApiKey, serverApiKey } } },
    { returnDocument: 'after' },
  );
  if (!user) throw new Error('User not found');
  return toSafeEnvironmentList(user);
}

async function removeEnvironment(clerkId, name) {
  if (name === 'Default') {
    throw new Error('The Default environment cannot be removed');
  }

  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  if (user.activeEnvironment === name) {
    throw new Error('The active environment cannot be removed');
  }

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $unset: { [`environments.${name}`]: '' } },
    { returnDocument: 'after' },
  );
  return toSafeEnvironmentList(updated);
}

async function setActiveEnvironment(clerkId, name) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  if (name !== null && !(user.environments ?? new Map()).has(name)) {
    throw new Error(`Environment "${name}" does not exist`);
  }

  const updated = await User.findOneAndUpdate(
    { clerkId },
    { $set: { activeEnvironment: name } },
    { returnDocument: 'after' },
  );
  return toSafeEnvironmentList(updated);
}

export {
  toSafeEnvironmentList,
  listEnvironments,
  addEnvironment,
  removeEnvironment,
  setActiveEnvironment,
};
