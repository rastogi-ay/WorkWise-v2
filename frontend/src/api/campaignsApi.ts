import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FetchCampaignsResponse {
  access: boolean;
  usageLimit: number | null;
  currentUsage: number | null;
}

interface FetchCreditRateResponse {
  amount: number | null;
}

export const createCampaign = async (
  getToken: GetClerkToken,
): Promise<FetchCampaignsResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error}`);
  }

  return data;
};

export const fetchCampaignsCreditRate = async (
  getToken: GetClerkToken,
): Promise<FetchCreditRateResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/campaigns/rate`, {
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error}`);
  }

  return data;
};
