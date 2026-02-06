'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { categoryService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiTag } from 'react-icons/fi';
import styles from './categorias.module.scss';

interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  data_criacao: string;
}

export default function AdminCategoriasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarCategorias();
    }
  }, [user]);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategorias(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategoria) {
        const response = await categoryService.update(editingCategoria.id, formData);
        if (response.success) {
          alert('Categoria atualizada com sucesso!');
        }
      } else {
        const response = await categoryService.create(formData);
        if (response.success) {
          alert('Categoria criada com sucesso!');
        }
      }

      setShowModal(false);
      resetForm();
      carregarCategorias();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar categoria');
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      ativo: categoria.ativo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const response = await categoryService.delete(id);
      if (response.success) {
        alert('Categoria excluída com sucesso!');
        carregarCategorias();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      ativo: true,
    });
    setEditingCategoria(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

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
    <div className={styles.adminCategorias}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Gerenciar Categorias</h1>
          </div>
          <button onClick={handleOpenModal} className={styles.addButton}>
            <FiPlus /> Nova Categoria
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <FiTag size={24} />
            <div>
              <p>Total de Categorias</p>
              <h3>{categorias.length}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiTag size={24} />
            <div>
              <p>Categorias Ativas</p>
              <h3>{categorias.filter((c) => c.ativo).length}</h3>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table} data-testid="categories-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>#{categoria.id}</td>
                  <td>
                    <div className={styles.categoryInfo}>
                      <FiTag />
                      <span>{categoria.nome}</span>
                    </div>
                  </td>
                  <td>{categoria.descricao || '-'}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        categoria.ativo ? styles.badgeSuccess : styles.badgeSecondary
                      }`}
                    >
                      {categoria.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEdit(categoria)}
                        className={styles.btnEdit}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(categoria.id)}
                        className={styles.btnDelete}
                        title="Excluir"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categorias.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhuma categoria encontrada</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setShowModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Ex: Camisetas"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  placeholder="Descrição da categoria..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  <span>Categoria ativa</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  {editingCategoria ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
