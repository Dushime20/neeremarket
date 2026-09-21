import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useProducts } from '@/api/hooks';
import { Alert, Button, ProductGridSkeleton } from '@/components/ui';
import { ProductGrid } from '@/components/product';
import gridStyles from '@/components/product/ProductGrid.module.css';
import styles from './QuickActionPages.module.css';

export function ImageSearchPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const { data, isLoading } = useProducts({ page: 1, limit: 12, sort: 'popular' });

  const results = useMemo(() => data?.items ?? [], [data?.items]);

  function readFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    setSearched(false);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    readFile(e.target.files?.[0]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    readFile(e.dataTransfer.files?.[0]);
  }

  function runSearch() {
    if (!preview) return;
    setSearched(true);
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Search by image | NeereMarket</title>
      </Helmet>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.kicker}>Visual search</p>
          <h1>Search by image</h1>
          <p>
            Upload a photo to find similar products on NeereMarket — the same entry point as
            Made-in-China’s image search tool.
          </p>
        </div>
      </section>

      <div className="container">
        <div
          className={styles.dropzone}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {preview ? (
            <img src={preview} alt="Upload preview" className={styles.preview} />
          ) : (
            <div className={styles.dropCopy}>
              <strong>Drop an image here</strong>
              <span>or choose a file from your device (JPG, PNG, WebP)</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={onFileChange}
            aria-label="Upload product image"
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" disabled={!preview} onClick={runSearch}>
            Find similar products
          </Button>
          {fileName ? <span className={styles.muted}>{fileName}</span> : null}
          <Link to="/search" className={styles.secondaryLink}>
            Search by keyword instead
          </Link>
        </div>

        {searched ? (
          <div className={styles.results}>
            <Alert tone="success">
              Showing popular matches while visual AI matching rolls out. Refine with keyword search
              anytime.
            </Alert>
            <h2>Similar products</h2>
            {isLoading ? <ProductGridSkeleton count={8} /> : null}
            {results.length ? (
              <ProductGrid products={results} className={gridStyles.dense} />
            ) : !isLoading ? (
              <p className={styles.muted}>No products available yet.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
