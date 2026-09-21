import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { APP_NAME } from '@/config/brand';
import styles from './QuickActionPages.module.css';

export function MobileAppPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>Get the app | {APP_NAME}</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Mobile</p>
          <h1>Shop {APP_NAME} on your phone</h1>
          <p>
            Browse stores, track orders, and pay with MoMo on the go — the same experience as the
            Made-in-China app entry point.
          </p>
        </div>
      </section>

      <div className={`container ${styles.layout}`}>
        <div className={styles.formCard}>
          <h2>Download the app</h2>
          <p className={styles.lead}>
            Scan a QR code with your phone camera, or use the store links below. (Store listings
            go live when the apps are published.)
          </p>
          <div className={styles.qrRow}>
            <div className={styles.qrCard}>
              <div className={styles.qrPlaceholder} aria-hidden="true">
                QR
              </div>
              <strong>Android</strong>
              <span>Google Play</span>
              <a
                className={styles.storeBtn}
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
              >
                Get it on Google Play
              </a>
            </div>
            <div className={styles.qrCard}>
              <div className={styles.qrPlaceholder} aria-hidden="true">
                QR
              </div>
              <strong>iPhone</strong>
              <span>App Store</span>
              <a
                className={styles.storeBtn}
                href="https://apps.apple.com/"
                target="_blank"
                rel="noreferrer"
              >
                Download on the App Store
              </a>
            </div>
          </div>
          <div className={styles.actions}>
            <Link to="/">
              <Button type="button" variant="secondary">
                Continue on web
              </Button>
            </Link>
          </div>
        </div>

        <aside className={styles.sideCard}>
          <h3>Why the app?</h3>
          <ul>
            <li>Faster checkout with saved MoMo details</li>
            <li>Order &amp; delivery alerts</li>
            <li>Message sellers on the go</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
