import { useEffect, useState, type ComponentType } from 'react';
import { CoinIcon } from '../extras/icons';

interface UsageMeterProps {
  label: string;
  usageLimit: number | null;
  currentUsage: number | null;
  Icon?: ComponentType<{ size?: number }>;
}

export function UsageMeter({ label, usageLimit, currentUsage, Icon = CoinIcon }: UsageMeterProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const limit = usageLimit ?? 0;
  const used = currentUsage ?? 0;
  const percentUsed = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  return (
    <div className="usage-meter">
      <span className="usage-meter__icon">
        <Icon />
      </span>
      <div className="usage-meter__text">
        <span className="usage-meter__label">{label}</span>
        <span className="usage-meter__value">
          {used} / {limit}
        </span>
        <div className="usage-meter__bar">
          <div
            className="usage-meter__bar-fill"
            style={{ width: animate ? `${percentUsed}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}
