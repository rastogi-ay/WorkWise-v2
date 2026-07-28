import { CustomerPortal as CustomerPortalWidget } from '@stigg/react-sdk';
import '@stigg/react-sdk/dist/styles.css';
import '../styles/App.css';
import { UserIcon } from '../extras/icons';

export default function CustomerPortal() {
  return (
    <div className="app">
      <div className="page-header">
        <span className="page-header__icon">
          <UserIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">Customer Portal</h1>
          <p className="page-header__subtitle">
            Manage your subscription, usage, and billing details.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content">
          {/* TODO: add productId here for parameters? */}
          <CustomerPortalWidget />
        </div>
      </div>
    </div>
  );
}
