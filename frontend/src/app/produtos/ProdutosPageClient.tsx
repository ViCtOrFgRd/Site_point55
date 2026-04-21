/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { Product } from '@/types';
import { productService, categoryService } from '@/services/api';
import { FiFilter, FiX } from 'react-icons/fi';
import styles from './produtos.module.scss';

export default function ProdutosPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const getFiltrosFromSearchParams = useCallback(() => ({
    categoria: searchParams.get('categoria') || '',
    ordenar: searchParams.get('ordenar') || 'relevancia',
    precoMin: searchParams.get('precoMin') || '',
    precoMax: searchParams.get('precoMax') || '',
    promocao: searchParams.get('promocao') === 'true',
    busca: searchParams.get('q') || '',
  }), [searchParams]);

  const [products, setProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const observerCallbackRef = useRef<() => void>(() => {});
  const isUpdatingFromUrlRef = useRef(false);
  const loadingRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const paginaAtualRef = useRef(1);
  const requestIdRef = useRef(0);

  const [filtros, setFiltros] = useState(getFiltrosFromSearchParams);

  const buildQueryStringFromFiltros = useCallback((filtrosAtuais: typeof filtros) => {
    const params = new URLSearchParams();

    if (filtrosAtuais.categoria) params.set('categoria', filtrosAtuais.categoria);
    if (filtrosAtuais.busca) params.set('q', filtrosAtuais.busca);
    if (filtrosAtuais.precoMin) params.set('precoMin', filtrosAtuais.precoMin);
    if (filtrosAtuais.precoMax) params.set('precoMax', filtrosAtuais.precoMax);
    if (filtrosAtuais.promocao) params.set('promocao', 'true');
    if (filtrosAtuais.ordenar && filtrosAtuais.ordenar !== 'relevancia') {
      params.set('ordenar', filtrosAtuais.ordenar);
    }

    return params.toString();
  }, []);

  // Carregar categorias ao montar componente
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Sincronizar filtros com URL para recarregar produtos ao trocar query params
  useEffect(() => {
    const filtrosDaUrl = getFiltrosFromSearchParams();

    setFiltros((prev) => {
      const mudou =
        prev.categoria !== filtrosDaUrl.categoria ||
        prev.ordenar !== filtrosDaUrl.ordenar ||
        prev.precoMin !== filtrosDaUrl.precoMin ||
        prev.precoMax !== filtrosDaUrl.precoMax ||
        prev.promocao !== filtrosDaUrl.promocao ||
        prev.busca !== filtrosDaUrl.busca;

      if (mudou) {
        isUpdatingFromUrlRef.current = true;
      }

      return mudou ? filtrosDaUrl : prev;
    });
  }, [getFiltrosFromSearchParams]);

  // Sincronizar URL com os filtros alterados pela UI
  useEffect(() => {
    if (isUpdatingFromUrlRef.current) {
      isUpdatingFromUrlRef.current = false;
      return;
    }

    const novaQuery = buildQueryStringFromFiltros(filtros);
    const queryAtual = buildQueryStringFromFiltros(getFiltrosFromSearchParams());

    if (novaQuery === queryAtual) {
      return;
    }

    const proximaUrl = novaQuery ? `${pathname}?${novaQuery}` : pathname;
    router.replace(proximaUrl, { scroll: false });
  }, [filtros, buildQueryStringFromFiltros, getFiltrosFromSearchParams, pathname, router]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    paginaAtualRef.current = paginaAtual;
  }, [paginaAtual]);

  // Carregar produtos iniciais quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1);
    paginaAtualRef.current = 1;
    setProducts([]);
    setHasMore(true);
    hasMoreRef.current = true;
    void carregarProdutos(1, true);
  }, [filtros]);

  const carregarCategorias = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        const categoriasData: any[] = Array.isArray(response.data) ? response.data : [];
        // Filtrar apenas categorias que tenham produtos (produtos_count > 0)
        const categoriasComProdutos = categoriasData.filter(
          (cat: any) => cat.produtos_count > 0
        );
        setCategorias(categoriasComProdutos);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async (pagina: number = paginaAtualRef.current, reset: boolean = false) => {
    const requestId = ++requestIdRef.current;

    if (!reset && loadingMoreRef.current) {
      return;
    }

    if (reset) {
      setLoading(true);
      loadingRef.current = true;
    } else {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    }

    try {
      // Preparar parametros conforme API do backend
      const params: any = {
        pagina,
        limite: 20,
      };

      // Adicionar filtros apenas se tiverem valor
      if (filtros.categoria) {
        const categoriaNumerica = parseInt(filtros.categoria, 10);
        params.categoria = !isNaN(categoriaNumerica) && categoriaNumerica > 0
          ? categoriaNumerica
          : filtros.categoria;
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

      // Mapear ordenacao do frontend para API (backend espera 'ordem' e 'direcao')
      const ordenacaoMap: any = {
        relevancia: { ordem: 'data_criacao', direcao: 'DESC' },
        menor_preco: { ordem: 'preco', direcao: 'ASC' },
        maior_preco: { ordem: 'preco', direcao: 'DESC' },
        nome: { ordem: 'nome', direcao: 'ASC' },
        mais_vendidos: { ordem: 'vendas', direcao: 'DESC' },
      };

      const ordenacao = ordenacaoMap[filtros.ordenar] || ordenacaoMap.relevancia;
      params.ordem = ordenacao.ordem;
      params.direcao = ordenacao.direcao;

      const response = await productService.getAll(params);

      // Ignora resposta atrasada de uma requisição antiga
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (response.success) {
        const novosProdutos: any[] = Array.isArray(response.data) ? response.data : [];
        const total = Number((response as any).pagination?.total ?? response.total ?? 0);

        let totalAtual = 0;
        if (reset) {
          setProducts(novosProdutos);
          totalAtual = novosProdutos.length;
        } else {
          setProducts((prev) => {
            const updated = [...prev, ...novosProdutos];
            totalAtual = updated.length;
            return updated;
          });
        }

        setTotalProdutos(total);

        // Interrompe carregamentos contínuos quando backend devolve página vazia
        // ou quando já alcançamos o total informado.
        const temMais = novosProdutos.length > 0 && totalAtual < total;
        setHasMore(temMais);
        hasMoreRef.current = temMais;
      }
    } catch (error: any) {
      if (requestId === requestIdRef.current) {
        console.error('Erro ao carregar produtos:', error);
        if (reset) {
          setProducts([]);
          setTotalProdutos(0);
          setHasMore(false);
          hasMoreRef.current = false;
        }
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
        loadingMoreRef.current = false;
      }
    }
  };

  // Carregar mais produtos quando chegar ao fim
  const carregarMaisProdutos = useCallback(() => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) {
      return;
    }

    const proximaPagina = paginaAtualRef.current + 1;
    setPaginaAtual(proximaPagina);
    paginaAtualRef.current = proximaPagina;
    void carregarProdutos(proximaPagina, false);
  }, [carregarProdutos]);

  // Mantém a ref sempre atualizada com a versão mais recente do callback
  // sem recriar o observer a cada mudança de estado
  useEffect(() => {
    observerCallbackRef.current = carregarMaisProdutos;
  }, [carregarMaisProdutos]);

  // Intersection Observer — recriado APENAS quando o elemento sentinela
  // entra ou sai do DOM (troca de filtro reseta products → sentinel some → volta)
  useEffect(() => {
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observerCallbackRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl]);

  const handleFiltroChange = (campo: string, valor: any) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
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
              <p>
                {totalProdutos}{' '}
                {totalProdutos === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </p>
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
                <div ref={setSentinelEl} style={{ height: '20px', margin: '20px 0' }}>
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
