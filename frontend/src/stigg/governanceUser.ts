import { useSearchParams } from 'react-router-dom';

// The governance `user` entity type's attribution key — see GOVERNANCE_ENTITY_TYPES in
// backend/src/stigg/constants.js. This is the dimension name Stigg matches to resolve the entity
// chain, so it has to stay in step with the backend.
const USER_ATTRIBUTION_KEY = 'userId';

export const ACTING_AS_PARAM = 'actingAs';

/**
 * The governance user whose budget governs AI usage, held in the URL.
 *
 * The URL is the right home for this: /governance writes it and /chatbot reads it, so it needs to
 * survive navigation between the two — and putting it in the query string means it also survives a
 * reload and makes a demo link shareable ("open this and you're Alice"). No provider needed.
 */
export function useActingAs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const actingAsEntityId = searchParams.get(ACTING_AS_PARAM) || null;

  function setActingAsEntityId(entityId: string | null) {
    const next = new URLSearchParams(searchParams);
    if (entityId) {
      next.set(ACTING_AS_PARAM, entityId);
    } else {
      next.delete(ACTING_AS_PARAM);
    }
    // replace, not push: flipping between users shouldn't stack up history entries to back out of.
    setSearchParams(next, { replace: true });
  }

  // Ready to send as-is; empty means ungoverned, which the backend treats as opt-out.
  const dimensions: Record<string, string> = actingAsEntityId
    ? { [USER_ATTRIBUTION_KEY]: actingAsEntityId }
    : {};

  // Carries the selection across a link to the other page.
  function linkTo(pathname: string) {
    return actingAsEntityId
      ? `${pathname}?${ACTING_AS_PARAM}=${encodeURIComponent(actingAsEntityId)}`
      : pathname;
  }

  return { actingAsEntityId, setActingAsEntityId, dimensions, linkTo };
}
