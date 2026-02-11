'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { badgeService, productService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiTag, FiStar, FiX } from 'react-icons/fi';
import styles from './badges.module.scss';

interface Badge {
  id: number;
  nome: string;
  tipo: 'best_seller' | 'mais_vendido' | 'novo' | 'limitado';
  cor?: string;
  icone?: string;
  ativo: boolean;
  data_criacao: string;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem_url?: string;
}

export default function AdminBadgesPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProdutosModal, setShowProdutosModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedProdutoId, setSelectedProdutoId] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'novo' as 'best_seller' | 'mais_vendido' | 'novo' | 'limitado',
    cor: '#FF6B6B',
    icone: '⭐',
    ativo: true,
  });

  const tiposBadge = [
    { value: 'best_seller', label: 'Best Seller', icon: '🏆' },
    { value: 'mais_vendido', label: 'Mais Vendido', icon: '🔥' },
    { value: 'novo', label: 'Novo', icon: '✨' },
    { value: 'limitado', label: 'Edição Limitada', icon: '💎' },
  ];

  const coresPreDefinidas = [
    '#FF6B6B', // Vermelho
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul
    '#FFA07A', // Laranja
    '#98D8C8', // Verde claro
    '#FFD93D', // Amarelo
    '#6C5CE7', // Roxo
    '#FF6348', // Vermelho coral
  ];

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarBadges();
      carregarProdutos();
    }
  }, [user]);

  const carregarBadges = async () => {
    setLoading(true);
    try {
      const response = await badgeService.getAll();
      if (response.success) {
        setBadges(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
      showToast('Erro ao carregar badges', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await productService.getAllAdmin({ limite: 1000 });
      if (response.success) {
        setProdutos(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      showToast('Nome do badge é obrigatório', 'error');
      return;
    }
    
    try {
      if (editingBadge) {
        const response = await badgeService.update(editingBadge.id, formData);
        if (response.success) {
          showToast('Badge atualizado com sucesso!', 'success');
        }
      } else {
        const response = await badgeService.create(formData);
        if (response.success) {
          showToast('Badge criado com sucesso!', 'success');
        }
      }
      
      setShowModal(false);
      resetForm();
      carregarBadges();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar badge', 'error');
    }
  };

  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      nome: badge.nome,
      tipo: badge.tipo,
      cor: badge.cor || '#FF6B6B',
      icone: badge.icone || '⭐',
      ativo: badge.ativo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este badge?')) {
      return;
    }
    
    try {
      const response = await badgeService.delete(id);
      if (response.success) {
        showToast('Badge excluído com sucesso!', 'success');
        carregarBadges();
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir badge', 'error');
    }
  };

  const handleAdicionarProduto = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowProdutosModal(true);
  };

  const handleVincularProduto = async () => {
    if (!selectedBadge || !selectedProdutoId) {
      showToast('Selecione um produto', 'error');
      return;
    }
    
    try {
      const response = await badgeService.addToProduct(selectedProdutoId, selectedBadge.id);
      if (response.success) {
        showToast('Badge vinculado ao produto com sucesso!', 'success');
        setShowProdutosModal(false);
        setSelectedProdutoId(0);
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao vincular badge', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'novo',
      cor: '#FF6B6B',
      icone: '⭐',
      ativo: true,
    });
    setEditingBadge(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (authLoading || !user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.adminBadgesPage}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1><FiTag /> Gerenciar Badges</h1>
            <p>Crie e gerencie badges para destacar produtos especiais</p>
          </div>
          <button className={styles.addButton} onClick={handleOpenModal}>
            <FiPlus /> Novo Badge
          </button>
        </div>

        {/* Lista de Badges */}
        {loading ? (
          <div className={styles.loading}>Carregando badges...</div>
        ) : badges.length === 0 ? (
          <div className={styles.empty}>
            <FiTag size={48} />
            <h2>Nenhum badge cadastrado</h2>
            <p>Comece criando seu primeiro badge</p>
            <button onClick={handleOpenModal}>
              <FiPlus /> Criar Primeiro Badge
            </button>
          </div>
        ) : (
          <div className={styles.badgeGrid}>
            {badges.map((badge) => (
              <div key={badge.id} className={styles.badgeCard}>
                <div className={styles.badgeHeader}>
                  <div className={styles.badgePreview} style={{ backgroundColor: badge.cor }}>
                    <span className={styles.badgeIcon}>{badge.icone}</span>
                    <span className={styles.badgeNome}>{badge.nome}</span>
                  </div>
                  <span className={`${styles.status} ${badge.ativo ? styles.ativo : styles.inativo}`}>
                    {badge.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className={styles.badgeInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Tipo:</span>
                    <span className={styles.value}>
                      {tiposBadge.find(t => t.value === badge.tipo)?.label || badge.tipo}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Criado em:</span>
                    <span className={styles.value}>
                      {new Date(badge.data_criacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className={styles.badgeActions}>
                  <button
                    className={styles.vinculoButton}
                    onClick={() => handleAdicionarProduto(badge)}
                    title="Vincular a produto"
                  >
                    <FiStar /> Vincular
                  </button>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(badge)}
                    title="Editar"
                  >
                    <FiEdit />
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(badge.id)}
                    title="Excluir"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criar/Editar Badge */}
        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingBadge ? 'Editar Badge' : 'Novo Badge'}</h2>
                <button onClick={() => setShowModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Nome do Badge *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Super Oferta"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo *</label>
                  <div className={styles.tipoGrid}>
                    {tiposBadge.map((tipo) => (
                      <label key={tipo.value} className={styles.tipoOption}>
                        <input
                          type="radio"
                          name="tipo"
                          value={tipo.value}
                          checked={formData.tipo === tipo.value}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                        />
                        <div className={styles.tipoCard}>
                          <span className={styles.tipoIcon}>{tipo.icon}</span>
                          <span className={styles.tipoLabel}>{tipo.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Cor do Badge</label>
                  <div className={styles.coresGrid}>
                    {coresPreDefinidas.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`${styles.corOption} ${formData.cor === cor ? styles.selected : ''}`}
                        style={{ backgroundColor: cor }}
                        onClick={() => setFormData({ ...formData, cor })}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className={styles.colorPicker}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ícone (Emoji)</label>
                  <input
                    type="text"
                    value={formData.icone}
                    onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                    placeholder="⭐"
                    maxLength={2}
                  />
                  <small>Use emojis: ⭐ 🔥 ✨ 💎 🏆 ⚡ 🎉 🎁</small>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                    Badge ativo
                  </label>
                </div>

                {/* Preview */}
                <div className={styles.preview}>
                  <label>Preview:</label>
                  <div className={styles.badgePreviewLarge} style={{ backgroundColor: formData.cor }}>
                    <span className={styles.previewIcon}>{formData.icone}</span>
                    <span className={styles.previewNome}>{formData.nome || 'Nome do Badge'}</span>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    {editingBadge ? 'Atualizar' : 'Criar'} Badge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Vincular Produto */}
        {showProdutosModal && selectedBadge && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Vincular Badge: {selectedBadge.nome}</h2>
                <button onClick={() => setShowProdutosModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className={styles.produtosList}>
                <label>Selecione um produto:</label>
                <select
                  value={selectedProdutoId}
                  onChange={(e) => setSelectedProdutoId(Number(e.target.value))}
                  className={styles.produtoSelect}
                >
                  <option value={0}>Escolha um produto...</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} - R$ {Number(produto.preco).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowProdutosModal(false)} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleVincularProduto} 
                  className={styles.submitButton}
                  disabled={!selectedProdutoId}
                >
                  Vincular Badge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
