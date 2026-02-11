'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import { getColorVariationStyle } from '@/utils/colorMapping';
import CategoryBadges from '@/components/CategoryBadges/CategoryBadges';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Converter preços para número (vêm como string do PostgreSQL)
  const preco = toNumber(product.preco);
  const precoOriginal = toNumber(product.preco_original);
  
  const hasDiscount = precoOriginal && precoOriginal > preco;
  const discountPercent = product.desconto_percentual || 
    (hasDiscount ? Math.round(((precoOriginal - preco) / precoOriginal) * 100) : 0);

  const parcelasMaximas = product.parcelas_maximas ? Number(product.parcelas_maximas) : 3;
  const parcelas = parcelasMaximas > 0 ? parcelasMaximas : 3;
  const parcelamento = Math.floor(preco / parcelas);
  const precoComPix = product.preco_pix ? toNumber(product.preco_pix) : preco * 0.95;
  const colorOptions = product.cores_disponiveis
    ? Array.from(
        new Map(
          product.cores_disponiveis
            .map((cor) => cor.trim())
            .filter(Boolean)
            .map((cor) => [cor.toLowerCase(), cor])
        ).values()
      )
    : [];

  return (
    <Link href={`/produtos/${product.id}`} className={styles.card}>
      {/* Imagem do Produto */}
      <div className={styles.imageWrapper}>
        {product.imagens && product.imagens.length > 0 ? (
          <Image
            src={product.imagens[0]}
            alt={product.nome}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className={styles.noImage}>
            <span>Sem imagem</span>
          </div>
        )}

        {/* Badges */}
        <div className={styles.badges}>
          {product.badges && product.badges.map((badge) => (
            <span
              key={badge.id}
              className={styles.badge}
              style={{ backgroundColor: badge.cor }}
            >
              {badge.nome}
            </span>
          ))}
        </div>

        {/* Badge de Desconto */}
        {hasDiscount && (
          <div className={styles.discountBadge}>
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Informações do Produto */}
      <div className={styles.info}>
        {/* Nome */}
        <h3 className={styles.name}>{product.nome.toUpperCase()}</h3>

        {/* Categorias */}
        {product.categoria_nomes && product.categoria_nomes.length > 0 && (
          <CategoryBadges categories={product.categoria_nomes} maxDisplay={3} size="small" />
        )}

        {/* Cores Disponíveis */}
        {colorOptions.length > 0 && (
          <div className={styles.colors}>
            {colorOptions.slice(0, 5).map((cor, index) => (
              <div
                key={`${cor}-${index}`}
                className={styles.colorDot}
                style={getColorVariationStyle(cor)}
                title={cor}
              />
            ))}
            {colorOptions.length > 5 && (
              <span className={styles.moreColors}>
                +{colorOptions.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Preços */}
        <div className={styles.pricing}>
          {hasDiscount && (
            <span className={styles.originalPrice}>
              de R$ {formatPrice(precoOriginal)}
            </span>
          )}
          <div className={styles.currentPrice}>
            <span className={styles.label}>por</span>
            <span className={styles.price}>
              R$ {formatPrice(preco)}
            </span>
          </div>
        </div>

        {/* Parcelamento */}
        <p className={styles.installment}>
          {parcelas}x de R$ {formatPrice(parcelamento)} sem juros
        </p>

        {/* Preço com PIX */}
        <div className={styles.pixPrice}>
          <span className={styles.pixLabel}>R$ {formatPrice(precoComPix)}</span>
          <span className={styles.pixText}>no PIX</span>
        </div>

        {/* Avaliações */}
        {product.media_avaliacoes && (
          <div className={styles.rating}>
            <span className={styles.stars}>
              {'★'.repeat(Math.round(product.media_avaliacoes))}
              {'☆'.repeat(5 - Math.round(product.media_avaliacoes))}
            </span>
            <span className={styles.ratingValue}>
              {product.media_avaliacoes.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
