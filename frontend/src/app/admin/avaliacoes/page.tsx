'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { reviewService, productService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiStar, FiTrash2 } from 'react-icons/fi';
import styles from './avaliacoes.module.scss';

export default function AdminAvaliacoesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar produtos para depois buscar avaliações
      const produtosRes = await productService.getAll({ limite: 100 });
      if (produtosRes.success) {
        const prods = produtosRes.data || [];
        setProdutos(prods);

        // Carregar avaliações de cada produto
        const todasAvaliacoes: any[] = [];
        for (const prod of prods.slice(0, 20)) {
          // Limitar a 20 produtos por performance
          try {
            const avalRes = await reviewService.getByProduct(prod.id, { limite: 50 });
            if (avalRes.success && avalRes.data) {
              const avalWithProduto = avalRes.data.map((av: any) => ({
                ...av,
                produto_nome: prod.nome,
                produto_id: prod.id,
              }));
              todasAvaliacoes.push(...avalWithProduto);
            }
          } catch (error) {
            console.error(`Erro ao carregar avaliações do produto ${prod.id}:`, error);
          }
        }
        setAvaliacoes(todasAvaliacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return;
    }

    try {
      const response = await reviewService.delete(id);
      if (response.success) {
        alert('Avaliação excluída com sucesso!');
        carregarDados();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir avaliação');
    }
  };

  const renderStars = (nota: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            fill={star <= nota ? '#ffc107' : 'none'}
            color="#ffc107"
          />
        ))}
      </div>
    );
  };

  const mediaNotas = avaliacoes.length
    ? (avaliacoes.reduce((acc, av) => acc + av.nota, 0) / avaliacoes.length).toFixed(1)
    : 0;

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.adminAvaliacoes}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Gerenciar Avaliações</h1>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <FiStar size={24} />
            <div>
              <p>Total de Avaliações</p>
              <h3>{avaliacoes.length}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiStar size={24} />
            <div>
              <p>Média Geral</p>
              <h3>{mediaNotas} ⭐</h3>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Usuário</th>
                <th>Nota</th>
                <th>Data</th>
                <th>Verificado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {avaliacoes.map((avaliacao) => (
                <tr key={avaliacao.id}>
                  <td>
                    <Link href={`/produtos/${avaliacao.produto_id}`}>
                      {avaliacao.produto_nome}
                    </Link>
                  </td>
                  <td>{avaliacao.usuario_nome || 'Anônimo'}</td>
                  <td>{renderStars(avaliacao.nota)}</td>
                  <td>{new Date(avaliacao.data_avaliacao).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {avaliacao.verificado_compra ? (
                      <span className={styles.badgeSuccess}>Sim</span>
                    ) : (
                      <span className={styles.badgeSecondary}>Não</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleDelete(avaliacao.id)}
                        className={styles.btnDelete}
                        title="Excluir"
                      >
                        <FiTrash2 /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {avaliacoes.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhuma avaliação encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
