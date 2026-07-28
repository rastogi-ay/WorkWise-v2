import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';
import type { SyncedCustomer, CustomerProfileInput } from './usersApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  customerId: string,
  customerProfile: CustomerProfileInput = {},
): Promise<CustomersResponse> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(
    `${API_BASE_URL}/api/customers/${encodeURIComponent(environmentName)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ customerId, ...customerProfile }),
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
