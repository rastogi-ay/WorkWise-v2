import { Link } from 'react-router-dom';
import { LockIcon } from '../extras/icons';
import '../styles/AccessDeniedModal.css';

interface AccessDeniedModalProps {
  featureName: string;
  pricingUrl: string;
}

export function AccessDeniedModal({ featureName, pricingUrl }: AccessDeniedModalProps) {
  return (
    <div className="paywall-backdrop">
      <div className="paywall-modal">
        <span className="paywall-modal__icon">
          <LockIcon size={26} />
        </span>
        <h2 className="paywall-modal__title">Premium Feature</h2>
        <p className="paywall-modal__message">Upgrade your plan to unlock {featureName}.</p>
        <Link to={pricingUrl} className="paywall-modal__cta">
          View Pricing
        </Link>
      </div>
    </div>
  );
}
