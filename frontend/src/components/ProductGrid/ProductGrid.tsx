'use client';

import { Product } from '@/types';
import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.scss';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className={styles.grid}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={styles.skeleton}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonText} />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
