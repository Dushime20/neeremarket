import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { APP_NAME, pageTitle } from '@/config/brand';
import styles from './InfoPages.module.css';

export function HelpPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>{pageTitle('Help')}</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Help center</p>
          <h1>How can we help?</h1>
          <p>
            Answers for orders, Mobile Money payments, returns, and selling on {APP_NAME}.
          </p>
        </div>
      </section>

      <div className="container">
        <div className={styles.grid}>
          <Link to="/orders" className={styles.card}>
            <h2>Track an order</h2>
            <p>Open My orders to see status, seller shipments, and delivery updates.</p>
          </Link>
          <Link to="/returns" className={styles.card}>
            <h2>Returns & refunds</h2>
            <p>Most items can be returned within 7 days of delivery. Refunds go back to MoMo.</p>
          </Link>
          <Link to="/contact" className={styles.card}>
            <h2>Talk to support</h2>
            <p>Email, phone, or a short message — we reply during marketplace hours.</p>
          </Link>
          <Link to="/sell" className={styles.card}>
            <h2>Selling on {APP_NAME}</h2>
            <p>Open a store for free, list products, and get paid with MTN MoMo or Airtel Money.</p>
          </Link>
        </div>

        <div className={styles.panel}>
          <h2>Frequently asked</h2>
          <div className={styles.faq}>
            <details open>
              <summary>How do I pay?</summary>
              <p>
                Checkout is in RWF. Choose MTN MoMo or Airtel Money, confirm on your phone, and we
                hold the order until payment succeeds.
              </p>
            </details>
            <details>
              <summary>Where is my order?</summary>
              <p>
                Go to <Link to="/orders">My orders</Link>. One checkout can include several sellers —
                each seller ships their own parcel.
              </p>
            </details>
            <details>
              <summary>I forgot my password</summary>
              <p>
                Use the email or phone on your account and contact support from the{' '}
                <Link to="/contact">Contact</Link> page. We’ll help you reset access. Never share
                OTPs or MoMo PINs with anyone claiming to be {APP_NAME}.
              </p>
            </details>
            <details>
              <summary>Payment failed or expired</summary>
              <p>
                Stock is released if MoMo doesn’t confirm in time. Open the order and try payment
                again, or place a new checkout. If money left your wallet, send us the MoMo
                reference on Contact.
              </p>
            </details>
            <details>
              <summary>How do I message a seller?</summary>
              <p>
                Open the product page and use Chat, or go to <Link to="/messages">Messages</Link>{' '}
                after you sign in.
              </p>
            </details>
            <details>
              <summary>How do I start selling?</summary>
              <p>
                Create a seller account on <Link to="/sell">For sellers</Link>, complete onboarding,
                then list products from your dashboard.
              </p>
            </details>
          </div>
        </div>

        <div className={styles.cta}>
          <Link to="/contact">
            <Button type="button">Contact support</Button>
          </Link>
          <Link to="/online-service">
            <Button type="button" variant="secondary">
              Online service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
