'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { Product } from '@/types';
import { productService, categoryService } from '@/services/api';
import { FiFilter, FiX } from 'react-icons/fi';
import styles from './produtos.module.scss';

export default function ProdutosPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [filtros, setFiltros] = useState({
    categoria: searchParams.get('categoria') || '',
    ordenar: searchParams.get('ordenar') || 'relevancia',
    precoMin: searchParams.get('precoMin') || '',
    precoMax: searchParams.get('precoMax') || '',
    promocao: searchParams.get('promocao') === 'true',
    busca: searchParams.get('q') || '',
  });

  // Sincronizar filtros com URL quando searchParams mudar
  useEffect(() => {
    setFiltros({
      categoria: searchParams.get('categoria') || '',
      ordenar: searchParams.get('ordenar') || 'relevancia',
      precoMin: searchParams.get('precoMin') || '',
      precoMax: searchParams.get('precoMax') || '',
      promocao: searchParams.get('promocao') === 'true',
      busca: searchParams.get('q') || '',
    });
  }, [searchParams]);

  // Carregar categorias ao montar componente
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Carregar produtos iniciais quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1);
    setProducts([]);
    setHasMore(true);
    carregarProdutos(1, true);
  }, [filtros]);

  const carregarCategorias = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        // Filtrar apenas categorias que tenham produtos (produtos_count > 0)
        const categoriasComProdutos = (response.data || []).filter(
          (cat: any) => cat.produtos_count > 0
        );
        setCategorias(categoriasComProdutos);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async (pagina: number = paginaAtual, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Preparar parâmetros conforme API do backend
      const params: any = {
        pagina: pagina,
        limite: 20, // Aumentado para 20 produtos por vez
      };

      // Adicionar filtros apenas se tiverem valor
      if (filtros.categoria) {
        // O backend suporta tanto ID numérico quanto slug
        // Tentar converter para número
        const categoriaNumerica = parseInt(filtros.categoria, 10);
        
        if (!isNaN(categoriaNumerica) && categoriaNumerica > 0) {
          // Se for um número positivo válido, enviar como número
          params.categoria = categoriaNumerica;
        } else {
          // Se for texto (slug), enviar como texto
          params.categoria = filtros.categoria;
        }
      }
      
      if (filtros.busca) {
        params.busca = filtros.busca;
      }
      
      if (filtros.precoMin) {
        params.precoMin = parseFloat(filtros.precoMin);
      }
      
      if (filtros.precoMax) {
        params.precoMax = parseFloat(filtros.precoMax);
      }
      
      if (filtros.promocao) {
        params.promocao = true;
      }

      // Mapear ordenação do frontend para API (backend espera 'ordem' e 'direcao')
      const ordenacaoMap: any = {
        'relevancia': { ordem: 'data_criacao', direcao: 'DESC' },
        'menor_preco': { ordem: 'preco', direcao: 'ASC' },
        'maior_preco': { ordem: 'preco', direcao: 'DESC' },
        'nome': { ordem: 'nome', direcao: 'ASC' },
        'mais_vendidos': { ordem: 'vendas', direcao: 'DESC' },
      };
      
      const ordenacao = ordenacaoMap[filtros.ordenar] || ordenacaoMap['relevancia'];
      params.ordem = ordenacao.ordem;
      params.direcao = ordenacao.direcao;

      const response = await productService.getAll(params);
      
      if (response.success) {
        const novosProdutos = response.data || [];
        const total = (response as any).pagination?.total || response.total || 0;
        
        let totalAtual = 0;
        if (reset) {
          setProducts(novosProdutos);
          totalAtual = novosProdutos.length;
        } else {
          setProducts(prev => {
            const updated = [...prev, ...novosProdutos];
            totalAtual = updated.length;
            return updated;
          });
        }
        
        setTotalProdutos(total);
        
        // Verificar se há mais produtos para carregar
        // Considera que há mais se: total de produtos carregados < total disponível E recebeu produtos nesta página
        const temMais = totalAtual < total && novosProdutos.length > 0;
        setHasMore(temMais);
      }
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
      if (reset) {
        setProducts([]);
        setTotalProdutos(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Carregar mais produtos quando chegar ao fim
  const carregarMaisProdutos = useCallback(() => {
    if (!loadingMore && hasMore) {
      const proximaPagina = paginaAtual + 1;
      setPaginaAtual(proximaPagina);
      carregarProdutos(proximaPagina, false);
    }
  }, [loadingMore, hasMore, paginaAtual, products]);

  // Intersection Observer para detectar quando usuário chega ao fim
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore) {
          carregarMaisProdutos();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, carregarMaisProdutos]);

  const handleFiltroChange = (campo: string, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros({
      categoria: '',
      ordenar: 'relevancia',
      precoMin: '',
      precoMax: '',
      promocao: false,
      busca: '',
    });
  };

  return (
    <div className={styles.page}>
      <Breadcrumbs items={[{ label: 'Produtos' }]} />
      
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>{filtros.busca ? `Resultados para "${filtros.busca}"` : 'Todos os Produtos'}</h1>
          <p>Encontre as melhores peças para você</p>
        </div>

        {/* Botão Filtro Mobile */}
        <button 
          className={styles.mobileFilterButton}
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          <FiFilter /> Filtros
        </button>

        <div className={styles.content}>
          {/* Sidebar de Filtros */}
          <aside className={`${styles.sidebar} ${mobileFilterOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.sidebarHeader}>
              <h3>Filtros</h3>
              <button 
                className={styles.closeFilters}
                onClick={() => setMobileFilterOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.filterSection}>
              <h3>Categorias</h3>
              <div className={styles.filterOptions}>
                <label>
                  <input 
                    type="radio" 
                    name="categoria" 
                    value="" 
                    checked={filtros.categoria === ''}
                    onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                  />
                  Todos os Produtos
                </label>
                {categorias.map((cat) => (
                  <label key={cat.id}>
                    <input 
                      type="radio" 
                      name="categoria" 
                      value={cat.id.toString()}
                      checked={filtros.categoria === cat.id.toString()}
                      onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                    />
                    {cat.nome}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterSection}>
              <h3>Faixa de Preço</h3>
              <div className={styles.priceInputs}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={filtros.precoMin}
                  onChange={(e) => handleFiltroChange('precoMin', e.target.value)}
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={filtros.precoMax}
                  onChange={(e) => handleFiltroChange('precoMax', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.filterSection}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox"
                  checked={filtros.promocao}
                  onChange={(e) => handleFiltroChange('promocao', e.target.checked)}
                />
                Somente em promoção
              </label>
            </div>

            <button className={styles.clearFilters} onClick={limparFiltros}>
              Limpar Filtros
            </button>
          </aside>

          {/* Grid de Produtos */}
          <main className={styles.main}>
            <div className={styles.toolbar}>
              <p>{totalProdutos} {totalProdutos === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>
              <select
                value={filtros.ordenar}
                onChange={(e) => handleFiltroChange('ordenar', e.target.value)}
                className={styles.sortSelect}
              >
                <option value="relevancia">Relevância</option>
                <option value="menor_preco">Menor Preço</option>
                <option value="maior_preco">Maior Preço</option>
                <option value="nome">Nome (A-Z)</option>
                <option value="mais_vendidos">Mais Vendidos</option>
              </select>
            </div>
            
            {loading && products.length === 0 ? (
              <div className={styles.loadingMessage}>Carregando produtos...</div>
            ) : products.length === 0 ? (
              <div className={styles.emptyMessage}>
                <p>Nenhum produto encontrado com os filtros selecionados.</p>
                <button onClick={limparFiltros}>Limpar Filtros</button>
              </div>
            ) : (
              <>
                <ProductGrid products={products} loading={false} />
                
                {/* Elemento observador para scroll infinito */}
                <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }}>
                  {loadingMore && (
                    <div className={styles.loadingMore}>
                      <p>Carregando mais produtos...</p>
                    </div>
                  )}
                </div>

                {!hasMore && products.length > 0 && (
                  <div className={styles.endMessage}>
                    <p>Você viu todos os {totalProdutos} produtos disponíveis! 🎉</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
