import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';
import { throwIfError } from './apiErrors';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CreateCampaignsResponse {
  access: boolean;
  usageLimit: number | null;
  currentUsage: number | null;
}

interface FetchCreditRateResponse {
  access: boolean;
  rate: number | null;
}

export const createCampaign = async (getToken: GetClerkToken): Promise<CreateCampaignsResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();
  throwIfError(response, data);

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
  throwIfError(response, data);

  return data;
};
