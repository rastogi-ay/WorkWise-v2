import type { GetClerkToken } from '../../clerkAuth';
import { withAuthHeaders } from '../../clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SyncedCustomer {
  customerId: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
}

export interface CustomerProfileInput {
  customerId: string;
  name?: string;
  email?: string;
}

interface CustomersResponse {
  customers: SyncedCustomer[];
}

export const listCustomers = async (
  getToken: GetClerkToken,
  environmentName: string,
): Promise<CustomersResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${encodeURIComponent(environmentName)}`,
    { headers },
  );
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const addCustomer = async (
  getToken: GetClerkToken,
  environmentName: string,
  customerProfile: CustomerProfileInput,
): Promise<CustomersResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${encodeURIComponent(environmentName)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(customerProfile),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const updateCustomer = async (
  getToken: GetClerkToken,
  environmentName: string,
  customerProfile: CustomerProfileInput,
): Promise<CustomersResponse> => {
  const { customerId, ...profile } = customerProfile;
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${encodeURIComponent(environmentName)}/${encodeURIComponent(customerId)}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(profile),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const archiveCustomer = async (
  getToken: GetClerkToken,
  environmentName: string,
  customerId: string,
): Promise<CustomersResponse> => {
  const headers = await withAuthHeaders(getToken);
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${encodeURIComponent(environmentName)}/${encodeURIComponent(customerId)}/archive`,
    {
      method: 'POST',
      headers,
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};

export const setActiveCustomer = async (
  getToken: GetClerkToken,
  environmentName: string,
  customerId: string,
): Promise<CustomersResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${encodeURIComponent(environmentName)}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ customerId }),
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }

  return data;
};
