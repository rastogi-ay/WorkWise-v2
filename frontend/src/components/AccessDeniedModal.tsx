import { LockIcon, AlertIcon } from '../extras/icons';
import '../styles/AccessDeniedModal.css';

interface AccessDeniedModalProps {
  status: 'denied' | 'error';
  featureName: string;
  onClose?: () => void;
}

const STATUS_CONFIG = {
  denied: {
    icon: <LockIcon size={26} />,
    title: 'Premium Feature',
    ctaLabel: 'Upgrade Plan',
    message: (featureName: string) => `Upgrade your plan to unlock ${featureName}.`,
  },
  error: {
    icon: <AlertIcon size={26} />,
    title: 'Something went wrong',
    ctaLabel: 'Retry',
    message: (featureName: string) =>
      `We couldn't load ${featureName} right now. Please try again.`,
  },
};

export function AccessDeniedModal({ status, featureName, onClose }: AccessDeniedModalProps) {
  const config = STATUS_CONFIG[status];

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
        <span className="paywall-modal__icon">{config.icon}</span>
        <h2 className="paywall-modal__title">{config.title}</h2>
        <p className="paywall-modal__message">{config.message(featureName)}</p>
        <button type="button" className="paywall-modal__cta">
          {config.ctaLabel}
          {/* TODO: add onUpgrade here to point to React widget */}
        </button>
      </div>
    </div>
  );
}
