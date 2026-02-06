'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { couponService } from '@/services/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Tag, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import styles from './cupons.module.scss';

interface Cupom {
  id: number;
  codigo: string;
  descricao?: string;
  tipo_desconto: 'percentual' | 'fixo';
  valor_desconto: number;
  valor_minimo?: number;
  data_validade?: string;
  usos_maximos?: number;
  usos_realizados: number;
  ativo: boolean;
  data_criacao: string;
}

export default function AdminCuponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCupom, setEditingCupom] = useState<Cupom | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    tipo_desconto: 'percentual' as 'percentual' | 'fixo',
    valor_desconto: 1,
    valor_minimo: 0,
    data_validade: '',
    usos_maximos: 0,
    ativo: true,
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarCupons();
    }
  }, [user]);

  const carregarCupons = async () => {
    setLoading(true);
    try {
      const response = await couponService.getAll();
      if (response.success) {
        setCupons(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      showError('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.codigo.trim()) {
      showError('Código do cupom é obrigatório');
      return;
    }
    
    if (formData.valor_desconto === undefined || formData.valor_desconto === null || formData.valor_desconto <= 0) {
      showError('Valor de desconto deve ser maior que zero');
      return;
    }
    
    if (!['percentual', 'fixo'].includes(formData.tipo_desconto)) {
      showError('Tipo de desconto inválido');
      return;
    }
    
    try {
      const dataToSend = {
        codigo: formData.codigo.toUpperCase(),
        descricao: formData.descricao || undefined,
        tipo_desconto: formData.tipo_desconto,
        valor_desconto: parseFloat(formData.valor_desconto.toString()) || 0,
        valor_minimo: formData.valor_minimo ? parseFloat(formData.valor_minimo.toString()) : 0,
        data_validade: formData.data_validade || undefined,
        usos_maximos: formData.usos_maximos ? parseInt(formData.usos_maximos.toString()) : undefined,
        ativo: formData.ativo,
      };
      
      if (editingCupom) {
        const response = await couponService.update(editingCupom.id, dataToSend);
        if (response.success) {
          toast.success('✨ Cupom atualizado com sucesso!');
        }
      } else {
        const response = await couponService.create(dataToSend);
        if (response.success) {
          toast.success('✨ Cupom criado com sucesso!');
        }
      }
      
      setShowModal(false);
      resetForm();
      carregarCupons();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cupom');
    }
  };

  const handleEdit = (cupom: Cupom) => {
    setEditingCupom(cupom);
    setFormData({
      codigo: cupom.codigo,
      descricao: cupom.descricao || '',
      tipo_desconto: cupom.tipo_desconto,
      valor_desconto: cupom.valor_desconto,
      valor_minimo: cupom.valor_minimo || 0,
      data_validade: cupom.data_validade ? cupom.data_validade.split('T')[0] : '',
      usos_maximos: cupom.usos_maximos || 0,
      ativo: cupom.ativo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) {
      return;
    }

    try {
      const response = await couponService.delete(id);
      if (response.success) {
        toast.success('✨ Cupom excluído com sucesso!');
        carregarCupons();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cupom');
    }
  };

  const resetForm = () => {
    setEditingCupom(null);
    setFormData({
      codigo: '',
      descricao: '',
      tipo_desconto: 'percentual',
      valor_desconto: 1,
      valor_minimo: 0,
      data_validade: '',
      usos_maximos: 0,
      ativo: true,
    });
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number, tipo: string) => {
    if (tipo === 'percentual') {
      return `${valor}%`;
    }
    return `R$ ${valor.toFixed(2)}`;
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
    <div className={styles.adminCupons}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <ArrowLeft size={20} /> Voltar
            </Link>
            <h1>Gerenciar Cupons</h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className={styles.addButton}
          >
            <Plus size={20} /> Novo Cupom
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <Tag size={24} />
            <div>
              <p>Total de Cupons</p>
              <h3>{cupons.length}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <Percent size={24} />
            <div>
              <p>Cupons Ativos</p>
              <h3>{cupons.filter((c) => c.ativo).length}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <DollarSign size={24} />
            <div>
              <p>Total de Usos</p>
              <h3>{cupons.reduce((acc, c) => acc + c.usos_realizados, 0)}</h3>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>Valor Mínimo</th>
                <th>Validade</th>
                <th>Usos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cupons.map((cupom) => (
                <tr key={cupom.id}>
                  <td>
                    <strong>{cupom.codigo}</strong>
                    {cupom.descricao && (
                      <small className={styles.descricao}>{cupom.descricao}</small>
                    )}
                  </td>
                  <td>
                    <span className={styles.tipoBadge}>
                      {cupom.tipo_desconto === 'percentual' ? 'Percentual' : 'Fixo'}
                    </span>
                  </td>
                  <td>{formatarValor(cupom.valor_desconto, cupom.tipo_desconto)}</td>
                  <td>
                    {cupom.valor_minimo && cupom.valor_minimo > 0
                      ? `R$ ${parseFloat(cupom.valor_minimo).toFixed(2)}`
                      : 'Sem mínimo'}
                  </td>
                  <td>
                    {cupom.data_validade
                      ? formatarData(cupom.data_validade)
                      : 'Sem validade'}
                  </td>
                  <td>
                    {cupom.usos_realizados}
                    {cupom.usos_maximos ? ` / ${cupom.usos_maximos}` : ' / Ilimitado'}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${cupom.ativo ? styles.badgeSuccess : styles.badgeDanger}`}>
                      {cupom.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEdit(cupom)}
                        className={styles.btnEdit}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cupom.id)}
                        className={styles.btnDelete}
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {cupons.length === 0 && (
            <div className={styles.empty}>
              <Tag size={48} />
              <p>Nenhum cupom cadastrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCupom ? 'Editar Cupom' : 'Novo Cupom'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Código do Cupom *</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  required
                  placeholder="Ex: PROMO10"
                  maxLength={20}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Descrição</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Desconto de 10% para primeira compra"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tipo de Desconto *</label>
                  <select
                    name="tipo"
                    value={formData.tipo_desconto}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_desconto: e.target.value as any })
                    }
                    required
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Valor do Desconto *</label>
                  <input
                    type="number"
                    name="desconto"
                    step="0.01"
                    min="0"
                    value={formData.valor_desconto}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_desconto: parseFloat(e.target.value) })
                    }
                    required
                    placeholder={formData.tipo_desconto === 'percentual' ? '10' : '50.00'}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Valor Mínimo da Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_minimo}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_minimo: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Data de Validade</label>
                  <input
                    type="date"
                    value={formData.data_validade}
                    onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Número Máximo de Usos</label>
                <input
                  type="number"
                  min="0"
                  value={formData.usos_maximos}
                  onChange={(e) =>
                    setFormData({ ...formData, usos_maximos: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0 = Ilimitado"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  Cupom ativo
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  {editingCupom ? 'Atualizar' : 'Criar'} Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
