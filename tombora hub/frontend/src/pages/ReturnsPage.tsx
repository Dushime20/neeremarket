import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { APP_NAME, pageTitle } from '@/config/brand';
import styles from './InfoPages.module.css';

export function ReturnsPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>{pageTitle('Returns')}</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Returns & refunds</p>
          <h1>Send it back within 7 days</h1>
          <p>
            If an item isn’t right, request a return from your order. Approved refunds go back to
            the Mobile Money wallet you paid with.
          </p>
        </div>
      </section>

      <div className="container">
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepNo}>01</span>
            <h2>Open the order</h2>
            <p>
              Go to <Link to="/orders">My orders</Link> and pick the delivered item within 7 days of
              delivery.
            </p>
          </li>
          <li>
            <span className={styles.stepNo}>02</span>
            <h2>Request a return</h2>
            <p>Tell us what’s wrong and keep the item unused, with tags and original packaging.</p>
          </li>
          <li>
            <span className={styles.stepNo}>03</span>
            <h2>Refund to MoMo</h2>
            <p>
              After the seller or {APP_NAME} inspects it, we refund the paid amount to MTN MoMo or
              Airtel Money.
            </p>
          </li>
        </ol>

        <div className={styles.split}>
          <section className={styles.panel}>
            <h2>What you can return</h2>
            <ul className={styles.policyList}>
              <li>Most new goods returned within 7 days of the delivery date.</li>
              <li>Wrong, damaged, or not-as-described items — include photos in the request.</li>
              <li>Unopened cosmetics, sealed electronics, and unused fashion with tags on.</li>
            </ul>
            <h2 className={styles.subHead}>What we can’t take back</h2>
            <ul className={styles.policyList}>
              <li>Fresh food, plants, and other perishables.</li>
              <li>Custom or tailored pieces made to your measurements.</li>
              <li>Items used, washed, or missing parts, unless they arrived defective.</li>
            </ul>
          </section>
          <aside className={styles.panel}>
            <h2>Need help?</h2>
            <p>
              Multi-seller orders are refunded per seller parcel. Commission is adjusted on our side
              — you only see the amount paid.
            </p>
            <div className={styles.cta}>
              <Link to="/orders">
                <Button type="button">View my orders</Button>
              </Link>
              <Link to="/contact">
                <Button type="button" variant="secondary">
                  Contact support
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
