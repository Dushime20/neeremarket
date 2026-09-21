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
  { id: 'out', label: 'Out of stock' },
  { id: 'low', label: 'Low' },
  { id: 'in', label: 'Healthy' },
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
          <p>Track on-hand units per color and size. Buyers cannot order a variant at 0 available.</p>
        </div>
        <Link to="/seller/products/new">
          <Button type="button" size="sm">
            Add product
          </Button>
        </Link>
      </header>

      {banner ? <Alert tone="success">{banner}</Alert> : null}
      {err ? <Alert tone="error">{err}</Alert> : null}

      <section className={styles.kpis} aria-label="Stock summary">
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="brand">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Variants</span>
          </div>
          <strong>{summary?.variants ?? 0}</strong>
          <em>Color / size SKUs</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="ok">
              <MetricIcon path={ICONS.bag} />
            </span>
            <span>Healthy</span>
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
              placeholder="Product, SKU, color, size"
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
              title="No variants in this view"
              description="Create listings with color and size so you can track stock per SKU."
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
                  <th>Variant</th>
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
                  Page {data.pagination.page} of {data.pagination.totalPages} Â· {data.pagination.total} variants
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

  const status = row.isOut ? 'OUT_OF_STOCK' : row.isLow ? 'LOW_STOCK' : 'IN_STOCK';

  async function save(setQuantity: number, reason?: string) {
    try {
      await adjust.mutateAsync({ variantId: row.id, setQuantity, reason });
      onSaved(
        setQuantity <= row.reserved
          ? `${row.product.name} Â· ${variantLabel(row.name, row.attributes)} is out of stock`
          : `Updated ${row.product.name} Â· ${variantLabel(row.name, row.attributes)}`,
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
        <small className={styles.muted} style={{ display: 'block' }}>
          {Object.entries(row.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' Â· ') || 'Standard'}
        </small>
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
          {row.available > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={adjust.isPending}
              onClick={() => void save(row.reserved, 'Marked out of stock')}
            >
              Mark out
            </Button>
          ) : null}
        </form>
      </td>
    </tr>
  );
}
