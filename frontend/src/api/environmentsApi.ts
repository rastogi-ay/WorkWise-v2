import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';
import type { SyncedEnvironment } from './usersApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface EnvironmentsResponse {
  environments: SyncedEnvironment[];
}

async function handleResponse(response: Response): Promise<EnvironmentsResponse> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error}`);
  }
  return data;
}

export const listEnvironments = async (getToken: GetClerkToken): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/environments`, { headers });
  return handleResponse(response);
};

export const addEnvironment = async (
  getToken: GetClerkToken,
  name: string,
  clientApiKey: string,
  serverApiKey: string,
): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(`${API_BASE_URL}/api/environments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, clientApiKey, serverApiKey }),
  });
  return handleResponse(response);
};

export const removeEnvironment = async (
  getToken: GetClerkToken,
  name: string,
): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/environments/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse(response);
};

export const setActiveEnvironment = async (
  getToken: GetClerkToken,
  name: string | null,
): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(`${API_BASE_URL}/api/environments/active`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
};
