import { discountPercent, formatRwf } from '@/utils/money';
import styles from './PriceDisplay.module.css';

type Props = {
  price: string;
  discountPrice?: string | null;
  size?: 'sm' | 'lg';
};

export function PriceDisplay({ price, discountPrice, size = 'sm' }: Props) {
  const current = discountPrice || price;
  const pct = discountPercent(price, discountPrice ?? null);
  return (
    <div className={`${styles.wrap} ${styles[size]}`}>
      <strong>{formatRwf(current)}</strong>
      {discountPrice ? <span className={styles.old}>{formatRwf(price)}</span> : null}
      {pct ? <span className={styles.off}>{pct}% off</span> : null}
    </div>
  );
}
