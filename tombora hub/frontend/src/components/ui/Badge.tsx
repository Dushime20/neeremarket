import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Props = {
  children: ReactNode;
  tone?: 'brand' | 'accent' | 'muted' | 'success' | 'warning' | 'danger';
};

export function Badge({ children, tone = 'brand' }: Props) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
