export function toPlainProduct<T extends Record<string, unknown>>(product: T) {
  const price = product.price;
  const discountPrice = product.discountPrice;
  const rawVariants = product.variants;
  const variants = Array.isArray(rawVariants)
    ? rawVariants.map((v: Record<string, unknown>) => ({
        ...v,
        price: v?.price != null ? String(v.price) : null,
      }))
    : rawVariants;
  return {
    ...product,
    price: price != null ? String(price) : price,
    discountPrice: discountPrice != null ? String(discountPrice) : null,
    ...(variants !== undefined ? { variants } : {}),
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let slug = slugify(base) || 'item';
  let i = 0;
  while (await exists(slug)) {
    i += 1;
    slug = `${slugify(base).slice(0, 70)}-${i}`;
  }
  return slug;
}
