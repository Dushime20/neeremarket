import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { hasSellerAccount } from '@/utils/auth';
import { Button } from '@/components/ui';
import styles from './InfoPages.module.css';

export function SellPage() {
  const { data: user } = useMe();
  const isSeller = hasSellerAccount(user?.roles);

  return (
    <div className={styles.page}>
      <Helmet>
        <title>For sellers | NeereMarket</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>For sellers</p>
          <h1>Turn your stall into a storefront.</h1>
          <p>
            List for free, reach buyers nationwide, and get paid the way you already work — Mobile
            Money.
          </p>
        </div>
      </section>
      <div className="container">
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2>Free to list</h2>
            <p>Open a store in minutes. No listing fee to get your first products in front of buyers.</p>
          </article>
          <article className={styles.card}>
            <h2>Paid in MoMo</h2>
            <p>Receive payouts through MTN MoMo and Airtel Money — the rails your customers already use.</p>
          </article>
          <article className={styles.card}>
            <h2>Nationwide reach</h2>
            <p>Sell beyond your market stall, from Kigali neighborhoods to buyers across Rwanda.</p>
          </article>
          <article className={styles.card}>
            <h2>Seller tools</h2>
            <p>Manage products, orders, and finance from one dashboard built for local commerce.</p>
          </article>
        </div>
        <div className={styles.panel}>
          <h2>Ready to sell on NeereMarket?</h2>
          <p>Create a seller account, set up your store, and start listing products.</p>
          <div className={styles.cta}>
            {isSeller ? (
              <Link to="/seller">
                <Button type="button">Go to seller dashboard</Button>
              </Link>
            ) : (
              <Link to="/register?as=seller">
                <Button type="button">Start selling</Button>
              </Link>
            )}
            <Link to="/how-it-works">
              <Button type="button" variant="secondary">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
