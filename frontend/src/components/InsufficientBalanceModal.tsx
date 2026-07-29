import { Link } from 'react-router-dom';
import { CoinIcon } from '../extras/icons';
import '../styles/AccessDeniedModal.css';

interface InsufficientBalanceModalProps {
  featureName: string;
  pricingUrl: string;
  onClose?: () => void;
  title?: string;
  message?: string;
  ctaLabel?: string;
}

export function InsufficientBalanceModal({
  featureName,
  pricingUrl,
  onClose,
  title = 'Out of Credits',
  message,
  ctaLabel = 'Buy Credits',
}: InsufficientBalanceModalProps) {
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
        <h2 className="paywall-modal__title">{title}</h2>
        <p className="paywall-modal__message">
          {message ??
            `You don't have enough credits left to use ${featureName}. Top up your balance to keep going.`}
        </p>
        <Link to={pricingUrl} className="paywall-modal__cta">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
