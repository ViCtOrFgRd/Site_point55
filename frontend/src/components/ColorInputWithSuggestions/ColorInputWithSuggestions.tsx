/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/**
 * Componente para adicionar cores com sugestões e preview
 * Suporta cores simples e variações com gradiente
 */

'use client';

import React, { useState } from 'react';
import { 
  convertColorToHex, 
  getOfficialColorNames,
  getColorLabel,
  getColorVariationStyle
} from '@/utils/colorMapping';
import styles from './ColorInputWithSuggestions.module.scss';

interface ColorInputWithSuggestionsProps {
  onAddColor: (color: string) => void;
  existingColors: string[];
  label?: string;
}

export default function ColorInputWithSuggestions({
  onAddColor,
  existingColors,
  label = 'Cores Disponíveis'
}: ColorInputWithSuggestionsProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allColors = getOfficialColorNames();

  const handleInputChange = (value: string) => {
    setInput(value);

    if (value.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Buscar cores que começam com o input
    const filtered = allColors.filter(
      (color) =>
        color.toLowerCase().includes(value.toLowerCase()) &&
        !existingColors.includes(color) &&
        !existingColors.some((ec) => ec.includes(color))
    );

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleAddColor = (color?: string) => {
    const colorToAdd = color || input.trim();

    if (colorToAdd && !existingColors.includes(colorToAdd)) {
      onAddColor(colorToAdd);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddColor();
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => input.length > 0 && setShowSuggestions(true)}
          placeholder="Digite uma cor ou combinação (ex: azul ou branco/azul ou branco\\azul)"
          className={styles.input}
        />
        <button
          type="button"
          onClick={() => handleAddColor()}
          className={styles.addButton}
          disabled={!input.trim()}
        >
          + Adicionar
        </button>
      </div>

      {/* Preview da cor/variação */}
      {input.trim() && (
        <div className={styles.preview}>
          <div
            className={styles.previewColor}
            style={getColorVariationStyle(input.trim())}
          />
          <span className={styles.previewLabel}>
            {getColorLabel(input.trim())}
          </span>
        </div>
      )}

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <p className={styles.suggestionsTitle}>Sugestões:</p>
          <div className={styles.suggestionsList}>
            {suggestions.slice(0, 8).map((color) => (
              <button
                key={color}
                type="button"
                className={styles.suggestionItem}
                onClick={() => handleAddColor(color)}
              >
                <div
                  className={styles.suggestionColor}
                  style={getColorVariationStyle(color)}
                />
                <span>{getColorLabel(color)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cores populares */}
      {!showSuggestions && (
        <div className={styles.popularColors}>
          <p className={styles.popularTitle}>Cores populares:</p>
          <div className={styles.popularList}>
            {['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde'].map((color) => (
              <button
                key={color}
                type="button"
                className={styles.popularItem}
                onClick={() => handleAddColor(color)}
              >
                <div
                  className={styles.popularColor}
                  style={getColorVariationStyle(color)}
                />
                <span>{color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cores existentes */}
      {existingColors.length > 0 && (
        <div className={styles.existingColors}>
          <p className={styles.existingTitle}>Cores adicionadas:</p>
          <div className={styles.tagsList}>
            {existingColors.map((cor, index) => (
              <span key={index} className={styles.tag}>
                <div
                  className={styles.tagColor}
                  style={getColorVariationStyle(cor)}
                />
                {getColorLabel(cor)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dica */}
      <p className={styles.hint}>
        💡 Dica: Use "/" ou "\\" para combinar cores, ex: "branco/azul"
      </p>

      <p className={styles.hint}>
        📌 Padrão recomendado: {allColors.slice(0, 10).join(', ')}...
      </p>
    </div>
  );
}
