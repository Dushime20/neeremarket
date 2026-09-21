import styles from './Rating.module.css';

export function Rating({ value, count }: { value: number | string; count?: number }) {
  const n = Number(value) || 0;
  return (
    <p className={styles.rating}>
      <span aria-hidden>★</span>
      <span>{n.toFixed(1)}</span>
      {count != null ? <span className={styles.count}>({count})</span> : null}
    </p>
  );
}
