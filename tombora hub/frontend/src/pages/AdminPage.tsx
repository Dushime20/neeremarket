import { useState, type FormEvent, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useAdminAudit,
  useAdminAuditStats,
  useAdminLoginHistory,
  type AuditLogItem,
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
  useUnlockUser,
  useAdminPayouts,
  useReviewPayout,
  usePayoutAction,
  useAdminReturns,
  useReviewReturn,
  useRefundAction,
  useAdminDisputes,
  type DisputeStatus,
} from '@/api/hooks';
import {
  ActionIconButton,
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  SortTh,
  TableBanner,
  TableCard,
  TablePagination,
  TableSkeleton,
  TableToolbar,
  useConfirm,
  useToast,
} from '@/components/ui';
import { UserDetailModal, SellerDetailModal, ProductDetailModal, AuditDetailModal } from '@/components/admin/AdminModals';
import { ICONS, MetricIcon, initials } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { isAdminRole } from '@/utils/auth';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import {
  disputeStatusLabel,
  disputeStatusTone,
  disputeTypeLabel,
  isDisputeActive,
} from '@/utils/disputes';
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
        <title>{`Admin ${section} | NeereMarket`}</title>
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
            <span>Open disputes / returns</span>
            <strong>
              {c?.openDisputes ?? 0} / {c?.openReturns ?? 0}
            </strong>
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
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useAdminUsers(q || undefined);
  const updateStatus = useUpdateUserStatus();
  const unlockUser = useUnlockUser();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setQ(urlQ);
    setPage(1);
  }, [urlQ]);

  const allUsers = data?.items || [];
  const isLocked = (u: { lockedUntil?: string | null }) => !!(u.lockedUntil && new Date(u.lockedUntil) > new Date());
  const activeCount = allUsers.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = allUsers.filter((u) => u.status === 'SUSPENDED').length;
  const lockedCount = allUsers.filter(isLocked).length;

  const displayedUsers =
    statusFilter === 'LOCKED'
      ? allUsers.filter(isLocked)
      : statusFilter
        ? allUsers.filter((u) => u.status === statusFilter)
        : allUsers;

  const totalPages = Math.ceil(displayedUsers.length / pageSize);
  const paginatedUsers = displayedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="User Accounts & Roles"
          subtitle={
            <span>
              <strong>{suspendedCount}</strong> suspended · <strong>{activeCount}</strong> active
              {lockedCount > 0 ? (
                <>
                  {' '}· <strong style={{ color: 'var(--color-danger, #ef4444)' }}>{lockedCount}</strong> locked
                </>
              ) : null}{' '}
              · <strong>{allUsers.length}</strong> total users
            </span>
          }
        />
        <TableToolbar
          searchValue={q}
          onSearchChange={(val) => {
            setQ(val);
            setPage(1);
          }}
          searchPlaceholder="Search by name, email, phone..."
          filterChips={[
            { id: '', label: 'All Users', count: allUsers.length },
            { id: 'ACTIVE', label: 'Active', count: activeCount },
            { id: 'SUSPENDED', label: 'Suspended', count: suspendedCount },
            ...(lockedCount > 0 ? [{ id: 'LOCKED', label: 'Locked', count: lockedCount }] : []),
          ]}
          activeFilter={statusFilter}
          onFilterChange={(id) => {
            setStatusFilter(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortTh>User</SortTh>
                <SortTh>Roles</SortTh>
                <SortTh>Status</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => {
                const userLocked = isLocked(u);
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.fullName}</strong>
                      <small>{u.email || u.phone}</small>
                    </td>
                    <td>{u.roles.join(', ')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Badge tone={statusTone(u.status)}>{prettyStatus(u.status)}</Badge>
                        {userLocked ? <Badge tone="danger">Temporarily Locked</Badge> : null}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <ActionIconButton
                          icon="view"
                          label="View User Details"
                          onClick={() => setSelectedUserId(u.id)}
                        />
                        {userLocked ? (
                          <ActionIconButton
                            icon="unlock"
                            tone="warning"
                            label="Unlock Account"
                            disabled={unlockUser.isPending}
                            onClick={() => {
                              unlockUser.mutate(u.id, {
                                onSuccess: () => setMsg(`Unlocked account for ${u.fullName}`),
                                onError: (err) => setMsg(getErrorMessage(err)),
                              });
                            }}
                          />
                        ) : null}
                        <ActionIconButton
                          icon={u.status === 'ACTIVE' ? 'ban' : 'check'}
                          tone={u.status === 'ACTIVE' ? 'danger' : 'success'}
                          label={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
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
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={displayedUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {selectedUserId ? (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusUpdated={() => {
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}

function SellersTab() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useAdminSellers(filter || undefined);
  const moderate = useModerateSeller();
  const [msg, setMsg] = useState<string | null>(null);

  const allSellers = data?.items || [];
  const inReviewCount = allSellers.filter((s) => s.verificationStatus === 'UNDER_REVIEW').length;
  const verifiedCount = allSellers.filter((s) => s.verificationStatus === 'VERIFIED').length;
  const rejectedCount = allSellers.filter((s) => s.verificationStatus === 'REJECTED').length;

  const displayedSellers = search
    ? allSellers.filter(
        (s) =>
          s.businessName.toLowerCase().includes(search.toLowerCase()) ||
          s.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (s.store?.name && s.store.name.toLowerCase().includes(search.toLowerCase())),
      )
    : allSellers;

  const totalPages = Math.ceil(displayedSellers.length / pageSize);
  const paginatedSellers = displayedSellers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>


      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          title="Seller Verification Directory"
          subtitle={
            <span>
              <strong>{inReviewCount}</strong> in review · <strong>{verifiedCount}</strong> verified · <strong>{rejectedCount}</strong> rejected · <strong>{allSellers.length}</strong> total
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search by business name, owner, or store..."
          filterChips={[
            { id: '', label: 'All Sellers', count: allSellers.length },
            { id: 'UNDER_REVIEW', label: 'In Review', count: inReviewCount },
            { id: 'VERIFIED', label: 'Verified', count: verifiedCount },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
          ]}
          activeFilter={filter}
          onFilterChange={(id) => {
            setFilter(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortTh>Seller</SortTh>
                <SortTh>Store</SortTh>
                <SortTh>Status</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {paginatedSellers.map((s) => (
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
                      <ActionIconButton
                        icon="view"
                        label="View Seller Profile"
                        onClick={() => setSelectedSellerId(s.id)}
                      />
                      <ActionIconButton
                        icon="check"
                        tone="success"
                        label="Verify Seller"
                        disabled={moderate.isPending || s.verificationStatus === 'VERIFIED'}
                        onClick={() =>
                          moderate.mutate(
                            { id: s.id, verificationStatus: 'VERIFIED' },
                            { onSuccess: () => setMsg('Seller verified') },
                          )
                        }
                      />
                      <ActionIconButton
                        icon="cross"
                        tone="danger"
                        label="Reject Seller"
                        disabled={moderate.isPending || s.verificationStatus === 'REJECTED'}
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
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={displayedSellers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {selectedSellerId ? (
        <SellerDetailModal
          sellerId={selectedSellerId}
          onClose={() => setSelectedSellerId(null)}
          onModerated={() => {
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}

function ProductsTab() {
  const [filter, setFilter] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const pending = useAdminProducts(filter || undefined);
  const moderate = useModerateProduct();
  const [msg, setMsg] = useState<string | null>(null);

  const allProducts = pending.data?.items || [];
  const inReviewCount = allProducts.filter((p) => p.status === 'PENDING_APPROVAL').length;

  const displayedProducts = search
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.store.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allProducts;

  const totalPages = Math.ceil(displayedProducts.length / pageSize);
  const paginatedProducts = displayedProducts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>


      {msg ? <Alert tone="success">{msg}</Alert> : null}
      {pending.isLoading ? <TableSkeleton /> : null}
      {pending.isError ? <Alert tone="error">{getErrorMessage(pending.error)}</Alert> : null}

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
          title="Catalog Moderation Queue"
          subtitle={
            <span>
              <strong>{filter === 'PENDING_APPROVAL' ? allProducts.length : inReviewCount}</strong> awaiting review · <strong>{allProducts.length}</strong> listings in view
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search by product name, store..."
          filterChips={[
            { id: 'PENDING_APPROVAL', label: 'In Review' },
            { id: 'ACTIVE', label: 'Live' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: '', label: 'All' },
          ]}
          activeFilter={filter}
          onFilterChange={(id) => {
            setFilter(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        {!pending.isLoading && displayedProducts.length === 0 ? (
          <EmptyState title="No products in this filter" />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Product</SortTh>
                  <SortTh>Price</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => (
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
                        <ActionIconButton
                          icon="view"
                          label="View Product Details"
                          onClick={() => setSelectedProductId(p.id)}
                        />
                        <ActionIconButton
                          icon="check"
                          tone="success"
                          label="Approve Product Listing"
                          disabled={p.status === 'ACTIVE'}
                          onClick={() =>
                            moderate.mutate(
                              { id: p.id, status: 'ACTIVE' },
                              { onSuccess: () => setMsg('Product approved') },
                            )
                          }
                        />
                        <ActionIconButton
                          icon="cross"
                          tone="danger"
                          label="Reject Product Listing"
                          onClick={() =>
                            moderate.mutate(
                              { id: p.id, status: 'REJECTED', reason: 'Does not meet policy' },
                              { onSuccess: () => setMsg('Product rejected') },
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={displayedProducts.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {selectedProductId ? (
        <ProductDetailModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onModerated={() => {
            void pending.refetch();
          }}
        />
      ) : null}
    </>
  );
}

function OrdersTab() {
  const { data, isLoading, isError, error } = useAdminOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (isLoading) return <TableSkeleton />;
  if (isError) return <Alert tone="error">{getErrorMessage(error)}</Alert>;

  const orders = data?.items || [];
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = statusFilter ? o.status === statusFilter : true;
    const matchesSearch = search
      ? o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>


      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          title="Marketplace Orders Queue"
          subtitle={
            <span>
              <strong>{pendingCount}</strong> pending · <strong>{paidCount}</strong> paid · <strong>{deliveredCount}</strong> delivered · <strong>{orders.length}</strong> total orders
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search by order #, customer..."
          filterChips={[
            { id: '', label: 'All Orders', count: orders.length },
            { id: 'PAID', label: 'Paid', count: paidCount },
            { id: 'PENDING', label: 'Pending', count: pendingCount },
            { id: 'DELIVERED', label: 'Delivered', count: deliveredCount },
          ]}
          activeFilter={statusFilter}
          onFilterChange={(id) => {
            setStatusFilter(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortTh>Order</SortTh>
                <SortTh>Customer</SortTh>
                <SortTh>Status</SortTh>
                <SortTh>Total</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((o) => (
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
                    <Link to={`/admin/orders/${o.id}`} title="View Order Details">
                      <ActionIconButton icon="view" label="View Order Details" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>
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
  const [activeView, setActiveView] = useState<'audit' | 'logins'>('audit');
  const [auditPage, setAuditPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionCategory, setActionCategory] = useState<string>('all');
  const [inspectItem, setInspectItem] = useState<AuditLogItem | null>(null);

  const { data: stats } = useAdminAuditStats();

  const auditParams = {
    page: auditPage,
    limit: 10,
    search: search || undefined,
    entityType: entityFilter || undefined,
    action: actionCategory !== 'all' ? actionCategory : undefined,
  };

  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErr,
  } = useAdminAudit(auditParams);

  const loginParams = {
    page: loginPage,
    limit: 10,
    search: search || undefined,
  };

  const {
    data: loginData,
    isLoading: loginLoading,
    isError: loginError,
    error: loginErr,
  } = useAdminLoginHistory(loginParams);

  function getActionTone(action: string): 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'muted' {
    if (action.startsWith('user.login') || action.startsWith('user.register')) return 'success';
    if (action.startsWith('user.locked') || action.includes('cancel') || action.includes('delete') || action.includes('suspend')) return 'danger';
    if (action.startsWith('payout')) return 'accent';
    if (action.startsWith('product') || action.startsWith('seller')) return 'brand';
    return 'muted';
  }

  return (
    <>


      {/* KPI Summary Cards */}
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.alert} />
            <span className={styles.kpiLabel}>Total Audit Events</span>
          </div>
          <div className={styles.kpiValue}>{stats?.totalAuditLogs ?? '—'}</div>
          <p className={styles.kpiHint}>Platform wide actions</p>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.trend} />
            <span className={styles.kpiLabel}>Activity (Past 24h)</span>
          </div>
          <div className={styles.kpiValue}>{stats?.auditLogsPast24h ?? '—'}</div>
          <p className={styles.kpiHint}>Recent logged operations</p>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.users} />
            <span className={styles.kpiLabel}>Authentication Logins</span>
          </div>
          <div className={styles.kpiValue}>{stats?.totalLogins ?? '—'}</div>
          <p className={styles.kpiHint}>
            {stats?.failedLoginsPast24h ? `${stats.failedLoginsPast24h} failed in 24h` : 'All secure'}
          </p>
        </div>

        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <MetricIcon path={ICONS.wallet} />
            <span className={styles.kpiLabel}>Payout &amp; Finance Trails</span>
          </div>
          <div className={styles.kpiValue}>{stats?.payoutAuditsCount ?? '—'}</div>
          <p className={styles.kpiHint}>Withdrawals &amp; approvals</p>
        </div>
      </div>

      {/* Main Panel */}
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          title={activeView === 'audit' ? 'System Audit Trail & Security Log' : 'User Login & Security History'}
          subtitle={
            <span>
              <strong>{activeView === 'audit' ? (auditData?.pagination?.total ?? 0) : (loginData?.pagination?.total ?? 0)}</strong> immutable event records
            </span>
          }
        />
        {/* Navigation Sub-Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border, #e5e7eb)',
            padding: '0.75rem 1.25rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              type="button"
              variant={activeView === 'audit' ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveView('audit');
                setSearch('');
              }}
            >
              System Audit Trail
            </Button>
            <Button
              type="button"
              variant={activeView === 'logins' ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveView('logins');
                setSearch('');
              }}
            >
              User Login &amp; Security History
            </Button>
          </div>

          {/* Quick Category filter for Audit Trail */}
          {activeView === 'audit' ? (
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'payout', label: 'Payouts' },
                { id: 'user', label: 'Users' },
                { id: 'seller', label: 'Sellers' },
                { id: 'product', label: 'Products' },
                { id: 'order', label: 'Orders' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActionCategory(c.id);
                    setAuditPage(1);
                  }}
                  style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: actionCategory === c.id ? 600 : 400,
                    border: '1px solid',
                    borderColor: actionCategory === c.id ? 'var(--color-brand, #6b8f6b)' : '#e5e7eb',
                    background: actionCategory === c.id ? 'var(--color-brand-soft, #f0f5f0)' : '#fff',
                    color: actionCategory === c.id ? 'var(--color-brand, #6b8f6b)' : 'var(--color-ink, #374151)',
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
            <input
              type="search"
              aria-label="Search records"
              placeholder={activeView === 'audit' ? 'Search actions, reason, IP...' : 'Search users, email, IP...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (activeView === 'audit') setAuditPage(1);
                else setLoginPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #d1d5db)',
                fontSize: '0.875rem',
                background: '#fff',
              }}
            />
          </div>

          {activeView === 'audit' ? (
            <div style={{ width: '160px' }}>
              <select
                aria-label="Filter by entity type"
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setAuditPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #d1d5db)',
                  fontSize: '0.875rem',
                  background: '#fff',
                }}
              >
                <option value="">All Entities</option>
                <option value="PayoutRequest">PayoutRequest</option>
                <option value="User">User</option>
                <option value="SellerProfile">SellerProfile</option>
                <option value="Product">Product</option>
                <option value="Order">Order</option>
                <option value="Dispute">Dispute</option>
              </select>
            </div>
          ) : null}
        </div>

        {/* View 1: System Audit Trail */}
        {activeView === 'audit' ? (
          <>
            {auditLoading ? (
              <div style={{ padding: '1.5rem' }}>
                <TableSkeleton />
              </div>
            ) : auditError ? (
              <div style={{ padding: '1.25rem' }}>
                <Alert tone="error">{getErrorMessage(auditErr)}</Alert>
              </div>
            ) : !auditData?.items.length ? (
              <div style={{ padding: '2rem 1rem' }}>
                <EmptyState
                  title="No audit entries found"
                  description="No activities matched the current search or filters."
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortTh>Action</SortTh>
                      <SortTh>Entity</SortTh>
                      <SortTh>Performed By</SortTh>
                      <SortTh>Reason / Note</SortTh>
                      <SortTh>IP</SortTh>
                      <SortTh>When</SortTh>
                      <SortTh sortable={false} style={{ textAlign: 'right' }}>Actions</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.items.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Badge tone={getActionTone(a.action)}>
                            {a.action}
                          </Badge>
                        </td>
                        <td>
                          <strong>{a.entityType}</strong>
                          {a.entityId ? (
                            <small style={{ display: 'block', color: 'var(--color-muted, #6b7280)' }}>
                              {a.entityId.slice(0, 8)}...
                            </small>
                          ) : null}
                        </td>
                        <td>
                          {a.actor ? (
                            <div>
                              <span>{a.actor.fullName}</span>
                              {a.actor.email ? (
                                <small style={{ display: 'block', color: 'var(--color-muted, #6b7280)' }}>
                                  {a.actor.email}
                                </small>
                              ) : null}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-muted, #9ca3af)', fontStyle: 'italic' }}>
                              System
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem',
                            }}
                            title={a.reason || ''}
                          >
                            {a.reason || '—'}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem' }}>{a.ip || '—'}</code>
                        </td>
                        <td>
                          <small>{new Date(a.createdAt).toLocaleString()}</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ActionIconButton
                            icon="inspect"
                            label="Inspect Audit Event"
                            onClick={() => setInspectItem(a)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <TablePagination
              page={auditPage}
              totalPages={auditData?.pagination?.totalPages ?? 1}
              totalItems={auditData?.pagination?.total}
              pageSize={10}
              onPageChange={setAuditPage}
            />
          </>
        ) : null}

        {/* View 2: User Login & Security History */}
        {activeView === 'logins' ? (
          <>
            {loginLoading ? (
              <div style={{ padding: '1.5rem' }}>
                <TableSkeleton />
              </div>
            ) : loginError ? (
              <div style={{ padding: '1.25rem' }}>
                <Alert tone="error">{getErrorMessage(loginErr)}</Alert>
              </div>
            ) : !loginData?.items.length ? (
              <div style={{ padding: '2rem 1rem' }}>
                <EmptyState
                  title="No login records found"
                  description="No user authentication events recorded with current query."
                />
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <SortTh>Status</SortTh>
                      <SortTh>User Account</SortTh>
                      <SortTh>IP Address</SortTh>
                      <SortTh>Device &amp; User Agent</SortTh>
                      <SortTh>Attempted At</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {loginData.items.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <Badge tone={log.success ? 'success' : 'danger'}>
                            {log.success ? 'Success' : 'Failed Attempt'}
                          </Badge>
                        </td>
                        <td>
                          {log.user ? (
                            <div>
                              <strong>{log.user.fullName}</strong>
                              <small style={{ display: 'block', color: 'var(--color-muted, #6b7280)' }}>
                                {log.user.email || log.user.phone || 'No email'}
                              </small>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-muted, #9ca3af)' }}>Unknown user</span>
                          )}
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8125rem' }}>{log.ip || '—'}</code>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                              color: 'var(--color-ink-muted, #4b5563)',
                            }}
                            title={log.userAgent || ''}
                          >
                            {log.userAgent || 'Unknown client'}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(log.createdAt).toLocaleString()}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination for Logins */}
            <TablePagination
              page={loginPage}
              totalPages={loginData?.pagination?.totalPages ?? 1}
              totalItems={loginData?.pagination?.total}
              pageSize={10}
              onPageChange={setLoginPage}
            />
          </>
        ) : null}
      </TableCard>

      {/* Inspect Detail Modal */}
      {inspectItem ? (
        <AuditDetailModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
        />
      ) : null}
    </>
  );
}

function PayoutsTab() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const confirm = useConfirm();
  const toast = useToast();
  const { data, isLoading, isError, error } = useAdminPayouts(filter || undefined);
  const review = useReviewPayout();
  const payoutAction = usePayoutAction();
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const busy = review.isPending || payoutAction.isPending;

  const onError = (err: unknown) => {
    const text = getErrorMessage(err);
    setMsg({ tone: 'error', text });
    toast.error(text);
  };

  async function approve(id: string) {
    const ok = await confirm({
      title: 'Approve withdrawal',
      message: 'Approve this withdrawal? The money is sent to the seller’s Mobile Money wallet immediately.',
      confirmText: 'Approve & transfer',
      tone: 'warning',
    });
    if (!ok) return;

    review.mutate(
      { id, action: 'APPROVE' },
      {
        onSuccess: () => {
          const text = 'Approved — transfer sent to Mobile Money. Status updates when FDI confirms.';
          setMsg({ tone: 'success', text });
          toast.success(text);
        },
        onError,
      },
    );
  }

  function checkStatus(id: string) {
    payoutAction.mutate(
      { id, action: 'check' },
      {
        onSuccess: (payout) =>
          setMsg({
            tone: payout.status === 'FAILED' ? 'error' : payout.status === 'PAID' ? 'success' : 'info',
            text:
              payout.status === 'PAID'
                ? 'Transfer confirmed — payout paid.'
                : payout.status === 'FAILED'
                  ? 'Transfer failed — funds returned to the seller’s available balance.'
                  : 'Transfer still processing on Mobile Money.',
          }),
        onError,
      },
    );
  }

  const allPayouts = data || [];
  const requestedCount = allPayouts.filter((p) => ['REQUESTED', 'UNDER_REVIEW'].includes(p.status)).length;
  const approvedCount = allPayouts.filter((p) => p.status === 'APPROVED').length;
  const paidCount = allPayouts.filter((p) => p.status === 'PAID').length;

  const displayedPayouts = search
    ? allPayouts.filter(
        (p) =>
          p.seller.businessName.toLowerCase().includes(search.toLowerCase()) ||
          (p.destination?.phone && p.destination.phone.includes(search)),
      )
    : allPayouts;

  const totalPages = Math.ceil(displayedPayouts.length / pageSize);
  const paginatedPayouts = displayedPayouts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>


      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      {isLoading ? <TableSkeleton /> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
          title="Seller Payouts & Disbursals Queue"
          subtitle={
            <span>
              <strong>{requestedCount}</strong> awaiting action · <strong>{approvedCount}</strong> approved · <strong>{paidCount}</strong> paid · <strong>{allPayouts.length}</strong> total
            </span>
          }
        />
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search by seller, phone..."
          filterChips={[
            { id: '', label: 'All', count: allPayouts.length },
            { id: 'REQUESTED', label: 'Requested' },
            { id: 'UNDER_REVIEW', label: 'In Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PROCESSING', label: 'Sending' },
            { id: 'PAID', label: 'Paid' },
            { id: 'FAILED', label: 'Failed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ]}
          activeFilter={filter}
          onFilterChange={(id) => {
            setFilter(id);
            setPage(1);
          }}
          columnsAction={{
            label: 'Columns',
          }}
        />
        {!isLoading && !displayedPayouts.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No payout requests in this filter" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Seller</SortTh>
                  <SortTh>Amount</SortTh>
                  <SortTh>Send to</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedPayouts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.seller.businessName}</strong>
                      <small>{new Date(p.createdAt).toLocaleString()}</small>
                    </td>
                    <td className={styles.num}>{formatRwf(p.amount)}</td>
                    <td>
                      {p.destination?.phone || '—'}
                      <small>{prettyStatus(p.method)}</small>
                    </td>
                    <td>
                      <Badge tone={statusTone(p.status)}>{prettyStatus(p.status)}</Badge>
                      {p.reviewNotes && ['APPROVED', 'FAILED'].includes(p.status) ? (
                        <small>{p.reviewNotes}</small>
                      ) : null}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {['REQUESTED', 'UNDER_REVIEW'].includes(p.status) ? (
                          <ActionIconButton
                            icon="send"
                            tone="success"
                            label="Approve & Send to MoMo"
                            disabled={busy}
                            onClick={() => approve(p.id)}
                          />
                        ) : null}
                        {p.status === 'APPROVED' ? (
                          <ActionIconButton
                            icon="send"
                            tone="purple"
                            label="Retry Transfer"
                            disabled={busy}
                            onClick={() =>
                              payoutAction.mutate(
                                { id: p.id, action: 'send' },
                                {
                                  onSuccess: () => setMsg({ tone: 'success', text: 'Transfer sent to Mobile Money.' }),
                                  onError,
                                },
                              )
                            }
                          />
                        ) : null}
                        {p.status === 'PROCESSING' ? (
                          <ActionIconButton
                            icon="refresh"
                            tone="warning"
                            label="Check Mobile Money Status"
                            disabled={busy}
                            onClick={() => checkStatus(p.id)}
                          />
                        ) : null}
                        {['REQUESTED', 'UNDER_REVIEW', 'APPROVED'].includes(p.status) ? (
                          <ActionIconButton
                            icon="cross"
                            tone="danger"
                            label="Cancel Withdrawal"
                            disabled={busy}
                            onClick={() =>
                              review.mutate(
                                { id: p.id, action: 'CANCEL' },
                                {
                                  onSuccess: () => setMsg({ tone: 'success', text: 'Payout cancelled — funds returned to the seller.' }),
                                  onError,
                                },
                              )
                            }
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={displayedPayouts.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>
    </>
  );
}

const DISPUTE_FILTERS: Array<{ id: DisputeStatus | ''; label: string }> = [
  { id: '', label: 'All' },
  { id: 'OPEN', label: 'Waiting for seller' },
  { id: 'SELLER_RESPONDED', label: 'Seller replied' },
  { id: 'ESCALATED', label: 'Support involved' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'WITHDRAWN', label: 'Withdrawn' },
];

function OrderDisputesPanel() {
  const [status, setStatus] = useState<DisputeStatus | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, isError, error } = useAdminDisputes(status || undefined, q.trim() || undefined);
  const counts = data?.counts || {};
  const activeTotal = (counts.OPEN ?? 0) + (counts.SELLER_RESPONDED ?? 0) + (counts.ESCALATED ?? 0);

  const allDisputes = data?.items || [];
  const totalPages = Math.ceil(allDisputes.length / pageSize);
  const paginatedDisputes = allDisputes.slice((page - 1) * pageSize, page * pageSize);

  return (
    <TableCard>
      <TableBanner
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        }
        title="Order Disputes & Claims"
        subtitle={
          <span>
            <strong>{activeTotal}</strong> active disputes · <strong>{allDisputes.length}</strong> total cases
          </span>
        }
      />
      <TableToolbar
        searchValue={q}
        onSearchChange={(val) => {
          setQ(val);
          setPage(1);
        }}
        searchPlaceholder="Search dispute, order, customer, seller..."
        filterChips={DISPUTE_FILTERS.map((f) => ({
          id: f.id,
          label: f.label,
          count: f.id && counts[f.id] ? counts[f.id] : undefined,
        }))}
        activeFilter={status}
        onFilterChange={(id) => {
          setStatus(id as DisputeStatus | '');
          setPage(1);
        }}
        columnsAction={{
          label: 'Columns',
        }}
      />
      {isLoading ? <TableSkeleton rows={4} /> : null}
      {isError ? (
        <div className={styles.panelBody}>
          <Alert tone="error">{getErrorMessage(error)}</Alert>
        </div>
      ) : null}
      {!isLoading && !allDisputes.length ? (
        <div className={styles.panelBody}>
          <EmptyState compact title="No disputes in this view" />
        </div>
      ) : null}
      {allDisputes.length ? (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.cardTable}`}>
            <thead>
              <tr>
                <SortTh>Dispute</SortTh>
                <SortTh>Customer → Seller</SortTh>
                <SortTh>Problem</SortTh>
                <SortTh>Status</SortTh>
                <SortTh sortable={false}>Actions</SortTh>
              </tr>
            </thead>
            <tbody>
              {paginatedDisputes.map((d) => (
                <tr key={d.id}>
                  <td data-cell="title">
                    <strong>{d.subject}</strong>
                    <small className={styles.mono}>
                      {d.disputeNumber} · {d.orderNumber}
                    </small>
                  </td>
                  <td data-label="Customer → Seller">
                    {d.customerName}
                    <small>{d.sellerName}</small>
                  </td>
                  <td data-label="Problem">
                    {disputeTypeLabel(d.type)}
                    <small>{d.messageCount} message{d.messageCount === 1 ? '' : 's'}</small>
                  </td>
                  <td data-label="Status">
                    <Badge tone={disputeStatusTone(d.status)}>{disputeStatusLabel(d.status)}</Badge>
                    <small>Updated {new Date(d.updatedAt).toLocaleString()}</small>
                  </td>
                  <td data-cell="action">
                    <Link to={`/admin/disputes/${d.id}`} title={isDisputeActive(d.status) ? 'Review Dispute' : 'View Dispute'}>
                      <ActionIconButton
                        icon={isDisputeActive(d.status) ? 'edit' : 'view'}
                        tone={isDisputeActive(d.status) ? 'brand' : 'info'}
                        label={isDisputeActive(d.status) ? 'Review Dispute' : 'View Dispute'}
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={allDisputes.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </TableCard>
  );
}

function DisputesTab() {
  const { data, isLoading, isError, error } = useAdminReturns();
  const [returnsPage, setReturnsPage] = useState(1);
  const pageSize = 10;
  const confirm = useConfirm();
  const toast = useToast();
  const review = useReviewReturn();
  const refundAction = useRefundAction();
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const busy = review.isPending || refundAction.isPending;
  const onError = (err: unknown) => {
    const text = getErrorMessage(err);
    setMsg({ tone: 'error', text });
    toast.error(text);
  };

  async function onApproveReturn(id: string) {
    const ok = await confirm({
      title: 'Approve return & refund',
      message: 'Approve this return? The refund is sent to the customer’s Mobile Money number immediately.',
      confirmText: 'Approve & refund',
      tone: 'warning',
    });
    if (!ok) return;

    review.mutate(
      { id, action: 'APPROVE' },
      {
        onSuccess: () => {
          const text = 'Return approved — refund sent to Mobile Money.';
          setMsg({ tone: 'success', text });
          toast.success(text);
        },
        onError,
      },
    );
  }

  function runRefund(returnId: string, action: 'send' | 'check') {
    refundAction.mutate(
      { returnId, action },
      {
        onSuccess: (refund) =>
          setMsg({
            tone: refund.status === 'FAILED' ? 'error' : refund.status === 'REFUNDED' ? 'success' : 'info',
            text:
              refund.status === 'REFUNDED'
                ? 'Refund confirmed on Mobile Money.'
                : refund.status === 'FAILED'
                  ? 'Refund failed on Mobile Money. You can retry it.'
                  : 'Refund sent — waiting for Mobile Money confirmation.',
          }),
        onError,
      },
    );
  }

  const returnsList = data || [];
  const totalPages = Math.ceil(returnsList.length / pageSize);
  const paginatedReturns = returnsList.slice((returnsPage - 1) * pageSize, returnsPage * pageSize);

  return (
    <>

      <OrderDisputesPanel />
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      <TableCard>
        <TableBanner
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          }
          title="Customer Return & Refund Requests"
          subtitle={
            <span>
              <strong>{returnsList.filter((r) => ['REQUESTED', 'UNDER_REVIEW'].includes(r.status)).length}</strong> pending review · <strong>{returnsList.length}</strong> total return requests
            </span>
          }
        />
        {isLoading ? <TableSkeleton /> : null}
        {!isLoading && !returnsList.length ? (
          <div className={styles.panelBody}>
            <EmptyState compact title="No return requests" />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortTh>Order</SortTh>
                  <SortTh>Customer</SortTh>
                  <SortTh>Reason</SortTh>
                  <SortTh>Status</SortTh>
                  <SortTh sortable={false}>Actions</SortTh>
                </tr>
              </thead>
              <tbody>
                {paginatedReturns.map((row) => {
                  const refund = row.refunds[row.refunds.length - 1];
                  return (
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
                        {refund ? (
                          <small>
                            Refund {formatRwf(refund.amount)} · {prettyStatus(refund.status)}
                          </small>
                        ) : null}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {['REQUESTED', 'UNDER_REVIEW'].includes(row.status) ? (
                            <>
                              <ActionIconButton
                                icon="check"
                                tone="success"
                                title="Approve & refund"
                                aria-label="Approve and refund return request"
                                disabled={busy}
                                onClick={() => onApproveReturn(row.id)}
                              />
                              <ActionIconButton
                                icon="cross"
                                tone="danger"
                                title="Reject return request"
                                aria-label="Reject return request"
                                disabled={busy}
                                onClick={() =>
                                  review.mutate(
                                    { id: row.id, action: 'REJECT' },
                                    { onSuccess: () => setMsg({ tone: 'success', text: 'Return rejected' }), onError },
                                  )
                                }
                              />
                            </>
                          ) : null}
                          {refund && ['INITIATED', 'FAILED'].includes(refund.status) ? (
                            <ActionIconButton
                              icon="send"
                              tone="purple"
                              title="Retry refund"
                              aria-label="Retry refund transfer"
                              disabled={busy}
                              onClick={() => runRefund(row.id, 'send')}
                            />
                          ) : null}
                          {refund?.status === 'PENDING' ? (
                            <ActionIconButton
                              icon="refresh"
                              tone="warning"
                              title="Check refund status"
                              aria-label="Check refund status"
                              disabled={busy}
                              onClick={() => runRefund(row.id, 'check')}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          page={returnsPage}
          totalPages={totalPages}
          totalItems={returnsList.length}
          pageSize={pageSize}
          onPageChange={setReturnsPage}
        />
      </TableCard>
    </>
  );
}

function ProfileTab() {
  const { data: user } = useMe();
  return (
    <>

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
