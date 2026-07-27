import { CoinIcon } from '../extras/icons';
import '../styles/AccessDeniedModal.css';

interface InsufficientBalanceModalProps {
  featureName: string;
  onClose?: () => void;
}

export function InsufficientBalanceModal({ featureName, onClose }: InsufficientBalanceModalProps) {
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
          <CoinIcon size={26} />
        </span>
        <h2 className="paywall-modal__title">Out of Credits</h2>
        <p className="paywall-modal__message">
          You don't have enough credits left to use {featureName}. Top up your balance to keep
          going.
        </p>
        <button type="button" className="paywall-modal__cta">
          Buy Credits
        </button>
      </div>
    </div>
  );
}
