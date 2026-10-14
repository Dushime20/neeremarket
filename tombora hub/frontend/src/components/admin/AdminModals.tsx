import { Link } from 'react-router-dom';
import {
  AuditLogItem,
  useAdminProduct,
  useAdminSeller,
  useAdminUser,
  useModerateProduct,
  useModerateSeller,
  useUpdateUserStatus,
  useUnlockUser,
} from '@/api/hooks';
import { Badge, Button, TableSkeleton, useConfirm, useToast } from '@/components/ui';
import { formatRwf } from '@/utils/money';
import { prettyStatus, statusTone } from '@/utils/status';
import styles from './AdminModals.module.css';

// ─── User Detail Modal ────────────────────────────────────────────────────────

export function UserDetailModal({
  userId,
  onClose,
  onStatusUpdated,
}: {
  userId: string;
  onClose: () => void;
  onStatusUpdated?: () => void;
}) {
  const { data: user, isLoading, isError } = useAdminUser(userId);
  const updateStatus = useUpdateUserStatus();
  const unlockUser = useUnlockUser();
  const confirm = useConfirm();
  const toast = useToast();

  const isLocked = !!(user?.lockedUntil && new Date(user.lockedUntil) > new Date());

  async function handleUnlock() {
    if (!user) return;
    const ok = await confirm({
      title: 'Unlock user account',
      message: `Unlock ${user.fullName}'s account and reset failed login attempts?`,
      confirmText: 'Unlock account',
      tone: 'info',
    });
    if (!ok) return;

    try {
      await unlockUser.mutateAsync(user.id);
      toast.success(`Account unlocked for ${user.fullName}`);
      onStatusUpdated?.();
    } catch {
      toast.error('Failed to unlock user account');
    }
  }

  async function handleToggleStatus() {
    if (!user) return;
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const ok = await confirm({
      title: nextStatus === 'SUSPENDED' ? 'Suspend user account' : 'Activate user account',
      message:
        nextStatus === 'SUSPENDED'
          ? `Suspend ${user.fullName}? They will not be able to log in or transact.`
          : `Re-activate ${user.fullName}'s account?`,
      confirmText: nextStatus === 'SUSPENDED' ? 'Suspend account' : 'Activate account',
      tone: nextStatus === 'SUSPENDED' ? 'danger' : 'info',
    });
    if (!ok) return;

    try {
      await updateStatus.mutateAsync({ id: user.id, status: nextStatus });
      toast.success(`Account marked as ${prettyStatus(nextStatus)}`);
      onStatusUpdated?.();
    } catch {
      toast.error('Failed to update user status');
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <header className={styles.modalHead}>
          <div className={styles.headTitle}>
            <p className={styles.kicker}>User Profile</p>
            <h2 id="user-modal-title" className={styles.title}>
              {user?.fullName || 'User Details'}
              {user ? <Badge tone={statusTone(user.status)}>{prettyStatus(user.status)}</Badge> : null}
              {isLocked ? <Badge tone="danger">Temporarily Locked</Badge> : null}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className={styles.modalBody}>
          {isLoading ? <TableSkeleton rows={4} /> : null}
          {isError ? <p className={styles.fieldValue}>Failed to load user information.</p> : null}

          {user ? (
            <>
              {isLocked ? (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.875rem' }}>
                      Account is temporarily locked
                    </strong>
                    <span style={{ color: '#7f1d1d', fontSize: '0.8125rem' }}>
                      Locked due to {user.failedLoginCount || 5} consecutive failed logins until{' '}
                      {new Date(user.lockedUntil!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={unlockUser.isPending}
                    onClick={handleUnlock}
                  >
                    {unlockUser.isPending ? 'Unlocking...' : 'Unlock Account'}
                  </Button>
                </div>
              ) : null}

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Account Identity</h3>
                  <span className={styles.mono}>{user.id}</span>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Full Name</span>
                    <span className={styles.fieldValue}>{user.fullName}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Email Address</span>
                    <span className={styles.fieldValue}>
                      {user.email || '—'}{' '}
                      {user.emailVerifiedAt ? <Badge tone="success">Verified</Badge> : null}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Phone Number</span>
                    <span className={styles.fieldValue}>
                      {user.phone || '—'}{' '}
                      {user.phoneVerifiedAt ? <Badge tone="success">Verified</Badge> : null}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Registered On</span>
                    <span className={styles.fieldValue}>
                      {new Date(user.createdAt).toLocaleDateString()} at{' '}
                      {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className={styles.field} style={{ marginTop: '0.85rem' }}>
                  <span className={styles.fieldLabel}>Assigned Roles</span>
                  <div className={styles.roles}>
                    {user.roles.map((r) => (
                      <span key={r} className={styles.roleTag}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Platform Activity</h3>
                </div>
                <div className={styles.grid3}>
                  <div className={styles.metricCard}>
                    <span>Orders Placed</span>
                    <strong>{user._count?.orders ?? 0}</strong>
                  </div>
                  <div className={styles.metricCard}>
                    <span>Reviews Written</span>
                    <strong>{user._count?.reviews ?? 0}</strong>
                  </div>
                  <div className={styles.metricCard}>
                    <span>Disputes</span>
                    <strong>{user._count?.disputes ?? 0}</strong>
                  </div>
                </div>
              </section>

              {user.sellerProfile ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h3 className={styles.sectionTitle}>Connected Seller Profile</h3>
                    <Badge tone={statusTone(user.sellerProfile.verificationStatus)}>
                      {prettyStatus(user.sellerProfile.verificationStatus)}
                    </Badge>
                  </div>
                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Business Name</span>
                      <span className={styles.fieldValue}>{user.sellerProfile.businessName}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Store</span>
                      <span className={styles.fieldValue}>
                        {user.sellerProfile.store ? (
                          <Link to={`/stores/${user.sellerProfile.store.slug}`} target="_blank">
                            {user.sellerProfile.store.name} ↗
                          </Link>
                        ) : (
                          'No storefront yet'
                        )}
                      </span>
                    </div>
                  </div>
                </section>
              ) : null}

              {user.addresses && user.addresses.length > 0 ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h3 className={styles.sectionTitle}>Saved Addresses ({user.addresses.length})</h3>
                  </div>
                  {user.addresses.map((a) => (
                    <div key={a.id} className={styles.field} style={{ marginBottom: '0.5rem' }}>
                      <span className={styles.fieldValue}>
                        <strong>{a.fullName || a.recipientName || 'Address'}</strong> ({a.phone}) ·{' '}
                        {a.street || a.streetAddress || ''}{a.sector ? `, ${a.sector}` : ''}, {a.district},{' '}
                        {a.province} {a.isDefault ? <Badge tone="brand">Default</Badge> : null}
                      </span>
                    </div>
                  ))}
                </section>
              ) : null}

              {user.loginHistory && user.loginHistory.length > 0 ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h3 className={styles.sectionTitle}>Recent Login Activity & Security</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {user.loginHistory.map((lh) => (
                      <div
                        key={lh.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          background: 'var(--color-surface, #f9fafb)',
                          fontSize: '0.8125rem',
                          border: '1px solid var(--color-border, #e5e7eb)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Badge tone={lh.success ? 'success' : 'danger'}>
                            {lh.success ? 'Success' : 'Failed'}
                          </Badge>
                          <span>IP: <code>{lh.ip || 'Unknown'}</code></span>
                          {lh.userAgent ? (
                            <span
                              style={{
                                color: 'var(--color-muted, #6b7280)',
                                maxWidth: '240px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={lh.userAgent}
                            >
                              {lh.userAgent}
                            </span>
                          ) : null}
                        </div>
                        <span style={{ color: 'var(--color-muted, #6b7280)', whiteSpace: 'nowrap' }}>
                          {new Date(lh.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className={styles.modalFoot}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {user && isLocked ? (
            <Button
              type="button"
              variant="secondary"
              disabled={unlockUser.isPending}
              onClick={handleUnlock}
            >
              {unlockUser.isPending ? 'Unlocking...' : 'Unlock Account'}
            </Button>
          ) : null}
          {user ? (
            <Button
              type="button"
              variant={user.status === 'ACTIVE' ? 'danger' : 'primary'}
              disabled={updateStatus.isPending}
              onClick={handleToggleStatus}
            >
              {user.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
            </Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

// ─── Seller Detail Modal ──────────────────────────────────────────────────────

export function SellerDetailModal({
  sellerId,
  onClose,
  onModerated,
}: {
  sellerId: string;
  onClose: () => void;
  onModerated?: () => void;
}) {
  const { data: seller, isLoading, isError } = useAdminSeller(sellerId);
  const moderate = useModerateSeller();
  const confirm = useConfirm();
  const toast = useToast();

  async function handleModerate(status: 'VERIFIED' | 'REJECTED') {
    if (!seller) return;
    const ok = await confirm({
      title: status === 'VERIFIED' ? 'Verify seller' : 'Reject seller verification',
      message:
        status === 'VERIFIED'
          ? `Grant verified status to “${seller.businessName}”? Their storefront will be fully active.`
          : `Reject verification for “${seller.businessName}”?`,
      confirmText: status === 'VERIFIED' ? 'Verify seller' : 'Reject verification',
      tone: status === 'VERIFIED' ? 'info' : 'danger',
    });
    if (!ok) return;

    try {
      await moderate.mutateAsync({
        id: seller.id,
        verificationStatus: status,
        reason: status === 'REJECTED' ? 'Does not meet documentation guidelines' : undefined,
      });
      toast.success(status === 'VERIFIED' ? 'Seller verified successfully!' : 'Seller verification rejected');
      onModerated?.();
    } catch {
      toast.error('Failed to moderate seller');
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="seller-modal-title">
        <header className={styles.modalHead}>
          <div className={styles.headTitle}>
            <p className={styles.kicker}>Seller Moderation</p>
            <h2 id="seller-modal-title" className={styles.title}>
              {seller?.businessName || 'Seller Details'}
              {seller ? (
                <Badge tone={statusTone(seller.verificationStatus)}>
                  {prettyStatus(seller.verificationStatus)}
                </Badge>
              ) : null}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className={styles.modalBody}>
          {isLoading ? <TableSkeleton rows={4} /> : null}
          {isError ? <p className={styles.fieldValue}>Failed to load seller information.</p> : null}

          {seller ? (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Business Overview</h3>
                  {seller.store ? (
                    <Link to={`/stores/${seller.store.slug}`} target="_blank" className={styles.fieldValue}>
                      View Storefront ↗
                    </Link>
                  ) : null}
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Business Name</span>
                    <span className={styles.fieldValue}>{seller.businessName}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Business Category</span>
                    <span className={styles.fieldValue}>{seller.businessCategory || 'Retail'}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Contact Phone</span>
                    <span className={styles.fieldValue}>{seller.businessPhone || seller.user.phone || '—'}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>WhatsApp</span>
                    <span className={styles.fieldValue}>{seller.whatsappNumber || '—'}</span>
                  </div>
                </div>

                {seller.description ? (
                  <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                    <span className={styles.fieldLabel}>Description</span>
                    <p className={styles.fieldValue} style={{ margin: '0.2rem 0 0' }}>
                      {seller.description}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Store Owner / Account</h3>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Owner Full Name</span>
                    <span className={styles.fieldValue}>{seller.user.fullName}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Account Email</span>
                    <span className={styles.fieldValue}>{seller.user.email || '—'}</span>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Location & Shop</h3>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Region</span>
                    <span className={styles.fieldValue}>
                      {seller.district || '—'}, {seller.province || '—'}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Sector / Cell</span>
                    <span className={styles.fieldValue}>
                      {seller.sector || '—'} {seller.cell ? `/ ${seller.cell}` : ''}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Market Location</span>
                    <span className={styles.fieldValue}>{seller.marketLocation || '—'}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Shop Location / Stand</span>
                    <span className={styles.fieldValue}>{seller.shopLocation || '—'}</span>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Performance & Finances</h3>
                </div>
                <div className={styles.grid3}>
                  <div className={styles.metricCard}>
                    <span>Available Balance</span>
                    <strong>{formatRwf(seller.wallet?.availableBalance || '0')}</strong>
                  </div>
                  <div className={styles.metricCard}>
                    <span>Pending Balance</span>
                    <strong>{formatRwf(seller.wallet?.pendingBalance || '0')}</strong>
                  </div>
                  <div className={styles.metricCard}>
                    <span>Orders Completed</span>
                    <strong>{seller.totalOrders || seller._count?.sellerOrders || 0}</strong>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>

        <footer className={styles.modalFoot}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {seller && seller.verificationStatus !== 'VERIFIED' ? (
            <Button
              type="button"
              disabled={moderate.isPending}
              onClick={() => handleModerate('VERIFIED')}
            >
              Verify Seller
            </Button>
          ) : null}
          {seller && seller.verificationStatus !== 'REJECTED' ? (
            <Button
              type="button"
              variant="danger"
              disabled={moderate.isPending}
              onClick={() => handleModerate('REJECTED')}
            >
              Reject Verification
            </Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────

export function ProductDetailModal({
  productId,
  onClose,
  onModerated,
}: {
  productId: string;
  onClose: () => void;
  onModerated?: () => void;
}) {
  const { data: product, isLoading, isError } = useAdminProduct(productId);
  const moderate = useModerateProduct();
  const confirm = useConfirm();
  const toast = useToast();

  async function handleModerate(status: 'ACTIVE' | 'REJECTED') {
    if (!product) return;
    const ok = await confirm({
      title: status === 'ACTIVE' ? 'Approve product listing' : 'Reject product listing',
      message:
        status === 'ACTIVE'
          ? `Publish “${product.name}” to the marketplace catalog? Shoppers will be able to purchase it immediately.`
          : `Reject listing for “${product.name}”?`,
      confirmText: status === 'ACTIVE' ? 'Approve & Publish' : 'Reject Listing',
      tone: status === 'ACTIVE' ? 'info' : 'danger',
    });
    if (!ok) return;

    try {
      await moderate.mutateAsync({
        id: product.id,
        status,
        reason: status === 'REJECTED' ? 'Quality or policy violation' : undefined,
      });
      toast.success(status === 'ACTIVE' ? 'Product approved and published!' : 'Product listing rejected');
      onModerated?.();
    } catch {
      toast.error('Failed to update product');
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <header className={styles.modalHead}>
          <div className={styles.headTitle}>
            <p className={styles.kicker}>Catalog Moderation</p>
            <h2 id="product-modal-title" className={styles.title}>
              {product?.name || 'Product Details'}
              {product ? <Badge tone={statusTone(product.status)}>{prettyStatus(product.status)}</Badge> : null}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className={styles.modalBody}>
          {isLoading ? <TableSkeleton rows={4} /> : null}
          {isError ? <p className={styles.fieldValue}>Failed to load product details.</p> : null}

          {product ? (
            <>
              {product.images && product.images.length > 0 ? (
                <div className={styles.gallery}>
                  {product.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.altText || product.name}
                      className={`${styles.galleryThumb} ${img.isPrimary ? styles.galleryThumbPrimary : ''}`}
                    />
                  ))}
                </div>
              ) : null}

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Product Details</h3>
                  <Link to={`/products/${product.slug}`} target="_blank" className={styles.fieldValue}>
                    View on Marketplace ↗
                  </Link>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Selling Price</span>
                    <strong className={styles.fieldValue} style={{ fontSize: '1.1rem', color: '#166534' }}>
                      {formatRwf(product.discountPrice || product.price)}
                      {product.discountPrice ? (
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginLeft: '0.4rem', fontSize: '0.85rem' }}>
                          {formatRwf(product.price)}
                        </span>
                      ) : null}
                    </strong>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Store</span>
                    <span className={styles.fieldValue}>{product.store.name}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Category</span>
                    <span className={styles.fieldValue}>{product.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Condition</span>
                    <span className={styles.fieldValue}>{product.condition || 'NEW'}</span>
                  </div>
                </div>

                {product.shortDescription ? (
                  <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                    <span className={styles.fieldLabel}>Summary</span>
                    <p className={styles.fieldValue} style={{ margin: '0.2rem 0 0' }}>
                      {product.shortDescription}
                    </p>
                  </div>
                ) : null}

                {product.description ? (
                  <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                    <span className={styles.fieldLabel}>Full Description</span>
                    <p className={styles.fieldValue} style={{ margin: '0.2rem 0 0', whiteSpace: 'pre-line' }}>
                      {product.description}
                    </p>
                  </div>
                ) : null}
              </section>

              {product.variants && product.variants.length > 0 ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h3 className={styles.sectionTitle}>Variants & Stock ({product.variants.length})</h3>
                  </div>
                  <table className={styles.variantsTable}>
                    <thead>
                      <tr>
                        <th>Variant</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Available Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <strong>{v.name || 'Default'}</strong>
                            {Object.entries(v.attributes || {}).length > 0 ? (
                              <small style={{ display: 'block', color: '#64748b' }}>
                                {Object.entries(v.attributes)
                                  .map(([k, val]) => `${k}: ${val}`)
                                  .join(', ')}
                              </small>
                            ) : null}
                          </td>
                          <td>
                            <span className={styles.mono}>{v.sku || '—'}</span>
                          </td>
                          <td>{v.price ? formatRwf(v.price) : formatRwf(product.price)}</td>
                          <td>
                            <strong>{v.inventory?.available ?? 0} units</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {product.specifications && product.specifications.length > 0 ? (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h3 className={styles.sectionTitle}>Specifications</h3>
                  </div>
                  <div className={styles.grid2}>
                    {product.specifications.map((spec) => (
                      <div key={spec.id} className={styles.field}>
                        <span className={styles.fieldLabel}>{spec.name}</span>
                        <span className={styles.fieldValue}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className={styles.modalFoot}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {product && product.status !== 'ACTIVE' ? (
            <Button
              type="button"
              disabled={moderate.isPending}
              onClick={() => handleModerate('ACTIVE')}
            >
              Approve &amp; Publish
            </Button>
          ) : null}
          {product && product.status !== 'REJECTED' ? (
            <Button
              type="button"
              variant="danger"
              disabled={moderate.isPending}
              onClick={() => handleModerate('REJECTED')}
            >
              Reject Listing
            </Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

// ─── Audit Detail Modal ───────────────────────────────────────────────────────

export function AuditDetailModal({
  item,
  onClose,
}: {
  item: AuditLogItem | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
      >
        <header className={styles.modalHead}>
          <div className={styles.modalTitleWrap}>
            <span className={styles.kicker}>Audit Inspection</span>
            <h2 id="audit-modal-title" className={styles.modalTitle}>
              {item.action}
            </h2>
            <div className={styles.badgeRow}>
              <Badge tone="accent">{item.entityType}</Badge>
              {item.entityId ? <Badge tone="muted">ID: {item.entityId}</Badge> : null}
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>

        <div className={styles.modalBody}>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>Event Metadata</h3>
            </div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Actor</span>
                <span className={styles.fieldValue}>
                  {item.actor ? (
                    <>
                      <strong>{item.actor.fullName}</strong>
                      {item.actor.email ? <small> ({item.actor.email})</small> : null}
                    </>
                  ) : (
                    'System / Automated'
                  )}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Client IP</span>
                <span className={styles.fieldValue}>
                  <code>{item.ip || 'Not recorded'}</code>
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Recorded At</span>
                <span className={styles.fieldValue}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Reason / Notes</span>
                <span className={styles.fieldValue}>
                  {item.reason || 'None specified'}
                </span>
              </div>
            </div>
          </section>

          {item.before || item.after ? (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>State Changes (Payload)</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {item.before ? (
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', color: 'var(--color-muted, #6b7280)', marginBottom: '0.375rem' }}>
                      Previous State (Before)
                    </h4>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        background: '#f8fafc',
                        border: '1px solid var(--color-border, #e2e8f0)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                        maxHeight: '220px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {JSON.stringify(item.before, null, 2)}
                    </pre>
                  </div>
                ) : null}

                {item.after ? (
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', color: 'var(--color-muted, #6b7280)', marginBottom: '0.375rem' }}>
                      Updated State (After)
                    </h4>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        background: '#f8fafc',
                        border: '1px solid var(--color-border, #e2e8f0)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                        maxHeight: '220px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {JSON.stringify(item.after, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <footer className={styles.modalFoot}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}
