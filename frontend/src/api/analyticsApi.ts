import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';
import { throwIfError } from './apiErrors';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FetchAnalyticsResponse {
  access: boolean;
}

export const fetchAnalytics = async (getToken: GetClerkToken): Promise<FetchAnalyticsResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/analytics`, { headers });
  const data = await response.json();
  throwIfError(response, data);

  return data;
};
