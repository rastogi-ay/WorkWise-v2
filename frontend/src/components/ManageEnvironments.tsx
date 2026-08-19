import { useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/react';
import { useSyncedUser } from '../UserContext';
import { addEnvironment, removeEnvironment, setActiveEnvironment } from '../api/environmentsApi';
import {
  addCustomer,
  updateCustomer,
  archiveCustomer,
  setActiveCustomer,
} from '../api/customersApi';
import { LayersIcon, UserIcon } from '../extras/icons';
import '../styles/App.css';
import '../styles/AccessDeniedModal.css';
import '../styles/ManageEnvironments.css';

interface PendingEnvironment {
  name: string;
  clientApiKey: string;
  serverApiKey: string;
}

interface EditingCustomer {
  environmentName: string;
  customerId: string;
  name: string;
  email: string;
}

interface ArchivePendingCustomer {
  environmentName: string;
  customerId: string;
}

export default function ManageEnvironments() {
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
  const [pendingName, setPendingName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isCreatingEnvironment, setIsCreatingEnvironment] = useState(false);

  const [customerIdByEnv, setCustomerIdByEnv] = useState<Record<string, string>>({});
  const [customerProfileByEnv, setCustomerProfileByEnv] = useState<
    Record<string, { name: string; email: string }>
  >({});
  const [customerErrorByEnv, setCustomerErrorByEnv] = useState<Record<string, string | null>>({});

  const [editingCustomer, setEditingCustomer] = useState<EditingCustomer | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [archivePending, setArchivePending] = useState<ArchivePendingCustomer | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  function updateCustomerProfileField(
    environmentName: string,
    field: 'name' | 'email',
    value: string,
  ) {
    setCustomerProfileByEnv((prev) => {
      const existing = prev[environmentName] ?? { name: '', email: '' };
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
        {
          customerId: pendingCustomerId,
          name: pendingName.trim() || undefined,
          email: pendingEmail.trim() || undefined,
        },
      );
      setSelectedEnvironmentOverride(pendingEnvironment.name);
      setName('');
      setClientApiKey('');
      setServerApiKey('');
      setPendingEnvironment(null);
      setPendingCustomerId('');
      setPendingName('');
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
    setPendingName('');
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
      await addCustomer(getToken, environmentName, {
        customerId,
        name: profile?.name.trim() || undefined,
        email: profile?.email.trim() || undefined,
      });
      setCustomerIdByEnv((prev) => ({ ...prev, [environmentName]: '' }));
      setCustomerProfileByEnv((prev) => ({
        ...prev,
        [environmentName]: { name: '', email: '' },
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

  function startEditCustomer(
    environmentName: string,
    customer: { customerId: string; name: string | null; email: string | null },
  ) {
    setCustomerErrorByEnv((prev) => ({ ...prev, [environmentName]: null }));
    setEditingCustomer({
      environmentName,
      customerId: customer.customerId,
      name: customer.name ?? '',
      email: customer.email ?? '',
    });
  }

  function cancelEditCustomer() {
    setEditingCustomer(null);
  }

  function updateEditingCustomerField(field: 'name' | 'email', value: string) {
    setEditingCustomer((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSaveEditCustomer(event: FormEvent) {
    event.preventDefault();
    if (!editingCustomer) return;
    const { environmentName, customerId, name, email } = editingCustomer;
    setIsSavingEdit(true);
    setCustomerErrorByEnv((prev) => ({ ...prev, [environmentName]: null }));
    try {
      await updateCustomer(getToken, environmentName, {
        customerId,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      setEditingCustomer(null);
      refetch();
    } catch (err) {
      setCustomerErrorByEnv((prev) => ({
        ...prev,
        [environmentName]: err instanceof Error ? err.message : 'Failed to update customer',
      }));
    } finally {
      setIsSavingEdit(false);
    }
  }

  function requestArchiveCustomer(environmentName: string, customerId: string) {
    setCustomerErrorByEnv((prev) => ({ ...prev, [environmentName]: null }));
    setArchivePending({ environmentName, customerId });
  }

  function cancelArchiveCustomer() {
    setArchivePending(null);
  }

  async function confirmArchiveCustomer() {
    if (!archivePending) return;
    const { environmentName, customerId } = archivePending;
    setIsArchiving(true);
    try {
      await archiveCustomer(getToken, environmentName, customerId);
      setArchivePending(null);
      refetch();
    } catch (err) {
      setCustomerErrorByEnv((prev) => ({
        ...prev,
        [environmentName]: err instanceof Error ? err.message : 'Failed to archive customer',
      }));
      setArchivePending(null);
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="app">
      <div className="page-header">
        <span className="page-header__icon">
          <LayersIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">Manage Environments</h1>
          <p className="page-header__subtitle">
            Manage the Stigg environments and customers available to your account.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content manage-environments">
          <div className="manage-environments__layout">
            <div className="manage-environments__sidebar">
              <div className="manage-environments__env-list">
                {environments.map((env) => (
                  <button
                    key={env.name}
                    type="button"
                    className={
                      env.name === selectedEnvironmentName
                        ? 'manage-environments__env-item manage-environments__env-item--selected'
                        : 'manage-environments__env-item'
                    }
                    onClick={() => setSelectedEnvironmentOverride(env.name)}
                  >
                    <span>{env.name}</span>
                    {env.isActive && (
                      <span className="manage-environments__env-item-dot" aria-label="Active" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="manage-environments__add-env-trigger"
                onClick={openAddEnvironment}
              >
                + Add environment
              </button>
              {error && !pendingEnvironment && !isAddingEnvironment && (
                <p className="manage-environments__error">{error}</p>
              )}
            </div>

            <div className="manage-environments__detail">
              {selectedEnv ? (
                <>
                  <div className="manage-environments__detail-header">
                    <h2>{selectedEnv.name}</h2>
                    <div className="manage-environments__detail-actions">
                      {selectedEnv.isActive ? (
                        <span className="manage-environments__active-badge">Active</span>
                      ) : (
                        <button type="button" onClick={() => handleSelect(selectedEnv.name)}>
                          Set as Active
                        </button>
                      )}
                      {selectedEnv.name !== 'Default' && !selectedEnv.isActive && (
                        <button
                          type="button"
                          className="manage-environments__remove"
                          onClick={() => setEnvPendingRemoval(selectedEnv.name)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="manage-environments__customers">
                    <p className="manage-environments__customers-label">
                      Customers{selectedEnv.customers.length > 0 && ` (${selectedEnv.customers.length})`}
                    </p>
                    {selectedEnv.customers.length === 0 && (
                      <p className="manage-environments__empty">No customers yet.</p>
                    )}
                    {selectedEnv.customers.map((customer) =>
                      editingCustomer?.environmentName === selectedEnv.name &&
                      editingCustomer.customerId === customer.customerId ? (
                        <form
                          key={customer.customerId}
                          className="manage-environments__customer-row manage-environments__customer-row--editing"
                          onSubmit={handleSaveEditCustomer}
                        >
                          <input
                            placeholder="Name (optional)"
                            value={editingCustomer.name}
                            onChange={(event) =>
                              updateEditingCustomerField('name', event.target.value)
                            }
                            autoFocus
                          />
                          <input
                            placeholder="Email (optional)"
                            value={editingCustomer.email}
                            onChange={(event) =>
                              updateEditingCustomerField('email', event.target.value)
                            }
                          />
                          <button type="submit" disabled={isSavingEdit}>
                            {isSavingEdit ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" onClick={cancelEditCustomer}>
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div key={customer.customerId} className="manage-environments__customer-row">
                          <div className="manage-environments__customer-info">
                            <span className="manage-environments__customer-avatar">
                              <UserIcon size={15} />
                            </span>
                            <div className="manage-environments__customer-text">
                              {customer.name && (
                                <span className="manage-environments__customer-name">
                                  {customer.name}
                                </span>
                              )}
                              <span className="manage-environments__customer-id">
                                {customer.customerId}
                              </span>
                            </div>
                          </div>
                          <div className="manage-environments__customer-actions">
                            {customer.isActive ? (
                              <span className="manage-environments__active-badge">Active</span>
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
                            <button
                              type="button"
                              onClick={() => startEditCustomer(selectedEnv.name, customer)}
                            >
                              Edit
                            </button>
                            {archivePending?.environmentName === selectedEnv.name &&
                            archivePending.customerId === customer.customerId ? (
                              <>
                                <button
                                  type="button"
                                  className="manage-environments__remove"
                                  onClick={confirmArchiveCustomer}
                                  disabled={isArchiving}
                                >
                                  {isArchiving ? 'Archiving…' : 'Confirm archive?'}
                                </button>
                                <button type="button" onClick={cancelArchiveCustomer}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="manage-environments__remove"
                                disabled={customer.isActive}
                                title={
                                  customer.isActive
                                    ? 'Set another customer as active before archiving this one'
                                    : undefined
                                }
                                onClick={() =>
                                  requestArchiveCustomer(selectedEnv.name, customer.customerId)
                                }
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </div>
                      ),
                    )}

                    <form
                      className="manage-environments__customer-form"
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
                        placeholder="Name (optional)"
                        value={customerProfileByEnv[selectedEnv.name]?.name ?? ''}
                        onChange={(event) =>
                          updateCustomerProfileField(selectedEnv.name, 'name', event.target.value)
                        }
                      />
                      <input
                        placeholder="Email (optional)"
                        value={customerProfileByEnv[selectedEnv.name]?.email ?? ''}
                        onChange={(event) =>
                          updateCustomerProfileField(selectedEnv.name, 'email', event.target.value)
                        }
                      />
                      <button type="submit">Add customer</button>
                    </form>

                    {customerErrorByEnv[selectedEnv.name] && (
                      <p className="manage-environments__error">
                        {customerErrorByEnv[selectedEnv.name]}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="manage-environments__empty">No environments yet.</p>
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
              <form className="manage-environments__form" onSubmit={handleStartAdd}>
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
            <div className="paywall-modal manage-environments__modal--wide">
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
              <form className="manage-environments__form" onSubmit={handleCreateEnvironment}>
                <input
                  className="manage-environments__confirm-input"
                  value={pendingCustomerId}
                  onChange={(event) => setPendingCustomerId(event.target.value)}
                  placeholder="Customer ID"
                  autoFocus
                />
                <input
                  className="manage-environments__confirm-input"
                  value={pendingName}
                  onChange={(event) => setPendingName(event.target.value)}
                  placeholder="Name (optional)"
                />
                <input
                  className="manage-environments__confirm-input"
                  value={pendingEmail}
                  onChange={(event) => setPendingEmail(event.target.value)}
                  placeholder="Email (optional)"
                />
                {error && <p className="manage-environments__error">{error}</p>}
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
                className="manage-environments__confirm-input"
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
