/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import HeroSlider from '@/components/HeroSlider/HeroSlider';
import { Product } from '@/types';
import { productService, categoryService } from '@/services/api';
import Link from 'next/link';
import styles from './page.module.scss';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarCategorias = async () => {
    setLoadingCategories(true);
    setCategoriesError(false);

    try {
      const response = await categoryService.getAll();
      if (response.success) {
        const categoriasData: any[] = Array.isArray(response.data) ? response.data : [];
        const categoriasAtivas = categoriasData.filter(
          (categoria: any) => categoria.produtos_count > 0
        );
        setCategorias(categoriasAtivas);
      } else {
        setCategoriesError(true);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategoriesError(true);
    } finally {
      setLoadingCategories(false);
    }
  };

  const carregarDados = async () => {
    setLoadingFeatured(true);
    setLoadingPromo(true);
    setLoadingCategories(true);
    setCategoriesError(false);

    const [destaquesResult, promocoesResult, categoriasResult] = await Promise.allSettled([
      productService.getDestaques({ limite: 8 }),
      productService.getPromocoes({ limite: 8 }),
      categoryService.getAll(),
    ]);

    if (destaquesResult.status === 'fulfilled' && destaquesResult.value.success) {
      setFeaturedProducts(Array.isArray(destaquesResult.value.data) ? destaquesResult.value.data : []);
    } else if (destaquesResult.status === 'rejected') {
      console.error('Erro ao carregar produtos em destaque:', destaquesResult.reason);
    }
    setLoadingFeatured(false);

    if (promocoesResult.status === 'fulfilled' && promocoesResult.value.success) {
      setPromoProducts(Array.isArray(promocoesResult.value.data) ? promocoesResult.value.data : []);
    } else if (promocoesResult.status === 'rejected') {
      console.error('Erro ao carregar promoções:', promocoesResult.reason);
    }
    setLoadingPromo(false);

    if (categoriasResult.status === 'fulfilled' && categoriasResult.value.success) {
      const categoriasData: any[] = Array.isArray(categoriasResult.value.data) ? categoriasResult.value.data : [];
      const categoriasAtivas = categoriasData.filter(
        (categoria: any) => categoria.produtos_count > 0
      );
      setCategorias(categoriasAtivas);
    } else {
      setCategoriesError(true);
      if (categoriasResult.status === 'rejected') {
        console.error('Erro ao carregar categorias:', categoriasResult.reason);
      }
    }
    setLoadingCategories(false);
  };

  return (
    <div className={styles.home}>
      {/* Hero Slider */}
      <section className={styles.heroWrap}>
        <HeroSlider />
      </section>

      {/* Produtos em Destaque */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Produtos em Destaque</h2>
            <p>Nossas peças mais vendidas</p>
          </div>
          {loadingFeatured ? (
            <ProductGrid products={[]} loading />
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
            {loadingCategories ? (
              <>
                {[...Array(8)].map((_, index) => (
                  <div key={index} className={styles.categorySkeleton}>
                    <div className={styles.categorySkeletonImage} />
                    <div className={styles.categorySkeletonText} />
                  </div>
                ))}
              </>
            ) : categoriesError ? (
              <div className={`${styles.empty} ${styles.categoryLoading}`}>
                <p>Nao foi possivel carregar as categorias agora.</p>
                <button type="button" className={styles.retryButton} onClick={carregarCategorias}>
                  Tentar novamente
                </button>
              </div>
            ) : categorias.length === 0 ? (
              <div className={styles.empty}>Nenhuma categoria disponível no momento.</div>
            ) : (
              categorias.slice(0, 8).map((categoria) => (
                <Link 
                  key={categoria.id} 
                  href={`/produtos?categoria=${categoria.slug}`} 
                  className={styles.categoryCard}
                >
                  <div 
                    className={styles.categoryImage} 
                    style={{ 
                      backgroundImage: categoria.imagem ? `url(${categoria.imagem})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                  </div>
                  <h3>{categoria.nome}</h3>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promoções */}
      {(loadingPromo || promoProducts.length > 0) && (
        <section className={styles.promoSection}>
          <div className={styles.container}>
            <h2>🔥 Promoções Imperdíveis</h2>
            {loadingPromo ? (
              <ProductGrid products={[]} loading />
            ) : (
              <ProductGrid products={promoProducts} loading={loadingPromo} />
            )}
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

