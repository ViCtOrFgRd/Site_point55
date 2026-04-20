'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import { extractColorOptions, getColorVariationStyle } from '@/utils/colorMapping';
import { sanitizeText } from '@/utils/textSanitizer';
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
  const parcelamento = preco / parcelas;
  const precoComPix = product.preco_pix ? toNumber(product.preco_pix) : preco * 0.95;
  const colorOptions = extractColorOptions(product.cores_disponiveis || []);
  const nomeProduto = sanitizeText(product.nome);
  const categorias = (product.categoria_nomes || []).map((categoria) => sanitizeText(categoria));

  return (
    <Link href={`/produtos/${product.id}`} className={styles.card}>
      {/* Imagem do Produto */}
      <div className={styles.imageWrapper}>
        {product.imagens && product.imagens.length > 0 ? (
          <Image
            src={product.imagens[0]}
            alt={nomeProduto}
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
        <div className={styles.nameBlock}>
          <h3 className={styles.name}>{nomeProduto.toUpperCase()}</h3>
        </div>

        {/* Perfume/Categoria */}
        <div className={styles.perfumeBlock}>
          <span className={styles.metaLabel}>Perfume</span>
          <div className={styles.perfumeContent}>
            {categorias.length > 0 ? (
              <CategoryBadges categories={categorias} maxDisplay={2} size="small" />
            ) : (
              <span className={styles.metaValue}>Não informado</span>
            )}
          </div>
        </div>

        {/* Cores Disponíveis */}
        <div className={styles.colorsBlock}>
          <span className={styles.metaLabel}>Cores</span>
          <div className={styles.colors}>
            {colorOptions.length > 0 ? (
              <>
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
              </>
            ) : (
              <span className={styles.metaValue}>Sem variações</span>
            )}
          </div>
        </div>

        {/* Preços */}
        <div className={styles.pricingBlock}>
          <span className={styles.metaLabel}>Valor</span>
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
