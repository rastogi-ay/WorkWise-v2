import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'react-router-dom';
import {
  createGovernanceNode,
  deleteGovernanceNode,
  fetchGovernanceTree,
  reportGovernanceUsage,
  updateGovernanceNodeLimit,
  type GovernanceEntityType,
  type GovernanceNode,
} from '../api/ai-spend/governanceApi';
import { useActingAs } from '../stigg/governanceUser';
import { SitemapIcon, AlertIcon, ChatIcon } from '../extras/icons';
import { PageLoading } from '../extras/PageLoading';
import '../styles/App.css';
import '../styles/ManageEnvironments.css';
import '../styles/Governance.css';

// Matches the `user` entity type in backend/src/stigg/constants.js — the deepest level, and the one
// AI usage is attributed to.
const USER_ENTITY_TYPE_ID = 'user';

interface AddNodeTarget {
  parent: GovernanceNode | null;
  entityTypeId: string;
}

function formatResetDate(usagePeriodEnd: string | null) {
  if (!usagePeriodEnd) return '—';
  return new Date(usagePeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function typeLabel(entityTypes: GovernanceEntityType[], entityTypeId: string) {
  return entityTypes.find((type) => type.id === entityTypeId)?.displayName ?? entityTypeId;
}

// Deleting a node archives its whole subtree, so the confirmation needs to say how much goes with
// it. Walks parentId rather than reading depth, which only describes indentation.
function countDescendants(nodes: GovernanceNode[], entityId: string): number {
  const directChildren = nodes.filter((node) => node.parentId === entityId);
  return directChildren.reduce(
    (total, child) => total + 1 + countDescendants(nodes, child.entityId),
    0,
  );
}

export default function Governance() {
  const { getToken } = useAuth();
  const { actingAsEntityId, setActingAsEntityId, linkTo } = useActingAs();

  const [nodes, setNodes] = useState<GovernanceNode[]>([]);
  const [entityTypes, setEntityTypes] = useState<GovernanceEntityType[]>([]);
  const [currencyLabel, setCurrencyLabel] = useState('units');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row transient state, keyed by entityId so rows never share a message or an input.
  const [rowMessage, setRowMessage] = useState<Record<string, { text: string; isError: boolean }>>(
    {},
  );
  const [amountByEntity, setAmountByEntity] = useState<Record<string, string>>({});
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);

  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [limitDraft, setLimitDraft] = useState('');

  const [addTarget, setAddTarget] = useState<AddNodeTarget | null>(null);
  const [newEntityId, setNewEntityId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [pendingDeletion, setPendingDeletion] = useState<GovernanceNode | null>(null);

  const rootTypeId = entityTypes[0]?.id ?? 'department';
  const userNodes = nodes.filter((node) => node.entityTypeId === USER_ENTITY_TYPE_ID);

  const load = useCallback(async () => {
    try {
      const data = await fetchGovernanceTree(getToken);
      setNodes(data.nodes);
      setEntityTypes(data.entityTypes);
      setCurrencyLabel(data.currencyLabel);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load governance tree');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  // A selected user can be deleted, or belong to a customer we've since switched away from. Clearing
  // it here stops the chatbot attributing usage to an entity that no longer exists.
  useEffect(() => {
    if (isLoading || !actingAsEntityId) return;
    if (!nodes.some((node) => node.entityId === actingAsEntityId)) {
      setActingAsEntityId(null);
    }
  }, [isLoading, nodes, actingAsEntityId, setActingAsEntityId]);

  function setMessage(entityId: string, text: string, isError: boolean) {
    setRowMessage((prev) => ({ ...prev, [entityId]: { text, isError } }));
  }

  function clearMessage(entityId: string) {
    setRowMessage((prev) => {
      const next = { ...prev };
      delete next[entityId];
      return next;
    });
  }

  function openAdd(parent: GovernanceNode | null) {
    const entityTypeId = parent ? (parent.childEntityTypeId ?? rootTypeId) : rootTypeId;
    setAddTarget({ parent, entityTypeId });
    setNewEntityId('');
    setNewDisplayName('');
    setNewLimit('');
    setAddError(null);
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!addTarget) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const { nodes: updated } = await createGovernanceNode(getToken, {
        entityId: newEntityId.trim(),
        displayName: newDisplayName.trim() || newEntityId.trim(),
        entityTypeId: addTarget.entityTypeId,
        parentId: addTarget.parent?.entityId ?? null,
        // Blank means unlimited — usage is still tracked, it just never blocks.
        usageLimit: newLimit.trim() === '' ? null : Number(newLimit),
      });
      setNodes(updated);
      setAddTarget(null);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create entity');
    } finally {
      setIsAdding(false);
    }
  }

  async function commitLimit(node: GovernanceNode) {
    const nextLimit = limitDraft.trim() === '' ? null : Number(limitDraft);
    setEditingEntityId(null);
    if (nextLimit === node.usageLimit) return;

    setBusyEntityId(node.entityId);
    try {
      const { nodes: updated } = await updateGovernanceNodeLimit(
        getToken,
        node.entityId,
        nextLimit,
      );
      setNodes(updated);
      clearMessage(node.entityId);
    } catch (err) {
      setMessage(node.entityId, err instanceof Error ? err.message : 'Failed to update', true);
    } finally {
      setBusyEntityId(null);
    }
  }

  async function handleReport(node: GovernanceNode) {
    const amount = Number(amountByEntity[node.entityId] ?? '1');
    if (!Number.isInteger(amount) || amount < 1) {
      setMessage(node.entityId, `Enter a whole number of ${currencyLabel}, 1 or more.`, true);
      return;
    }

    setBusyEntityId(node.entityId);
    try {
      const result = await reportGovernanceUsage(getToken, node.entityId, amount);
      // The chain runs leaf -> root, so this reads as the path the request had to clear.
      const path = result.chain
        .map((link) => `${link.entityId} ${link.currentUsage}/${link.usageLimit ?? '∞'}`)
        .join('  ←  ');
      setMessage(node.entityId, `Reported ${result.amount} ${currencyLabel}. ${path}`, false);
      await load();
    } catch (err) {
      setMessage(node.entityId, err instanceof Error ? err.message : 'Failed to report', true);
    } finally {
      setBusyEntityId(null);
    }
  }

  async function confirmDeletion() {
    if (!pendingDeletion) return;
    const { entityId } = pendingDeletion;
    setPendingDeletion(null);
    setBusyEntityId(entityId);
    try {
      const { nodes: updated } = await deleteGovernanceNode(getToken, entityId);
      setNodes(updated);
      clearMessage(entityId);
    } catch (err) {
      setMessage(entityId, err instanceof Error ? err.message : 'Failed to delete', true);
    } finally {
      setBusyEntityId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="app">
        <PageLoading />
      </div>
    );
  }

  const descendantCount = pendingDeletion ? countDescendants(nodes, pendingDeletion.entityId) : 0;

  return (
    <div className="app">
      <div className="page-header">
        <span className="page-header__icon">
          <SitemapIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">Governance</h1>
          <p className="page-header__subtitle">
            Chat as a governed user and watch the spend roll up. Budgets apply per department, team,
            and user.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content governance">
          <div className="governance__toolbar">
            <button type="button" className="governance__add-root" onClick={() => openAdd(null)}>
              + Add {typeLabel(entityTypes, rootTypeId).toLowerCase()}
            </button>

            {userNodes.length > 0 && (
              <label className="governance__acting-as">
                Acting as
                <select
                  value={actingAsEntityId ?? ''}
                  onChange={(event) => setActingAsEntityId(event.target.value || null)}
                >
                  <option value="">Nobody (ungoverned)</option>
                  {userNodes.map((node) => (
                    <option key={node.entityId} value={node.entityId}>
                      {node.displayName}
                    </option>
                  ))}
                </select>
                {/* The selection rides in the query string, so this link hands it to the chat page. */}
                <Link className="governance__chat-link" to={linkTo('/chatbot')}>
                  <ChatIcon size={14} /> Chat as this user
                </Link>
              </label>
            )}
          </div>

          {error && <p className="manage-environments__error">{error}</p>}

          {nodes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">
                <SitemapIcon size={22} />
              </span>
              <p className="empty-state__title">No governed entities yet</p>
              <p className="empty-state__body">
                Add a {typeLabel(entityTypes, rootTypeId).toLowerCase()} to start budgeting this
                customer, then nest teams and users beneath it.
              </p>
            </div>
          ) : (
            <div className="governance__table">
              <div className="governance__row governance__row--head">
                <span>Entity</span>
                <span>Type</span>
                <span>Budget ({currencyLabel})</span>
                <span>Utilization</span>
                <span>Resets</span>
                <span>Report</span>
              </div>

              {nodes.map((node) => {
                const message = rowMessage[node.entityId];
                const isBusy = busyEntityId === node.entityId;
                const isActingAs = node.entityId === actingAsEntityId;
                const percent =
                  node.usageLimit && node.usageLimit > 0
                    ? Math.min(100, (node.currentUsage / node.usageLimit) * 100)
                    : 0;

                return (
                  <div
                    key={node.entityId}
                    className={
                      isActingAs
                        ? 'governance__row-group governance__row-group--acting'
                        : 'governance__row-group'
                    }
                  >
                    <div className="governance__row">
                      <span
                        className="governance__entity"
                        style={{ paddingLeft: `${node.depth * 1.25}rem` }}
                      >
                        <span className="governance__entity-name">
                          {node.displayName}
                          {isActingAs && (
                            <span className="governance__acting-badge">acting as</span>
                          )}
                        </span>
                        <span className="governance__entity-id">{node.entityId}</span>
                      </span>

                      <span className="governance__type">
                        {typeLabel(entityTypes, node.entityTypeId)}
                      </span>

                      <span className="governance__budget">
                        {editingEntityId === node.entityId ? (
                          <input
                            className="governance__limit-input"
                            value={limitDraft}
                            autoFocus
                            placeholder="unlimited"
                            onChange={(event) => setLimitDraft(event.target.value)}
                            onBlur={() => commitLimit(node)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') commitLimit(node);
                              if (event.key === 'Escape') setEditingEntityId(null);
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className="governance__limit"
                            title="Click to edit. Leave blank for unlimited."
                            onClick={() => {
                              setEditingEntityId(node.entityId);
                              setLimitDraft(
                                node.usageLimit === null ? '' : String(node.usageLimit),
                              );
                            }}
                          >
                            {node.currentUsage} / {node.usageLimit ?? '∞'}
                          </button>
                        )}
                      </span>

                      <span className="governance__meter">
                        <span className="governance__meter-bar">
                          <span
                            className={
                              percent >= 100
                                ? 'governance__meter-fill governance__meter-fill--full'
                                : 'governance__meter-fill'
                            }
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="governance__meter-label">
                          {node.usageLimit ? `${Math.round(percent)}%` : 'tracked'}
                        </span>
                      </span>

                      <span className="governance__resets">
                        {formatResetDate(node.usagePeriodEnd)}
                      </span>

                      <span className="governance__actions">
                        <input
                          className="governance__units-input"
                          value={amountByEntity[node.entityId] ?? '1'}
                          onChange={(event) =>
                            setAmountByEntity((prev) => ({
                              ...prev,
                              [node.entityId]: event.target.value,
                            }))
                          }
                          aria-label={`${currencyLabel} to spend for ${node.displayName}`}
                        />
                        <button type="button" disabled={isBusy} onClick={() => handleReport(node)}>
                          {isBusy ? '…' : 'Report'}
                        </button>
                        {node.childEntityTypeId && (
                          <button
                            type="button"
                            title={`Add a ${typeLabel(entityTypes, node.childEntityTypeId).toLowerCase()}`}
                            onClick={() => openAdd(node)}
                          >
                            +
                          </button>
                        )}
                        <button
                          type="button"
                          className="governance__delete"
                          title="Delete this entity and everything under it"
                          onClick={() => setPendingDeletion(node)}
                        >
                          ×
                        </button>
                      </span>
                    </div>

                    {message && (
                      <div
                        className={
                          message.isError
                            ? 'governance__message governance__message--error'
                            : 'governance__message'
                        }
                      >
                        {message.isError && <AlertIcon size={14} />}
                        <span>{message.text}</span>
                        <button type="button" onClick={() => clearMessage(node.entityId)}>
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {addTarget && (
          <div className="paywall-backdrop">
            <div className="paywall-modal">
              <button
                type="button"
                className="paywall-modal__close"
                onClick={() => setAddTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="paywall-modal__title">
                Add {typeLabel(entityTypes, addTarget.entityTypeId).toLowerCase()}
              </h2>
              {addTarget.parent && (
                <p className="paywall-modal__message">
                  Nested under <strong>{addTarget.parent.displayName}</strong>.
                </p>
              )}
              <form className="manage-environments__form" onSubmit={handleAdd}>
                <input
                  className="manage-environments__confirm-input"
                  value={newEntityId}
                  onChange={(event) => setNewEntityId(event.target.value)}
                  placeholder="Entity ID (e.g. user-alice)"
                  autoFocus
                />
                <input
                  className="manage-environments__confirm-input"
                  value={newDisplayName}
                  onChange={(event) => setNewDisplayName(event.target.value)}
                  placeholder="Display name (optional)"
                />
                <input
                  className="manage-environments__confirm-input"
                  value={newLimit}
                  onChange={(event) => setNewLimit(event.target.value)}
                  placeholder={`Budget in ${currencyLabel} per month (blank = unlimited)`}
                />
                {addError && <p className="manage-environments__error">{addError}</p>}
                <button
                  type="submit"
                  className="paywall-modal__cta"
                  disabled={!newEntityId.trim() || isAdding}
                >
                  {isAdding ? 'Creating…' : 'Create'}
                </button>
              </form>
            </div>
          </div>
        )}

        {pendingDeletion && (
          <div className="paywall-backdrop">
            <div className="paywall-modal">
              <button
                type="button"
                className="paywall-modal__close"
                onClick={() => setPendingDeletion(null)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="paywall-modal__title">Delete entity?</h2>
              <p className="paywall-modal__message">
                <strong>{pendingDeletion.displayName}</strong> will be archived along with
                {descendantCount > 0
                  ? ` its ${descendantCount} nested ${descendantCount === 1 ? 'entity' : 'entities'}.`
                  : ' any entities nested under it.'}{' '}
                Recorded usage is not refunded.
              </p>
              <button
                type="button"
                className="paywall-modal__cta paywall-modal__cta--danger"
                onClick={confirmDeletion}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
