import styles from './Skeleton.module.css';

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return <div className={styles.skeleton} style={{ height, width }} aria-hidden />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <Skeleton height={200} />
          <Skeleton height={14} width="80%" />
          <Skeleton height={14} width="50%" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.table} aria-hidden>
      <Skeleton height={18} width="28%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={44} />
      ))}
    </div>
  );
}
