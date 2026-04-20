/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { promocaoService, productService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiPercent, FiCalendar, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import { confirmAction } from '@/utils/alerts';
import styles from './promocoes.module.scss';

interface Promocao {
  id: number;
  nome: string;
  descricao?: string;
  tipo_desconto: 'percentual' | 'valor_fixo';
  desconto_percentual?: number;
  desconto_valor?: number;
  data_inicio: string;
  data_fim: string;
  produtos_aplicaveis?: number[];
  ativa: boolean;
  data_criacao: string;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
}

export default function AdminPromocoesPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromocao, setEditingPromocao] = useState<Promocao | null>(null);
  const [selectedProdutos, setSelectedProdutos] = useState<number[]>([]);
  const [searchProduto, setSearchProduto] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo_desconto: 'percentual' as 'percentual' | 'valor_fixo',
    desconto_percentual: 0,
    desconto_valor: 0,
    data_inicio: '',
    data_fim: '',
    produtos_aplicaveis: [] as number[],
    ativa: true,
  });

  const displayZeroAsEmpty = (value: number) => (value === 0 ? '' : value);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarPromocoes();
      carregarProdutos();
    }
  }, [user]);

  const carregarPromocoes = async () => {
    setLoading(true);
    try {
      const response = await promocaoService.getAll();
      if (response.success) {
        setPromocoes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
      showToast('Erro ao carregar promoções', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await productService.getAllAdmin({ limite: 1000 });
      if (response.success) {
        setProdutos(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      showToast('Nome da promoção é obrigatório', 'error');
      return;
    }

    if (!formData.data_inicio || !formData.data_fim) {
      showToast('Datas de início e fim são obrigatórias', 'error');
      return;
    }

    if (new Date(formData.data_inicio) >= new Date(formData.data_fim)) {
      showToast('Data de fim deve ser posterior à data de início', 'error');
      return;
    }

    const dadosPromocao = {
      ...formData,
      produtos_aplicaveis: selectedProdutos,
    };
    
    try {
      if (editingPromocao) {
        const response = await promocaoService.update(editingPromocao.id, dadosPromocao);
        if (response.success) {
          showToast('Promoção atualizada com sucesso!', 'success');
        }
      } else {
        const response = await promocaoService.create(dadosPromocao);
        if (response.success) {
          showToast('Promoção criada com sucesso!', 'success');
        }
      }
      
      setShowModal(false);
      resetForm();
      carregarPromocoes();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar promoção', 'error');
    }
  };

  const handleEdit = (promocao: Promocao) => {
    setEditingPromocao(promocao);
    setFormData({
      nome: promocao.nome,
      descricao: promocao.descricao || '',
      tipo_desconto: promocao.tipo_desconto,
      desconto_percentual: promocao.desconto_percentual || 0,
      desconto_valor: promocao.desconto_valor || 0,
      data_inicio: promocao.data_inicio.split('T')[0],
      data_fim: promocao.data_fim.split('T')[0],
      produtos_aplicaveis: promocao.produtos_aplicaveis || [],
      ativa: promocao.ativa,
    });
    setSelectedProdutos(promocao.produtos_aplicaveis || []);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction(
      'Excluir promoção',
      'Tem certeza que deseja excluir esta promoção?',
      'Excluir'
    );
    if (!confirmed) {
      return;
    }
    
    try {
      const response = await promocaoService.delete(id);
      if (response.success) {
        showToast('Promoção excluída com sucesso!', 'success');
        carregarPromocoes();
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao excluir promoção', 'error');
    }
  };

  const handleToggleAtiva = async (id: number, ativaAtual: boolean) => {
    try {
      const response = await promocaoService.toggle(id);
      if (response.success) {
        showToast(
          `Promoção ${!ativaAtual ? 'ativada' : 'desativada'} com sucesso!`,
          'success'
        );
        carregarPromocoes();
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao alterar status', 'error');
    }
  };

  const handleToggleProduto = (produtoId: number) => {
    setSelectedProdutos(prev => 
      prev.includes(produtoId)
        ? prev.filter(id => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo_desconto: 'percentual',
      desconto_percentual: 0,
      desconto_valor: 0,
      data_inicio: '',
      data_fim: '',
      produtos_aplicaveis: [],
      ativa: true,
    });
    setSelectedProdutos([]);
    setEditingPromocao(null);
    setSearchProduto('');
  };

  const handleOpenModal = () => {
    resetForm();
    // Data padrão: hoje até daqui 7 dias
    const hoje = new Date().toISOString().split('T')[0];
    const daquiSete = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      data_inicio: hoje,
      data_fim: daquiSete,
    }));
    setShowModal(true);
  };

  const getStatusPromocao = (promocao: Promocao) => {
    if (!promocao.ativa) return { label: 'Inativa', class: 'inativa' };
    
    const agora = new Date();
    const inicio = new Date(promocao.data_inicio);
    const fim = new Date(promocao.data_fim);
    
    if (agora < inicio) return { label: 'Agendada', class: 'agendada' };
    if (agora > fim) return { label: 'Expirada', class: 'expirada' };
    return { label: 'Vigente', class: 'vigente' };
  };

  if (authLoading || !user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.adminPromocoesPage}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1><FiPercent /> Gerenciar Promoções</h1>
            <p>Crie campanhas promocionais com desconto para seus produtos</p>
          </div>
          <button className={styles.addButton} onClick={handleOpenModal}>
            <FiPlus /> Nova Promoção
          </button>
        </div>

        {/* Lista de Promoções */}
        {loading ? (
          <div className={styles.loading}>Carregando promoções...</div>
        ) : promocoes.length === 0 ? (
          <div className={styles.empty}>
            <FiPercent size={48} />
            <h2>Nenhuma promoção cadastrada</h2>
            <p>Comece criando sua primeira campanha promocional</p>
            <button onClick={handleOpenModal}>
              <FiPlus /> Criar Primeira Promoção
            </button>
          </div>
        ) : (
          <div className={styles.promocoesGrid}>
            {promocoes.map((promocao) => {
              const status = getStatusPromocao(promocao);
              const desconto = promocao.tipo_desconto === 'percentual'
                ? `${promocao.desconto_percentual}%`
                : `R$ ${(promocao.desconto_valor || 0).toFixed(2)}`;
              
              return (
                <div key={promocao.id} className={styles.promocaoCard}>
                  <div className={styles.promocaoHeader}>
                    <h3>{promocao.nome}</h3>
                    <span className={`${styles.status} ${styles[status.class]}`}>
                      {status.label}
                    </span>
                  </div>

                  {promocao.descricao && (
                    <p className={styles.descricao}>{promocao.descricao}</p>
                  )}

                  <div className={styles.promocaoInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Desconto:</span>
                      <span className={styles.valueDestaque}>{desconto}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Período:</span>
                      <span className={styles.value}>
                        {new Date(promocao.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(promocao.data_fim).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Produtos:</span>
                      <span className={styles.value}>
                        {!promocao.produtos_aplicaveis || promocao.produtos_aplicaveis.length === 0
                          ? 'Todos'
                          : `${promocao.produtos_aplicaveis.length} selecionados`}
                      </span>
                    </div>
                  </div>

                  <div className={styles.promocaoActions}>
                    <button
                      className={`${styles.toggleButton} ${promocao.ativa ? styles.ativo : styles.inativo}`}
                      onClick={() => handleToggleAtiva(promocao.id, promocao.ativa)}
                      title={promocao.ativa ? 'Desativar' : 'Ativar'}
                    >
                      {promocao.ativa ? <FiToggleRight /> : <FiToggleLeft />}
                      {promocao.ativa ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEdit(promocao)}
                      title="Editar"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(promocao.id)}
                      title="Excluir"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Criar/Editar Promoção */}
        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingPromocao ? 'Editar Promoção' : 'Nova Promoção'}</h2>
                <button onClick={() => setShowModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Nome da Promoção *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Black Friday 2026"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva a promoção..."
                    rows={3}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tipo de Desconto *</label>
                    <select
                      value={formData.tipo_desconto}
                      onChange={(e) => setFormData({ ...formData, tipo_desconto: e.target.value as any })}
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="valor_fixo">Valor Fixo (R$)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      {formData.tipo_desconto === 'percentual' ? 'Percentual' : 'Valor'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.tipo_desconto === 'percentual' ? 100 : undefined}
                      value={displayZeroAsEmpty(
                        formData.tipo_desconto === 'percentual' ? formData.desconto_percentual : formData.desconto_valor
                      )}
                      onChange={(e) => setFormData({
                        ...formData,
                        [formData.tipo_desconto === 'percentual' ? 'desconto_percentual' : 'desconto_valor']: Number(e.target.value)
                      })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Data de Início *</label>
                    <input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Data de Fim *</label>
                    <input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Produtos Aplicáveis</label>
                  <p className={styles.helpText}>
                    Deixe vazio para aplicar a todos os produtos, ou selecione produtos específicos
                  </p>
                  <input
                    type="text"
                    placeholder="Pesquisar produto por nome..."
                    value={searchProduto}
                    onChange={(e) => setSearchProduto(e.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.produtosGrid}>
                    {produtos
                      .filter(p => p.nome.toLowerCase().includes(searchProduto.toLowerCase()))
                      .map((produto) => (
                      <label key={produto.id} className={styles.produtoCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedProdutos.includes(produto.id)}
                          onChange={() => handleToggleProduto(produto.id)}
                        />
                        <span>{produto.nome}</span>
                      </label>
                    ))}
                  </div>
                  {selectedProdutos.length > 0 && (
                    <p className={styles.selectedCount}>
                      {selectedProdutos.length} produto(s) selecionado(s)
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.ativa}
                      onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                    />
                    Promoção ativa
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    {editingPromocao ? 'Atualizar' : 'Criar'} Promoção
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
