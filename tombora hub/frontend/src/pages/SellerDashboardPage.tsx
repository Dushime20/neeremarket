import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMe, useSellerDashboard, useSellerOrders, useSellerProducts } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { ICONS, MetricIcon, greeting, todayLabel } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { isSellerRole } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './workspace.module.css';

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: dashboard, isLoading, isError, error } = useSellerDashboard();
  const { data: products } = useSellerProducts();
  const { data: orders } = useSellerOrders();

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          description="Sign in with a seller account to open this workspace."
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller')}
        />
      </div>
    );
  }

  if (!isSellerRole(user.roles)) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Not a seller yet"
          description="Open a storefront to list products and receive orders."
          actionLabel="Start selling"
          onAction={() => navigate('/sell')}
        />
      </div>
    );
  }

  const wallet = dashboard?.wallet as
    | { pendingBalance: string; availableBalance: string; currency: string }
    | null
    | undefined;
  const seller = dashboard?.seller as
    | { businessName: string; verificationStatus: string; totalOrders?: number; ratingAvg?: string }
    | undefined;
  const store = dashboard?.store as { name: string; slug: string } | undefined;
  const productStats = (dashboard?.products || {}) as Record<string, number>;
  const orderStats = (dashboard?.orders || {}) as Record<string, number>;
  const productTotal = Object.values(productStats).reduce((a, b) => a + b, 0);
  const orderTotal = Object.values(orderStats).reduce((a, b) => a + b, 0);
  const maxProduct = Math.max(1, ...Object.values(productStats));
  const lowStock = Number(dashboard?.lowStockProducts ?? 0);

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Seller overview | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div className={styles.pageHeadCopy}>
          <p className={styles.kicker}>{todayLabel()}</p>
          <h1>
            {greeting()}, {seller?.businessName || store?.name || 'seller'}
          </h1>
          <p>Track sales, stock, and store performance from one workspace.</p>
          <div className={styles.pageMeta}>
            {store?.name ? <span className={styles.muted}>{store.name}</span> : null}
            <Badge tone={statusTone(seller?.verificationStatus)}>
              {prettyStatus(seller?.verificationStatus || 'PENDING')}
            </Badge>
          </div>
        </div>
        <div className={styles.actions}>
          {store ? (
            <Link to={`/stores/${store.slug}`}>
              <Button variant="secondary" type="button" size="sm">
                Storefront
              </Button>
            </Link>
          ) : null}
          <Link to="/seller/products/new">
            <Button type="button" size="sm">
              Add product
            </Button>
          </Link>
        </div>
      </header>

      {isLoading ? <TableSkeleton rows={5} /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {dashboard ? (
        <>
          {seller?.verificationStatus && seller.verificationStatus !== 'VERIFIED' ? (
            <aside
              className={styles.notice}
              data-tone={
                seller.verificationStatus === 'REJECTED' || seller.verificationStatus === 'SUSPENDED'
                  ? 'danger'
                  : seller.verificationStatus === 'UNDER_REVIEW'
                    ? 'info'
                    : undefined
              }
            >
              <p>
                <strong>
                  {seller.verificationStatus === 'UNDER_REVIEW'
                    ? 'Verification is in review'
                    : seller.verificationStatus === 'REJECTED'
                      ? 'Verification needs another look'
                      : seller.verificationStatus === 'SUSPENDED'
                        ? 'Seller account is suspended'
                        : 'Finish store onboarding'}
                </strong>
                {seller.verificationStatus === 'UNDER_REVIEW'
                  ? 'Admin is reviewing your KYC and payout details.'
                  : seller.verificationStatus === 'REJECTED'
                    ? 'Update your documents and submit again.'
                    : 'Complete identity, business docs, and payout details to get a verified badge.'}
              </p>
              <Link to="/seller/onboarding" className={styles.link}>
                Open onboarding
              </Link>
            </aside>
          ) : null}

          {lowStock > 0 ? (
            <aside className={styles.notice}>
              <p>
                <strong>{lowStock} listings are low on stock</strong>
                Restock before they drop out of the catalog.
              </p>
              <Link to="/seller/inventory" className={styles.link}>
                Review inventory
              </Link>
            </aside>
          ) : null}

          <section className={styles.kpis} aria-label="Key metrics">
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="ok">
                  <MetricIcon path={ICONS.wallet} />
                </span>
                <span>Available</span>
              </div>
              <strong>{formatRwf(wallet?.availableBalance || 0)}</strong>
              <em>Ready to withdraw</em>
            </article>
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="warn">
                  <MetricIcon path={ICONS.hold} />
                </span>
                <span>Pending</span>
              </div>
              <strong>{formatRwf(wallet?.pendingBalance || 0)}</strong>
              <em>Held until fulfillment</em>
            </article>
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone="brand">
                  <MetricIcon path={ICONS.bag} />
                </span>
                <span>Orders</span>
              </div>
              <strong>{orderTotal}</strong>
              <em>{seller?.totalOrders ?? orderTotal} lifetime</em>
            </article>
            <article className={styles.kpi}>
              <div className={styles.kpiHead}>
                <span className={styles.kpiIcon} data-tone={lowStock ? 'warn' : 'accent'}>
                  <MetricIcon path={ICONS.box} />
                </span>
                <span>Catalog</span>
              </div>
              <strong>{productTotal}</strong>
              <em>{lowStock} low stock</em>
            </article>
          </section>

          <section className={styles.split}>
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Recent orders</h2>
                <Link to="/seller/orders">View all</Link>
              </div>
              {!orders?.items.length ? (
                <div className={styles.panelBody}>
                  <EmptyState compact title="No orders yet" description="Paid customer orders appear here." />
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.items.slice(0, 6).map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong className={styles.mono}>{order.sellerOrderNumber}</strong>
                            <small>{order.items.map((i) => i.productName).join(', ')}</small>
                          </td>
                          <td>
                            <Badge tone={statusTone(order.status)}>{prettyStatus(order.status)}</Badge>
                          </td>
                          <td className={styles.num}>{formatRwf(order.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Listing status</h2>
                <Link to="/seller/products">Manage</Link>
              </div>
              <div className={styles.panelBody}>
                {!productTotal ? (
                  <EmptyState compact title="No listings yet" />
                ) : (
                  <div className={styles.mix}>
                    {Object.entries(productStats).map(([status, count]) => (
                      <div key={status} className={styles.mixRow}>
                        <span>{prettyStatus(status)}</span>
                        <b>{count}</b>
                        <span className={styles.bar}>
                          <i style={{ width: `${(count / maxProduct) * 100}%` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Latest products</h2>
              <Link to="/seller/products">View catalog</Link>
            </div>
            {!products?.items.length ? (
              <div className={styles.panelBody}>
                <EmptyState
                  compact
                  title="Create your first listing"
                  description="Registration stays free. Admin approval may apply."
                  actionLabel="Add product"
                  onAction={() => navigate('/seller/products/new')}
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.items.slice(0, 8).map((p) => {
                      const status = (p as { status?: string }).status;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className={styles.item}>
                              {p.images?.[0]?.url ? (
                                <img className={styles.thumb} src={p.images[0].url} alt="" />
                              ) : (
                                <span className={styles.thumb} />
                              )}
                              <span>
                                <strong>{p.name}</strong>
                                <small>{p.category?.name || 'Uncategorized'}</small>
                              </span>
                            </div>
                          </td>
                          <td>{p.category?.name || '—'}</td>
                          <td className={styles.num}>{formatRwf(p.discountPrice || p.price)}</td>
                          <td>
                            <Badge tone={statusTone(status)}>{prettyStatus(status)}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
