export type GetClerkToken = () => Promise<string | null>;

export async function withAuthHeaders(
  getToken: GetClerkToken,
  base: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await getToken();
  const headers = { ...base };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
