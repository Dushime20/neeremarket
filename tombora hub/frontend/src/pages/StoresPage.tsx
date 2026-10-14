import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProducts, useStores } from '@/api/hooks';
import { Alert, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { FALLBACK_CATEGORY_VISUAL } from '@/utils/categoryVisuals';
import styles from './StoresPage.module.css';

const BANNER_TINTS = [
  '#faefe3', // Warm Sand / Wood tone (matches Tools & Hardware)
  '#f0ebf5', // Soft Lilac / Lavender (matches Machinery card)
  '#ebf3ee', // Gentle Sage Mint
  '#eaf2f5', // Clean Ice Blue
  '#f8ece6', // Soft Peach Coral
  '#f6edf2', // Delicate Rose
  '#f3f4f6', // Clean Pearl Gray
  '#fdf4e9', // Warm Buttercream
];

export function StoresPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useStores(page);
  const { data: productsData } = useProducts({ page: 1, limit: 32 });

  const globalProducts = productsData?.items ?? [];

  return (
    <div className={`container ${styles.page}`}>
      <Helmet>
        <title>Stores | NeereMarket</title>
        <meta
          name="description"
          content="Explore verified stores, boutiques, and workshops across Rwanda."
        />
      </Helmet>

      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.heading}>Seller Stores</h1>
          <p className={styles.subheading}>
            Discover verified boutiques, workshops, and storefronts across Rwanda.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loadingStack}>
          <ProductGridSkeleton count={2} />
        </div>
      ) : null}

      {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

      {!isLoading && !isError && data?.items.length === 0 ? (
        <EmptyState
          title="No stores yet"
          description="Sellers can register and list storefronts on NeereMarket."
        />
      ) : null}

      {!isLoading && data?.items.length ? (
        <div className={styles.storesStack}>
          {data.items.map((store, storeIdx) => {
            const tint = BANNER_TINTS[storeIdx % BANNER_TINTS.length];
            const storeProducts = [...(store.products || [])];

            // Fill up to 8 products from global catalog if store has fewer
            if (storeProducts.length < 8 && globalProducts.length) {
              const existingIds = new Set(storeProducts.map((p) => p.id));
              for (const gp of globalProducts) {
                if (!existingIds.has(gp.id)) {
                  storeProducts.push({
                    id: gp.id,
                    name: gp.name,
                    slug: gp.slug,
                    imageUrl: gp.images[0]?.url || null,
                  });
                  existingIds.add(gp.id);
                  if (storeProducts.length >= 8) break;
                }
              }
            }

            const bannerImg =
              store.seller.coverUrl ||
              storeProducts[0]?.imageUrl ||
              store.seller.logoUrl ||
              FALLBACK_CATEGORY_VISUAL.image;

            const locationStr =
              [store.seller.marketLocation, store.seller.district]
                .filter(Boolean)
                .join(' · ') || 'Kigali, Rwanda';

            return (
              <article key={store.id} className={styles.showcaseCard}>
                {/* Left Column: Colored Banner matching design */}
                <div className={styles.showcaseBanner} style={{ backgroundColor: tint }}>
                  <div className={styles.showcaseBannerTop}>
                    <h2 className={styles.showcaseTitle}>{store.name}</h2>
                    <p className={styles.showcaseLocation}>{locationStr}</p>
                    <Link
                      to={`/stores/${store.slug}`}
                      className={styles.sourceNowBtn}
                      title={`Source from ${store.name}`}
                    >
                      Source Now
                    </Link>
                  </div>
                  <div className={styles.showcaseBannerImgWrap}>
                    <img src={bannerImg} alt={store.name} loading="lazy" />
                  </div>
                </div>

                {/* Right Column: 4x2 Grid of 8 items */}
                <div className={styles.showcaseGrid}>
                  {storeProducts.slice(0, 8).map((p) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      className={styles.showcaseItem}
                      title={p.name}
                    >
                      <span className={styles.showcaseItemTitle}>{p.name}</span>
                      <div className={styles.showcaseItemImgWrap}>
                        <img
                          src={p.imageUrl || FALLBACK_CATEGORY_VISUAL.image}
                          alt={p.name}
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {data?.pagination && data.pagination.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Stores pagination">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className={styles.pageIndicator}>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
          >
            Next ›
          </button>
        </nav>
      ) : null}
    </div>
  );
}
