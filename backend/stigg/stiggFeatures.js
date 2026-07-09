// Feature IDs for the different features from Stigg
export const TEMPLATES_FEATURE_ID = 'feature-01-templates';
export const ANALYTICS_FEATURE_ID = 'feature-04-analytics';
export const MESSAGES_FEATURE_ID = 'feature-06-messages';

// Error class for feature denied errors to be thrown after entitlement checks
export class FeatureDeniedError extends Error {
  constructor() {
    super();
    this.name = 'FeatureDeniedError';
  }
}
