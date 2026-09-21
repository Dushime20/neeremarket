import { Button } from '@/components/ui';
import styles from './QuantitySelector.module.css';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({ value, min = 1, max = 999, onChange }: Props) {
  return (
    <div className={styles.wrap} role="group" aria-label="Quantity">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <span className={styles.value}>{value}</span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </Button>
    </div>
  );
}
