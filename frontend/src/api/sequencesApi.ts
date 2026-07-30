import type { GetClerkToken } from '../clerkAuth';
import { withAuthHeaders } from '../clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CreateSequencesResponse {
  currentUsage: number | null;
}

interface FetchSequencesCostResponse {
  cost: number | null;
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

export const fetchSequencesCost = async (
  getToken: GetClerkToken,
): Promise<FetchSequencesCostResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/sequences/cost`, {
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
