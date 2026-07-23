import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '@clerk/react';
import { useSyncedUser } from '../UserContext';
import { addEnvironment, removeEnvironment, setActiveEnvironment } from '../api/environmentsApi';
import '../styles/EnvironmentSwitcher.css';

export default function EnvironmentSwitcher() {
  const { getToken } = useAuth();
  const { user, refetch } = useSyncedUser();
  const [isManaging, setIsManaging] = useState(false);
  const [name, setName] = useState('');
  const [clientApiKey, setClientApiKey] = useState('');
  const [serverApiKey, setServerApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const environments = user?.environments ?? [];

  async function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setError(null);
    try {
      await setActiveEnvironment(getToken, value === '' ? null : value);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch environment');
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addEnvironment(getToken, name, clientApiKey, serverApiKey);
      setName('');
      setClientApiKey('');
      setServerApiKey('');
      refetch();
    } catch (err) {
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

  return (
    <div className="env-switcher">
      <select
        className="env-switcher__select"
        value={user?.activeEnvironment ?? ''}
        onChange={handleSelect}
      >
        <option value="">Default</option>
        {environments.map((env) => (
          <option key={env.name} value={env.name}>
            {env.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="env-switcher__manage-toggle"
        onClick={() => setIsManaging((value) => !value)}
      >
        {isManaging ? 'Close' : 'Manage'}
      </button>

      {isManaging && (
        <div className="env-switcher__panel">
          {environments.map((env) => (
            <div key={env.name} className="env-switcher__row">
              <span>{env.name}</span>
              <button type="button" onClick={() => handleRemove(env.name)}>
                Remove
              </button>
            </div>
          ))}

          <form className="env-switcher__form" onSubmit={handleAdd}>
            <input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <input
              placeholder="Client API key"
              value={clientApiKey}
              onChange={(event) => setClientApiKey(event.target.value)}
              required
            />
            <input
              placeholder="Server API key"
              type="password"
              value={serverApiKey}
              onChange={(event) => setServerApiKey(event.target.value)}
              required
            />
            <button type="submit">Add environment</button>
          </form>

          {error && <p className="env-switcher__error">{error}</p>}
        </div>
      )}
    </div>
  );
}
