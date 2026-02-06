'use client';

import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import styles from './RatingStars.module.scss';

interface RatingStarsProps {
  rating: number; // 0 a 5
  size?: 'small' | 'medium' | 'large';
  showNumber?: boolean;
  readonly?: boolean;
  onRate?: (rating: number) => void;
}

export default function RatingStars({ 
  rating, 
  size = 'medium', 
  showNumber = false,
  readonly = true,
  onRate
}: RatingStarsProps) {
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // Estrela cheia
      stars.push(
        <FaStar 
          key={i} 
          className={`${styles.star} ${styles.filled}`}
          onClick={() => !readonly && onRate && onRate(i)}
        />
      );
    } else if (rating >= i - 0.5) {
      // Meia estrela
      stars.push(
        <FaStarHalfAlt 
          key={i} 
          className={`${styles.star} ${styles.filled}`}
          onClick={() => !readonly && onRate && onRate(i)}
        />
      );
    } else {
      // Estrela vazia
      stars.push(
        <FiStar 
          key={i} 
          className={styles.star}
          onClick={() => !readonly && onRate && onRate(i)}
        />
      );
    }
  }

  return (
    <div className={`${styles.ratingStars} ${styles[size]} ${!readonly ? styles.interactive : ''}`}>
      <div className={styles.stars}>
        {stars}
      </div>
      {showNumber && (
        <span className={styles.ratingNumber}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
