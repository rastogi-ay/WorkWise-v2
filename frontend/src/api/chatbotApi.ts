import type { GetClerkToken } from '../clerkAuth';
import { withAuthHeaders } from '../clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface SendChatMessageResponse {
  reply: string;
  currentUsage: number | null;
}

export const sendChatMessage = async (
  getToken: GetClerkToken,
  history: ChatMessage[],
  dimensions: Record<string, string> = {},
): Promise<SendChatMessageResponse> => {
  const headers = await withAuthHeaders(getToken, { 'Content-Type': 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ history, dimensions }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
