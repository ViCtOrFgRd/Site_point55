'use client';

import styles from './ColorSelector.module.scss';
import { 
  extractColorOptions,
  getColorLabel, 
  getColorVariationStyle 
} from '@/utils/colorMapping';

interface ColorSelectorProps {
  colors: string[];
  selectedColor?: string;
  onSelectColor: (color: string) => void;
  label?: string;
  disabledColors?: string[];
}

export default function ColorSelector({ 
  colors, 
  selectedColor, 
  onSelectColor,
  label = 'Cor',
  disabledColors = [],
}: ColorSelectorProps) {
  const colorOptions = extractColorOptions(colors);
  const disabledSet = new Set(disabledColors);

  return (
    <div className={styles.colorSelector}>
      <h3>{label}: {selectedColor ? <span className={styles.selectedLabel}>Selecionada</span> : 'Selecione'}</h3>
      <div className={styles.colors}>
        {colorOptions.map((color, index) => {
          const isDisabled = disabledSet.has(color);

          return (
          <button
            key={index}
            className={`${styles.colorItem} ${selectedColor === color ? styles.itemActive : ''}`}
            onClick={() => !isDisabled && onSelectColor(color)}
            title={getColorLabel(color)}
            aria-label={`Selecionar cor ${getColorLabel(color)}`}
            disabled={isDisabled}
          >
            <span
              className={`${styles.colorOption} ${selectedColor === color ? styles.active : ''}`}
              style={getColorVariationStyle(color)}
            />
            <span className={styles.colorLabel}>{getColorLabel(color)}</span>
          </button>
          );
        })}
      </div>
    </div>
  );
}
