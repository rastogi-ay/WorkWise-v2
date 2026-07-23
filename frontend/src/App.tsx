import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { StiggProvider } from '@stigg/react-sdk';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import Analytics from './components/Analytics';
import Campaigns from './components/Campaigns';
import Sequences from './components/Sequences';
import { UserProvider, useSyncedUser } from './UserContext';
import { ThemeProvider, useTheme } from './ThemeContext';

function ThemedToastContainer() {
  const { theme } = useTheme();
  return <ToastContainer position="top-right" theme={theme} />;
}

function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="app-loading">Loading…</div>;
  }
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <UserProvider>
      <Outlet />
    </UserProvider>
  );
}

function StiggAndOutlet() {
  const { user: syncedUser, isLoading } = useSyncedUser();

  if (isLoading) {
    return <div className="app-loading">Loading…</div>;
  }

  // clerkId of user will always match customerId in Stigg (for simplicity)
  const customerId = syncedUser?.clerkId;
  if (!customerId) {
    return (
      // TODO: maybe add a default npc@stigg.io customer?
      <div className="app-loading">
        No corresponding customer ID in Stigg was found.
      </div>
    );
  }

  const activeEnv = syncedUser?.environments.find((env) => env.isActive);
  const apiKey =
    activeEnv?.clientApiKey ??
    import.meta.env.VITE_DEFAULT_STIGG_CLIENT_API_KEY;

  return (
    <StiggProvider
      key={activeEnv?.name ?? 'Default'}
      apiKey={apiKey}
      customerId={customerId}
    >
      <div className="app-shell">
        <Sidebar />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </StiggProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* TODO: potentially get rid of ToastContainer */}
        <ThemedToastContainer />
        <Routes>
          <Route
            path="/sign-in/*"
            element={
              <div className="clerk-auth-shell">
                <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
              </div>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <div className="clerk-auth-shell">
                <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
              </div>
            }
          />
          <Route element={<ProtectedLayout />}>
            <Route element={<StiggAndOutlet />}>
              <Route path="/" element={<Analytics />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/sequences" element={<Sequences />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
