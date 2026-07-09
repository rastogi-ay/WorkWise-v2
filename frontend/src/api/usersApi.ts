import type { GetClerkToken } from './clerkAuth';
import { withAuthHeaders } from './clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SyncedEnvironment {
  name: string;
  clientApiKey: string;
  isActive: boolean;
}

export interface SyncedUser {
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
  environments: SyncedEnvironment[];
  activeEnvironment: string | null;
}

// grabs the state of the user from MongoDB
export const syncUser = async (
  getToken: GetClerkToken,
): Promise<SyncedUser> => {
  const headers = await withAuthHeaders(getToken, {
    'Content-Type': 'application/json',
  });
  const response = await fetch(`${API_BASE_URL}/api/users/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${data.error}`);
  }

  return data;
};
