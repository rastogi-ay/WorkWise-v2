import { AlertIcon } from '../extras/icons';
import '../styles/AccessDeniedModal.css';

interface ErrorModalProps {
  featureName: string;
  onClose?: () => void;
}

export function ErrorModal({ featureName, onClose }: ErrorModalProps) {
  return (
    <div className="paywall-backdrop">
      <div className="paywall-modal">
        {onClose && (
          <button
            type="button"
            className="paywall-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <span className="paywall-modal__icon">
          <AlertIcon size={26} />
        </span>
        <h2 className="paywall-modal__title">Something went wrong</h2>
        <p className="paywall-modal__message">
          We couldn't load {featureName} right now. Please try again.
        </p>
        <button type="button" className="paywall-modal__cta">
          Retry
        </button>
      </div>
    </div>
  );
}
