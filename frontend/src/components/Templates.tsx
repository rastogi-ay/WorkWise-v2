import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { toast } from 'react-toastify';
import '../styles/App.css';
import '../styles/Template.css';
import { createTemplate, fetchTemplates } from '../api/templatesApi';

function Templates() {
  const { getToken } = useAuth();
  const [title, setTitle] = useState('');
  const [currentUsage, setCurrentUsage] = useState(0);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function loadUsage() {
      try {
        const { currentUsage, usageLimit } = await fetchTemplates(getToken);
        setCurrentUsage(currentUsage);
        setUsageLimit(usageLimit);
      } catch {
        toast.error('Failed to load templates', {
          toastId: 'templates-error',
        });
      }
    }
    loadUsage();
  }, [getToken]);

  const handleAdd = async () => {
    if (title.trim()) {
      try {
        const result = await createTemplate(getToken);
        setCurrentUsage(result.currentUsage);
        setTitle('');
        toast.success(result.message, {
          toastId: 'templates-create-success',
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Request failed';
        toast.error(message, {
          toastId: 'templates-create-error',
        });
      }
    }
  };

  return (
    <div className="app">
      <h1>Templates</h1>

      <div className="templates-usage">
        {usageLimit !== undefined && (
          <>
            <span className="templates-usage__text">
              <strong>{currentUsage}</strong> of <strong>{usageLimit}</strong>{' '}
              templates used (entitlement limit)
            </span>
            <div className="templates-usage__bar">
              <div
                className={`templates-usage__fill ${
                  currentUsage >= usageLimit
                    ? 'templates-usage__fill--at-limit'
                    : ''
                }`}
                style={{
                  width: `${Math.min(100, (currentUsage / usageLimit) * 100)}%`,
                }}
              />
            </div>
          </>
        )}
      </div>

      <div className="input-section">
        <input
          type="text"
          placeholder="Template title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
        />
        <button onClick={handleAdd} className="add-button">
          Add Template (& report usage to Stigg)
        </button>
      </div>
    </div>
  );
}

export default Templates;
