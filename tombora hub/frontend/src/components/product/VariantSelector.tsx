import { useMemo } from 'react';
import { variantLabel } from '@/utils/variant';
import styles from './VariantSelector.module.css';

export type VariantOption = {
  id: string;
  sku?: string;
  name: string | null;
  attributes: Record<string, string>;
  price: string | null;
  inventory?: { available: number } | null;
};

type Props = {
  variants: VariantOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function attrKeys(variants: VariantOption[]) {
  const keys = new Set<string>();
  for (const v of variants) {
    Object.keys(v.attributes || {}).forEach((k) => keys.add(k));
  }
  const preferred = ['color', 'Colour', 'size', 'Size'];
  const ordered = preferred.filter((k) =>
    [...keys].some((key) => key.toLowerCase() === k.toLowerCase()),
  );
  const rest = [...keys].filter(
    (k) => !preferred.some((p) => p.toLowerCase() === k.toLowerCase()),
  );
  return [...ordered, ...rest];
}

function getAttr(v: VariantOption, key: string) {
  const entry = Object.entries(v.attributes || {}).find(
    ([k]) => k.toLowerCase() === key.toLowerCase(),
  );
  return entry?.[1] || '';
}

function uniqueValues(variants: VariantOption[], key: string) {
  const values: string[] = [];
  for (const v of variants) {
    const value = getAttr(v, key);
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  const keys = useMemo(() => attrKeys(variants), [variants]);
  const selected = variants.find((v) => v.id === selectedId) || null;

  if (!keys.length) {
    return (
      <div className={styles.wrap} role="listbox" aria-label="Product variants">
        {variants.map((v) => {
          const label = variantLabel(v.name, v.attributes);
          const available = v.inventory?.available ?? 0;
          const disabled = available <= 0;
          return (
            <button
              key={v.id}
              type="button"
              role="option"
              aria-selected={selectedId === v.id}
              disabled={disabled}
              className={`${styles.pill} ${selectedId === v.id ? styles.active : ''}`}
              onClick={() => onSelect(v.id)}
            >
              {label}
              {disabled ? ' (out)' : ''}
            </button>
          );
        })}
      </div>
    );
  }

  function selectAttr(key: string, value: string) {
    const desired = keys.map((k) => ({
      key: k,
      value: k.toLowerCase() === key.toLowerCase() ? value : selected ? getAttr(selected, k) : '',
    }));

    const exact = variants.find((v) =>
      desired.every(({ key: k, value: val }) => !val || getAttr(v, k) === val),
    );
    if (exact && (exact.inventory?.available ?? 0) > 0) {
      onSelect(exact.id);
      return;
    }

    const withValue = variants.filter((v) => getAttr(v, key) === value);
    const inStock = withValue.find((v) => (v.inventory?.available ?? 0) > 0);
    onSelect((inStock || withValue[0] || variants[0]).id);
  }

  function valueAvailable(key: string, value: string) {
    const candidates = variants.filter((v) => getAttr(v, key) === value);
    if (!candidates.length) return false;
    if (!selected) return candidates.some((v) => (v.inventory?.available ?? 0) > 0);

    const compatible = candidates.filter((v) =>
      keys.every((k) => {
        if (k.toLowerCase() === key.toLowerCase()) return true;
        const selectedVal = getAttr(selected, k);
        return !selectedVal || getAttr(v, k) === selectedVal;
      }),
    );
    const pool = compatible.length ? compatible : candidates;
    return pool.some((v) => (v.inventory?.available ?? 0) > 0);
  }

  return (
    <div className={styles.groups}>
      {keys.map((key) => {
        const values = uniqueValues(variants, key);
        const current = selected ? getAttr(selected, key) : '';
        const isColor = key.toLowerCase() === 'color' || key.toLowerCase() === 'colour';
        const label = key.charAt(0).toUpperCase() + key.slice(1);

        return (
          <div key={key} className={styles.group}>
            <div className={styles.groupHead}>
              <p className={styles.groupLabel}>
                {label}: <span>{current || 'Select'}</span>
              </p>
            </div>
            <div
              className={isColor ? styles.swatches : styles.wrap}
              role="listbox"
              aria-label={label}
            >
              {values.map((value) => {
                const disabled = !valueAvailable(key, value);
                const active = current === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={disabled}
                    title={value}
                    className={`${isColor ? styles.swatch : styles.pill} ${
                      active ? styles.active : ''
                    }`}
                    onClick={() => selectAttr(key, value)}
                  >
                    {isColor ? <span className={styles.swatchText}>{value.slice(0, 1)}</span> : value}
                    {!isColor && disabled ? ' (out)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
