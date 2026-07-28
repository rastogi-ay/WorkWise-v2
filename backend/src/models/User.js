import mongoose from 'mongoose';

const { Schema } = mongoose;

const stiggCustomerSchema = new Schema(
  {
    customerId: { type: String, required: true },
    // all optional — a user can supply these when creating a customer, but there's no
    // requirement to (unlike the clerkId-customer, which always gets them from the Clerk profile)
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    email: { type: String, default: null },
    stiggOnboarded: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const stiggEnvironmentSchema = new Schema(
  {
    clientApiKey: { type: String, required: true },
    serverApiKey: { type: String, required: true },
    // never null — every environment always has an active customer from the moment it's created
    activeCustomerId: { type: String, required: true },
    customers: { type: [stiggCustomerSchema], default: [] },
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
    activeEnvironment: { type: String, default: 'Default' },
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
        activeCustomerId: env.activeCustomerId,
        customers: (env.customers ?? []).map((customer) => ({
          customerId: customer.customerId,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          isActive: customer.customerId === env.activeCustomerId,
          stiggOnboarded: customer.stiggOnboarded,
        })),
      };
    }
    ret.environments = safeEnvironments;

    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
