/* eslint-disable @next/next/no-img-element, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import CountdownTimer from '@/components/CountdownTimer/CountdownTimer';
import { Product } from '@/types';
import { productService, bannerService } from '@/services/api';
import { FiZap } from 'react-icons/fi';
import styles from './promocoes.module.scss';

function PromocoesContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  const [banner, setBanner] = useState<any>(null);
  const [loadingBanner, setLoadingBanner] = useState(true);

  const desativarBannerAtual = () => {
    setBanner(null);
  };

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
      const bannersData: any[] = Array.isArray(response.data) ? response.data : [];
      if (response.success && bannersData.length > 0) {
        // Pegar o primeiro banner ativo
        const primeiroBanner = bannersData[0];
        const expirado = primeiroBanner?.data_fim
          ? (() => {
              const fim = new Date(primeiroBanner.data_fim);
              fim.setHours(23, 59, 59, 999);
              return fim.getTime() < Date.now();
            })()
          : false;

        if (expirado) {
          desativarBannerAtual();
          return;
        }

        setBanner(primeiroBanner);
        return;
      }

      setBanner(null);
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
        setProducts(Array.isArray(response.data) ? response.data : []);
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
                <p>Oferta termina em:</p>
                <CountdownTimer endDate={banner.data_fim} onExpire={desativarBannerAtual} />
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
        
        {/* Seção de Produtos */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>
              {categoriaSelecionada 
                ? `Ofertas - ${categoriaSelecionada.charAt(0).toUpperCase() + categoriaSelecionada.slice(1)}`
                : 'Ofertas em Promoção'
              }
            </h2>
            <p>{products.length} produtos com desconto</p>
          </div>
          <ProductGrid products={products} loading={loading} />
        </section>
      </div>
    </div>
  );
}

export default function PromocoesPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.container}>Carregando promoções...</div></div>}>
      <PromocoesContent />
    </Suspense>
  );
}
