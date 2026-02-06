'use client';

import styles from './ColorSelector.module.scss';
import { 
  convertColorToHex, 
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
  return (
    <div className={styles.colorSelector}>
      <h3>{label}: {selectedColor ? <span className={styles.selectedLabel}>Selecionada</span> : 'Selecione'}</h3>
      <div className={styles.colors}>
        {colors.map((color, index) => (
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
