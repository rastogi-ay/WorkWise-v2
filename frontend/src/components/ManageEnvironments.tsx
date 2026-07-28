import { useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/react';
import { useSyncedUser } from '../UserContext';
import { addEnvironment, removeEnvironment, setActiveEnvironment } from '../api/environmentsApi';
import { LayersIcon } from '../extras/icons';
import '../styles/App.css';
import '../styles/AccessDeniedModal.css';
import '../styles/ManageEnvironments.css';

export default function ManageEnvironments() {
  const { getToken } = useAuth();
  const { user, refetch } = useSyncedUser();
  const [name, setName] = useState('');
  const [clientApiKey, setClientApiKey] = useState('');
  const [serverApiKey, setServerApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [envPendingRemoval, setEnvPendingRemoval] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const environments = user?.environments ?? [];

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addEnvironment(getToken, name, clientApiKey, serverApiKey);
      setName('');
      setClientApiKey('');
      setServerApiKey('');
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add environment');
    }
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

  return (
    <div className="app">
      <div className="page-header">
        <span className="page-header__icon">
          <LayersIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">Manage Environments</h1>
          <p className="page-header__subtitle">
            Add or remove the Stigg environments available to your account.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content manage-environments">
          <div className="manage-environments__list">
            {environments.map((env) => (
              <div key={env.name} className="manage-environments__row">
                <span>{env.name}</span>
                <div className="manage-environments__row-actions">
                  {env.isActive ? (
                    <span className="manage-environments__active-badge">Active</span>
                  ) : (
                    <button type="button" onClick={() => handleSelect(env.name)}>
                      Select
                    </button>
                  )}
                  {env.name !== 'Default' && !env.isActive && (
                    <button
                      type="button"
                      className="manage-environments__remove"
                      onClick={() => setEnvPendingRemoval(env.name)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form className="manage-environments__form" onSubmit={handleAdd}>
            <h2 className="section-title">Add environment</h2>
            <input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
            <button type="submit">Add environment</button>
          </form>

          {error && <p className="manage-environments__error">{error}</p>}
        </div>

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
