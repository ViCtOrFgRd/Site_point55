'use client';

import styles from './ColorSelector.module.scss';

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
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            title={color}
            aria-label={`Selecionar cor ${color}`}
          />
        ))}
      </div>
    </div>
  );
}
