import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CreateSequencesResponse {
  usageLimit: number | null;
  currentUsage: number | null;
}

interface FetchCreditRateResponse {
  rate: number | null;
}

export const createSequence = async (getToken: GetClerkToken): Promise<CreateSequencesResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/sequences`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const fetchSequencesCreditRate = async (
  getToken: GetClerkToken,
): Promise<FetchCreditRateResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/sequences/rate`, {
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
