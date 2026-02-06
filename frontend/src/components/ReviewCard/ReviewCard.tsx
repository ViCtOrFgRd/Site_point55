'use client';

import { Comentario } from '@/types';
import RatingStars from '../RatingStars/RatingStars';
import { FiThumbsUp } from 'react-icons/fi';
import styles from './ReviewCard.module.scss';

interface ReviewCardProps {
  comentario: Comentario;
  onLike?: (id: number) => void;
}

export default function ReviewCard({ comentario, onLike }: ReviewCardProps) {
  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {comentario.usuario_nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className={styles.userName}>{comentario.usuario_nome || 'Usuário'}</h4>
            <p className={styles.reviewDate}>{formatarData(comentario.data_comentario)}</p>
          </div>
        </div>
        {comentario.nota && (
          <RatingStars rating={comentario.nota} size="small" />
        )}
      </div>

      <div className={styles.reviewContent}>
        <p>{comentario.texto}</p>
      </div>

      {comentario.verificado_compra && (
        <div className={styles.verifiedBadge}>
          ✓ Compra Verificada
        </div>
      )}

      <div className={styles.reviewFooter}>
        <button 
          className={styles.likeButton}
          onClick={() => onLike && onLike(comentario.id)}
        >
          <FiThumbsUp />
          <span>Útil ({comentario.curtidas})</span>
        </button>
      </div>
    </div>
  );
}
