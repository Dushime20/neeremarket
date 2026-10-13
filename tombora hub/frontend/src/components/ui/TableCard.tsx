import React, { type ReactNode } from 'react';
import styles from './TableCard.module.css';

export interface TableCardProps {
  children: ReactNode;
  className?: string;
}

export function TableCard({ children, className = '' }: TableCardProps) {
  return <section className={`${styles.tableCard} ${className}`.trim()}>{children}</section>;
}

export type BannerTone = 'brand' | 'sage' | 'navy' | 'slate';

export interface TableBannerProps {
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  tone?: BannerTone;
  className?: string;
}

export function TableBanner({
  icon,
  title,
  subtitle,
  actions,
  tone = 'brand',
  className = '',
}: TableBannerProps) {
  const toneClass =
    tone === 'navy'
      ? styles.bannerNavy
      : tone === 'slate'
        ? styles.bannerSlate
        : styles.bannerBrand;

  return (
    <div className={`${styles.banner} ${toneClass} ${className}`.trim()}>
      <div className={styles.bannerLeft}>
        {icon ? <div className={styles.bannerIcon}>{icon}</div> : null}
        <div className={styles.bannerText}>
          <h2 className={styles.bannerTitle}>{title}</h2>
          {subtitle ? <div className={styles.bannerSubtitle}>{subtitle}</div> : null}
        </div>
      </div>
      {actions ? <div className={styles.bannerRight}>{actions}</div> : null}
    </div>
  );
}

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

export interface TableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterChips?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  columnsAction?: {
    label?: string;
    onClick?: () => void;
    active?: boolean;
  };
  children?: ReactNode;
  className?: string;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterChips,
  activeFilter,
  onFilterChange,
  columnsAction,
  children,
  className = '',
}: TableToolbarProps) {
  return (
    <div className={`${styles.toolbar} ${className}`.trim()}>
      {onSearchChange !== undefined ? (
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}

      <div className={styles.toolbarActions}>
        {filterChips && filterChips.length > 0 && onFilterChange ? (
          <div className={styles.chipGroup}>
            {filterChips.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id || 'all'}
                  type="button"
                  className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                  onClick={() => onFilterChange(chip.id)}
                >
                  {chip.label}
                  {chip.count !== undefined ? ` (${chip.count})` : ''}
                </button>
              );
            })}
          </div>
        ) : null}

        {columnsAction ? (
          <button
            type="button"
            className={`${styles.pillBtn} ${columnsAction.active ? styles.pillBtnActive : ''}`}
            onClick={columnsAction.onClick}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            {columnsAction.label || 'Columns'}
          </button>
        ) : null}

        {children}
      </div>
    </div>
  );
}

export interface SortThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  sortable?: boolean;
}

export function SortTh({ children, sortable = true, className = '', ...props }: SortThProps) {
  return (
    <th className={`${sortable ? styles.sortTh : ''} ${className}`.trim()} {...props}>
      {children}
      {sortable ? (
        <span className={styles.sortIcon} aria-hidden="true">
          ⇅
        </span>
      ) : null}
    </th>
  );
}

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startIdx = totalItems !== undefined ? (totalItems === 0 ? 0 : Math.min((page - 1) * pageSize + 1, totalItems)) : (page - 1) * pageSize + 1;
  const endIdx = totalItems !== undefined ? Math.min(page * pageSize, totalItems) : page * pageSize;

  // Build page number list with ellipsis for large ranges
  const pageNumbers: (number | 'ellipsis')[] = [];
  const maxButtons = 5;
  if (safeTotalPages <= maxButtons) {
    for (let i = 1; i <= safeTotalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(safeTotalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      if (!pageNumbers.includes(i)) pageNumbers.push(i);
    }
    if (page < safeTotalPages - 2) pageNumbers.push('ellipsis');
    if (!pageNumbers.includes(safeTotalPages)) pageNumbers.push(safeTotalPages);
  }

  return (
    <div className={`${styles.pagination} ${className}`.trim()}>
      <div className={styles.pageInfo}>
        {totalItems !== undefined ? (
          <>
            Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{' '}
            <strong>{totalItems}</strong> results
          </>
        ) : (
          <>
            Page <strong>{page}</strong> of <strong>{safeTotalPages}</strong>
          </>
        )}
      </div>

      <div className={styles.pageControls}>
        <button
          type="button"
          className={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          title="Previous page"
        >
          ‹
        </button>

        {pageNumbers.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Go to page ${p}`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.pageBtn}
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          title="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
