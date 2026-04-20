'use client';

import styles from './SizeSelector.module.scss';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize?: string;
  onSelectSize: (size: string) => void;
  label?: string;
  disabled?: boolean;
  stockBySize?: Record<string, number>;
  soldBySize?: Record<string, number>;
}

export default function SizeSelector({ 
  sizes, 
  selectedSize, 
  onSelectSize,
  label = 'Tamanho',
  disabled = false,
  stockBySize = {},
  soldBySize = {},
}: SizeSelectorProps) {
  const normalize = (value: string) => value.trim().toUpperCase();

  return (
    <div className={styles.sizeSelector}>
      <h3>{label}: {selectedSize || 'Selecione'}</h3>
      <div className={styles.sizes}>
        {sizes.map((size) => {
          const sizeKey = normalize(size);
          const stockValue = Number(stockBySize[sizeKey] ?? stockBySize[size] ?? 0);
          const soldValue = Number(soldBySize[sizeKey] ?? soldBySize[size] ?? 0);
          const sizeDisabled = disabled || (Object.keys(stockBySize).length > 0 && stockValue <= 0);

          return (
            <button
              key={size}
              className={`${styles.sizeOption} ${selectedSize === size ? styles.active : ''}`}
              onClick={() => !sizeDisabled && onSelectSize(size)}
              disabled={sizeDisabled}
              aria-label={`Selecionar tamanho ${size}`}
            >
              <span className={styles.sizeValue}>{size}</span>
              {(Object.keys(stockBySize).length > 0 || soldValue > 0) && (
                <span className={styles.sizeMeta}>
                  {Object.keys(stockBySize).length > 0 ? `${Math.max(0, stockValue)} disp.` : null}
                  {soldValue > 0 ? ` • ${soldValue} vend.` : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button className={styles.sizeGuideLink} type="button">
        📏 Guia de Tamanhos
      </button>
    </div>
  );
}
