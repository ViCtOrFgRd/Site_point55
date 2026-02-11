'use client';

import styles from './ColorSelector.module.scss';
import { 
  getColorLabel, 
  getColorVariationStyle 
} from '@/utils/colorMapping';

interface ColorSelectorProps {
  colors: string[];
  selectedColor?: string;
  onSelectColor: (color: string) => void;
  label?: string;
}

export default function ColorSelector({ 
  colors, 
  selectedColor, 
  onSelectColor,
  label = 'Cor'
}: ColorSelectorProps) {
  const colorOptions = Array.from(
    new Map(
      colors
        .map((color) => color.trim())
        .filter(Boolean)
        .map((color) => [color.toLowerCase(), color])
    ).values()
  );

  return (
    <div className={styles.colorSelector}>
      <h3>{label}: {selectedColor ? <span className={styles.selectedLabel}>Selecionada</span> : 'Selecione'}</h3>
      <div className={styles.colors}>
        {colorOptions.map((color, index) => (
          <button
            key={index}
            className={`${styles.colorOption} ${selectedColor === color ? styles.active : ''}`}
            style={getColorVariationStyle(color)}
            onClick={() => onSelectColor(color)}
            title={getColorLabel(color)}
            aria-label={`Selecionar cor ${getColorLabel(color)}`}
          />
        ))}
      </div>
    </div>
  );
}
