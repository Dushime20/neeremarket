import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '@/api/hooks';
import { categoryImage } from '@/utils/categoryVisuals';
import styles from './CategoryMegaMenu.module.css';

type Props = {
  categories: Category[];
};

function CategoryTile({ category }: { category: Category }) {
  return (
    <Link to={`/categories/${category.slug}`} className={styles.tile}>
      <span className={styles.tileImage}>
        <img src={categoryImage(category.slug, category.imageUrl)} alt="" loading="lazy" />
      </span>
      <span className={styles.tileLabel}>{category.name}</span>
    </Link>
  );
}

export function CategoryMegaMenu({ categories }: Props) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = categories.find((c) => c.id === activeId) ?? categories[0] ?? null;
  const picks = active?.children?.length ? active.children : active ? [active] : [];
  const alsoLike = categories.filter((c) => c.id !== active?.id).slice(0, 18);

  useEffect(() => {
    if (categories.length && !activeId) {
      setActiveId(categories[0].id);
    }
  }, [categories, activeId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  if (!categories.length) return null;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.triggerIcon}>
          <path
            d="M4 5h6M4 12h6M4 19h6M14 5h6M14 12h6M14 19h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        Categories
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.triggerChevron}>
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div id={menuId} className={styles.panel} role="region" aria-label="Browse categories">
          <div className={`container ${styles.panelInner}`}>
            <aside className={styles.sidebar}>
              <p className={styles.sidebarTitle}>All categories</p>
              <ul className={styles.sidebarList}>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      className={`${styles.sidebarItem} ${
                        category.id === active?.id ? styles.sidebarItemActive : ''
                      }`}
                      onMouseEnter={() => setActiveId(category.id)}
                      onFocus={() => setActiveId(category.id)}
                      onClick={() => setActiveId(category.id)}
                    >
                      <span>{category.name}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M9 6l6 6-6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <Link to="/categories" className={styles.viewAll} onClick={() => setOpen(false)}>
                View all categories
              </Link>
            </aside>

            {active ? (
              <div className={styles.content}>
                <section className={styles.picksSection}>
                  <div className={styles.sectionHead}>
                    <h3>
                      {active.children?.length ? `Shop ${active.name}` : `Picks in ${active.name}`}
                    </h3>
                    <Link to={`/categories/${active.slug}`} onClick={() => setOpen(false)}>
                      Shop all
                    </Link>
                  </div>
                  <div className={styles.tileGrid}>
                    {picks.map((item) => (
                      <CategoryTile key={item.id} category={item} />
                    ))}
                  </div>
                </section>

                <section className={styles.alsoSection}>
                  <div className={styles.sectionHead}>
                    <h3>You may also like</h3>
                  </div>
                  <div className={`${styles.tileGrid} ${styles.tileGridWide}`}>
                    {alsoLike.map((item) => (
                      <CategoryTile key={item.id} category={item} />
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
