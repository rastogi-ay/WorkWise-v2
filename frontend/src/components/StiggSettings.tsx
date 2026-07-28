import { useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/react';
import { useSyncedUser } from '../UserContext';
import { addEnvironment, removeEnvironment, setActiveEnvironment } from '../api/environmentsApi';
import { addCustomer, setActiveCustomer } from '../api/customersApi';
import { LayersIcon } from '../extras/icons';
import '../styles/App.css';
import '../styles/AccessDeniedModal.css';
import '../styles/StiggSettings.css';

interface PendingEnvironment {
  name: string;
  clientApiKey: string;
  serverApiKey: string;
}

export default function StiggSettings() {
  const { getToken } = useAuth();
  const { user, refetch } = useSyncedUser();

  const environments = user?.environments ?? [];

  // Which environment's detail pane is shown. Falls back to the active environment, then the
  // first one in the list, so there's always a sensible selection without an extra effect.
  const [selectedEnvironmentOverride, setSelectedEnvironmentOverride] = useState<string | null>(
    null,
  );
  const overrideStillExists =
    selectedEnvironmentOverride != null &&
    environments.some((env) => env.name === selectedEnvironmentOverride);
  const selectedEnvironmentName =
    (overrideStillExists ? selectedEnvironmentOverride : null) ??
    environments.find((env) => env.isActive)?.name ??
    environments[0]?.name ??
    null;
  const selectedEnv = environments.find((env) => env.name === selectedEnvironmentName) ?? null;

  const [error, setError] = useState<string | null>(null);
  const [envPendingRemoval, setEnvPendingRemoval] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);
  const [name, setName] = useState('');
  const [clientApiKey, setClientApiKey] = useState('');
  const [serverApiKey, setServerApiKey] = useState('');

  const [pendingEnvironment, setPendingEnvironment] = useState<PendingEnvironment | null>(null);
  const [pendingCustomerId, setPendingCustomerId] = useState('');
  const [pendingFirstName, setPendingFirstName] = useState('');
  const [pendingLastName, setPendingLastName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isCreatingEnvironment, setIsCreatingEnvironment] = useState(false);

  const [customerIdByEnv, setCustomerIdByEnv] = useState<Record<string, string>>({});
  const [customerProfileByEnv, setCustomerProfileByEnv] = useState<
    Record<string, { firstName: string; lastName: string; email: string }>
  >({});
  const [customerErrorByEnv, setCustomerErrorByEnv] = useState<Record<string, string | null>>({});

  function updateCustomerProfileField(
    environmentName: string,
    field: 'firstName' | 'lastName' | 'email',
    value: string,
  ) {
    setCustomerProfileByEnv((prev) => {
      const existing = prev[environmentName] ?? { firstName: '', lastName: '', email: '' };
      return { ...prev, [environmentName]: { ...existing, [field]: value } };
    });
  }

  function openAddEnvironment() {
    setError(null);
    setName('');
    setClientApiKey('');
    setServerApiKey('');
    setIsAddingEnvironment(true);
  }

  function cancelAddEnvironment() {
    setIsAddingEnvironment(false);
    setError(null);
  }

  // Screen 1: hold the environment's fields locally — no API call yet.
  function handleStartAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsAddingEnvironment(false);
    setPendingEnvironment({ name, clientApiKey, serverApiKey });
    setPendingCustomerId('');
  }

  // Screen 2: the environment and its first customer are created together, in one request.
  async function handleCreateEnvironment(event: FormEvent) {
    event.preventDefault();
    if (!pendingEnvironment) return;
    setError(null);
    setIsCreatingEnvironment(true);
    try {
      await addEnvironment(
        getToken,
        pendingEnvironment.name,
        pendingEnvironment.clientApiKey,
        pendingEnvironment.serverApiKey,
        pendingCustomerId,
        {
          firstName: pendingFirstName.trim() || undefined,
          lastName: pendingLastName.trim() || undefined,
          email: pendingEmail.trim() || undefined,
        },
      );
      setSelectedEnvironmentOverride(pendingEnvironment.name);
      setName('');
      setClientApiKey('');
      setServerApiKey('');
      setPendingEnvironment(null);
      setPendingCustomerId('');
      setPendingFirstName('');
      setPendingLastName('');
      setPendingEmail('');
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add environment');
    } finally {
      setIsCreatingEnvironment(false);
    }
  }

  function cancelNewEnvironment() {
    setPendingEnvironment(null);
    setPendingCustomerId('');
    setPendingFirstName('');
    setPendingLastName('');
    setPendingEmail('');
    setError(null);
  }

  async function handleRemove(envName: string) {
    setError(null);
    try {
      await removeEnvironment(getToken, envName);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove environment');
    }
  }

  async function confirmRemoval() {
    if (!envPendingRemoval) return;
    await handleRemove(envPendingRemoval);
    setEnvPendingRemoval(null);
    setConfirmText('');
  }

  function cancelRemoval() {
    setEnvPendingRemoval(null);
    setConfirmText('');
  }

  async function handleSelect(envName: string | null) {
    setError(null);
    try {
      await setActiveEnvironment(getToken, envName);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch environment');
    }
  }

  async function handleAddCustomer(event: FormEvent, environmentName: string) {
    event.preventDefault();
    setCustomerErrorByEnv((prev) => ({ ...prev, [environmentName]: null }));
    const customerId = customerIdByEnv[environmentName] ?? '';
    const profile = customerProfileByEnv[environmentName];
    try {
      await addCustomer(getToken, environmentName, customerId, {
        firstName: profile?.firstName.trim() || undefined,
        lastName: profile?.lastName.trim() || undefined,
        email: profile?.email.trim() || undefined,
      });
      setCustomerIdByEnv((prev) => ({ ...prev, [environmentName]: '' }));
      setCustomerProfileByEnv((prev) => ({
        ...prev,
        [environmentName]: { firstName: '', lastName: '', email: '' },
      }));
      refetch();
    } catch (err) {
      setCustomerErrorByEnv((prev) => ({
        ...prev,
        [environmentName]: err instanceof Error ? err.message : 'Failed to add customer',
      }));
    }
  }

  async function handleSelectCustomer(environmentName: string, customerId: string) {
    setCustomerErrorByEnv((prev) => ({ ...prev, [environmentName]: null }));
    try {
      await setActiveCustomer(getToken, environmentName, customerId);
      refetch();
    } catch (err) {
      setCustomerErrorByEnv((prev) => ({
        ...prev,
        [environmentName]: err instanceof Error ? err.message : 'Failed to switch customer',
      }));
    }
  }

  return (
    <div className="app">
      <div className="page-header">
        <span className="page-header__icon">
          <LayersIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">Stigg Settings</h1>
          <p className="page-header__subtitle">
            Manage the Stigg environments and customers available to your account.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content stigg-settings">
          <div className="stigg-settings__layout">
            <div className="stigg-settings__sidebar">
              <div className="stigg-settings__env-list">
                {environments.map((env) => (
                  <button
                    key={env.name}
                    type="button"
                    className={
                      env.name === selectedEnvironmentName
                        ? 'stigg-settings__env-item stigg-settings__env-item--selected'
                        : 'stigg-settings__env-item'
                    }
                    onClick={() => setSelectedEnvironmentOverride(env.name)}
                  >
                    <span>{env.name}</span>
                    {env.isActive && (
                      <span className="stigg-settings__env-item-dot" aria-label="Active" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="stigg-settings__add-env-trigger"
                onClick={openAddEnvironment}
              >
                + Add environment
              </button>
              {error && !pendingEnvironment && !isAddingEnvironment && (
                <p className="stigg-settings__error">{error}</p>
              )}
            </div>

            <div className="stigg-settings__detail">
              {selectedEnv ? (
                <>
                  <div className="stigg-settings__detail-header">
                    <h2>{selectedEnv.name}</h2>
                    <div className="stigg-settings__detail-actions">
                      {selectedEnv.isActive ? (
                        <span className="stigg-settings__active-badge">Active</span>
                      ) : (
                        <button type="button" onClick={() => handleSelect(selectedEnv.name)}>
                          Set as Active
                        </button>
                      )}
                      {selectedEnv.name !== 'Default' && !selectedEnv.isActive && (
                        <button
                          type="button"
                          className="stigg-settings__remove"
                          onClick={() => setEnvPendingRemoval(selectedEnv.name)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="stigg-settings__customers">
                    <p className="stigg-settings__customers-label">Customers</p>
                    {selectedEnv.customers.map((customer) => (
                      <div key={customer.customerId} className="stigg-settings__customer-row">
                        <span>
                          {customer.customerId}
                          {!customer.stiggOnboarded && ' (provisioning…)'}
                        </span>
                        {customer.isActive ? (
                          <span className="stigg-settings__active-badge">Active</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectCustomer(selectedEnv.name, customer.customerId)
                            }
                          >
                            Select
                          </button>
                        )}
                      </div>
                    ))}

                    {selectedEnv.name !== 'Default' && (
                      <form
                        className="stigg-settings__customer-form"
                        onSubmit={(event) => handleAddCustomer(event, selectedEnv.name)}
                      >
                        <input
                          placeholder="Customer ID"
                          value={customerIdByEnv[selectedEnv.name] ?? ''}
                          onChange={(event) =>
                            setCustomerIdByEnv((prev) => ({
                              ...prev,
                              [selectedEnv.name]: event.target.value,
                            }))
                          }
                        />
                        <input
                          placeholder="First name (optional)"
                          value={customerProfileByEnv[selectedEnv.name]?.firstName ?? ''}
                          onChange={(event) =>
                            updateCustomerProfileField(
                              selectedEnv.name,
                              'firstName',
                              event.target.value,
                            )
                          }
                        />
                        <input
                          placeholder="Last name (optional)"
                          value={customerProfileByEnv[selectedEnv.name]?.lastName ?? ''}
                          onChange={(event) =>
                            updateCustomerProfileField(
                              selectedEnv.name,
                              'lastName',
                              event.target.value,
                            )
                          }
                        />
                        <input
                          placeholder="Email (optional)"
                          value={customerProfileByEnv[selectedEnv.name]?.email ?? ''}
                          onChange={(event) =>
                            updateCustomerProfileField(
                              selectedEnv.name,
                              'email',
                              event.target.value,
                            )
                          }
                        />
                        <button type="submit">Add customer</button>
                      </form>
                    )}

                    {customerErrorByEnv[selectedEnv.name] && (
                      <p className="stigg-settings__error">
                        {customerErrorByEnv[selectedEnv.name]}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="stigg-settings__empty">No environments yet.</p>
              )}
            </div>
          </div>
        </div>

        {isAddingEnvironment && (
          <div className="paywall-backdrop">
            <div className="paywall-modal">
              <button
                type="button"
                className="paywall-modal__close"
                onClick={cancelAddEnvironment}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="paywall-modal__title">Add environment</h2>
              <form className="stigg-settings__form" onSubmit={handleStartAdd}>
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
                <input
                  placeholder="Client API key"
                  type="password"
                  value={clientApiKey}
                  onChange={(event) => setClientApiKey(event.target.value)}
                />
                <input
                  placeholder="Server API key"
                  type="password"
                  value={serverApiKey}
                  onChange={(event) => setServerApiKey(event.target.value)}
                />
                <button type="submit">Next</button>
              </form>
            </div>
          </div>
        )}

        {pendingEnvironment && (
          <div className="paywall-backdrop">
            <div className="paywall-modal stigg-settings__modal--wide">
              <button
                type="button"
                className="paywall-modal__close"
                onClick={cancelNewEnvironment}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="paywall-modal__title">Create a customer</h2>
              <p className="paywall-modal__message">
                Every environment needs at least one Stigg customer. Add one for{' '}
                <strong>{pendingEnvironment.name}</strong> to finish creating it.
              </p>
              <form className="stigg-settings__form" onSubmit={handleCreateEnvironment}>
                <input
                  className="stigg-settings__confirm-input"
                  value={pendingCustomerId}
                  onChange={(event) => setPendingCustomerId(event.target.value)}
                  placeholder="Customer ID"
                  autoFocus
                />
                <input
                  className="stigg-settings__confirm-input"
                  value={pendingFirstName}
                  onChange={(event) => setPendingFirstName(event.target.value)}
                  placeholder="First name (optional)"
                />
                <input
                  className="stigg-settings__confirm-input"
                  value={pendingLastName}
                  onChange={(event) => setPendingLastName(event.target.value)}
                  placeholder="Last name (optional)"
                />
                <input
                  className="stigg-settings__confirm-input"
                  value={pendingEmail}
                  onChange={(event) => setPendingEmail(event.target.value)}
                  placeholder="Email (optional)"
                />
                {error && <p className="stigg-settings__error">{error}</p>}
                <button
                  type="submit"
                  className="paywall-modal__cta"
                  disabled={!pendingCustomerId.trim() || isCreatingEnvironment}
                >
                  {isCreatingEnvironment ? 'Creating…' : 'Create environment'}
                </button>
              </form>
            </div>
          </div>
        )}

        {envPendingRemoval && (
          <div className="paywall-backdrop">
            <div className="paywall-modal">
              <button
                type="button"
                className="paywall-modal__close"
                onClick={cancelRemoval}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="paywall-modal__title">Remove environment?</h2>
              <p className="paywall-modal__message">
                Are you sure you want to remove <strong>{envPendingRemoval}</strong>? Type the
                environment name to confirm.
              </p>
              <input
                className="stigg-settings__confirm-input"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder={envPendingRemoval}
                autoFocus
              />
              <button
                type="button"
                className="paywall-modal__cta paywall-modal__cta--danger"
                disabled={confirmText !== envPendingRemoval}
                onClick={confirmRemoval}
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
