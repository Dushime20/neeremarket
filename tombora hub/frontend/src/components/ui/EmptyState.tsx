import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './EmptyState.module.css';

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ title, description, actionLabel, onAction, children, compact }: Props) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`} role="status">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
      {actionLabel && onAction ? (
        <Button type="button" size={compact ? 'sm' : 'md'} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
