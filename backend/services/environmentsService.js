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

  const user = await User.findOneAndUpdate(
    { clerkId },
    { $set: { [`environments.${name}`]: { clientApiKey, serverApiKey } } },
    { new: true },
  );
  if (!user) throw new Error('User not found');
  return toSafeEnvironmentList(user);
}

async function removeEnvironment(clerkId, name) {
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('User not found');

  const update = { $unset: { [`environments.${name}`]: '' } };
  if (user.activeEnvironment === name) {
    update.$set = { activeEnvironment: null };
  }

  const updated = await User.findOneAndUpdate({ clerkId }, update, {
    new: true,
  });
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
    { new: true },
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
