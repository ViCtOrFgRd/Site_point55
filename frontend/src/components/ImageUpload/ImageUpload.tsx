'use client';

import { useState, useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import styles from './ImageUpload.module.scss';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  onImageRemoved?: () => void;
  previewUrl?: string;
  accept?: string;
  maxSize?: number; // em MB
  label?: string;
}

export default function ImageUpload({
  onImageSelected,
  onImageRemoved,
  previewUrl,
  accept = 'image/*',
  maxSize = 5,
  label = 'Upload de Imagem',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError('');

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido');
      return false;
    }

    // Validar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`O arquivo não pode exceder ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onImageSelected(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved?.();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      {previewUrl ? (
        <div className={styles.preview}>
          <img src={previewUrl} alt="Preview" className={styles.previewImage} />
          <button
            type="button"
            onClick={handleRemoveImage}
            className={styles.removeButton}
            title="Remover imagem"
          >
            <FiX />
          </button>
        </div>
      ) : (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FiUpload size={32} />
          <p>Arraste uma imagem ou clique para selecionar</p>
          <small>Máximo {maxSize}MB • Formatos: JPG, PNG, WebP</small>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className={styles.hiddenInput}
          />
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
