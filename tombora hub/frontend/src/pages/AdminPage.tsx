import { useState, type FormEvent, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAdminAudit,
  useAdminDashboard,
  useAdminOrders,
  useAdminProducts,
  useAdminSellers,
  useAdminSettings,
  useAdminUsers,
  useCmsBanners,
  useCmsPages,
  useMe,
  useModerateProduct,
  useModerateSeller,
  useUpsertBanner,
  useUpsertPage,
  useUpsertSetting,
  useUpdateUserStatus,
  useAdminPayouts,
  useReviewPayout,
  useProcessPayout,
  useAdminReturns,
  useReviewReturn,
} from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, TableSkeleton } from '@/components/ui';
import { ICONS, MetricIcon, greeting, initials, todayLabel } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { isAdminRole } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

const SECTIONS = [
  'overview',
  'users',
  'sellers',
  'products',
  'orders',
  'payouts',
  'disputes',
  'cms',
  'settings',
  'audit',
  'profile',
] as const;

type Section = (typeof SECTIONS)[number];

function isSection(value: string | undefined): value is Section {
  return !!value && (SECTIONS as readonly string[]).includes(value);
}

export function AdminPage() {
  const { data: user } = useMe();
  const navigate = useNavigate();
  const { section: sectionParam } = useParams();
  const [params] = useSearchParams();
  const tab = params.get('tab');
  const section: Section = isSection(sectionParam) ? sectionParam : 'overview';

  if (tab && !sectionParam && isSection(tab)) {
    return <Navigate to={`/admin/${tab}`} replace />;
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Admin login required"
          description="Use an operations account to open the console."
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/admin')}
        />
      </div>
    );
  }

  if (!isAdminRole(user.roles)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Admin {section} | NeereMarket</title>
      </Helmet>
      {section === 'overview' ? <OverviewTab /> : null}
      {section === 'users' ? <UsersTab /> : null}
      {section === 'sellers' ? <SellersTab /> : null}
      {section === 'products' ? <ProductsTab /> : null}
      {section === 'orders' ? <OrdersTab /> : null}
      {section === 'payouts' ? <PayoutsTab /> : null}
      {section === 'disputes' ? <DisputesTab /> : null}
      {section === 'cms' ? <CmsTab /> : null}
      {section === 'settings' ? <SettingsTab /> : null}
      {section === 'audit' ? <AuditTab /> : null}
      {section === 'profile' ? <ProfileTab /> : null}
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading, isError, error } = useAdminDashboard();
  const pendingSellers = useAdminSellers('UNDER_REVIEW');
  const pendingProducts = useAdminProducts('PENDING_APPROVAL');

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  const c = data?.counts;
  const attention = (c?.pendingSellers ?? 0) + (c?.pendingProducts ?? 0);

  return (
    <>
      <header className={styles.pageHead}>
        <div className={styles.pageHeadCopy}>
          <p className={styles.kicker}>{todayLabel()}</p>
          <h1>{greeting()}. Marketplace pulse</h1>
          <p>Live snapshot of GMV, queues, and catalog health across NeereMarket.</p>
        </div>
      </header>

      {attention > 0 ? (
        <aside className={styles.notice}>
          <p>
            <strong>{attention} items need moderation</strong>
            {c?.pendingSellers ?? 0} sellers and {c?.pendingProducts ?? 0} products are waiting.
          </p>
          <div className={styles.actions}>
            <Link to="/admin/sellers" className={styles.link}>
              Sellers
            </Link>
            <Link to="/admin/products" className={styles.link}>
              Products
            </Link>
          </div>
        </aside>
      ) : null}

      <section className={styles.kpis} aria-label="Marketplace metrics">
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="ok">
              <MetricIcon path={ICONS.trend} />
            </span>
            <span>GMV</span>
          </div>
          <strong>{formatRwf(data?.gmv || '0')}</strong>
          <em>Paid and in-progress orders</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="brand">
              <MetricIcon path={ICONS.users} />
            </span>
            <span>Users</span>
          </div>
          <strong>{c?.users ?? 0}</strong>
          <em>Registered accounts</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="accent">
              <MetricIcon path={ICONS.store} />
            </span>
            <span>Sellers</span>
          </div>
          <strong>{c?.sellers ?? 0}</strong>
          <em>{c?.pendingSellers ?? 0} awaiting verification</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="warn">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Products</span>
          </div>
          <strong>{c?.products ?? 0}</strong>
          <em>{c?.pendingProducts ?? 0} in review</em>
        </article>
      </section>

      <section className={styles.queues} aria-label="Operations queues">
        <article className={styles.queueCard}>
          <div>
            <span>Orders</span>
            <strong>{c?.orders ?? 0}</strong>
          </div>
          <Link to="/admin/orders">Open</Link>
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Open payouts</span>
            <strong>{c?.openPayouts ?? 0}</strong>
          </div>
          <Link to="/admin/payouts">Review</Link>
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Open returns</span>
            <strong>{c?.openReturns ?? 0}</strong>
          </div>
          <Link to="/admin/disputes">Review</Link>
        </article>
        <article className={styles.queueCard}>
          <div>
            <span>Attention</span>
            <strong>{attention}</strong>
          </div>
          <Link to="/admin/products">Queue</Link>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Sellers to verify</h2>
            <Link to="/admin/sellers">Open queue</Link>
          </div>
          <div className={styles.panelBody}>
            {!pendingSellers.data?.items.length ? (
              <EmptyState compact title="No sellers waiting" />
            ) : (
              <ul className={styles.queue}>
                {pendingSellers.data.items.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <div className={styles.item}>
                      <span className={styles.avatar}>{initials(s.businessName)}</span>
                      <span>
                        <strong>{s.businessName}</strong>
                        <small>
                          {s.user.fullName} Â· {s.store?.name || 'No store'}
                        </small>
                      </span>
                    </div>
                    <Badge tone={statusTone(s.verificationStatus)}>
                      {prettyStatus(s.verificationStatus)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Products in review</h2>
            <Link to="/admin/products">Open queue</Link>
          </div>
          <div className={styles.panelBody}>
            {!pendingProducts.data?.items.length ? (
              <EmptyState compact title="No products waiting" />
            ) : (
              <ul className={styles.queue}>
                {pendingProducts.data.items.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.store.name} Â· {formatRwf(p.price)}
                      </small>
                    </div>
                    <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function UsersTab() {
  const [params] = useSearchParams();
  const urlQ = params.get('q') || '';
  const [q, setQ] = useState(urlQ);
  const { data, isLoading, isError, error } = useAdminUsers(q || undefined);
  const updateStatus = useUpdateUserStatus();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Access</p>
          <h1>Users</h1>
          <p>Accounts, roles, and suspension.</p>
        </div>
      </header>
      <form
        className={styles.search}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Input label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.fullName}</strong>
                    <small>{u.email || u.phone}</small>
                  </td>
                  <td>{u.roles.join(', ')}</td>
                  <td>
                    <Badge tone={statusTone(u.status)}>{prettyStatus(u.status)}</Badge>
                  </td>
                  <td>
                    <Button
                      type="button"
                      size="sm"
                      variant={u.status === 'ACTIVE' ? 'secondary' : 'primary'}
                      disabled={updateStatus.isPending}
                      onClick={() => {
                        const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                        updateStatus.mutate(
                          { id: u.id, status: next },
                          {
                            onSuccess: () => setMsg(`Updated ${u.fullName}`),
                            onError: (err) => setMsg(getErrorMessage(err)),
                          },
                        );
                      }}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SellersTab() {
  const [filter, setFilter] = useState('');
  const { data, isLoading, isError, error } = useAdminSellers(filter || undefined);
  const moderate = useModerateSeller();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Moderation</p>
          <h1>Sellers</h1>
          <p>Verification and store access.</p>
        </div>
      </header>
      <div className={styles.filters}>
        {[
          { id: '', label: 'All' },
          { id: 'UNDER_REVIEW', label: 'In review' },
          { id: 'VERIFIED', label: 'Verified' },
          { id: 'REJECTED', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Store</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.businessName}</strong>
                    <small>{s.user.fullName}</small>
                  </td>
                  <td>{s.store?.name || 'No store'}</td>
                  <td>
                    <Badge tone={statusTone(s.verificationStatus)}>
                      {prettyStatus(s.verificationStatus)}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        size="sm"
                        disabled={moderate.isPending || s.verificationStatus === 'VERIFIED'}
                        onClick={() =>
                          moderate.mutate(
                            { id: s.id, verificationStatus: 'VERIFIED' },
                            { onSuccess: () => setMsg('Seller verified') },
                          )
                        }
                      >
                        Verify
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={moderate.isPending}
                        onClick={() =>
                          moderate.mutate(
                            {
                              id: s.id,
                              verificationStatus: 'REJECTED',
                              reason: 'Does not meet policy',
                            },
                            { onSuccess: () => setMsg('Seller rejected') },
                          )
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProductsTab() {
  const [filter, setFilter] = useState('PENDING_APPROVAL');
  const pending = useAdminProducts(filter || undefined);
  const moderate = useModerateProduct();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Catalog</p>
          <h1>Products</h1>
          <p>Approve listings before they go live.</p>
        </div>
      </header>
      <div className={styles.filters}>
        {[
          { id: 'PENDING_APPROVAL', label: 'In review' },
          { id: 'ACTIVE', label: 'Live' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: '', label: 'All' },
        ].map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {pending.isLoading ? <TableSkeleton /> : null}
      {pending.isError ? <Alert tone="error">{getErrorMessage(pending.error)}</Alert> : null}
      {!pending.isLoading && (pending.data?.items.length || 0) === 0 ? (
        <EmptyState title="No products in this filter" />
      ) : null}
      {(pending.data?.items.length || 0) > 0 ? (
        <section className={styles.panel}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(pending.data?.items || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <small>{p.store.name}</small>
                    </td>
                    <td className={styles.num}>{formatRwf(p.price)}</td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button
                          type="button"
                          size="sm"
                          disabled={p.status === 'ACTIVE'}
                          onClick={() =>
                            moderate.mutate(
                              { id: p.id, status: 'ACTIVE' },
                              { onSuccess: () => setMsg('Product approved') },
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            moderate.mutate(
                              { id: p.id, status: 'REJECTED', reason: 'Policy' },
                              { onSuccess: () => setMsg('Product rejected') },
                            )
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}

function OrdersTab() {
  const { data, isLoading, isError, error } = useAdminOrders();
  if (isLoading) return <TableSkeleton />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Operations</p>
          <h1>Orders</h1>
          <p>Marketplace-wide order activity.</p>
        </div>
      </header>
      <section className={styles.panel}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.orderNumber}</strong>
                </td>
                <td>{o.customer.fullName}</td>
                <td>
                  <Badge tone={statusTone(o.status)}>{prettyStatus(o.status)}</Badge>
                </td>
                <td className={styles.num}>{formatRwf(o.total)}</td>
                <td>
                  <Link to={`/orders/${o.id}`}>
                    <Button type="button" size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    </>
  );
}

function CmsTab() {
  const banners = useCmsBanners();
  const pages = useCmsPages();
  const upsertBanner = useUpsertBanner();
  const upsertPage = useUpsertPage();
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('https://placehold.co/1200x400/2d5173/ffffff?text=Banner');
  const [pageSlug, setPageSlug] = useState('help');
  const [pageTitle, setPageTitle] = useState('Help');
  const [pageBody, setPageBody] = useState('How can we help?');
  const [msg, setMsg] = useState<string | null>(null);

  async function onBanner(e: FormEvent) {
    e.preventDefault();
    try {
      await upsertBanner.mutateAsync({
        title: bannerTitle,
        imageUrl: bannerImage,
        isActive: true,
      });
      setBannerTitle('');
      setMsg('Banner saved');
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  async function onPage(e: FormEvent) {
    e.preventDefault();
    try {
      await upsertPage.mutateAsync({
        slug: pageSlug,
        title: pageTitle,
        body: pageBody,
        isPublished: true,
      });
      setMsg('Page saved');
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Content</p>
          <h1>CMS</h1>
          <p>Banners and published pages.</p>
        </div>
      </header>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      <div className={styles.cmsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>New banner</h2>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={onBanner}>
              <Input label="Title" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} required />
              <Input label="Image URL" value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} required />
              <Button type="submit" disabled={upsertBanner.isPending}>
                Save banner
              </Button>
            </form>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Banner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(banners.data || []).map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>
                      <Badge tone={b.isActive ? 'success' : 'muted'}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>CMS page</h2>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={onPage}>
              <Input label="Slug" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} required />
              <Input label="Title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} required />
              <label className={styles.select}>
                Body
                <textarea value={pageBody} onChange={(e) => setPageBody(e.target.value)} rows={4} required />
              </label>
              <Button type="submit" disabled={upsertPage.isPending}>
                Publish page
              </Button>
            </form>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(pages.data || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <small>/{p.slug}</small>
                    </td>
                    <td>
                      <Badge tone={p.isPublished ? 'success' : 'muted'}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </>
  );
}

function SettingsTab() {
  const { data, isLoading, isError, error } = useAdminSettings();
  const upsert = useUpsertSetting();
  const [key, setKey] = useState('return_window_days');
  const [value, setValue] = useState('7');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      let parsed: unknown = value;
      try {
        parsed = JSON.parse(value);
      } catch {
        const n = Number(value);
        parsed = Number.isNaN(n) ? value : n;
      }
      await upsert.mutateAsync({ key, value: parsed });
      setMsg('Setting saved');
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Platform</p>
          <h1>Settings</h1>
          <p>Operational configuration for the hub.</p>
        </div>
      </header>
      <div className={styles.split}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Current settings</h2>
        </div>
        {msg ? (
          <div className={styles.panelBody}>
            <Alert tone="success">{msg}</Alert>
          </div>
        ) : null}
        {isLoading ? <TableSkeleton rows={4} /> : null}
        {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.key}</strong>
                  </td>
                  <td>
                    <small>{JSON.stringify(s.value)}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Update setting</h2>
        </div>
        <div className={styles.panelBody}>
          <form className={styles.form} onSubmit={onSubmit}>
            <Input label="Key" value={key} onChange={(e) => setKey(e.target.value)} required />
            <Input label="Value (JSON or number)" value={value} onChange={(e) => setValue(e.target.value)} required />
            <Button type="submit" disabled={upsert.isPending}>
              Save setting
            </Button>
          </form>
        </div>
      </section>
    </div>
    </>
  );
}

function AuditTab() {
  const { data, isLoading, isError, error } = useAdminAudit();
  if (isLoading) return <TableSkeleton />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Security</p>
          <h1>Audit log</h1>
          <p>Privileged actions across the hub.</p>
        </div>
      </header>
      <section className={styles.panel}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.action}</strong>
                </td>
                <td>
                  {a.entityType}
                  <small>{a.entityId || ''}</small>
                </td>
                <td>{a.actor?.fullName || 'system'}</td>
                <td>
                  <small>{new Date(a.createdAt).toLocaleString()}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    </>
  );
}

function PayoutsTab() {
  const [filter, setFilter] = useState('');
  const { data, isLoading, isError, error } = useAdminPayouts(filter || undefined);
  const review = useReviewPayout();
  const process = useProcessPayout();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Finance</p>
          <h1>Payouts</h1>
          <p>Approve seller withdrawals and process MoMo transfers.</p>
        </div>
      </header>
      <div className={styles.filters}>
        {[
          { id: '', label: 'All' },
          { id: 'REQUESTED', label: 'Requested' },
          { id: 'UNDER_REVIEW', label: 'In review' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'PAID', label: 'Paid' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ].map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            className={`${styles.chip} ${filter === f.id ? styles.chipOn : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <section className={styles.panel}>
        {!isLoading && !data?.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No payout requests" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.seller.businessName}</strong>
                      <small>{p.seller.businessPhone || new Date(p.createdAt).toLocaleString()}</small>
                    </td>
                    <td className={styles.num}>{formatRwf(p.amount)}</td>
                    <td>{prettyStatus(p.method)}</td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {['REQUESTED', 'UNDER_REVIEW'].includes(p.status) ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={review.isPending}
                              onClick={() =>
                                review.mutate(
                                  { id: p.id, action: 'APPROVE' },
                                  { onSuccess: () => setMsg('Payout approved') },
                                )
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={review.isPending}
                              onClick={() =>
                                review.mutate(
                                  { id: p.id, action: 'CANCEL' },
                                  { onSuccess: () => setMsg('Payout cancelled') },
                                )
                              }
                            >
                              Cancel
                            </Button>
                          </>
                        ) : null}
                        {p.status === 'APPROVED' ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={process.isPending}
                            onClick={() =>
                              process.mutate(p.id, { onSuccess: () => setMsg('Payout processed') })
                            }
                          >
                            Process
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function DisputesTab() {
  const { data, isLoading, isError, error } = useAdminReturns();
  const review = useReviewReturn();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Support</p>
          <h1>Disputes & returns</h1>
          <p>Review customer return requests and issue refunds.</p>
        </div>
      </header>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <section className={styles.panel}>
        {!isLoading && !data?.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No open disputes" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong className={styles.mono}>{row.order.orderNumber}</strong>
                      <small>{new Date(row.createdAt).toLocaleString()}</small>
                    </td>
                    <td>{row.order.customer?.fullName || '—'}</td>
                    <td>
                      {prettyStatus(row.reason)}
                      {row.notes ? <small>{row.notes}</small> : null}
                    </td>
                    <td>
                      <Badge tone={statusTone(row.status)}>{prettyStatus(row.status)}</Badge>
                    </td>
                    <td>
                      {['REQUESTED', 'UNDER_REVIEW'].includes(row.status) ? (
                        <div className={styles.actions}>
                          <Button
                            type="button"
                            size="sm"
                            disabled={review.isPending}
                            onClick={() =>
                              review.mutate(
                                { id: row.id, action: 'APPROVE' },
                                { onSuccess: () => setMsg('Return approved and refunded') },
                              )
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={review.isPending}
                            onClick={() =>
                              review.mutate(
                                { id: row.id, action: 'REJECT' },
                                { onSuccess: () => setMsg('Return rejected') },
                              )
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className={styles.muted}>
                          {row.refunds[0] ? formatRwf(row.refunds[0].amount) : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function ProfileTab() {
  const { data: user } = useMe();
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Account</p>
          <h1>Admin profile</h1>
          <p>Signed-in operations identity.</p>
        </div>
      </header>
      <section className={styles.panel}>
        <div className={styles.panelBody}>
          <div className={styles.item}>
            <span className={styles.avatar}>{initials(user?.email)}</span>
            <span>
              <strong>{user?.email || user?.phone || 'Admin'}</strong>
              <small>{user?.roles.join(', ')}</small>
            </span>
          </div>
          <p className={styles.muted} style={{ marginTop: '1rem' }}>
            Permissions: {user?.permissions.length ? user.permissions.join(', ') : 'All (super admin)'}
          </p>
        </div>
      </section>
    </>
  );
}
