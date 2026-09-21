import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { Alert, Button, Input } from '@/components/ui';
import styles from './QuickActionPages.module.css';

const STORAGE_KEY = 'neeremarket_sourcing_requests';

export function SourcingRequestPage() {
  const { data: user } = useMe();
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/sourcing-request')}`);
      return;
    }
    if (!productName.trim() || !quantity.trim() || !details.trim()) {
      setError('Please fill in product, quantity, and details.');
      return;
    }
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown[];
      const entry = {
        id: crypto.randomUUID(),
        productName: productName.trim(),
        quantity: quantity.trim(),
        details: details.trim(),
        contact: contact.trim() || user.email,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...prev].slice(0, 20)));
      setSubmitted(true);
      setProductName('');
      setQuantity('');
      setDetails('');
    } catch {
      setError('Could not save your request. Please try again.');
    }
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Post sourcing request | NeereMarket</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Easy sourcing</p>
          <h1>Post your sourcing request</h1>
          <p>
            Tell sellers what you need. Get quotes from verified NeereMarket stores across Rwanda —
            similar to Made-in-China’s RFQ flow.
          </p>
        </div>
      </section>

      <div className={`container ${styles.layout}`}>
        <form className={styles.formCard} onSubmit={onSubmit}>
          <h2>Request for quotation</h2>
          <p className={styles.lead}>
            Describe the product, quantity, and any specs. Sellers can follow up with offers.
          </p>
          {error ? <Alert tone="error">{error}</Alert> : null}
          {submitted ? (
            <Alert tone="success">
              Your sourcing request was posted. Sellers can review it and contact you. You can also
              message stores from product pages.
            </Alert>
          ) : null}
          <Input
            label="Product / category needed"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. School uniforms, bulk rice, phone accessories"
            required
          />
          <Input
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 200 pieces / 50 kg"
            required
          />
          <label className={styles.field}>
            Details &amp; requirements
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              required
              placeholder="Size, color, delivery location, budget, deadline…"
            />
          </label>
          <Input
            label="Contact email or phone"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Your email or MoMo number"
          />
          <div className={styles.actions}>
            <Button type="submit">{user ? 'Post request' : 'Log in to post request'}</Button>
            <Link to="/stores" className={styles.secondaryLink}>
              Browse stores instead
            </Link>
          </div>
        </form>

        <aside className={styles.sideCard}>
          <h3>How it works</h3>
          <ol>
            <li>Post what you want to buy</li>
            <li>Verified sellers send quotes</li>
            <li>Compare and chat to close the deal</li>
          </ol>
          <Link to="/how-it-works">Learn more about buying on NeereMarket</Link>
        </aside>
      </div>
    </div>
  );
}
