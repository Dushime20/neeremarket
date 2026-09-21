export function variantLabel(
  name?: string | null,
  attributes?: Record<string, unknown> | null,
) {
  const fromAttrs = Object.entries(attributes || {})
    .map(([, value]) => String(value ?? '').trim())
    .filter((value) => value && value.toLowerCase() !== 'standard')
    .join(' / ');
  if (fromAttrs) return fromAttrs;
  if (name && name !== 'Default') return name;
  return 'Standard';
}
