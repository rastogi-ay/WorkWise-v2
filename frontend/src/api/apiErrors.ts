// A 403 means the entitlement check denied access (normal outcome)
// Anything else non-2xx is a genuine error, must throw
export function throwIfError(response: Response, data: { error?: string }): void {
  if (response.ok || response.status === 403) return;
  throw new Error(data.error ?? 'Request failed');
}
