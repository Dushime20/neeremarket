import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  useCategories,
  useCreateProduct,
  useSellerProduct,
  useUpdateProduct,
  useUploadMedia,
} from '@/api/hooks';
import { Alert, Button, TableSkeleton } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import { findCategoryPlacement } from '@/utils/category';
import { StockBuilder } from '@/components/seller/StockBuilder';
import {
  mergeSpecValues,
  specsForCategory,
  type SpecFieldDef,
} from '@/utils/productSpecs';
import {
  axesFromNames,
  blankCombo,
  buildCombos,
  duplicateAxisName,
  startingAttributeNames,
  stockFromVariants,
  toVariantPayload,
  type StockAxis,
  type StockCombo,
} from '@/utils/stockAttributes';
import styles from './SellerProductFormPage.module.css';

type GalleryRow = {
  key: string;
  url: string;
  preview?: string;
  altText: string;
  isPrimary: boolean;
  uploading?: boolean;
};

type VideoRow = {
  key: string;
  url: string;
  preview?: string;
  uploading?: boolean;
};

type SpecRow = {
  key: string;
  name: string;
  value: string;
};

const STEPS = [
  { id: 0, label: 'Category', hint: 'Where it belongs' },
  { id: 1, label: 'Details', hint: 'Name and price' },
  { id: 2, label: 'Photos', hint: 'Upload from device' },
  { id: 3, label: 'Specs', hint: 'Category fields' },
  { id: 4, label: 'List', hint: 'Stock and publish' },
];

function newKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toCm(mm?: number | null) {
  if (!mm) return '';
  return String(Math.round(mm / 10));
}

function toMm(cm: string) {
  const n = Number(cm);
  if (!cm.trim() || Number.isNaN(n) || n <= 0) return undefined;
  return Math.round(n * 10);
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {required ? <em> *</em> : null}
      </span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function SellerProductFormPage() {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const { data: categories } = useCategories();
  const { data: existing, isLoading: loadingExisting } = useSellerProduct(productId);
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const upload = useUploadMedia();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [categoryReady, setCategoryReady] = useState(false);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('15000');
  const [discountPrice, setDiscountPrice] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [condition, setCondition] = useState<'NEW' | 'USED' | 'REFURBISHED'>('NEW');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<GalleryRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [weightGrams, setWeightGrams] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [axes, setAxes] = useState<StockAxis[]>([]);
  const [combos, setCombos] = useState<StockCombo[]>([blankCombo()]);
  const [stockCustomized, setStockCustomized] = useState(false);
  const [submitForApproval, setSubmitForApproval] = useState(true);

  useEffect(() => {
    if (!existing || hydrated) return;
    setName(existing.name || '');
    setSku(existing.sku || '');
    setPrice(String(existing.price || ''));
    setDiscountPrice(existing.discountPrice ? String(existing.discountPrice) : '');
    setCondition(existing.condition || 'NEW');
    setShortDescription(existing.shortDescription || '');
    setDescription(existing.description || '');
    setImages(
      existing.images?.length
        ? existing.images.map((img, index) => ({
            key: newKey(),
            url: img.url,
            altText: img.altText || '',
            isPrimary: img.isPrimary ?? index === 0,
          }))
        : [],
    );
    setVideos((existing.videos || []).map((video) => ({ key: newKey(), url: video.url })));
    setSpecs(
      (existing.specifications || []).map((row, index) => ({
        key: `saved-${index}-${row.name}`,
        name: row.name,
        value: row.value,
      })),
    );
    setWeightGrams(existing.weightGrams ? String(existing.weightGrams) : '');
    setLengthCm(toCm(existing.lengthMm));
    setWidthCm(toCm(existing.widthMm));
    setHeightCm(toCm(existing.heightMm));
    setTags((existing.tags || []).join(', '));
    setSeoTitle(existing.seoTitle || '');
    setSeoDescription(existing.seoDescription || '');
    const stock = stockFromVariants(existing.variants || []);
    setAxes(stock.axes);
    setCombos(stock.combos.length ? stock.combos : [blankCombo()]);
    setStockCustomized(true);
    setHydrated(true);
  }, [existing, hydrated]);

  useEffect(() => {
    if (!existing?.categoryId || !categories?.length || categoryReady) return;
    const placement = findCategoryPlacement(categories, existing.categoryId);
    setParentCategoryId(placement.parentId);
    setSubCategoryId(placement.subId);
    setCategoryReady(true);
  }, [existing?.categoryId, categories, categoryReady]);

  const parentCategory = (categories || []).find((c) => c.id === parentCategoryId);
  const subcategories = parentCategory?.children || [];
  const subCategory = subcategories.find((c) => c.id === subCategoryId);
  const leafCategoryId = subCategoryId || (subcategories.length ? '' : parentCategoryId);
  const parentSlug = parentCategory?.slug;
  const subSlug = subCategory?.slug;
  const specDefs = useMemo(
    () => specsForCategory(parentSlug, subSlug),
    [parentSlug, subSlug],
  );
  const cover = images.find((img) => img.isPrimary) || images[0];
  const coverSrc = cover?.url || cover?.preview;
  const uploadingMedia = images.some((img) => img.uploading) || videos.some((video) => video.uploading);
  const templateKey = `${parentSlug || ''}:${subSlug || ''}`;

  useEffect(() => {
    if (!parentSlug) return;
    setSpecs((current) => mergeSpecValues(current, specDefs));
  }, [templateKey, parentSlug, specDefs]);

  useEffect(() => {
    if (isEdit || stockCustomized || !parentSlug) return;
    const nextAxes = axesFromNames(startingAttributeNames(parentSlug, subSlug));
    setAxes(nextAxes);
    setCombos(nextAxes.length ? buildCombos(nextAxes, []).combos : [blankCombo()]);
  }, [templateKey, isEdit, stockCustomized, parentSlug, subSlug]);

  function applyStock(nextAxes: StockAxis[], nextCombos: StockCombo[]) {
    setStockCustomized(true);
    setAxes(nextAxes);
    setCombos(nextCombos);
  }

  function updateImage(key: string, patch: Partial<GalleryRow>) {
    setImages((rows) =>
      rows.map((row) => {
        if (row.key !== key) {
          return patch.isPrimary ? { ...row, isPrimary: false } : row;
        }
        return { ...row, ...patch };
      }),
    );
  }

  function revokePreview(row: { preview?: string }) {
    if (row.preview?.startsWith('blob:')) URL.revokeObjectURL(row.preview);
  }

  function removeImage(key: string) {
    setImages((rows) => {
      const target = rows.find((row) => row.key === key);
      if (target) revokePreview(target);
      const next = rows.filter((row) => row.key !== key);
      if (!next.some((row) => row.isPrimary) && next[0]) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  function removeVideo(key: string) {
    setVideos((rows) => {
      const target = rows.find((row) => row.key === key);
      if (target) revokePreview(target);
      return rows.filter((row) => row.key !== key);
    });
  }

  async function handleFiles(list: FileList | File[] | null) {
    const files = Array.from(list || []);
    if (!files.length) return;

    const incomingImages = files.filter(
      (file) => file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name),
    );
    const incomingVideos = files.filter(
      (file) => file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name),
    );

    if (incomingImages.length + incomingVideos.length !== files.length) {
      setError('Use JPG, PNG, WEBP, GIF photos or MP4 / MOV / WEBM videos.');
      return;
    }
    if (files.length > 8) {
      setError('Upload up to 8 files at a time.');
      return;
    }
    if (images.length + incomingImages.length > 12) {
      setError('You can add up to 12 photos.');
      return;
    }
    if (videos.length + incomingVideos.length > 3) {
      setError('You can add up to 3 videos.');
      return;
    }

    setError(null);
    const placeholders = files.map((file) => ({
      key: newKey(),
      file,
      isVideo: file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name),
      preview: URL.createObjectURL(file),
    }));

    setImages((rows) => {
      let hasCover = rows.some((row) => row.isPrimary);
      return [
        ...rows,
        ...placeholders
          .filter((item) => !item.isVideo)
          .map((item) => {
            const row: GalleryRow = {
              key: item.key,
              url: '',
              preview: item.preview,
              altText: '',
              isPrimary: !hasCover,
              uploading: true,
            };
            hasCover = true;
            return row;
          }),
      ];
    });
    setVideos((rows) => [
      ...rows,
      ...placeholders
        .filter((item) => item.isVideo)
        .map((item) => ({
          key: item.key,
          url: '',
          preview: item.preview,
          uploading: true,
        })),
    ]);

    try {
      const uploaded = await upload.mutateAsync(files);
      uploaded.forEach((result, index) => {
        const item = placeholders[index];
        if (!item) return;
        if (result.kind === 'video' || item.isVideo) {
          setVideos((rows) =>
            rows.map((row) =>
              row.key === item.key ? { ...row, url: result.url, uploading: false } : row,
            ),
          );
        } else {
          setImages((rows) =>
            rows.map((row) =>
              row.key === item.key ? { ...row, url: result.url, uploading: false } : row,
            ),
          );
        }
      });
    } catch (err) {
      placeholders.forEach((item) => {
        URL.revokeObjectURL(item.preview);
        if (item.isVideo) {
          setVideos((rows) => rows.filter((row) => row.key !== item.key));
        } else {
          setImages((rows) => {
            const next = rows.filter((row) => row.key !== item.key);
            if (!next.some((row) => row.isPrimary) && next[0]) {
              next[0] = { ...next[0], isPrimary: true };
            }
            return next;
          });
        }
      });
      setError(getErrorMessage(err, 'Could not upload files. Check size and format.'));
    }
  }

  function galleryPayload() {
    return images
      .map((img, index) => ({
        url: img.url.trim(),
        altText: img.altText.trim() || undefined,
        isPrimary: img.isPrimary || index === 0,
      }))
      .filter((img) => img.url);
  }

  function specsPayload() {
    return specs
      .map((row) => ({ name: row.name.trim(), value: row.value.trim() }))
      .filter((row) => row.name && row.value);
  }

  function missingRequiredSpecs() {
    return specDefs.filter((def) => {
      if (!def.required) return false;
      const row = specs.find((item) => item.name === def.name);
      return !row?.value.trim();
    });
  }

  function validateStep(index: number) {
    if (index === 0) {
      if (!parentCategoryId) return 'Select a category.';
      if (subcategories.length && !subCategoryId) return 'Select a subcategory.';
    }
    if (index === 1) {
      if (name.trim().length < 2) return 'Enter a product name.';
      if (!Number(price) || Number(price) < 1) return 'Enter a valid price.';
      if (!description.trim()) return 'Add a full description.';
    }
    if (index === 2) {
      if (uploadingMedia) return 'Wait for uploads to finish.';
      if (!galleryPayload().length) return 'Add at least one product photo.';
    }
    if (index === 3) {
      if (!parentSlug) return 'Select a category first so we can load the right specifications.';
      const missing = missingRequiredSpecs();
      if (missing.length) {
        return `Fill required ${parentCategory?.name || 'category'} specs: ${missing.map((d) => d.name).join(', ')}.`;
      }
    }
    if (index === 4) return validateStock();
    return null;
  }

  function validateStock() {
    const duplicate = duplicateAxisName(axes);
    if (duplicate) {
      return `Attribute "${duplicate}" is listed twice. Keep one attribute and put every option under it.`;
    }
    const empty = axes.find((axis) => axis.name.trim() && !axis.values.some((value) => value.trim()));
    if (empty) {
      return `Add at least one value for ${empty.name.trim()}, or remove that attribute.`;
    }
    if (!combos.length) return 'Add at least one stock line.';
    if (combos.some((combo) => combo.stock.trim() === '' || Number(combo.stock) < 0 || Number.isNaN(Number(combo.stock)))) {
      return 'Each stock line needs a quantity of 0 or more.';
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const blocking = [0, 1, 2, 3, 4].map(validateStep).find(Boolean);
    if (blocking) {
      setError(blocking);
      return;
    }
    setError(null);
    const gallery = galleryPayload();
    const specList = specsPayload();
    const categoryId = leafCategoryId;

    const common = {
      name,
      sku: sku.trim() || undefined,
      description: description.trim() || undefined,
      shortDescription: (shortDescription || description).trim().slice(0, 160) || undefined,
      categoryId,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : isEdit ? null : undefined,
      currency: 'RWF',
      condition,
      weightGrams: weightGrams ? Number(weightGrams) : undefined,
      lengthMm: toMm(lengthCm),
      widthMm: toMm(widthCm),
      heightMm: toMm(heightCm),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      specifications: specList,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      images: gallery,
      videos: videos.map((row) => ({ url: row.url.trim() })).filter((row) => row.url),
      submitForApproval,
    };

    try {
      const stamp = Date.now().toString().slice(-6);
      const variants = toVariantPayload(axes, combos, {
        productName: name,
        price: Number(price),
        stamp,
      });

      if (isEdit && productId) {
        await update.mutateAsync({ id: productId, ...common, variants });
        navigate(`/seller/products/${productId}`);
        return;
      }

      await create.mutateAsync({
        ...common,
        variants,
      });
      navigate('/seller/products');
    } catch (err) {
      setError(getErrorMessage(err, isEdit ? 'Could not update product' : 'Could not create product'));
    }
  }

  if (isEdit && loadingExisting) {
    return (
      <div className={styles.page}>
        <TableSkeleton />
      </div>
    );
  }

  const pending = create.isPending || update.isPending || upload.isPending || uploadingMedia;
  const defByName = new Map(specDefs.map((def) => [def.name, def]));

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{isEdit ? 'Edit product' : 'Add product'} | NeereMarket</title>
      </Helmet>

      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Catalog</p>
          <h1>{isEdit ? 'Edit listing' : 'Add a product'}</h1>
          <p>
            A guided listing that adapts to {parentCategory?.name || 'each category'} — photos,
            the right specifications, then stock.
          </p>
          <p className={styles.stepMeta}>
            Step {step + 1} of {STEPS.length} · {STEPS[step].label}
          </p>
          <div className={styles.progress} aria-hidden="true">
            <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
        {isEdit ? (
          <Link to={`/seller/products/${productId}`}>
            <Button type="button" size="sm" variant="ghost">
              Back to details
            </Button>
          </Link>
        ) : null}
      </header>

      <div className={styles.layout}>
        <nav className={styles.steps} aria-label="Listing steps">
          {STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.stepBtn} ${step === item.id ? styles.stepOn : ''} ${
                item.id < step ? styles.stepDone : ''
              }`}
              onClick={() => {
                setError(null);
                setStep(item.id);
              }}
            >
              <span className={styles.stepNum}>{item.id + 1}</span>
              <span>
                {item.label}
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </nav>

        <form className={styles.main} onSubmit={onSubmit}>
      {error ? <Alert tone="error">{error}</Alert> : null}

          {step === 0 ? (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Where should shoppers find this?</h2>
                <p>Pick a category, then a more specific subcategory — like a product directory.</p>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <p className={styles.hint}>Category</p>
                  <div className={styles.catGrid}>
                    {(categories || []).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={c.id === parentCategoryId ? styles.catCardOn : styles.catCard}
                        onClick={() => {
                          setParentCategoryId(c.id);
                          setSubCategoryId('');
                        }}
                      >
                        <strong>{c.name}</strong>
                        <span>{c.children?.length ? `${c.children.length} subcategories` : 'Main category'}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {parentCategoryId ? (
                  <div>
                    <p className={styles.hint}>Subcategory</p>
                    {subcategories.length ? (
                      <div className={styles.chipRow}>
                        {subcategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`${styles.chip} ${c.id === subCategoryId ? styles.chipOn : ''}`}
                            onClick={() => setSubCategoryId(c.id)}
                          >
                {c.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.hint}>This category has no subcategories — it will be used as-is.</p>
                    )}
                  </div>
                ) : null}
                <div>
                  <p className={styles.hint}>Condition</p>
                  <div className={styles.chipRow}>
                    {(
                      [
                        ['NEW', 'New'],
                        ['USED', 'Used'],
                        ['REFURBISHED', 'Refurbished'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.chip} ${condition === value ? styles.chipOn : ''}`}
                        onClick={() => setCondition(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.footer}>
                <span />
                <div className={styles.footRight}>
                  <Button type="button" onClick={goNext}>
                    Continue
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Name, price, and story</h2>
                <p>Write the listing the way a shopper in Kigali would scan it on their phone.</p>
              </div>
              <div className={styles.cardBody}>
                <Field label="Product name" required>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
                <div className={styles.grid2}>
                  <Field label="Price (RWF)" required>
                    <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
                  </Field>
                  <Field label="Discount price" hint="Optional sale price">
                    <input
          type="number"
                      min={1}
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="SKU" hint="Leave blank to auto-generate from variants">
                  <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="NM-SHIRT-001" />
                </Field>
                <Field label="Short description" hint={`${shortDescription.length}/160`}>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                    maxLength={160}
                    placeholder="One line shown near the price"
                  />
                </Field>
                <Field label="Full description" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                    placeholder="What it is, who it is for, how to use or care for it"
                  />
                </Field>
              </div>
              <div className={styles.footer}>
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <div className={styles.footRight}>
                  <Button type="button" onClick={goNext}>
                    Continue
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Product gallery</h2>
                <p>
                  Upload photos or a short video from this computer or your phone. Mark one photo as
                  the cover — that is what buyers see first.
                </p>
              </div>
              <div className={styles.cardBody}>
                <label
                  className={`${styles.dropzone} ${dragOver ? styles.dropOn : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void handleFiles(e.dataTransfer.files);
                  }}
                >
                  <input
                    className={styles.fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/jpg,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
                    multiple
                    disabled={upload.isPending}
                    onChange={(e) => {
                      void handleFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <strong>Add photos or a video</strong>
                  <span>
                    Tap to choose from your library or camera. You can also drag files here. Photos
                    up to 12MB, videos up to 40MB.
                  </span>
                </label>
                <div className={styles.uploadActions}>
                  <label className={styles.cameraBtn}>
                    <input
                      className={styles.fileInput}
                      type="file"
                      accept="image/*,video/*"
                      capture="environment"
                      disabled={upload.isPending}
                      onChange={(e) => {
                        void handleFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    Use camera
                  </label>
                  <span className={styles.hint}>
                    {images.filter((img) => img.url || img.preview).length}/12 photos ·{' '}
                    {videos.length}/3 videos
                  </span>
                </div>
                {images.length || videos.length ? (
                  <div className={styles.gallery}>
                    {images.map((img, index) => {
                      const src = img.url || img.preview;
                      return (
                        <div
                          key={img.key}
                          className={`${styles.photo} ${img.isPrimary ? styles.photoCover : ''} ${
                            img.uploading ? styles.photoBusy : ''
                          }`}
                        >
                          {src ? (
                            <img src={src} alt={img.altText || `Product photo ${index + 1}`} />
                          ) : (
                            <div className={styles.photoEmpty}>Photo {index + 1}</div>
                          )}
                          {img.uploading ? <span className={styles.busyBadge}>Uploading…</span> : null}
                          {img.isPrimary ? <span className={styles.coverBadge}>Cover</span> : null}
                          <Field label="Alt text">
                            <input
                              value={img.altText}
                              placeholder="Front view"
                              onChange={(e) => updateImage(img.key, { altText: e.target.value })}
                            />
                          </Field>
                          <label className={styles.check}>
                            <input
                              type="radio"
                              name="cover-image"
                              checked={img.isPrimary}
                              disabled={!img.url && !img.preview}
                              onChange={() => updateImage(img.key, { isPrimary: true })}
                            />
                            Use as cover
                          </label>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeImage(img.key)}>
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                    {videos.map((video, index) => {
                      const src = video.url || video.preview;
                      return (
                        <div
                          key={video.key}
                          className={`${styles.photo} ${video.uploading ? styles.photoBusy : ''}`}
                        >
                          {src ? (
                            <video src={src} muted playsInline controls preload="metadata" />
                          ) : (
                            <div className={styles.photoEmpty}>Video {index + 1}</div>
                          )}
                          {video.uploading ? (
                            <span className={styles.busyBadge}>Uploading…</span>
                          ) : (
                            <span className={styles.coverBadge}>Video</span>
                          )}
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeVideo(video.key)}>
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.hint}>No files yet. Add at least one photo to continue.</p>
                )}
              </div>
              <div className={styles.footer}>
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className={styles.footRight}>
                  <Button type="button" onClick={goNext} disabled={uploadingMedia}>
                    {uploadingMedia ? 'Uploading…' : 'Continue'}
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>
                  {parentCategory
                    ? `${parentCategory.name}${subCategory ? ` · ${subCategory.name}` : ''} specifications`
                    : 'Specifications'}
                </h2>
                <p>
                  These fields change with the category so a dress, a phone, and a spice pack each get
                  the right details.
                </p>
              </div>
              <div className={styles.cardBody}>
                {!parentSlug ? (
                  <div className={styles.emptySpecs}>
                    <strong>Select a category first</strong>
                    Fashion, electronics, grocery, and other departments each have their own spec list.
                  </div>
                ) : (
                  <>
                    <div className={styles.specGrid}>
                      {specs.map((row) => {
                        const def: SpecFieldDef | undefined = defByName.get(row.name);
                        const locked = Boolean(def);
                        return (
                          <Field
                            key={row.key}
                            label={locked ? row.name : 'Custom spec'}
                            required={def?.required}
                            hint={def?.hint}
                          >
                            {!locked ? (
                              <input
                                value={row.name}
                                placeholder="Name"
                                onChange={(e) =>
                                  setSpecs((rows) =>
                                    rows.map((item) =>
                                      item.key === row.key ? { ...item, name: e.target.value } : item,
                                    ),
                                  )
                                }
                              />
                            ) : null}
                            {def?.type === 'select' && def.options?.length ? (
                              <select
                                value={row.value}
                                onChange={(e) =>
                                  setSpecs((rows) =>
                                    rows.map((item) =>
                                      item.key === row.key ? { ...item, value: e.target.value } : item,
                                    ),
                                  )
                                }
                                required={def.required}
                              >
                                <option value="">{def.placeholder}</option>
                                {def.options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={def?.type === 'number' ? 'number' : 'text'}
                                value={row.value}
                                placeholder={def?.placeholder || 'Value'}
                                required={def?.required}
                                onChange={(e) =>
                                  setSpecs((rows) =>
                                    rows.map((item) =>
                                      item.key === row.key ? { ...item, value: e.target.value } : item,
                                    ),
                                  )
                                }
                              />
                            )}
                            {!locked ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setSpecs((rows) => rows.filter((item) => item.key !== row.key))}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </Field>
                        );
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setSpecs((rows) => [...rows, { key: newKey(), name: '', value: '' }])
                      }
                    >
                      Add custom specification
                    </Button>
                  </>
                )}
              </div>
              <div className={styles.footer}>
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className={styles.footRight}>
                  <Button type="button" onClick={goNext}>
                    Continue
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Stock by attribute</h2>
                <p>
                  Options such as model, size, color, generation, or version each get a quantity and an
                  available switch. Later changes live in{' '}
                  <Link to={`/seller/inventory${name ? `?q=${encodeURIComponent(name)}` : ''}`}>
                    Inventory
                  </Link>
                  .
                </p>
              </div>
              <div className={styles.cardBody}>
                <StockBuilder
                  parentSlug={parentSlug}
                  subSlug={subSlug}
                  axes={axes}
                  combos={combos}
                  onChange={applyStock}
                />

                <div className={styles.grid3}>
                  <Field label="Weight (grams)">
                    <input
                      type="number"
                      min={1}
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(e.target.value)}
                    />
                  </Field>
                  <Field label="Length (cm)">
                    <input type="number" min={1} value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
                  </Field>
                  <Field label="Width (cm)">
                    <input type="number" min={1} value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
                  </Field>
                </div>
                <Field label="Height (cm)">
                  <input type="number" min={1} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
                </Field>
                <Field label="Tags" hint="Comma separated, helps search">
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="kigali, cotton, everyday"
                  />
                </Field>
                <Field label="SEO title">
                  <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={160} />
                </Field>
                <Field label="SEO description">
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    maxLength={320}
                  />
                </Field>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={submitForApproval}
                    onChange={(e) => setSubmitForApproval(e.target.checked)}
                  />
                  Submit for approval so this listing can go live
        </label>
              </div>
              <div className={styles.footer}>
                <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                  Back
                </Button>
                <div className={styles.footRight}>
                  <Button type="button" variant="ghost" onClick={() => navigate('/seller/products')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending
                      ? 'Saving…'
                      : isEdit
                        ? 'Save listing'
                        : submitForApproval
                          ? 'Submit for approval'
                          : 'Save draft'}
        </Button>
                </div>
              </div>
            </section>
          ) : null}
      </form>

        <aside className={styles.preview}>
          {coverSrc ? <img src={coverSrc} alt="" /> : <div className={styles.previewPh}>Cover photo</div>}
          <strong>{name || 'Untitled listing'}</strong>
          <p className={styles.price}>
            {price ? `${Number(price).toLocaleString()} RWF` : 'Set a price'}
          </p>
          <p>
            {parentCategory?.name || 'Category'}
            {subCategory ? ` / ${subCategory.name}` : ''}
          </p>
          <p>
            {images.filter((img) => img.url).length} photo
            {images.filter((img) => img.url).length === 1 ? '' : 's'} · {specsPayload().length} specs ·{' '}
            {combos.length} stock {combos.length === 1 ? 'line' : 'lines'}
          </p>
        </aside>
      </div>
    </div>
  );
}
