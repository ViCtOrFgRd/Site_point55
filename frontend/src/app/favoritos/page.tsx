'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiHeart, FiShoppingCart, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import styles from './favoritos.module.scss';

interface Produto {
  id: number;
  nome: string;
  slug: string;
  preco: number;
  preco_promocional?: number;
  imagem_principal: string;
  estoque: number;
}

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFavoritos();
  }, []);

  const carregarFavoritos = async () => {
    try {
      // Verificar se o usuário está autenticado
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Carregar favoritos do localStorage para usuários não autenticados
        const favoritosLocal = JSON.parse(localStorage.getItem('favoritos') || '[]');
        if (favoritosLocal.length > 0) {
          // Buscar detalhes dos produtos
          const produtosPromises = favoritosLocal.map((id: number) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/produtos/${id}`).then(r => r.json())
          );
          const produtos = await Promise.all(produtosPromises);
          setFavoritos(produtos.filter(p => p));
        }
        setLoading(false);
        return;
      }

      // Buscar favoritos do backend para usuários autenticados
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavoritos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const removerFavorito = async (produtoId: number) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        // Remover do localStorage
        const favoritosLocal = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const novosFavoritos = favoritosLocal.filter((id: number) => id !== produtoId);
        localStorage.setItem('favoritos', JSON.stringify(novosFavoritos));
        setFavoritos(favoritos.filter(p => p.id !== produtoId));
        return;
      }

      // Remover do backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos/${produtoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFavoritos(favoritos.filter(p => p.id !== produtoId));
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const itemExistente = carrinho.find((item: any) => item.produto_id === produto.id);

    if (itemExistente) {
      itemExistente.quantidade += 1;
    } else {
      carrinho.push({
        produto_id: produto.id,
        nome: produto.nome,
        preco: produto.preco_promocional || produto.preco,
        quantidade: 1,
        imagem: produto.imagem_principal
      });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    window.dispatchEvent(new Event('carrinhoAtualizado'));
    
    // Mostrar feedback visual (você pode adicionar um toast aqui)
    alert('Produto adicionado ao carrinho!');
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Meus Favoritos' }]} />
          <div className={styles.loading}>
            <p>Carregando favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Meus Favoritos' }]} />

        <div className={styles.header}>
          <FiHeart className={styles.headerIcon} />
          <h1>Meus Favoritos</h1>
          <p>
            {favoritos.length > 0
              ? `Você tem ${favoritos.length} ${favoritos.length === 1 ? 'produto' : 'produtos'} na sua lista de desejos`
              : 'Sua lista de desejos está vazia'}
          </p>
        </div>

        {favoritos.length === 0 ? (
          <div className={styles.empty}>
            <FiHeart className={styles.emptyIcon} />
            <h2>Nenhum produto favorito ainda</h2>
            <p>
              Comece a adicionar produtos aos seus favoritos clicando no ícone de coração 
              nas páginas de produtos
            </p>
            <Link href="/produtos" className={styles.btnExplorar}>
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {favoritos.map((produto) => (
                <div key={produto.id} className={styles.card}>
                  <button
                    className={styles.btnRemover}
                    onClick={() => removerFavorito(produto.id)}
                    title="Remover dos favoritos"
                  >
                    <FiTrash2 />
                  </button>

                  {produto.preco_promocional && (
                    <div className={styles.badge}>OFERTA</div>
                  )}

                  {produto.estoque === 0 && (
                    <div className={styles.badgeIndisponivel}>Esgotado</div>
                  )}

                  <Link href={`/produto/${produto.slug}`} className={styles.imageLink}>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={produto.imagem_principal || '/images/placeholder.jpg'}
                        alt={produto.nome}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.image}
                      />
                    </div>
                  </Link>

                  <div className={styles.cardContent}>
                    <Link href={`/produto/${produto.slug}`}>
                      <h3 className={styles.nome}>{produto.nome}</h3>
                    </Link>

                    <div className={styles.priceSection}>
                      {produto.preco_promocional ? (
                        <>
                          <span className={styles.precoOriginal}>
                            {formatarPreco(produto.preco)}
                          </span>
                          <span className={styles.precoPromocional}>
                            {formatarPreco(produto.preco_promocional)}
                          </span>
                          <span className={styles.desconto}>
                            {Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)}% OFF
                          </span>
                        </>
                      ) : (
                        <span className={styles.preco}>
                          {formatarPreco(produto.preco)}
                        </span>
                      )}
                    </div>

                    <button
                      className={styles.btnCarrinho}
                      onClick={() => adicionarAoCarrinho(produto)}
                      disabled={produto.estoque === 0}
                    >
                      <FiShoppingCart />
                      {produto.estoque === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <Link href="/produtos" className={styles.btnContinuar}>
                Continuar Comprando
              </Link>
            </div>
          </>
        )}

        <div className={styles.infoSection}>
          <h2>Sobre os Favoritos</h2>
          
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <FiHeart className={styles.infoIcon} />
              <h3>Salve o que você ama</h3>
              <p>
                Adicione produtos à sua lista de favoritos para encontrá-los facilmente depois
              </p>
            </div>

            <div className={styles.infoCard}>
              <FiAlertCircle className={styles.infoIcon} />
              <h3>Não perca promoções</h3>
              <p>
                Acompanhe seus produtos favoritos e seja notificado sobre descontos especiais
              </p>
            </div>

            <div className={styles.infoCard}>
              <FiShoppingCart className={styles.infoIcon} />
              <h3>Compre quando quiser</h3>
              <p>
                Seus favoritos ficam salvos para você comprar no momento certo
              </p>
            </div>
          </div>

          <div className={styles.tips}>
            <h3>Dicas</h3>
            <ul>
              <li>Favoritos são salvos automaticamente enquanto você navega</li>
              <li>Faça login para sincronizar favoritos entre dispositivos</li>
              <li>Use favoritos para criar listas de presentes</li>
              <li>Compartilhe produtos favoritos com amigos e família</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
