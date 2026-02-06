'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import { getColorBackground } from '@/utils/colorMapping';
import CategoryBadges from '@/components/CategoryBadges/CategoryBadges';
import styles from './ProductCard.module.scss';

// Helper para obter cor hexadecimal
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'Preto': '#000000',
    'Branco': '#FFFFFF',
    'Cinza': '#808080',
    'Cinza-claro': '#D3D3D3',
    'Cinza-escuro': '#404040',
    'Azul': '#0066CC',
    'Azul-claro': '#87CEEB',
    'Azul-escuro': '#00008B',
    'Vermelho': '#FF0000',
    'Vermelho-escuro': '#8B0000',
    'Verde': '#008000',
    'Verde-claro': '#90EE90',
    'Verde-escuro': '#006400',
    'Amarelo': '#FFFF00',
    'Laranja': '#FFA500',
    'Rosa': '#FFC0CB',
    'Rosa-escuro': '#DB7093',
    'Roxo': '#800080',
    'Marrom': '#8B4513',
    'Bege': '#F5F5DC',
    'Ouro': '#FFD700',
    'Prata': '#C0C0C0',
    'Turquesa': '#40E0D0',
    'Teal': '#008080',
    'Coral': '#FF7F50',
    'Khaki': '#F0E68C',
    'Salmon': '#FA8072',
    'Chocolate': '#D2691E',
  };
  return colorMap[colorName] || '#CCCCCC';
};

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

  const parcelamento = Math.floor(preco / 3);
  const precoComPix = preco * 0.95; // 5% desconto no PIX

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
        {product.cores_disponiveis && product.cores_disponiveis.length > 0 && (
          <div className={styles.colors}>
            {product.cores_disponiveis.slice(0, 5).map((cor, index) => {
              // Importar aqui ou usar inline
              const isGradient = cor.includes('/');
              const style = isGradient 
                ? { background: `linear-gradient(135deg, ${cor.split('/').map(c => getColorHex(c.trim())).join(', ')})` }
                : { backgroundColor: getColorHex(cor) };
              
              return (
                <div
                  key={index}
                  className={styles.colorDot}
                  style={style}
                  title={cor}
                />
              );
            })}
            {product.cores_disponiveis.length > 5 && (
              <span className={styles.moreColors}>
                +{product.cores_disponiveis.length - 5}
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
          3x de R$ {formatPrice(parcelamento)} sem juros
        </p>

        {/* Preço com PIX */}
        <div className={styles.pixPrice}>
          <span className={styles.pixLabel}>💰 R$ {formatPrice(precoComPix)}</span>
          <span className={styles.pixText}>no PIX (5% OFF)</span>
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
