'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import { Product, Comentario, Avaliacao } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { productService, reviewService, commentService } from '@/services/api';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import CategoryBadges from '@/components/CategoryBadges/CategoryBadges';
import RatingStars from '@/components/RatingStars/RatingStars';
import ReviewCard from '@/components/ReviewCard/ReviewCard';
import CountdownTimer from '@/components/CountdownTimer/CountdownTimer';
import SizeSelector from '@/components/SizeSelector/SizeSelector';
import ColorSelector from '@/components/ColorSelector/ColorSelector';
import { FiShoppingCart, FiHeart, FiTruck, FiShield } from 'react-icons/fi';
import styles from './produto.module.scss';

export default function ProdutoPage() {
  const params = useParams();
  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const productId = idParam ? parseInt(idParam, 10) : NaN;
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  // Estados para adicionar avaliação/comentário
  const [novaAvaliacao, setNovaAvaliacao] = useState(0);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  useEffect(() => {
    if (!idParam || Number.isNaN(productId)) {
      router.push('/produtos');
      return;
    }

    carregarProduto();
    carregarAvaliacoes();
    carregarComentarios();
  }, [idParam]);

  const carregarProduto = async () => {
    setLoading(true);
    
    try {
      if (Number.isNaN(productId)) {
        router.push('/produtos');
        return;
      }

      const response = await productService.getById(productId);
      if (response.success && response.data) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      router.push('/produtos');
    } finally {
      setLoading(false);
    }
  };

  const carregarAvaliacoes = async () => {
    try {
      if (Number.isNaN(productId)) {
        return;
      }

      const response = await reviewService.getByProduct(productId);
      if (response.success && response.data) {
        setAvaliacoes(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const carregarComentarios = async () => {
    try {
      if (Number.isNaN(productId)) {
        return;
      }

      const response = await commentService.getByProduct(productId);
      if (response.success && response.data) {
        setComentarios(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleAdicionarAvaliacao = async () => {
    if (!user) {
      toast.warning('Faça login para avaliar produtos');
      router.push('/perfil');
      return;
    }

    if (novaAvaliacao === 0) {
      toast.warning('Selecione uma nota de 1 a 5 estrelas');
      return;
    }

    setEnviandoAvaliacao(true);

    try {
      if (Number.isNaN(productId)) {
        toast.error('Produto invalido');
        return;
      }

      const response = await reviewService.create(productId, {
        nota: novaAvaliacao
      });

      if (response.success) {
        toast.success('Avaliação enviada com sucesso!');
        setNovaAvaliacao(0);
        carregarAvaliacoes();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar avaliação');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const handleAdicionarComentario = async () => {
    if (!user) {
      toast.warning('Faça login para comentar');
      router.push('/perfil');
      return;
    }

    if (novoComentario.trim().length < 10) {
      toast.warning('O comentário deve ter pelo menos 10 caracteres');
      return;
    }

    setEnviandoAvaliacao(true);

    try {
      if (Number.isNaN(productId)) {
        toast.error('Produto invalido');
        return;
      }

      const response = await commentService.create(productId, {
        texto: novoComentario
      });

      if (response.success) {
        toast.success('Comentário enviado com sucesso!');
        setNovoComentario('');
        carregarComentarios();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar comentário');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const handleMarcarComentarioUtil = async (comentarioId: number) => {
    try {
      await commentService.markUseful(comentarioId);
      carregarComentarios(); // Recarregar para atualizar contador
    } catch (error) {
      console.error('Erro ao marcar comentário como útil:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.tamanhos_disponiveis && product.tamanhos_disponiveis.length > 0 && !selectedSize) {
      toast.warning('Por favor, selecione um tamanho');
      return false;
    }

    if (product.cores_disponiveis && product.cores_disponiveis.length > 0 && !selectedColor) {
      toast.warning('Por favor, selecione uma cor');
      return false;
    }

    addItem(product, quantidade, selectedSize, selectedColor);
    toast.success('Produto adicionado ao carrinho!');
    return true;
  };

  const handleBuyNow = () => {
    const added = handleAddToCart();
    if (added) {
      router.push('/carrinho');
    }
  };

  if (loading || !product) {
    return (
      <div className={styles.loading}>
        <p>Carregando...</p>
      </div>
    );
  }

  const precisaSelecionarTamanho = Boolean(product.tamanhos_disponiveis?.length) && !selectedSize;
  const precisaSelecionarCor = Boolean(product.cores_disponiveis?.length) && !selectedColor;
  const acaoPrincipalLabel = precisaSelecionarTamanho
    ? 'Selecione o tamanho'
    : precisaSelecionarCor
    ? 'Selecione a cor'
    : 'Comprar Agora';
  const acaoSecundariaLabel = precisaSelecionarTamanho
    ? 'Selecione o tamanho'
    : precisaSelecionarCor
    ? 'Selecione a cor'
    : 'Adicionar ao Carrinho';

  // Converter preços para número
  const preco = toNumber(product.preco);
  const precoOriginal = toNumber(product.preco_original);
  const parcelasMaximas = product.parcelas_maximas ? Number(product.parcelas_maximas) : 3;
  const parcelas = parcelasMaximas > 0 ? parcelasMaximas : 3;
  const precoParcelado = preco / parcelas;
  const precoPix = product.preco_pix ? toNumber(product.preco_pix) : preco;
  const precoCredito = product.preco_credito ? toNumber(product.preco_credito) : preco;
  const precoDebito = product.preco_debito ? toNumber(product.preco_debito) : preco;
  const precoBoleto = product.preco_boleto ? toNumber(product.preco_boleto) : preco;

  return (
    <div className={styles.page}>
      <Breadcrumbs 
        items={[
          { label: 'Produtos', href: '/produtos' },
          { label: product.nome }
        ]} 
      />

      <div className={styles.container}>
        <div className={styles.productContainer}>
          {/* Galeria de Imagens */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              {product.imagens[selectedImage] ? (
                <img 
                  src={product.imagens[selectedImage]} 
                  alt={product.nome}
                />
              ) : (
                <div className={styles.noImage}>Sem imagem</div>
              )}
              
              {product.badges && product.badges.length > 0 && (
                <div className={styles.badges}>
                  {product.badges.map(badge => (
                    <span 
                      key={badge.id} 
                      className={styles.badge}
                      style={{ background: badge.cor }}
                    >
                      {badge.nome}
                    </span>
                  ))}
                </div>
              )}

              {product.desconto_percentual && product.desconto_percentual > 0 && (
                <div className={styles.discountBadge}>
                  -{product.desconto_percentual}%
                </div>
              )}
            </div>

            {product.imagens.length > 1 && (
              <div className={styles.thumbnails}>
                {product.imagens.map((img, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img} alt={`${product.nome} - ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className={styles.productInfo}>
            <h1>{product.nome}</h1>

            {/* Categorias */}
            {product.categoria_nomes && product.categoria_nomes.length > 0 && (
              <CategoryBadges categories={product.categoria_nomes} maxDisplay={5} size="medium" />
            )}

            <div className={styles.rating}>
              <RatingStars rating={product.media_avaliacoes || 0} size="medium" showNumber />
              <span className={styles.reviewCount}>({avaliacoes.length} avaliações)</span>
            </div>

            <div className={styles.pricing}>
              {precoOriginal && precoOriginal > preco && (
                <span className={styles.oldPrice}>
                  De R$ {formatPrice(precoOriginal)}
                </span>
              )}
              <div className={styles.currentPrice}>
                Por R$ {formatPrice(preco)}
              </div>
              <div className={styles.installment}>
                {parcelas}x de R$ {formatPrice(precoParcelado)} sem juros
              </div>
              <div className={styles.pixPrice}>
                💰 R$ {formatPrice(precoPix)} no PIX
              </div>
              <div className={styles.paymentBreakdown}>
                <div className={styles.paymentItem}>
                  <span>Credito</span>
                  <strong>R$ {formatPrice(precoCredito)}</strong>
                </div>
                <div className={styles.paymentItem}>
                  <span>Debito</span>
                  <strong>R$ {formatPrice(precoDebito)}</strong>
                </div>
                <div className={styles.paymentItem}>
                  <span>Boleto</span>
                  <strong>R$ {formatPrice(precoBoleto)}</strong>
                </div>
              </div>
            </div>

            {/* Contador de Tempo (se em promoção) */}
            {product.desconto_percentual && product.desconto_percentual > 0 && (
              <div className={styles.countdown}>
                <CountdownTimer endDate="2026-02-10T23:59:59" />
              </div>
            )}

            <div className={styles.description}>
              <p>{product.descricao}</p>
            </div>

            {/* Seletor de Cor */}
            {product.cores_disponiveis && product.cores_disponiveis.length > 0 && (
              <ColorSelector
                colors={product.cores_disponiveis}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />
            )}

            {/* Seletor de Tamanho */}
            {product.tamanhos_disponiveis && product.tamanhos_disponiveis.length > 0 && (
              <SizeSelector
                sizes={product.tamanhos_disponiveis}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
              />
            )}

            {/* Seletor de Quantidade */}
            <div className={styles.quantitySelector}>
              <h3>Quantidade:</h3>
              <div className={styles.quantityControls}>
                <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))}>-</button>
                <span>{quantidade}</span>
                <button onClick={() => setQuantidade(Math.min(product.estoque, quantidade + 1))}>+</button>
              </div>
              <span className={styles.stock}>
                {product.estoque} disponíveis
              </span>
            </div>

            {/* Botões de Ação */}
            <div className={styles.actions}>
              <button className={styles.buyButton} onClick={handleBuyNow}>
                {acaoPrincipalLabel}
              </button>
              <button className={styles.addToCartButton} onClick={handleAddToCart}>
                <FiShoppingCart /> {acaoSecundariaLabel}
              </button>
              <button className={styles.favoriteButton}>
                <FiHeart />
              </button>
            </div>

            {/* Benefícios */}
            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <FiTruck />
                <div>
                  <strong>Frete Grátis</strong>
                  <p>Em compras acima de R$ 200</p>
                </div>
              </div>
              <div className={styles.benefit}>
                <FiShield />
                <div>
                  <strong>Compra Segura</strong>
                  <p>Ambiente 100% protegido</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Avaliações */}
        <div className={styles.reviewsSection}>
          <h2>Avaliações e Comentários</h2>
          <div className={styles.reviewsSummary}>
            <div className={styles.averageRating}>
              <span className={styles.bigRating}>{product.media_avaliacoes?.toFixed(1) || '0.0'}</span>
              <RatingStars rating={product.media_avaliacoes || 0} size="large" />
              <p>{avaliacoes.length} avaliações</p>
            </div>
          </div>

          {/* Formulário de Avaliação */}
          {user && (
            <div className={styles.addReview}>
              <h3>Adicionar Avaliação</h3>
              <div className={styles.starsSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNovaAvaliacao(star)}
                    className={star <= novaAvaliacao ? styles.active : ''}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <button 
                onClick={handleAdicionarAvaliacao}
                disabled={enviandoAvaliacao || novaAvaliacao === 0}
                className={styles.submitButton}
              >
                {enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          )}

          {/* Formulário de Comentário */}
          {user && (
            <div className={styles.addComment}>
              <h3>Adicionar Comentário</h3>
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Compartilhe sua experiência com este produto (mínimo 10 caracteres)..."
                rows={4}
                className={styles.commentTextarea}
              />
              <button 
                onClick={handleAdicionarComentario}
                disabled={enviandoAvaliacao || novoComentario.length < 10}
                className={styles.submitButton}
              >
                {enviandoAvaliacao ? 'Enviando...' : 'Enviar Comentário'}
              </button>
            </div>
          )}

          <div className={styles.commentsList}>
            <h3>Comentários ({comentarios.length})</h3>
            {comentarios.map(comentario => (
              <div key={comentario.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <strong>{comentario.usuario_nome}</strong>
                  <span className={styles.commentDate}>
                    {new Date(comentario.data_comentario).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className={styles.commentText}>{comentario.texto}</p>
                <button 
                  onClick={() => handleMarcarComentarioUtil(comentario.id)}
                  className={styles.usefulButton}
                >
                  👍 Útil ({comentario.curtidas || 0})
                </button>
              </div>
            ))}
            {comentarios.length === 0 && (
              <p className={styles.noComments}>Ainda não há comentários para este produto.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
