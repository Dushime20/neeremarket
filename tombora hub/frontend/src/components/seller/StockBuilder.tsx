import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui';
import {
  ATTRIBUTE_LIBRARY,
  MAX_ATTRIBUTES,
  MAX_STOCK_LINES,
  activeAxes,
  attributeSignature,
  buildCombos,
  combinationCount,
  placeholderFor,
  recommendedAttributeNames,
  suggestionsFor,
  type StockAxis,
  type StockCombo,
} from '@/utils/stockAttributes';
import styles from './StockBuilder.module.css';

type Props = {
  parentSlug?: string | null;
  subSlug?: string | null;
  axes: StockAxis[];
  combos: StockCombo[];
  onChange: (axes: StockAxis[], combos: StockCombo[]) => void;
};

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function onEnter(event: KeyboardEvent<HTMLInputElement>, action: () => void) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
  action();
}

export function StockBuilder({ parentSlug, subSlug, axes, combos, onChange }: Props) {
  const [customName, setCustomName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [bulkQty, setBulkQty] = useState('10');
  const [notice, setNotice] = useState<string | null>(null);

  const used = new Set(axes.map((axis) => axis.name.trim().toLowerCase()).filter(Boolean));
  const recommended = recommendedAttributeNames(parentSlug, subSlug).filter(
    (name) => !used.has(name.toLowerCase()),
  );
  const libraryLeft = ATTRIBUTE_LIBRARY.filter((item) => !used.has(item.name.toLowerCase()));
  const lineCount = combinationCount(axes);
  const singleUnit = activeAxes(axes).length === 0;

  function commit(nextAxes: StockAxis[], previous = combos) {
    const built = buildCombos(nextAxes, previous);
    onChange(nextAxes, built.combos);
    if (built.overflow || combinationCount(nextAxes) > MAX_STOCK_LINES) {
      setNotice(`Keep combinations at ${MAX_STOCK_LINES} or fewer so every option has its own stock.`);
    } else {
      setNotice(null);
    }
  }

  function addAxis(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (axes.some((axis) => sameName(axis.name, trimmed))) {
      setNotice(`${trimmed} is already on this product.`);
      return;
    }
    if (axes.length >= MAX_ATTRIBUTES) {
      setNotice(`Use up to ${MAX_ATTRIBUTES} attributes on one product.`);
      return;
    }
    commit([...axes, { key: `${Date.now()}-${trimmed}`, name: trimmed, values: [] }]);
    setCustomName('');
  }

  function renameAxis(axisKey: string, name: string) {
    const current = axes.find((axis) => axis.key === axisKey);
    const previousName = current?.name || '';
    const nextAxes = axes.map((axis) => (axis.key === axisKey ? { ...axis, name } : axis));
    const nextCombos = combos.map((combo) => {
      if (!previousName.trim() || previousName === name) return combo;
      if (!(previousName in combo.attributes)) return combo;
      const attributes = { ...combo.attributes, [name]: combo.attributes[previousName] };
      delete attributes[previousName];
      return { ...combo, attributes };
    });
    commit(nextAxes, nextCombos);
  }

  function removeAxis(axisKey: string) {
    commit(axes.filter((axis) => axis.key !== axisKey));
  }

  function addValue(axisKey: string, raw: string) {
    const value = raw.trim();
    if (!value) return;
    const nextAxes = axes.map((axis) => {
      if (axis.key !== axisKey) return axis;
      if (axis.values.some((item) => item.toLowerCase() === value.toLowerCase())) return axis;
      return { ...axis, values: [...axis.values, value] };
    });
    if (combinationCount(nextAxes) > MAX_STOCK_LINES) {
      setNotice(`Adding “${value}” would create more than ${MAX_STOCK_LINES} stock lines.`);
      return;
    }
    setDrafts((current) => ({ ...current, [axisKey]: '' }));
    commit(nextAxes);
  }

  function removeValue(axisKey: string, value: string) {
    const nextAxes = axes.map((axis) =>
      axis.key === axisKey
        ? { ...axis, values: axis.values.filter((item) => item.toLowerCase() !== value.toLowerCase()) }
        : axis,
    );
    commit(nextAxes);
  }

  function updateCombo(key: string, patch: Partial<StockCombo>) {
    onChange(
      axes,
      combos.map((combo) => (combo.key === key ? { ...combo, ...patch } : combo)),
    );
  }

  function applyBulk() {
    const qty = String(Math.max(0, Math.floor(Number(bulkQty) || 0)));
    onChange(
      axes,
      combos.map((combo) => ({ ...combo, stock: qty })),
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.lead}>
        Each combination is its own stock line. This category suggests common attributes, and you can add
        any other — model, generation, version, scent, material, or a name you type. Mark a line not
        available when that option should not be ordered.
      </p>

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {axes.map((axis) => {
        const suggestions = suggestionsFor(axis.name, parentSlug, subSlug).filter(
          (value) => !axis.values.some((item) => item.toLowerCase() === value.toLowerCase()),
        );
        return (
          <fieldset key={axis.key} className={styles.axis}>
            <div className={styles.axisHead}>
              <label className={styles.axisName}>
                <span>Attribute</span>
                <input
                  value={axis.name}
                  maxLength={40}
                  onChange={(event) => renameAxis(axis.key, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault();
                  }}
                />
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeAxis(axis.key)}>
                Remove
              </Button>
            </div>
            {axis.values.length ? (
              <div className={styles.values}>
                {axis.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.valueOn}
                    onClick={() => removeValue(axis.key, value)}
                  >
                    {value} <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>Add every option that sells separately. Unused suggestions stay optional.</p>
            )}
            {suggestions.length ? (
              <div className={styles.values}>
                {suggestions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.value}
                    onClick={() => addValue(axis.key, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : null}
            <div className={styles.addValue}>
              <input
                value={drafts[axis.key] || ''}
                placeholder={placeholderFor(axis.name)}
                maxLength={80}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [axis.key]: event.target.value }))
                }
                onKeyDown={(event) => onEnter(event, () => addValue(axis.key, drafts[axis.key] || ''))}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => addValue(axis.key, drafts[axis.key] || '')}
              >
                Add value
              </Button>
            </div>
          </fieldset>
        );
      })}

      <div className={styles.addAttr}>
        <div>
          <strong>Add any attribute</strong>
          <p>Suggestions are a start. Type a name if it is not in the list.</p>
        </div>
        {recommended.length ? (
          <div className={styles.values}>
            {recommended.slice(0, 12).map((name) => (
              <button key={name} type="button" className={styles.value} onClick={() => addAxis(name)}>
                {name}
              </button>
            ))}
          </div>
        ) : null}
        {libraryLeft.length > 12 ? (
          <details className={styles.more}>
            <summary>All attribute names</summary>
            <div className={styles.values}>
              {libraryLeft.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={styles.value}
                  onClick={() => addAxis(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </details>
        ) : null}
        <div className={styles.addValue}>
          <input
            value={customName}
            maxLength={40}
            placeholder="Custom attribute, e.g. Socket, Heel height, Year"
            onChange={(event) => setCustomName(event.target.value)}
            onKeyDown={(event) => onEnter(event, () => addAxis(customName))}
          />
          <Button type="button" size="sm" variant="secondary" onClick={() => addAxis(customName)}>
            Add attribute
          </Button>
        </div>
      </div>

      <div className={styles.linesHead}>
        <div>
          <strong>
            {combos.length} stock {combos.length === 1 ? 'line' : 'lines'}
          </strong>
          <p>
            {singleUnit
              ? 'No options yet, so this product is one stock line.'
              : `${lineCount} combination${lineCount === 1 ? '' : 's'} from the attributes above.`}
          </p>
        </div>
        <div className={styles.bulk}>
          <input
            type="number"
            min={0}
            value={bulkQty}
            aria-label="Quantity for every stock line"
            onChange={(event) => setBulkQty(event.target.value)}
            onKeyDown={(event) => onEnter(event, applyBulk)}
          />
          <Button type="button" size="sm" variant="secondary" onClick={applyBulk}>
            Set all stock
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(axes, combos.map((combo) => ({ ...combo, available: true })))}
          >
            All available
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(axes, combos.map((combo) => ({ ...combo, available: false })))}
          >
            All not available
          </Button>
        </div>
      </div>

      <div className={styles.lines}>
        {combos.map((combo) => {
          const label = Object.entries(combo.attributes)
            .filter(([, value]) => value.trim())
            .map(([key, value]) => `${key}: ${value}`)
            .join(' · ');
          return (
            <div
              key={combo.key || attributeSignature(combo.attributes)}
              className={styles.line}
              data-off={!combo.available}
            >
              <div>
                <strong>{label || 'Standard unit'}</strong>
                <small>{combo.available ? 'Buyers can order this option' : 'Hidden from buyers'}</small>
              </div>
              <label className={styles.avail}>
                <input
                  type="checkbox"
                  checked={combo.available}
                  onChange={(event) => updateCombo(combo.key, { available: event.target.checked })}
                />
                {combo.available ? 'Available' : 'Not available'}
              </label>
              <label className={styles.qty}>
                <span>Stock</span>
                <input
                  type="number"
                  min={0}
                  value={combo.stock}
                  onChange={(event) => updateCombo(combo.key, { stock: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault();
                  }}
                />
              </label>
              <label className={styles.sku}>
                <span>SKU</span>
                <input
                  value={combo.sku}
                  placeholder="Optional"
                  maxLength={64}
                  onChange={(event) => updateCombo(combo.key, { sku: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault();
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
