'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import HeroSlider from '@/components/HeroSlider/HeroSlider';
import { Product } from '@/types';
import { productService, categoryService } from '@/services/api';
import { getCategoryIcon, getCategoryColor, getCategoryImage } from '@/config/categoryIcons';
import Link from 'next/link';
import styles from './page.module.scss';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingPromo, setLoadingPromo] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    // Carregar produtos em destaque (mais vendidos)
    try {
      const response = await productService.getDestaques({ limite: 8 });
      if (response.success) {
        setFeaturedProducts(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos em destaque:', error);
    } finally {
      setLoadingFeatured(false);
    }

    // Carregar produtos em promoção
    try {
      const response = await productService.getPromocoes({ limite: 8 });
      if (response.success) {
        setPromoProducts(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    } finally {
      setLoadingPromo(false);
    }

    // Carregar categorias
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategorias(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  // Ícones para categorias (fallback caso não tenha imagem)
  const categoryIcons: any = {
    'roupas-femininas': '👗',
    'roupas-masculinas': '👔',
    'acessorios': '👜',
    'acessórios': '👜',
    'calcados': '👟',
    'calçados': '👟',
    'calcas': '👖',
    'camisas': '👕',
    'tenis': '👟',
    'tênnis': '👟',
    'outros': '🛍️',
  };

  const categoryColors: any = {
    'roupas-femininas': '#FFE5E5',
    'roupas-masculinas': '#E5F2FF',
    'acessorios': '#FFF5E5',
    'acessórios': '#FFF5E5',
    'calcados': '#F0E5FF',
    'calçados': '#F0E5FF',
    'calcas': '#F5F0FF',
    'camisas': '#FFF0E5',
    'tenis': '#E5F5FF',
    'tênnis': '#E5F5FF',
    'outros': '#FFE5F5',
  };

  return (
    <div className={styles.home}>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Produtos em Destaque */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Produtos em Destaque</h2>
            <p>Nossas peças mais vendidas</p>
          </div>
          {loadingFeatured ? (
            <div className={styles.loading}>Carregando...</div>
          ) : featuredProducts.length === 0 ? (
            <div className={styles.empty}>Nenhum produto em destaque no momento.</div>
          ) : (
            <ProductGrid products={featuredProducts} loading={loadingFeatured} />
          )}
          <div className={styles.sectionFooter}>
            <Link href="/produtos" className={styles.viewAllButton}>
              Ver Todos os Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className={styles.categories}>
        <div className={styles.container}>
          <h2>Categorias</h2>
          <div className={styles.categoryGrid}>
            {categorias.length === 0 ? (
              // Fallback para categorias padrão com imagens
              <>
                <Link href="/produtos?categoria=roupas-femininas" className={styles.categoryCard}>
                  <div className={styles.categoryImage} style={{ 
                    background: '#FFE5E5',
                    backgroundImage: 'url(/images/categories/roupas-femininas.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <span style={{ fontSize: '4rem' }}>👗</span>
                  </div>
                  <h3>Feminino</h3>
                </Link>
                <Link href="/produtos?categoria=roupas-masculinas" className={styles.categoryCard}>
                  <div className={styles.categoryImage} style={{ 
                    background: '#E5F2FF',
                    backgroundImage: 'url(/images/categories/roupas-masculinas.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <span style={{ fontSize: '4rem' }}>👔</span>
                  </div>
                  <h3>Masculino</h3>
                </Link>
                <Link href="/produtos?categoria=acessorios" className={styles.categoryCard}>
                  <div className={styles.categoryImage} style={{ 
                    background: '#FFF5E5',
                    backgroundImage: 'url(/images/categories/acessorios.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <span style={{ fontSize: '4rem' }}>👜</span>
                  </div>
                  <h3>Acessórios</h3>
                </Link>
                <Link href="/produtos?categoria=calcados" className={styles.categoryCard}>
                  <div className={styles.categoryImage} style={{ 
                    background: '#F0E5FF',
                    backgroundImage: 'url(/images/categories/calcados.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <span style={{ fontSize: '4rem' }}>👟</span>
                  </div>
                  <h3>Calçados</h3>
                </Link>
              </>
            ) : (
              categorias.slice(0, 8).map((categoria) => (
                <Link 
                  key={categoria.id} 
                  href={`/produtos?categoria=${categoria.slug}`} 
                  className={styles.categoryCard}
                >
                  <div className={styles.categoryImage} style={{ 
                    background: categoryColors[categoria.slug] || '#E5F5FF',
                    backgroundImage: `url(${getCategoryImage(categoria.slug, categoria.nome)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    {!categoria.imagem && (
                      <span style={{ fontSize: '4rem' }}>
                        {categoryIcons[categoria.slug] || '🛍️'}
                      </span>
                    )}
                  </div>
                  <h3>{categoria.nome}</h3>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promoções */}
      {promoProducts.length > 0 && (
        <section className={styles.promoSection}>
          <div className={styles.container}>
            <h2>🔥 Promoções Imperdíveis</h2>
            <ProductGrid products={promoProducts} loading={loadingPromo} />
            <div className={styles.sectionFooter}>
              <Link href="/promocoes" className={styles.viewAllButton}>
                Ver Todas as Promoções
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

