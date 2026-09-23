import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAdjustInventory, useMe, useSellerInventory, type InventoryRow } from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, TableSkeleton } from '@/components/ui';
import { ICONS, MetricIcon } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { prettyStatus, statusTone } from '@/utils/status';
import { variantLabel } from '@/utils/variant';
import styles from './workspace.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Available' },
  { id: 'low', label: 'Low' },
  { id: 'out', label: 'Out of stock' },
  { id: 'off', label: 'Not available' },
];

export function SellerInventoryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: user } = useMe();
  const q = params.get('q') || '';
  const stock = params.get('stock') || 'all';
  const page = Math.max(1, Number(params.get('page') || 1));
  const [search, setSearch] = useState(q);
  const { data, isLoading, isError, error } = useSellerInventory(stock, q || undefined, page);

  useEffect(() => {
    setSearch(q);
  }, [q]);
  const [banner, setBanner] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!user) {
    return (
      <div className={styles.gate}>
        <EmptyState
          title="Seller login required"
          actionLabel="Log in"
          onAction={() => navigate('/login?next=/seller/inventory')}
        />
      </div>
    );
  }

  const summary = data?.summary;

  function setStockFilter(nextStock: string) {
    const next = new URLSearchParams(params);
    if (nextStock === 'all') next.delete('stock');
    else next.set('stock', nextStock);
    next.delete('page');
    setParams(next);
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setParams(next);
  }

  function applySearch(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set('q', search.trim());
    else next.delete('q');
    next.delete('page');
    setParams(next);
  }

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Inventory | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Stock</p>
          <h1>Inventory</h1>
          <p>
            Every option is its own stock line: model, size, color, generation, version, or any other
            attribute. Quantity 0 is out of stock. Not available hides that option from buyers.
          </p>
        </div>
        <Link to="/seller/products/new">
          <Button type="button" size="sm">
            Add product
          </Button>
        </Link>
      </header>

      {banner ? <Alert tone="success">{banner}</Alert> : null}
      {err ? <Alert tone="error">{err}</Alert> : null}

      <section className={`${styles.kpis} ${styles.kpisWide}`} aria-label="Stock summary">
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="brand">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Variants</span>
          </div>
          <strong>{summary?.variants ?? 0}</strong>
          <em>Attribute combinations</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="ok">
              <MetricIcon path={ICONS.bag} />
            </span>
            <span>Available</span>
          </div>
          <strong>{summary?.inStock ?? 0}</strong>
          <em>Above low-stock level</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="warn">
              <MetricIcon path={ICONS.hold} />
            </span>
            <span>Low</span>
          </div>
          <strong>{summary?.lowStock ?? 0}</strong>
          <em>Need restock soon</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="warn">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Out</span>
          </div>
          <strong>{summary?.outOfStock ?? 0}</strong>
          <em>Not orderable</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="accent">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Not available</span>
          </div>
          <strong>{summary?.notOffered ?? 0}</strong>
          <em>Hidden from buyers</em>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.filters} role="tablist" aria-label="Stock status">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`${styles.chip} ${stock === filter.id ? styles.chipOn : ''}`}
                onClick={() => setStockFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <form className={styles.inlineSearch} onSubmit={applySearch}>
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product, SKU, model, size, color"
            />
          </form>
        </div>
        {isLoading ? (
          <div className={styles.panelBody}>
            <TableSkeleton />
          </div>
        ) : null}
        {isError ? (
          <div className={styles.panelBody}>
            <Alert tone="error">{getErrorMessage(error)}</Alert>
          </div>
        ) : null}
        {!isLoading && !data?.items.length ? (
          <div className={styles.panelBody}>
            <EmptyState
              compact
              title="No stock lines in this view"
              description="Add a product and set attributes such as model, size, color, or generation. Each combination gets its own stock."
              actionLabel="Add product"
              onAction={() => navigate('/seller/products/new')}
            />
          </div>
        ) : null}
        {data?.items.length ? (
          <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Attributes</th>
                  <th>On hand</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <InventoryRowEditor
                    key={row.id}
                    row={row}
                    onSaved={(message) => {
                      setBanner(message);
                      setErr(null);
                    }}
                    onError={(message) => {
                      setErr(message);
                      setBanner(null);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination.totalPages > 1 ? (
            <div className={styles.panelBody}>
              <div className={styles.pagination}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className={styles.muted}>
                  Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} stock lines
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

function InventoryRowEditor({
  row,
  onSaved,
  onError,
}: {
  row: InventoryRow;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const adjust = useAdjustInventory();
  const [qty, setQty] = useState(String(row.quantity));

  useEffect(() => {
    setQty(String(row.quantity));
  }, [row.quantity]);

  const status = !row.isActive
    ? 'NOT_AVAILABLE'
    : row.isOut
      ? 'OUT_OF_STOCK'
      : row.isLow
        ? 'LOW_STOCK'
        : 'IN_STOCK';
  const attributeEntries = Object.entries(row.attributes).filter(
    ([key, value]) => !(key.toLowerCase() === 'type' && String(value).toLowerCase() === 'standard'),
  );

  async function save(setQuantity?: number, isAvailable?: boolean, reason?: string) {
    try {
      await adjust.mutateAsync({ variantId: row.id, setQuantity, isAvailable, reason });
      const label = variantLabel(row.name, row.attributes);
      onSaved(
        isAvailable === false
          ? `${row.product.name} · ${label} is not available`
          : isAvailable === true
            ? `${row.product.name} · ${label} is available`
            : `Updated ${row.product.name} · ${label}`,
      );
    } catch (ex) {
      onError(getErrorMessage(ex));
    }
  }

  return (
    <tr>
      <td>
        <div className={styles.item}>
          {row.product.image ? (
            <img className={styles.thumb} src={row.product.image} alt="" />
          ) : (
            <span className={styles.thumb} />
          )}
          <span>
            <strong>{row.product.name}</strong>
            <small>{row.sku}</small>
          </span>
        </div>
      </td>
      <td>
        <strong>{variantLabel(row.name, row.attributes)}</strong>
        <div className={styles.attrList}>
          {attributeEntries.length ? (
            attributeEntries.map(([key, value]) => (
              <span key={key} className={styles.attrChip}>
                <em>{key}</em> {value}
              </span>
            ))
          ) : (
            <span className={styles.attrChip}>Standard</span>
          )}
        </div>
      </td>
      <td className={styles.num}>{row.quantity}</td>
      <td className={styles.num}>{row.reserved}</td>
      <td className={styles.num}>
        <strong>{row.available}</strong>
      </td>
      <td>
        <Badge tone={statusTone(status)}>{prettyStatus(status)}</Badge>
      </td>
      <td>
        <form
          className={styles.stockForm}
          onSubmit={(e) => {
            e.preventDefault();
            void save(Number(qty));
          }}
        >
          <input
            className={styles.stockInput}
            type="number"
            min={row.reserved}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-label={`On-hand quantity for ${variantLabel(row.name, row.attributes)}`}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={adjust.isPending}>
            Save
          </Button>
          {row.isActive ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={adjust.isPending}
              onClick={() => void save(undefined, false, 'Marked not available')}
            >
              Not available
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={adjust.isPending}
              onClick={() => void save(undefined, true, 'Marked available')}
            >
              Mark available
            </Button>
          )}
          {row.available > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={adjust.isPending}
              onClick={() => void save(row.reserved, undefined, 'Marked out of stock')}
            >
              Mark out
            </Button>
          ) : null}
        </form>
      </td>
    </tr>
  );
}
