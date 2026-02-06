'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import CountdownTimer from '@/components/CountdownTimer/CountdownTimer';
import { Product } from '@/types';
import { productService, bannerService } from '@/services/api';
import { FiTrendingUp, FiZap } from 'react-icons/fi';
import styles from './promocoes.module.scss';

export default function PromocoesPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  const [banner, setBanner] = useState<any>(null);
  const [loadingBanner, setLoadingBanner] = useState(true);

  useEffect(() => {
    // Obter categoria dos parâmetros de URL
    const categoriaParam = searchParams.get('categoria') || '';
    setCategoriaSelecionada(categoriaParam);
    carregarProdutosEmPromocao(categoriaParam);
    carregarBanner();
  }, [searchParams]);

  const carregarBanner = async () => {
    try {
      const response = await bannerService.getAll(true);
      if (response.success && response.data && response.data.length > 0) {
        // Pegar o primeiro banner ativo
        setBanner(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar banner:', error);
    } finally {
      setLoadingBanner(false);
    }
  };

  const carregarProdutosEmPromocao = async (categoria: string = '') => {
    setLoading(true);

    try {
      const params: any = { limite: 50 };
      
      // Se houver categoria na URL, adicionar ao filtro
      if (categoria) {
        // Validar se é número ou texto (slug)
        const categoriaNumerica = parseInt(categoria, 10);
        if (!isNaN(categoriaNumerica) && categoriaNumerica > 0) {
          params.categoria = categoriaNumerica;
        } else {
          params.categoria = categoria;
        }
      }

      const response = await productService.getPromocoes(params);
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar promoções:', error?.message || error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Breadcrumbs items={[{ label: 'Promoções' }]} />

      <div className={styles.container}>
        {/* Banner de Promoção - Dinâmico */}
        {!loadingBanner && banner && (
          <div 
            className={styles.promoBanner}
            style={banner.cor_fundo ? { backgroundColor: banner.cor_fundo } : {}}
          >
            {banner.imagem && (
              <div className={styles.bannerImage}>
                <img src={banner.imagem} alt={banner.titulo} />
              </div>
            )}
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>
                <FiZap />
              </div>
              <div>
                <h1>{banner.titulo}</h1>
                {banner.subtitulo && <p>{banner.subtitulo}</p>}
              </div>
            </div>
            {banner.data_fim && (
              <div className={styles.countdown}>
                <p>Promoção termina em:</p>
                <CountdownTimer endDate={banner.data_fim} />
              </div>
            )}
            {banner.link_botao && banner.texto_botao && (
              <div className={styles.bannerAction}>
                <a href={banner.link_botao} className={styles.bannerButton}>
                  {banner.texto_botao}
                </a>
              </div>
            )}
          </div>
        )}
        
        {/* Banner padrão caso não haja banner configurado */}
        {!loadingBanner && !banner && (
          <div className={styles.promoBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>
                <FiZap />
              </div>
              <div>
                <h1>MEGA BAZAR</h1>
                <p>Até 70% OFF em peças selecionadas</p>
              </div>
            </div>
            <div className={styles.countdown}>
              <p>Promoção termina em:</p>
              <CountdownTimer endDate="2026-02-15T23:59:59" />
            </div>
          </div>
        )}

        {/* Destaques */}
        <div className={styles.highlights}>
          <div className={styles.highlightCard}>
            <FiTrendingUp />
            <h3>Mais Vendidos</h3>
            <p>Os produtos que todo mundo quer</p>
          </div>
          <div className={styles.highlightCard}>
            <FiZap />
            <h3>Ofertas Relâmpago</h3>
            <p>Descontos especiais por tempo limitado</p>
          </div>
          <div className={styles.highlightCard}>
            <FiTrendingUp />
            <h3>Últimas Unidades</h3>
            <p>Aproveite enquanto há estoque</p>
          </div>
        </div>

        {/* Seção de Produtos */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {categoriaSelecionada 
                ? `Promoções - ${categoriaSelecionada.charAt(0).toUpperCase() + categoriaSelecionada.slice(1)}`
                : 'Produtos em Promoção'
              }
            </h2>
            <p>{products.length} produtos com desconto</p>
          </div>
          <ProductGrid products={products} loading={loading} />
        </section>

        {/* Banner Informativo */}
        <div className={styles.infoBanner}>
          <h3>🎉 Cupom de Desconto</h3>
          <p>Use o cupom <strong>PRIMEIRACOMPRA</strong> e ganhe mais 5% OFF</p>
        </div>
      </div>
    </div>
  );
}
