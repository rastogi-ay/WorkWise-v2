import { useEffect, useState } from 'react';
import { CoinIcon } from '../extras/icons';

interface CreditBalanceProps {
  usageLimit: number | null;
  currentUsage: number | null;
}

export function CreditBalance({ usageLimit, currentUsage }: CreditBalanceProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const limit = usageLimit ?? 0;
  const used = currentUsage ?? 0;
  const percentUsed = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  return (
    <div className="credit-stat">
      <span className="credit-stat__icon">
        <CoinIcon />
      </span>
      <div className="credit-stat__text">
        <span className="credit-stat__label">Platform credits</span>
        <span className="credit-stat__value">
          {used} / {limit}
        </span>
        <div className="credit-stat__bar">
          <div
            className="credit-stat__bar-fill"
            style={{ width: animate ? `${percentUsed}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}
