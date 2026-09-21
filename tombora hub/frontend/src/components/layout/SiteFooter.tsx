import { Link } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { APP_LOGO_SRC, APP_NAME, APP_TAGLINE } from '@/config/brand';
import { hasSellerAccount } from '@/utils/auth';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  const { data: user } = useMe();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <div>
          <img src={APP_LOGO_SRC} alt={APP_NAME} className={styles.footerLogo} />
          <p>
            {APP_TAGLINE}. Shop local sellers and pay with MTN MoMo &amp; Airtel Money.
          </p>
        </div>
        <div>
          <p className={styles.footerTitle}>Shop</p>
          <Link to="/products">Products</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/categories">Categories</Link>
        </div>
        <div>
          <p className={styles.footerTitle}>Sell</p>
          <Link to="/sell">For sellers</Link>
          <Link to="/how-it-works">How it works</Link>
          {hasSellerAccount(user?.roles) ? <Link to="/seller">Seller dashboard</Link> : null}
        </div>
        <div>
          <p className={styles.footerTitle}>Company</p>
          <div className={styles.footerLinks}>
            <Link to="/why-tombora">Why {APP_NAME}</Link>
            <Link to="/about">About</Link>
            <Link to="/help">Help</Link>
            <Link to="/returns">Returns</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
