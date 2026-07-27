import { LockIcon } from '../extras/icons';
import '../styles/AccessDeniedModal.css';

interface AccessDeniedModalProps {
  featureName: string;
}

export function AccessDeniedModal({ featureName }: AccessDeniedModalProps) {
  return (
    <div className="paywall-backdrop">
      <div className="paywall-modal">
        <span className="paywall-modal__icon">
          <LockIcon size={26} />
        </span>
        <h2 className="paywall-modal__title">Premium Feature</h2>
        <p className="paywall-modal__message">Upgrade your plan to unlock {featureName}.</p>
        <button type="button" className="paywall-modal__cta">
          Upgrade Plan
          {/* TODO: add onUpgrade here to point to React widget */}
        </button>
      </div>
    </div>
  );
}
