/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import { caixaService } from '@/services/api';
import { confirmDelete, showSuccess, showError } from '@/utils/alerts';
import styles from '../admin.module.scss';

interface Caixa {
  id: number;
  codigo: string;
  nome: string;
  tamanho: 'P' | 'M' | 'G';
  altura: number;
  largura: number;
  comprimento: number;
  peso_caixa: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function CaixasCatalogoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCaixa, setEditingCaixa] = useState<Caixa | null>(null);
  const [filtroTamanho, setFiltroTamanho] = useState<'P' | 'M' | 'G' | ''>('');
  const [filtroAtivo, setFiltroAtivo] = useState<'true' | 'false' | ''>('');
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tamanho: 'P' as 'P' | 'M' | 'G',
    altura: '',
    largura: '',
    comprimento: '',
    peso_caixa: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarCaixas();
    }
  }, [user, filtroTamanho, filtroAtivo]);

  const carregarCaixas = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filtroTamanho) params.tamanho = filtroTamanho;
      if (filtroAtivo) params.ativo = filtroAtivo === 'true';
      
      const response = await caixaService.getAll(params);
      if (response.success && response.data) {
        setCaixas(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar caixas:', error);
      showError('Erro ao carregar caixas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (caixa?: Caixa) => {
    if (caixa) {
      setEditingCaixa(caixa);
      setFormData({
        codigo: caixa.codigo,
        nome: caixa.nome,
        tamanho: caixa.tamanho,
        altura: caixa.altura.toString(),
        largura: caixa.largura.toString(),
        comprimento: caixa.comprimento.toString(),
        peso_caixa: caixa.peso_caixa.toString(),
      });
    } else {
      setEditingCaixa(null);
      setFormData({
        codigo: '',
        nome: '',
        tamanho: 'P',
        altura: '',
        largura: '',
        comprimento: '',
        peso_caixa: '',
      });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingCaixa(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        codigo: formData.codigo.trim().toUpperCase(),
        nome: formData.nome.trim(),
        tamanho: formData.tamanho,
        altura: parseFloat(formData.altura),
        largura: parseFloat(formData.largura),
        comprimento: parseFloat(formData.comprimento),
        peso_caixa: parseFloat(formData.peso_caixa),
      };

      // Validações
      if (!data.codigo || data.codigo.length < 2 || data.codigo.length > 10) {
        showError('Código deve ter entre 2 e 10 caracteres');
        return;
      }

      if (!/^[A-Z0-9]+$/.test(data.codigo)) {
        showError('Código deve conter apenas letras e números');
        return;
      }

      if (!data.nome || data.nome.length < 3) {
        showError('Nome deve ter pelo menos 3 caracteres');
        return;
      }

      if (data.altura <= 0 || data.altura > 200) {
        showError('Altura deve estar entre 0 e 200 cm');
        return;
      }

      if (data.largura <= 0 || data.largura > 200) {
        showError('Largura deve estar entre 0 e 200 cm');
        return;
      }

      if (data.comprimento <= 0 || data.comprimento > 200) {
        showError('Comprimento deve estar entre 0 e 200 cm');
        return;
      }

      if (data.peso_caixa < 0 || data.peso_caixa > 50) {
        showError('Peso da caixa deve estar entre 0 e 50 kg');
        return;
      }

      if (editingCaixa) {
        const { codigo, tamanho, ...updateData } = data;
        await caixaService.update(editingCaixa.id, updateData);
        showSuccess('Caixa atualizada com sucesso!');
      } else {
        await caixaService.create(data);
        showSuccess('Caixa criada com sucesso!');
      }

      fecharModal();
      carregarCaixas();
    } catch (error: any) {
      console.error('Erro ao salvar caixa:', error);
      showError(error.message || 'Erro ao salvar caixa');
    }
  };

  const handleDesativar = async (caixa: Caixa) => {
    try {
      // Verificar uso
      const usoResponse = await caixaService.checkUsage(caixa.id);
      const usoData: any = usoResponse.data;
      
      if (usoData?.em_uso) {
        const tipos = Array.isArray(usoData?.tipos_vinculados) ? usoData.tipos_vinculados : [];
        const tiposNomes = tipos.map((t: any) => t.nome).join(', ');
        showError(
          `Não é possível desativar esta caixa. Ela está sendo usada por: ${tiposNomes || 'configurações ativas'}`
        );
        return;
      }

      const confirmed = await confirmDelete(
        `Tem certeza que deseja desativar a caixa "${caixa.nome}"?`,
        'Esta ação pode ser revertida depois.'
      );

      if (confirmed) {
        await caixaService.deactivate(caixa.id);
        showSuccess('Caixa desativada com sucesso!');
        carregarCaixas();
      }
    } catch (error: any) {
      console.error('Erro ao desativar caixa:', error);
      showError(error.message || 'Erro ao desativar caixa');
    }
  };

  const handleAtivar = async (caixa: Caixa) => {
    try {
      await caixaService.update(caixa.id, { ativo: true });
      showSuccess('Caixa ativada com sucesso!');
      carregarCaixas();
    } catch (error: any) {
      console.error('Erro ao ativar caixa:', error);
      showError(error.message || 'Erro ao ativar caixa');
    }
  };

  const getTamanhoLabel = (tamanho: string) => {
    switch (tamanho) {
      case 'P': return 'Pequena';
      case 'M': return 'Média';
      case 'G': return 'Grande';
      default: return tamanho;
    }
  };

  const formatPesoCaixa = (valor: number | string) => {
    const peso = Number(valor);
    return Number.isFinite(peso) ? peso.toFixed(3) : '0.000';
  };

  const getTamanhoBadgeClass = (tamanho: string) => {
    switch (tamanho) {
      case 'P': return styles.badgeP;
      case 'M': return styles.badgeM;
      case 'G': return styles.badgeG;
      default: return '';
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Package className={styles.spinner} />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/admin" className={styles.backButton}>
            <ArrowLeft size={20} />
            Voltar para Admin
          </Link>
          <h1 className={styles.title}>
            <Package size={32} />
            Catálogo de Caixas
          </h1>
          <p className={styles.subtitle}>
            Gerencie as caixas padrão (P/M/G) usadas no cálculo de frete
          </p>
        </div>
        <button onClick={() => abrirModal()} className={styles.primaryButton}>
          <Plus size={20} />
          Nova Caixa
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Tamanho:</label>
          <select
            value={filtroTamanho}
            onChange={(e) => setFiltroTamanho(e.target.value as any)}
            className={styles.select}
          >
            <option value="">Todos</option>
            <option value="P">Pequena</option>
            <option value="M">Média</option>
            <option value="G">Grande</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value as any)}
            className={styles.select}
          >
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tamanho</th>
              <th>Dimensões (A×L×C cm)</th>
              <th>Peso Caixa (kg)</th>
              <th>Volume (cm³)</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {caixas.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  <Package size={48} />
                  <p>Nenhuma caixa cadastrada</p>
                </td>
              </tr>
            ) : (
              caixas.map((caixa) => (
                <tr key={caixa.id}>
                  <td>
                    <strong>{caixa.codigo}</strong>
                  </td>
                  <td>{caixa.nome}</td>
                  <td>
                    <span className={`${styles.badge} ${getTamanhoBadgeClass(caixa.tamanho)}`}>
                      {getTamanhoLabel(caixa.tamanho)}
                    </span>
                  </td>
                  <td>
                    {caixa.altura} × {caixa.largura} × {caixa.comprimento}
                  </td>
                  <td>{formatPesoCaixa(caixa.peso_caixa)}</td>
                  <td>
                    {(caixa.altura * caixa.largura * caixa.comprimento).toLocaleString('pt-BR')}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${caixa.ativo ? styles.badgeSuccess : styles.badgeDanger}`}>
                      {caixa.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => abrirModal(caixa)}
                        className={styles.iconButton}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {caixa.ativo ? (
                        <button
                          onClick={() => handleDesativar(caixa)}
                          className={`${styles.iconButton} ${styles.danger}`}
                          title="Desativar"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAtivar(caixa)}
                          className={`${styles.iconButton} ${styles.success}`}
                          title="Ativar"
                        >
                          <Package size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCaixa ? 'Editar Caixa' : 'Nova Caixa'}</h2>
              <button onClick={fecharModal} className={styles.closeButton}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Código *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex: P1, M2, G3"
                    maxLength={10}
                    disabled={!!editingCaixa}
                    required
                  />
                  <small>2-10 caracteres, apenas letras e números</small>
                </div>
                <div className={styles.formGroup}>
                  <label>Tamanho *</label>
                  <select
                    value={formData.tamanho}
                    onChange={(e) => setFormData({ ...formData, tamanho: e.target.value as any })}
                    disabled={!!editingCaixa}
                    required
                  >
                    <option value="P">Pequena (P)</option>
                    <option value="M">Média (M)</option>
                    <option value="G">Grande (G)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Pequena 1, Média 2"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Altura (cm) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    placeholder="0-200"
                    min="0.01"
                    max="200"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Largura (cm) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.largura}
                    onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                    placeholder="0-200"
                    min="0.01"
                    max="200"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Comprimento (cm) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.comprimento}
                    onChange={(e) => setFormData({ ...formData, comprimento: e.target.value })}
                    placeholder="0-200"
                    min="0.01"
                    max="200"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Peso da Caixa Vazia (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.peso_caixa}
                  onChange={(e) => setFormData({ ...formData, peso_caixa: e.target.value })}
                  placeholder="0-50"
                  min="0"
                  max="50"
                  required
                />
                <small>Peso apenas da caixa vazia</small>
              </div>

              {formData.altura && formData.largura && formData.comprimento && (
                <div className={styles.infoBox}>
                  <AlertCircle size={20} />
                  <div>
                    <strong>Volume calculado:</strong>{' '}
                    {(parseFloat(formData.altura) * parseFloat(formData.largura) * parseFloat(formData.comprimento)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} cm³
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={fecharModal} className={styles.secondaryButton}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryButton}>
                  {editingCaixa ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
