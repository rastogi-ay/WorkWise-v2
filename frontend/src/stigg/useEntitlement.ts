import { useEffect, useState } from 'react';

export type EntitlementStatus = 'loading' | 'granted' | 'denied' | 'error';

interface EntitlementResult<T> {
  status: EntitlementStatus;
  data: T | null;
}

// Checks for 403 status; implies Stigg was called
export function isAccessDenied(error: unknown): boolean {
  return error instanceof Error && (error as Error & { status?: number }).status === 403;
}

// Reduces multiple useEntitlement statuses down to the two aggregate facts a page needs:
// 1) is any critical information still loading?
// 2) did retrieving any critical information result in an error?
// this function is NOT required. Simply a helper since most cases will leverage this
export function getLoadingAndError(...statuses: EntitlementStatus[]) {
  return {
    isLoading: statuses.some((s) => s === 'loading'),
    hasError: statuses.some((s) => s === 'error'),
  };
}

// Fetches an entitlement-gated endpoint and reduces the result down to a
// single status based purely on the HTTP response: granted (2xx), denied
// (403 — an expected "no access" outcome, not a failure), or error (any
// other non-2xx status, or a network failure).
export function useEntitlement<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): EntitlementResult<T> {
  const [status, setStatus] = useState<EntitlementStatus>('loading');
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('granted');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isAccessDenied(error)) {
          setStatus('denied');
        } else {
          setStatus('error');
          console.error('Entitlement check failed:', error);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { status, data };
}
