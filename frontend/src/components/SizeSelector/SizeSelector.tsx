'use client';

import styles from './SizeSelector.module.scss';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize?: string;
  onSelectSize: (size: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function SizeSelector({ 
  sizes, 
  selectedSize, 
  onSelectSize,
  label = 'Tamanho',
  disabled = false
}: SizeSelectorProps) {
  return (
    <div className={styles.sizeSelector}>
      <h3>{label}: {selectedSize || 'Selecione'}</h3>
      <div className={styles.sizes}>
        {sizes.map((size) => (
          <button
            key={size}
            className={`${styles.sizeOption} ${selectedSize === size ? styles.active : ''}`}
            onClick={() => !disabled && onSelectSize(size)}
            disabled={disabled}
            aria-label={`Selecionar tamanho ${size}`}
          >
            {size}
          </button>
        ))}
      </div>
      <button className={styles.sizeGuideLink} type="button">
        📏 Guia de Tamanhos
      </button>
    </div>
  );
}
