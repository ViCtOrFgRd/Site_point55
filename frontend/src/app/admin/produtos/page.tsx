'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { productService, categoryService } from '@/services/api';
import { Product } from '@/types';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import styles from './produtos.module.scss';

export default function AdminProdutosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);

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
      const [produtosRes, categoriasRes] = await Promise.all([
        productService.getAllAdmin({ limite: 10000 }),
        categoryService.getAllAdmin(),
      ]);

      if (produtosRes.success) {
        setProducts(produtosRes.data || []);
      }

      if (categoriasRes.success) {
        setCategorias(categoriasRes.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const response = await productService.delete(id);
      if (response.success) {
        toast.success('✨ Produto excluído com sucesso!');
        carregarDados();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir produto');
    }
  };

  const produtosFiltrados = products.filter((p) => {
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
    const categoriaId = parseInt(categoriaFiltro, 10);
    const matchCategoria = !categoriaFiltro
      || (Array.isArray(p.categoria_ids) && p.categoria_ids.includes(categoriaId))
      || p.categoria_id?.toString() === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

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
    <div className={styles.adminProdutos}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <ArrowLeft size={20} /> Voltar
            </Link>
            <h1>Gerenciar Produtos</h1>
          </div>
          <Link href="/admin/produtos/novo" className={styles.addButton} data-testid="btn-add-product">
            <Plus size={20} /> Novo Produto
          </Link>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <Package size={24} />
            <div>
              <p>Total de Produtos</p>
              <h3>{products.length}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <Eye size={24} />
            <div>
              <p>Produtos Ativos</p>
              <h3>{products.filter((p) => p.ativo).length}</h3>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table} data-testid="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Parcelas</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto) => (
                <tr key={produto.id}>
                  <td>#{produto.id}</td>
                  <td>
                    <div className={styles.productInfo}>
                      {(() => {
                        const imageUrl = Array.isArray(produto.imagens)
                          ? produto.imagens[0]
                          : produto.imagens;

                        return imageUrl ? (
                          <img src={imageUrl} alt={produto.nome} />
                        ) : null;
                      })()}
                      <span>{produto.nome}</span>
                    </div>
                  </td>
                  <td>{Array.isArray(produto.categoria_nomes) ? produto.categoria_nomes[0] : produto.categoria_nome || '-'}</td>
                  <td>R$ {typeof produto.preco === 'number' ? produto.preco.toFixed(2) : parseFloat(produto.preco || 0).toFixed(2)}</td>
                  <td>{produto.parcelas_maximas ? `${produto.parcelas_maximas}x` : '3x'}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        produto.estoque === 0 ? styles.badgeDanger : styles.badgeSuccess
                      }`}
                    >
                      {produto.estoque} un.
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        produto.ativo ? styles.badgeSuccess : styles.badgeSecondary
                      }`}
                    >
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/produtos/${produto.id}`}
                        className={styles.btnView}
                        title="Ver"
                        data-testid="btn-view"
                        aria-label="Ver produto"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/produtos/${produto.id}`}
                        className={styles.btnEdit}
                        title="Editar"
                        data-testid="btn-edit"
                        aria-label="Editar produto"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(produto.id)}
                        className={styles.btnDelete}
                        title="Excluir"
                        data-testid="btn-delete"
                        aria-label="Excluir produto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {produtosFiltrados.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
