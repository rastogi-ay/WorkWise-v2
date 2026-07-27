import { AlertIcon } from '../extras/icons';

export function BillingIntegrationMissing() {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <AlertIcon size={22} />
      </span>
      <p className="empty-state__title">Billing integration not connected</p>
      <p className="empty-state__body">
        Checkout isn't available until a billing integration is connected for this environment.
      </p>
    </div>
  );
}
