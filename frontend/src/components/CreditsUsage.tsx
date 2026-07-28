import { CreditGrants, CreditUsageChart, CreditUsageTimeRange } from '@stigg/react-sdk';
import '@stigg/react-sdk/dist/styles.css';
import '../styles/App.css';
import '../styles/CreditsUsage.css';
import { CoinIcon } from '../extras/icons';
import { CREDIT_CURRENCY_ID } from '../stigg/constants';

export default function CreditsUsage() {
  return (
    <div className="app">
      <div className="page-header">
        <span className="page-header__icon">
          <CoinIcon size={22} />
        </span>
        <div className="page-header__text">
          <h1 className="page-header__title">Credits Usage</h1>
          <p className="page-header__subtitle">
            Track how your credits are being granted and spent.
          </p>
        </div>
      </div>

      <div className="page-content-wrapper">
        <div className="page-content credits-usage__widgets">
          <CreditUsageChart
            currencyId={CREDIT_CURRENCY_ID}
            timeRange={CreditUsageTimeRange.LastMonth}
          />
          <CreditGrants currencyId={CREDIT_CURRENCY_ID} pageSize={10} />
        </div>
      </div>
    </div>
  );
}
