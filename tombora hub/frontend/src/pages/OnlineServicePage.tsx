import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { Alert, Button, Input } from '@/components/ui';
import styles from './QuickActionPages.module.css';

export function OnlineServicePage() {
  const { data: user } = useMe();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  function openMessages() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/messages')}`);
      return;
    }
    navigate('/messages');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/online-service')}`);
      return;
    }
    setSent(true);
    setSubject('');
    setBody('');
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Online service | NeereMarket</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Customer service</p>
          <h1>Online service</h1>
          <p>Chat with support, get order help, or message a seller — same idea as Made-in-China’s service desk.</p>
        </div>
      </section>

      <div className={`container ${styles.layout}`}>
        <div className={styles.formCard}>
          <h2>How can we help?</h2>
          <div className={styles.serviceGrid}>
            <button type="button" className={styles.serviceTile} onClick={openMessages}>
              <strong>Live messages</strong>
              <span>Open your inbox and chat with sellers or continue a thread.</span>
            </button>
            <Link to="/help" className={styles.serviceTile}>
              <strong>Help center</strong>
              <span>FAQs on orders, payments, returns, and MoMo payouts.</span>
            </Link>
            <Link to="/contact" className={styles.serviceTile}>
              <strong>Contact us</strong>
              <span>Reach NeereMarket support by email or phone.</span>
            </Link>
            <Link to="/returns" className={styles.serviceTile}>
              <strong>Returns</strong>
              <span>Start a return or check refund policy.</span>
            </Link>
          </div>

          <form className={styles.inlineForm} onSubmit={onSubmit}>
            <h3>Leave a support note</h3>
            {sent ? <Alert tone="success">Thanks — your note was recorded. We’ll follow up by email.</Alert> : null}
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Order issue, account help…"
            />
            <label className={styles.field}>
              Message
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
                placeholder="Describe your issue…"
              />
            </label>
            <Button type="submit">{user ? 'Send to support' : 'Log in to send'}</Button>
          </form>
        </div>

        <aside className={styles.sideCard}>
          <h3>Hours</h3>
          <p>Mon–Sat · 8:00–20:00 (CAT)</p>
          <p className={styles.muted}>For urgent order issues, use Messages after checkout.</p>
          <Button type="button" onClick={openMessages}>
            Open messages
          </Button>
        </aside>
      </div>
    </div>
  );
}
