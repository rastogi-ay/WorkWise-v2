import type { GetClerkToken } from '../../clerkAuth';
import { withAuthHeaders } from '../../clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FetchCreditBalanceResponse {
  usageLimit: number | null;
  currentUsage: number | null;
}

export const fetchCreditBalance = async (
  getToken: GetClerkToken,
): Promise<FetchCreditBalanceResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/credits`, { headers });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
