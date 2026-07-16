// Feature IDs for the different features from Stigg
export const ANALYTICS_FEATURE_ID = 'feature-analytics';

// Error class for feature denied errors to be thrown after entitlement checks
export class FeatureDeniedError extends Error {
  constructor(message) {
    super();
    this.name = 'FeatureDeniedError';
    this.message = message;
  }
}
