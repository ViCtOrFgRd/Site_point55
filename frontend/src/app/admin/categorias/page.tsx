/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { categoryService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiTag, FiImage } from 'react-icons/fi';
import { confirmAction } from '@/utils/alerts';
import styles from './categorias.module.scss';

interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  ativa: boolean;
  data_criacao: string;
  imagem?: string;
}

export default function AdminCategoriasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativa: true,
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
      const response = await categoryService.getAllAdmin();
      if (response.success) {
        setCategorias(Array.isArray(response.data) ? response.data : []);
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
      setUploading(true);
      const submitData: any = { ...formData };

      // Se houver imagem, não fazer upload aqui
      // O upload é feito separadamente via handleUploadImagem
      if (!imageFile && !imagePreview) {
        throw new Error('Selecione uma imagem para a categoria');
      }

      // Se houver preview (já foi feito upload), usar a URL
      if (imagePreview && !imageFile) {
        submitData.imagem = imagePreview;
      }

      if (editingCategoria) {
        const response = await categoryService.update(editingCategoria.id, submitData);
        if (response.success) {
          success('Categoria atualizada com sucesso!');
        }
      } else {
        const response = await categoryService.create(submitData);
        if (response.success) {
          success('Categoria criada com sucesso!');
        }
      }

      setShowModal(false);
      resetForm();
      carregarCategorias();
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar categoria');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImagem = async (file: File) => {
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de arquivo não suportado. Use apenas imagens (JPEG, PNG, GIF, WEBP).');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('imagem', file);

      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/categorias/upload-imagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Usar a URL completa da imagem
        const imageUrl = data.data.url.startsWith('http') 
          ? data.data.url 
          : `${API_URL.replace('/api', '')}${data.data.url}`;
        
        setImagePreview(imageUrl);
        setImageFile(null);
        success('Imagem enviada com sucesso!');
      } else {
        showError(data.message || 'Erro ao fazer upload da imagem');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      showError('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      ativa: categoria.ativa,
    });
    setImageFile(null);
    setImagePreview(categoria.imagem || '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction(
      'Excluir categoria',
      'Tem certeza que deseja excluir esta categoria?',
      'Excluir'
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await categoryService.delete(id);
      if (response.success) {
        success('Categoria excluída com sucesso!');
        carregarCategorias();
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      ativa: true,
    });
    setEditingCategoria(null);
    setImageFile(null);
    setImagePreview('');
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
              <h3>{categorias.filter((c) => c.ativa).length}</h3>
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
                      {categoria.imagem ? (
                        <img
                          src={categoria.imagem}
                          alt={categoria.nome}
                          className={styles.categoryThumbnail}
                        />
                      ) : (
                        <FiImage />
                      )}
                      <span>{categoria.nome}</span>
                    </div>
                  </td>
                  <td>{categoria.descricao || '-'}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        categoria.ativa ? styles.badgeSuccess : styles.badgeSecondary
                      }`}
                    >
                      {categoria.ativa ? 'Ativa' : 'Inativa'}
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
                <label htmlFor="upload-imagem">Imagem da Categoria *</label>
                <input
                  type="file"
                  id="upload-imagem"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadImagem(file);
                    }
                  }}
                  disabled={uploading}
                />
              </div>

              {imagePreview && (
                <div className={styles.imagePreview}>
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className={styles.removeImageBtn}
                  >
                    ✕ Remover imagem
                  </button>
                </div>
              )}

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
                    checked={formData.ativa}
                    onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                  />
                  <span>Categoria ativa</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={uploading}>
                  {uploading ? 'Salvando...' : editingCategoria ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
