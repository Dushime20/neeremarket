import type { ProductListItem } from '@/api/hooks';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

export function ProductGrid({
  products,
  className = '',
}: {
  products: ProductListItem[];
  className?: string;
}) {
  return (
    <div className={`${styles.grid} ${className}`.trim()}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
