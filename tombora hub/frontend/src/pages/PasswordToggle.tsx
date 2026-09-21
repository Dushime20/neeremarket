import styles from './Auth.module.css';

export function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.eye}
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
          <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5.5 0 9.5 5 10.5 7-.4.7-1.1 1.9-2.2 3.1M6.1 6.1C3.8 7.8 2.2 10.2 1.5 12c1 2 5 7 10.5 7 1.5 0 2.9-.3 4.1-.9" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
