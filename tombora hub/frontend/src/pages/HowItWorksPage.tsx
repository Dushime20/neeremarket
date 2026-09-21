import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import styles from './InfoPages.module.css';

export function HowItWorksPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>How it works | NeereMarket</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>How it works</p>
          <h1>Three steps to your door</h1>
          <p>Discover local sellers, pay with Mobile Money, and receive your order across Rwanda.</p>
        </div>
      </section>
      <div className="container">
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepNo}>01</span>
            <h2>Discover</h2>
            <p>Browse categories or search the live catalog from sellers across Rwanda.</p>
          </li>
          <li>
            <span className={styles.stepNo}>02</span>
            <h2>Pay with MoMo</h2>
            <p>Checkout in RWF with MTN MoMo or Airtel Money — no extra wallets.</p>
          </li>
          <li>
            <span className={styles.stepNo}>03</span>
            <h2>Receive</h2>
            <p>Get it delivered through local partners, from Kigali and beyond.</p>
          </li>
        </ol>
        <div className={styles.cta}>
          <Link to="/products">
            <Button type="button">Start shopping</Button>
          </Link>
          <Link to="/sell">
            <Button type="button" variant="secondary">
              For sellers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
