import mongoose from 'mongoose';

const { Schema } = mongoose;

const stiggEnvironmentSchema = new Schema(
  {
    clientApiKey: { type: String, required: true },
    serverApiKey: { type: String, required: true, select: false },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    lastSeenAt: { type: Date, default: Date.now },
    environments: {
      type: Map,
      of: stiggEnvironmentSchema,
      default: () => new Map(),
    },
    activeEnvironment: { type: String, default: null },
  },
  { timestamps: true },
);

// ensures that the Server API key never reaches the frontend (i.e. when res.json() is run)
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;

    const safeEnvironments = {};
    for (const [name, env] of doc.environments ?? new Map()) {
      safeEnvironments[name] = {
        clientApiKey: env.clientApiKey,
        isActive: name === doc.activeEnvironment,
      };
    }
    ret.environments = safeEnvironments;

    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
