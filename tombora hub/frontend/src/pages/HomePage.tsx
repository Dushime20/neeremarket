import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCategories, useProducts, useStores, type ProductListItem } from '@/api/hooks';
import { Alert, Button, EmptyState, ProductGridSkeleton } from '@/components/ui';
import { PriceDisplay, ProductGrid } from '@/components/product';
import { getErrorMessage } from '@/api/client';
import { discountPercent } from '@/utils/money';
import { categoryImage, FALLBACK_CATEGORY_VISUAL } from '@/utils/categoryVisuals';
import { HomeQuickActions } from '@/components/navigation/HomeQuickActions';
import styles from './HomePage.module.css';

const SLIDE_IMAGES = {
  home: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
  advertise:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  offer: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b3da?auto=format&fit=crop&w=1600&q=80',
};

function productImage(product?: ProductListItem) {
  return product?.images[0]?.url || FALLBACK_CATEGORY_VISUAL.image;
}

function chunkItems<T>(items: T[], size: number) {
  if (!items.length) return [[] as T[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function HomePage() {
  const { data: products, isLoading, isError, error } = useProducts({ page: 1, limit: 16 });
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useProducts({
    page: 1,
    limit: 4,
    sort: 'newest',
  });
  const { data: categories } = useCategories();
  const { data: stores } = useStores(1);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [storePage, setStorePage] = useState(0);
  const [storesPerPage, setStoresPerPage] = useState(2);
  const [catPage, setCatPage] = useState(0);
  const [catsPerPage, setCatsPerPage] = useState(12);
  const [catsPaused, setCatsPaused] = useState(false);

  const items = products?.items ?? [];
  const newArrivals = newArrivalsData?.items ?? [];
  const trending = items.slice(0, 12);
  const verifiedStores = (stores?.items ?? []).filter(
    (store) => store.seller.verificationStatus === 'VERIFIED',
  );
  const storePages = useMemo(
    () => chunkItems(verifiedStores, storesPerPage),
    [verifiedStores, storesPerPage],
  );
  const storePageCount = storePages.length;
  const categoryList = categories || [];
  const catPages = useMemo(
    () => chunkItems(categoryList, catsPerPage),
    [categoryList, catsPerPage],
  );
  const catPageCount = catPages.length;
  const offers = useMemo(
    () => items.filter((p) => discountPercent(p.price, p.discountPrice)).slice(0, 4),
    [items],
  );
  const promoProducts = (offers.length ? offers : items).slice(0, 4);
  const slidesCount = 4;

  useEffect(() => {
    function syncPageSize() {
      const w = window.innerWidth;
      setStoresPerPage(w <= 640 ? 1 : 2);
      if (w <= 640) setCatsPerPage(6);
      else if (w <= 900) setCatsPerPage(8);
      else setCatsPerPage(12);
    }
    syncPageSize();
    window.addEventListener('resize', syncPageSize);
    return () => window.removeEventListener('resize', syncPageSize);
  }, []);

  useEffect(() => {
    setStorePage((current) => Math.min(current, Math.max(0, storePageCount - 1)));
  }, [storePageCount]);

  useEffect(() => {
    setCatPage((current) => Math.min(current, Math.max(0, catPageCount - 1)));
  }, [catPageCount]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setSlide((current) => (current + 1) % slidesCount);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (storePageCount <= 1) return;
    const id = window.setInterval(() => {
      setStorePage((current) => (current + 1) % storePageCount);
    }, 6500);
    return () => window.clearInterval(id);
  }, [storePageCount]);

  useEffect(() => {
    if (catsPaused || catPageCount <= 1) return;
    const id = window.setInterval(() => {
      setCatPage((current) => (current + 1) % catPageCount);
    }, 5000);
    return () => window.clearInterval(id);
  }, [catsPaused, catPageCount]);

  function goTo(index: number) {
    setSlide((index + slidesCount) % slidesCount);
  }

  return (
    <div className={styles.home}>
      <Helmet>
        <title>NeereMarket — Rwanda’s Digital Marketplace</title>
        <meta
          name="description"
          content="Shop fashion, electronics, beauty, and grocery from Kigali sellers. Pay in RWF with MTN MoMo and Airtel Money."
        />
      </Helmet>

      <HomeQuickActions />

      <section className={`container ${styles.market}`} aria-label="Marketplace hero">
        <aside className={styles.arrivalsPanel} aria-labelledby="hero-arrivals">
          <h2 id="hero-arrivals" className={styles.arrivalsTitle}>
            New arrivals in Rwanda
          </h2>
          {newArrivals.length ? (
            <div className={styles.arrivalsGrid}>
              {newArrivals.slice(0, 4).map((product) => (
                <Link key={product.id} to={`/products/${product.slug}`} className={styles.arrivalCard}>
                  <span className={styles.arrivalThumb}>
                    <img src={productImage(product)} alt="" />
                  </span>
                  <span className={styles.arrivalLabel}>{product.name}</span>
                </Link>
              ))}
            </div>
          ) : null}
          {!newArrivals.length && newArrivalsLoading ? (
            <p className={styles.panelHint}>Loading new arrivals…</p>
          ) : null}
          {!newArrivals.length && !newArrivalsLoading ? (
            <p className={styles.panelHint}>Fresh listings will show here soon.</p>
          ) : null}
          <Link to="/new-arrivals" className={styles.arrivalsCta}>
            Shop the latest arrivals
          </Link>
        </aside>

        <div className={styles.centerCol}>
          <div
            className={styles.carousel}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Campaigns and promotions"
          >
            <div className={styles.track} style={{ transform: `translateX(-${slide * 100}%)` }}>
              <article className={`${styles.slide} ${styles.slideHome}`}>
                <img src={SLIDE_IMAGES.home} alt="" />
                <div className={styles.slideCopy}>
                  <p className={styles.eyebrow}>Rwanda’s marketplace</p>
                  <h1>Shop Kigali. Pay with MoMo. Delivered.</h1>
                  <p>
                    Fashion, phones, beauty, and grocery from local sellers — priced in RWF, paid
                    with MTN MoMo and Airtel Money.
                  </p>
                  <div className={styles.slideActions}>
                    <Link to="/products">
                      <Button type="button" className={styles.slideCta}>
                        Browse the market
                      </Button>
                    </Link>
                    <Link to="/sell">
                      <Button type="button" variant="secondary" className={styles.slideSecondary}>
                        Start selling
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>

              <article className={`${styles.slide} ${styles.slideAd}`}>
                <img src={SLIDE_IMAGES.advertise} alt="" />
                <div className={styles.slideCopy}>
                  <p className={styles.eyebrow}>Advertise</p>
                  <h2>Put your store in front of Rwanda.</h2>
                  <p>
                    Promote your boutique, stall, or brand on NeereMarket. Reach buyers who already
                    shop and pay with Mobile Money.
                  </p>
                  <Link to="/sell">
                    <Button type="button" className={styles.slideCta}>
                      Advertise your store
                    </Button>
                  </Link>
                </div>
              </article>

              <article className={`${styles.slide} ${styles.slideOffer}`}>
                <img src={SLIDE_IMAGES.offer} alt="" />
                <div className={styles.slideCopy}>
                  <p className={styles.eyebrow}>Offers</p>
                  <h2>Today’s deals in RWF.</h2>
                  <p>Limited-time markdowns from verified Kigali sellers. Same checkout — MoMo or Airtel.</p>
                  <Link to="/deals">
                    <Button type="button" className={styles.slideCta}>
                      Shop offers
                    </Button>
                  </Link>
                </div>
              </article>

              <article className={`${styles.slide} ${styles.slidePromo}`}>
                <div className={styles.promoGrid}>
                  {(promoProducts.length ? promoProducts : items.slice(0, 4)).map((product) => (
                    <Link key={product.id} to={`/products/${product.slug}`} className={styles.promoCard}>
                      <img src={productImage(product)} alt="" />
                      <div>
                        <p>{product.name}</p>
                        <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
                      </div>
                    </Link>
                  ))}
                  {!promoProducts.length && !items.length ? (
                    <div className={styles.promoEmpty}>
                      <h2>Promotion products</h2>
                      <p>Featured deals will appear here as sellers list offers.</p>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>

            <button
              type="button"
              className={`${styles.arrow} ${styles.prev}`}
              aria-label="Previous slide"
              onClick={() => goTo(slide - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              aria-label="Next slide"
              onClick={() => goTo(slide + 1)}
            >
              ›
            </button>

            <div className={styles.dots} role="tablist" aria-label="Carousel slides">
              {['Home', 'Advertise', 'Offers', 'Promotions'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={slide === index}
                  aria-label={label}
                  className={slide === index ? styles.dotActive : styles.dot}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </div>

          <div className={styles.storeCarousel} aria-label="Verified stores">
            <div className={styles.storeHead}>
              <h2>Verified stores</h2>
              <Link to="/stores">View all</Link>
            </div>
            <div className={styles.storeStage}>
              <div className={styles.storeViewport}>
                <div
                  className={styles.storeTrack}
                  style={{ transform: `translateX(-${storePage * 100}%)` }}
                >
                  {storePages.map((page, pageIndex) => (
                    <div key={pageIndex} className={styles.verifiedStores}>
                      {page.map((store) => {
                        const productsForStore = store.products ?? [];
                        return (
                          <article key={store.id} className={styles.storeCard}>
                            <Link to={`/stores/${store.slug}`} className={styles.storeCardHead}>
                              <strong>{store.name}</strong>
                              <span>
                                {[store.seller.marketLocation, store.seller.district]
                                  .filter(Boolean)
                                  .join(' · ') || 'Verified store'}
                              </span>
                            </Link>
                            <div className={styles.storeProducts}>
                              {productsForStore.slice(0, 4).map((product) => (
                                <Link
                                  key={product.id}
                                  to={`/stores/${store.slug}`}
                                  className={styles.storeProduct}
                                  title={`${product.name} — ${store.name}`}
                                >
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt="" />
                                  ) : (
                                    <span>{product.name.slice(0, 1)}</span>
                                  )}
                                </Link>
                              ))}
                              {!productsForStore.length ? (
                                <Link to={`/stores/${store.slug}`} className={styles.storeProductEmpty}>
                                  Visit store
                                </Link>
                              ) : null}
                            </div>
                            <Link to={`/stores/${store.slug}`} className={styles.storeCardCta}>
                              Shop {store.name}
                            </Link>
                          </article>
                        );
                      })}
                      {!page.length ? (
                        <article className={styles.storeCard}>
                          <div className={styles.storeCardHead}>
                            <strong>Verified stores</strong>
                            <span>Shop trusted storefronts</span>
                          </div>
                          <Link to="/stores" className={styles.storeCardCta}>
                            Browse stores
                          </Link>
                        </article>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              {storePageCount > 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles.storeArrow} ${styles.storePrev}`}
                    aria-label="Previous verified stores"
                    onClick={() =>
                      setStorePage((current) => (current - 1 + storePageCount) % storePageCount)
                    }
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${styles.storeArrow} ${styles.storeNext}`}
                    aria-label="Next verified stores"
                    onClick={() => setStorePage((current) => (current + 1) % storePageCount)}
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>
            {storePageCount > 1 ? (
              <div className={styles.storeDots} role="tablist" aria-label="Verified store pages">
                {storePages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={storePage === index}
                    aria-label={`Stores page ${index + 1}`}
                    className={storePage === index ? styles.dotActive : styles.dot}
                    onClick={() => setStorePage(index)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <aside className={styles.trendPanel} aria-labelledby="trending-heading">
          <div className={styles.panelHead}>
            <h2 id="trending-heading">Trending</h2>
            <Link to="/products">See all</Link>
          </div>
          <ul className={styles.trendList}>
            {trending.map((product, index) => {
              const pct = discountPercent(product.price, product.discountPrice);
              return (
                <li key={product.id}>
                  <Link to={`/products/${product.slug}`} className={styles.trendItem}>
                    <span className={styles.rank}>{index + 1}</span>
                    <img src={productImage(product)} alt="" />
                    <div>
                      <p>{product.name}</p>
                      <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
                      {pct ? <em>{pct}% off</em> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {!trending.length && isLoading ? <p className={styles.panelHint}>Loading trending items…</p> : null}
          {!trending.length && !isLoading ? (
            <p className={styles.panelHint}>Trending products will appear as the catalog grows.</p>
          ) : null}
        </aside>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="cats-heading">
        <div
          className={styles.catSwiper}
          onMouseEnter={() => setCatsPaused(true)}
          onMouseLeave={() => setCatsPaused(false)}
        >
          <div className={styles.catSwiperHead}>
            <h2 id="cats-heading">Shop by category</h2>
            <Link to="/categories" className={styles.sectionLink}>
              All categories
            </Link>
          </div>

          {categoryList.length ? (
            <>
              <div className={styles.catViewport}>
                <div
                  className={styles.catTrack}
                  style={{ transform: `translateX(-${catPage * 100}%)` }}
                >
                  {catPages.map((page, pageIndex) => (
                    <div
                      key={`cat-page-${pageIndex}`}
                      className={styles.catPage}
                      style={
                        {
                          '--cat-cols': catsPerPage >= 12 ? 6 : catsPerPage >= 8 ? 4 : 3,
                        } as CSSProperties
                      }
                    >
                      {page.map((c) => (
                        <Link
                          key={c.id}
                          to={`/categories/${c.slug}`}
                          className={styles.catItem}
                        >
                          <span className={styles.catCircle}>
                            <img
                              src={categoryImage(c.slug, c.imageUrl)}
                              alt=""
                              loading="lazy"
                            />
                          </span>
                          <span className={styles.catLabel}>{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {catPageCount > 1 ? (
                <div className={styles.catDots} role="tablist" aria-label="Category pages">
                  {catPages.map((_, index) => (
                    <button
                      key={`cat-dot-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={index === catPage}
                      aria-label={`Category page ${index + 1}`}
                      className={index === catPage ? styles.catDotActive : styles.catDot}
                      onClick={() => setCatPage(index)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className={styles.panelHint}>Categories will appear here soon.</p>
          )}
        </div>
      </section>

      <section className={`container ${styles.section} ${styles.homeProducts}`} aria-labelledby="popular-heading">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>Recommended</p>
            <h2 id="popular-heading">Popular this week</h2>
            <p>Live catalog from boutiques, stalls, and verified sellers across Rwanda.</p>
          </div>
          <Link to="/products" className={styles.sectionLink}>
            Shop all
          </Link>
        </div>

        {isLoading ? <ProductGridSkeleton /> : null}
        {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
        {!isLoading && !isError && products?.items.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Sellers can list items from the seller portal."
          />
        ) : null}
        {products?.items.length ? <ProductGrid products={products.items} /> : null}
      </section>
    </div>
  );
}
