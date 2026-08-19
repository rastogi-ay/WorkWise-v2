import type { GetClerkToken } from '../../clerkAuth';
import { withAuthHeaders } from '../../clerkAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GovernanceNode {
  entityId: string;
  displayName: string;
  entityTypeId: string;
  // null when this level is the deepest one, i.e. the node cannot have children
  childEntityTypeId: string | null;
  parentId: string | null;
  depth: number;
  // null means usage is tracked but never blocks
  usageLimit: number | null;
  currentUsage: number;
  utilization: number | null;
  cadence: string | null;
  usagePeriodEnd: string | null;
}

export interface GovernanceEntityType {
  id: string;
  displayName: string;
}

export interface GovernanceTreeResponse {
  nodes: GovernanceNode[];
  entityTypes: GovernanceEntityType[];
  defaultCadence: string;
  // human label for the governed unit, e.g. "tokens"
  currencyLabel: string;
}

interface NodesResponse {
  nodes: GovernanceNode[];
}

export interface ReportUsageResponse {
  entityId: string;
  amount: number;
  accountCurrentUsage: number | null;
  accountUsageLimit: number | null;
  chain: { entityId: string; usageLimit: number | null; currentUsage: number }[];
}

// Preserving `status` on the thrown error is what lets callers tell a governance denial (403) from a
// real failure, the same way isAccessDenied() does elsewhere in the app.
async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? 'Request failed'), { status: response.status });
  }
  return data;
}

export const fetchGovernanceTree = async (
  getToken: GetClerkToken,
): Promise<GovernanceTreeResponse> => {
  const headers = await withAuthHeaders(getToken);
  return readJson(await fetch(`${API_BASE_URL}/api/governance`, { headers }));
};

export const createGovernanceNode = async (
  getToken: GetClerkToken,
  node: {
    entityId: string;
    displayName: string;
    entityTypeId: string;
    parentId: string | null;
    usageLimit: number | null;
  },
): Promise<NodesResponse> => {
  const headers = await withAuthHeaders(getToken, { 'Content-Type': 'application/json' });
  return readJson(
    await fetch(`${API_BASE_URL}/api/governance/nodes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(node),
    }),
  );
};

export const updateGovernanceNodeLimit = async (
  getToken: GetClerkToken,
  entityId: string,
  usageLimit: number | null,
): Promise<NodesResponse> => {
  const headers = await withAuthHeaders(getToken, { 'Content-Type': 'application/json' });
  return readJson(
    await fetch(`${API_BASE_URL}/api/governance/nodes/${encodeURIComponent(entityId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ usageLimit }),
    }),
  );
};

export const deleteGovernanceNode = async (
  getToken: GetClerkToken,
  entityId: string,
): Promise<NodesResponse> => {
  const headers = await withAuthHeaders(getToken);
  return readJson(
    await fetch(`${API_BASE_URL}/api/governance/nodes/${encodeURIComponent(entityId)}`, {
      method: 'DELETE',
      headers,
    }),
  );
};

export const reportGovernanceUsage = async (
  getToken: GetClerkToken,
  entityId: string,
  amount: number,
): Promise<ReportUsageResponse> => {
  const headers = await withAuthHeaders(getToken, { 'Content-Type': 'application/json' });
  return readJson(
    await fetch(`${API_BASE_URL}/api/governance/nodes/${encodeURIComponent(entityId)}/usage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount }),
    }),
  );
};
