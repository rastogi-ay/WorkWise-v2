import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface TokensUsageResponse {
  usageLimit: number | null;
  currentUsage: number | null;
}

interface SendChatMessageResponse {
  reply: string;
  tokensUsed: number;
  usageLimit: number | null;
  currentUsage: number | null;
}

export const fetchTokensUsage = async (getToken: GetClerkToken): Promise<TokensUsageResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/tokens`, { headers });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const sendChatMessage = async (
  getToken: GetClerkToken,
  history: ChatMessage[],
): Promise<SendChatMessageResponse> => {
  const headers = await withAuthHeaders(getToken, { 'Content-Type': 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ history }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
