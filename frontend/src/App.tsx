import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { StiggProvider } from '@stigg/react-sdk';
import { SignIn, SignUp, useAuth } from '@clerk/react';
import Sidebar from './components/Sidebar';
import Analytics from './components/Analytics';
import Sequences from './components/Sequences';
import Chatbot from './components/Chatbot';
import CreditsUsage from './components/CreditsUsage';
import Governance from './components/Governance';
import CustomerPortal from './components/CustomerPortal';
import ManageEnvironments from './components/ManageEnvironments';
import { PaywallPage, PRICING_URL_BY_PRODUCT_ID } from './components/PaywallPage';
import { WORKWISE_AI_PRODUCT_ID, WORKWISE_PLANNER_PRODUCT_ID } from './stigg/constants';
import { UserProvider, useSyncedUser } from './UserContext';
import { ThemeProvider } from './ThemeContext';
import { PageLoading } from './extras/PageLoading';

function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <PageLoading />;
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

function AppShell() {
  const { isLoading } = useSyncedUser();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

// Resolves which Stigg customer the app should act as (the active environment's active
// customer) and wraps everything below in a StiggProvider for that context.
function StiggGate() {
  const { user: syncedUser } = useSyncedUser();

  const activeEnv = syncedUser?.environments.find((env) => env.isActive);
  const customerId = activeEnv?.activeCustomerId ?? syncedUser?.clerkId;

  if (!activeEnv || !customerId) {
    return <div className="app-loading">No active Stigg customer for this environment.</div>;
  }

  const apiKey = activeEnv.clientApiKey ?? import.meta.env.VITE_DEFAULT_STIGG_CLIENT_API_KEY;

  return (
    <StiggProvider key={`${activeEnv.name}:${customerId}`} apiKey={apiKey} customerId={customerId}>
      <Outlet />
    </StiggProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
            <Route element={<AppShell />}>
              <Route path="/manage-environments" element={<ManageEnvironments />} />
              <Route element={<StiggGate />}>
                <Route path="/" element={<Analytics />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/sequences" element={<Sequences />} />
                <Route path="/customer-portal" element={<CustomerPortal />} />
                <Route path="/credits" element={<CreditsUsage />} />
                <Route path="/governance" element={<Governance />} />
                <Route
                  path={PRICING_URL_BY_PRODUCT_ID[WORKWISE_AI_PRODUCT_ID]}
                  element={
                    <PaywallPage
                      productId={WORKWISE_AI_PRODUCT_ID}
                      title="Pricing"
                      subtitle="Choose a plan that unlocks more of WorkWise AI."
                    />
                  }
                />
                <Route
                  path={PRICING_URL_BY_PRODUCT_ID[WORKWISE_PLANNER_PRODUCT_ID]}
                  element={
                    <PaywallPage
                      productId={WORKWISE_PLANNER_PRODUCT_ID}
                      title="Pricing"
                      subtitle="Choose a plan that unlocks more of WorkWise Planner."
                    />
                  }
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
