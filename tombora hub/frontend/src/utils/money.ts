export function formatRwf(amount: string | number | bigint) {
  const n = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(n);
}

export function discountPercent(price: string, discountPrice: string | null) {
  if (!discountPrice) return null;
  const p = Number(price);
  const d = Number(discountPrice);
  if (!p || d >= p) return null;
  return Math.round(((p - d) / p) * 100);
}
