import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = '', ...rest }: Props) {
  const inputId = id || rest.name || label.replace(/\s+/g, '-').toLowerCase();
  return (
    <label className={`${styles.field} ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} aria-invalid={!!error} {...rest} />
      {error ? (
        <em className={styles.error} role="alert">
          {error}
        </em>
      ) : null}
    </label>
  );
}
