import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Alert, Button, Input } from '@/components/ui';
import { APP_NAME, pageTitle } from '@/config/brand';
import styles from './InfoPages.module.css';

const STORAGE_KEY = 'neeremarket_contact_messages';
const SUPPORT_EMAIL = 'hello@neeremarket.rw';
const SUPPORT_PHONE = '+250 788 123 456';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Order');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please add your name, email, and a message.');
      return;
    }
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown[];
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          [
            {
              id: crypto.randomUUID(),
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              topic,
              message: message.trim(),
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 20),
        ),
      );
      setSent(true);
      setMessage('');
    } catch {
      setError('Could not send your message. Please email us instead.');
    }
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{pageTitle('Contact')}</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Contact</p>
          <h1>We’re here in Kigali</h1>
          <p>
            Questions about an order, a payout, or your store? Send a note — {APP_NAME} support
            replies Monday to Saturday.
          </p>
        </div>
      </section>

      <div className={`container ${styles.split}`}>
        <form className={styles.panel} onSubmit={onSubmit}>
          <h2>Send a message</h2>
          {error ? <Alert tone="error">{error}</Alert> : null}
          {sent ? (
            <Alert tone="success">Thanks — we received your message and will follow up by email.</Alert>
          ) : null}
          <div className={styles.formStack}>
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+250 7…"
            />
            <label className={styles.areaLabel}>
              Topic
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option>Order</option>
                <option>Payment</option>
                <option>Return</option>
                <option>Seller account</option>
                <option>Other</option>
              </select>
            </label>
            <label className={styles.areaLabel}>
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Order number, what happened, and how we can help…"
              />
            </label>
            <div>
              <Button type="submit">Send message</Button>
            </div>
          </div>
        </form>

        <aside className={styles.panel}>
          <h2>Reach us directly</h2>
          <ul className={styles.contactList}>
            <li>
              <span>Email</span>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </li>
            <li>
              <span>Phone / WhatsApp</span>
              <a href="tel:+250788123456">{SUPPORT_PHONE}</a>
            </li>
            <li>
              <span>Hours</span>
              <strong>Mon–Sat · 8:00–20:00 CAT</strong>
            </li>
            <li>
              <span>Office</span>
              <strong>Kigali, Rwanda</strong>
            </li>
          </ul>
          <div className={styles.cta}>
            <Link to="/help">
              <Button type="button" variant="secondary">
                Help center
              </Button>
            </Link>
            <Link to="/messages">
              <Button type="button" variant="ghost">
                Messages
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
