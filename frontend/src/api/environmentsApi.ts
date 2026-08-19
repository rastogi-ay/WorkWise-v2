import type { GetClerkToken } from '../clerkAuth';
import { withAuthHeaders } from '../clerkAuth';
import type { SyncedCustomer, CustomerProfileInput } from './customersApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SyncedEnvironment {
  name: string;
  clientApiKey: string;
  isActive: boolean;
  activeCustomerId: string;
  customers: SyncedCustomer[];
}

interface EnvironmentsResponse {
  environments: SyncedEnvironment[];
}

export const listEnvironments = async (getToken: GetClerkToken): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(`${API_BASE_URL}/api/environments`, { headers });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const addEnvironment = async (
  getToken: GetClerkToken,
  name: string,
  clientApiKey: string,
  serverApiKey: string,
  customerProfile: CustomerProfileInput,
): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(`${API_BASE_URL}/api/environments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, clientApiKey, serverApiKey, customer: customerProfile }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
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
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const setActiveEnvironment = async (
  getToken: GetClerkToken,
  name: string | null,
): Promise<EnvironmentsResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(`${API_BASE_URL}/api/environments`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
