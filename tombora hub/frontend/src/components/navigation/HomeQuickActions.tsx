import { Link } from 'react-router-dom';
import styles from './HomeQuickActions.module.css';

const ACTIONS = [
  {
    to: '/sourcing-request',
    label: 'Post sourcing request',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="11" cy="11" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="11" cy="11" r="1.2" fill="currentColor" />
        <path
          d="M15.8 15.8 21 21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/online-service',
    label: 'Online service',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5.5 14.5v-2a6.5 6.5 0 0 1 13 0v2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M5.5 14.5v2.2A1.8 1.8 0 0 0 7.3 18.5h1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M18.5 14.5v2.2a1.8 1.8 0 0 1-1.8 1.8h-1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8.5 18.5h7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="5.5" cy="14.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="18.5" cy="14.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: '/app',
    label: 'Get the app',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="7"
          y="3"
          width="10"
          height="18"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
        <path d="M10 5.5h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/image-search',
    label: 'Search by image',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="11" cy="11" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13.6 13.6 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16.2 7.2l.7-.7M17.5 8.8l.9.2" fill="none" stroke="var(--color-brand)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export function HomeQuickActions() {
  return (
    <aside className={styles.rail} aria-label="Quick actions">
      {ACTIONS.map((action) => (
        <Link key={action.to} to={action.to} className={styles.item} title={action.label}>
          <span className={styles.icon}>{action.icon}</span>
          <span className={styles.tip}>{action.label}</span>
        </Link>
      ))}
    </aside>
  );
}
