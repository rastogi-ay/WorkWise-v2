import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@clerk/react';
import { syncUser, type SyncedUser } from './api/usersApi';

export interface UserContextValue {
  user: SyncedUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
  error: null,
  refetch: () => {},
});

// state of the user, includes personal info + environments
export function UserProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [state, setState] = useState<Omit<UserContextValue, 'refetch'>>({
    user: null,
    isLoading: true,
    error: null,
  });

  const fetchUser = useCallback(() => {
    let cancelled = false;

    setState((prev) => ({ ...prev, isLoading: true }));

    syncUser(getToken)
      .then((user) => {
        if (!cancelled) setState({ user, isLoading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ user: null, isLoading: false, error: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  useEffect(() => fetchUser(), [fetchUser]);

  return (
    <UserContext.Provider value={{ ...state, refetch: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useSyncedUser() {
  return useContext(UserContext);
}
