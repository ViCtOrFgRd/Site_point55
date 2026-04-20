/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX } from 'react-icons/fi';
import { Product } from '@/types';
import { productService } from '@/services/api';
import { formatPrice } from '@/utils/formatPrice';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  limit?: number;
  orderBy?: 'data_criacao' | 'preco' | 'nome' | 'vendas';
  direction?: 'ASC' | 'DESC';
}

export default function SearchBar({
  placeholder = 'Buscar produtos...',
  autoFocus = false,
  limit = 6,
  orderBy = 'nome',
  direction = 'ASC',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar produtos com debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await productService.search(query, {
          limite: limit,
          ordem: orderBy,
          direcao: direction,
        });
        if (response.success && response.data) {
          const resultsData: any[] = Array.isArray(response.data) ? response.data : [];
          setResults(resultsData.slice(0, limit));
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, limit, orderBy, direction]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/produtos?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSelectProduct = (productId: number) => {
    router.push(`/produtos/${productId}`);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={styles.searchBar} ref={searchRef}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className={styles.searchInput}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className={styles.clearButton}
            aria-label="Limpar busca"
          >
            <FiX />
          </button>
        )}
      </form>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.loading}>Buscando...</div>
          ) : results.length > 0 ? (
            <>
              <div className={styles.results}>
                {results.map((product) => (
                  <div
                    key={product.id}
                    className={styles.resultItem}
                    onClick={() => handleSelectProduct(product.id)}
                  >
                    <div className={styles.resultImage}>
                      {product.imagens[0] ? (
                        <img src={product.imagens[0]} alt={product.nome} />
                      ) : (
                        <div className={styles.noImage}>Sem imagem</div>
                      )}
                    </div>
                    <div className={styles.resultInfo}>
                      <h4>{product.nome}</h4>
                      <div className={styles.resultPrice}>
                        {product.preco_original && (
                          <span className={styles.oldPrice}>
                            R$ {formatPrice(product.preco_original)}
                          </span>
                        )}
                        <span className={styles.price}>
                          R$ {formatPrice(product.preco)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className={styles.seeAllButton}
              >
                Ver todos os resultados para "{query}"
              </button>
            </>
          ) : (
            <div className={styles.noResults}>
              Nenhum produto encontrado para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
