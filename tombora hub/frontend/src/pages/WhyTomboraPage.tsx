import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { APP_NAME, pageTitle } from '@/config/brand';
import styles from './InfoPages.module.css';

export function WhyTomboraPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>{pageTitle(`Why ${APP_NAME}`)}</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Why {APP_NAME}</p>
          <h1>Built for how Rwanda actually shops</h1>
          <p>A marketplace that speaks your currency, your payments, and your neighborhoods.</p>
        </div>
      </section>
      <div className="container">
        <div className={styles.grid}>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h10M4 17h7" />
                <circle cx="18" cy="16.5" r="3" />
              </svg>
            </span>
            <h2>Priced in RWF</h2>
            <p>No currency guesswork. Every listing is local, transparent, and ready to buy.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="6" y="3" width="12" height="18" rx="2" />
                <path d="M10 18h4" />
              </svg>
            </span>
            <h2>Mobile Money checkout</h2>
            <p>Pay with MTN MoMo or Airtel Money — the rails people already trust.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 4.5 6.5v5.2c0 4.7 3.2 8 7.5 9.3 4.3-1.3 7.5-4.6 7.5-9.3V6.5L12 3Z" />
                <path d="m8.8 12 2.2 2.2 4.2-4.4" />
              </svg>
            </span>
            <h2>Verified storefronts</h2>
            <p>Buy from real Kigali shops and market sellers, not anonymous listings.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 17h16M7 17V8l5-3 5 3v9" />
                <path d="M10 17v-5h4v5" />
              </svg>
            </span>
            <h2>Sell in minutes</h2>
            <p>Open a store for free, upload products, and start getting paid.</p>
          </article>
        </div>
        <div className={styles.cta}>
          <Link to="/products">
            <Button type="button">Browse the market</Button>
          </Link>
          <Link to="/how-it-works">
            <Button type="button" variant="secondary">
              How it works
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
