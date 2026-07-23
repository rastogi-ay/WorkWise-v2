import { useEffect, useState } from 'react';

export type EntitlementStatus = 'loading' | 'granted' | 'denied' | 'error';

interface EntitlementResult<T> {
  status: EntitlementStatus;
  data: T | null;
}

// Fetches an entitlement-gated endpoint and reduces the result down to a
// single status: loading, granted, denied (access: false, not a failure),
// or error (the request itself failed).
export function useEntitlement<T extends { access: boolean }>(
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
        setStatus(result.access ? 'granted' : 'denied');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus('error');
        console.error('Entitlement check failed:', error);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { status, data };
}
