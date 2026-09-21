import { NavLink } from 'react-router-dom';
import styles from './MobileBottomNav.module.css';

type Props = {
  unreadNotifications?: number;
  wishlistCount?: number;
};

export function MobileBottomNav({ unreadNotifications = 0, wishlistCount = 0 }: Props) {
  return (
    <nav className={styles.bar} aria-label="Primary">
      <NavLink
        to="/products"
        end
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
      >
        <span className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.label}>Market</span>
      </NavLink>

      <NavLink
        to="/stores"
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
      >
        <span className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v10.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M9 21v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={styles.label}>Store</span>
      </NavLink>

      <NavLink
        to="/wishlist"
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
        aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} saved` : 'Wishlist'}
      >
        <span className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          {wishlistCount > 0 ? (
            <span className={styles.badge}>{wishlistCount > 9 ? '9+' : wishlistCount}</span>
          ) : null}
        </span>
        <span className={styles.label}>Wishlist</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
      >
        <span className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9l-4 3v-3.2A2.5 2.5 0 0 1 4 14.5v-8z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.label}>Message</span>
      </NavLink>

      <NavLink
        to="/notifications"
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
        aria-label={
          unreadNotifications > 0
            ? `Alerts, ${unreadNotifications} unread`
            : 'Alerts'
        }
      >
        <span className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zm6 13a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 21z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          {unreadNotifications > 0 ? (
            <span className={styles.badge}>
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          ) : null}
        </span>
        <span className={styles.label}>Alerts</span>
      </NavLink>
    </nav>
  );
}
