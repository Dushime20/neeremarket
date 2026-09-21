import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useSellerProfile, useUpdateSellerProfile } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

export function SellerProfilePage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: seller, isLoading } = useSellerProfile();
  const update = useUpdateSellerProfile();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    businessCategory: '',
    district: '',
    province: '',
    marketLocation: '',
    businessPhone: '',
    whatsappNumber: '',
    logoUrl: '',
    coverUrl: '',
  });

  useEffect(() => {
    if (!seller) return;
    setForm({
      businessName: seller.businessName || '',
      description: seller.description || '',
      businessCategory: seller.businessCategory || '',
      district: seller.district || '',
      province: seller.province || '',
      marketLocation: seller.marketLocation || '',
      businessPhone: seller.businessPhone || '',
      whatsappNumber: seller.whatsappNumber || '',
      logoUrl: seller.logoUrl || '',
      coverUrl: seller.coverUrl || '',
    });
  }, [seller]);

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/profile')}
        />
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await update.mutateAsync({
        ...form,
        logoUrl: form.logoUrl || undefined,
        coverUrl: form.coverUrl || undefined,
      });
      setMsg('Store profile saved');
    } catch (ex) {
      setErr(getErrorMessage(ex));
    }
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Store profile | NeereMarket</title>
      </Helmet>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Account</p>
          <h1>Store profile</h1>
          <p>
            {seller?.store?.name || 'Your store'}{' '}
            {seller ? (
              <Badge tone={statusTone(seller.verificationStatus)}>
                {prettyStatus(seller.verificationStatus)}
              </Badge>
            ) : null}
          </p>
        </div>
        {seller?.store ? (
          <Link to={`/stores/${seller.store.slug}`}>
            <Button type="button" size="sm" variant="secondary">
              View storefront
            </Button>
          </Link>
        ) : null}
      </header>

      {isLoading ? <p className={styles.muted}>Loading profile…</p> : null}
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {err ? <Alert tone="error">{err}</Alert> : null}

      {seller ? (
        <div className={styles.twoCol}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Business details</h2>
            </div>
            <div className={styles.panelBody}>
              <form className={`${styles.form} ${styles.formWide}`} onSubmit={onSubmit}>
                <Input
                  label="Business name"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  required
                />
                <Input
                  label="Category"
                  value={form.businessCategory}
                  onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
                />
                <label className={styles.select}>
                  Description
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                <Input
                  label="Province"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                />
                <Input
                  label="District"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
                <Input
                  label="Market / shop location"
                  value={form.marketLocation}
                  onChange={(e) => setForm({ ...form, marketLocation: e.target.value })}
                />
                <Input
                  label="Business phone"
                  value={form.businessPhone}
                  onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
                />
                <Input
                  label="WhatsApp"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                />
                <Input
                  label="Logo URL"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
                <Input
                  label="Cover URL"
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                />
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? 'Saving…' : 'Save profile'}
                </Button>
              </form>
            </div>
          </section>
          <aside className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Preview</h2>
            </div>
            <div className={styles.panelBody}>
              {form.coverUrl ? <img className={styles.cover} src={form.coverUrl} alt="" /> : null}
              <div className={styles.item} style={{ marginTop: '0.85rem' }}>
                {form.logoUrl ? <img className={styles.thumb} src={form.logoUrl} alt="" /> : <span className={styles.avatar}>NM</span>}
                <span>
                  <strong>{form.businessName || 'Store name'}</strong>
                  <small>
                    {form.district || 'District'} {form.province ? `Â· ${form.province}` : ''}
                  </small>
                </span>
              </div>
              <p className={styles.muted}>{form.description || 'Add a store description customers will see.'}</p>
              <p className={styles.muted}>
                Signed in as {user.email || user.phone}
                <br />
                Roles: {user.roles.join(', ')}
              </p>
              {seller.verificationStatus !== 'VERIFIED' ? (
                <p>
                  <Link to="/seller/onboarding" className={styles.link}>
                    Continue onboarding
                  </Link>
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
