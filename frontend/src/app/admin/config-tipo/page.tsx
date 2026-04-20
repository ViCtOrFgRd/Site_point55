/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Save, Copy, Plus, Edit2 } from 'lucide-react';
import { tipoProdutoService, caixaService } from '@/services/api';
import { showSuccess, showError, confirmDelete } from '@/utils/alerts';
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
}

interface TipoProduto {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
}

interface ConfigLinha {
  caixa_id: number;
  capacidade: number;
  peso_medio_item: number;
  observacoes?: string;
  caixa?: {
    codigo: string;
    nome: string;
    altura: number;
    largura: number;
    comprimento: number;
    peso_caixa: number;
  };
}

interface ConfigEmbalagem {
  P: ConfigLinha | null;
  M: ConfigLinha | null;
  G: ConfigLinha | null;
}

const normalizeCaixaNome = (value: string): string => {
  if (!value || !/[ÃÂ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return value;
  }
};

export default function ConfigTipoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipos, setTipos] = useState<TipoProduto[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<number | null>(null);
  const [config, setConfig] = useState<ConfigEmbalagem>({
    P: null,
    M: null,
    G: null,
  });
  const [formData, setFormData] = useState({
    P: { caixa_id: 0, capacidade: 1, peso_medio_item: 0.5, observacoes: '' },
    M: { caixa_id: 0, capacidade: 3, peso_medio_item: 0.5, observacoes: '' },
    G: { caixa_id: 0, capacidade: 6, peso_medio_item: 0.5, observacoes: '' },
  });
  const [showNovoTipoModal, setShowNovoTipoModal] = useState(false);
  const [novoTipo, setNovoTipo] = useState({ nome: '', codigo: '' });
  const [showDuplicarModal, setShowDuplicarModal] = useState(false);
  const [tipoOrigemId, setTipoOrigemId] = useState<number>(0);

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

  useEffect(() => {
    if (tipoSelecionado) {
      carregarConfigTipo(tipoSelecionado);
    }
  }, [tipoSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar tipos
      const tiposResponse = await tipoProdutoService.getAll({ ativo: true });
      if (tiposResponse.success && tiposResponse.data) {
        const tiposData: TipoProduto[] = Array.isArray(tiposResponse.data) ? tiposResponse.data : [];
        setTipos(tiposData);
        if (tiposData.length > 0 && !tipoSelecionado) {
          setTipoSelecionado(tiposData[0].id);
        }
      }
      
      // Carregar caixas ativas
      const caixasResponse = await caixaService.getAll({ ativo: true });
      if (caixasResponse.success && caixasResponse.data) {
        setCaixas(Array.isArray(caixasResponse.data) ? caixasResponse.data : []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarConfigTipo = async (tipoId: number) => {
    try {
      const response = await tipoProdutoService.getEmbalagem(tipoId);
      if (response.success && response.data) {
        const embalagens = (response.data as any)?.embalagens;
        setConfig((embalagens && typeof embalagens === 'object') ? embalagens : { P: null, M: null, G: null });
        
        // Preencher formData ou usar valores padrão
        const newFormData: any = {
          P: { caixa_id: 0, capacidade: 1, peso_medio_item: 0.5, observacoes: '' },
          M: { caixa_id: 0, capacidade: 3, peso_medio_item: 0.5, observacoes: '' },
          G: { caixa_id: 0, capacidade: 6, peso_medio_item: 0.5, observacoes: '' },
        };
        
        ['P', 'M', 'G'].forEach(tamanho => {
          const cfg = embalagens?.[tamanho];
          if (cfg) {
            newFormData[tamanho] = {
              caixa_id: cfg.caixa_id,
              capacidade: cfg.capacidade,
              peso_medio_item: cfg.peso_medio_item,
              observacoes: cfg.observacoes || '',
            };
          }
        });
        
        setFormData(newFormData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar config:', error);
      // Resetar formData para valores padrão
      setConfig({ P: null, M: null, G: null });
      setFormData({
        P: { caixa_id: 0, capacidade: 1, peso_medio_item: 0.5, observacoes: '' },
        M: { caixa_id: 0, capacidade: 3, peso_medio_item: 0.5, observacoes: '' },
        G: { caixa_id: 0, capacidade: 6, peso_medio_item: 0.5, observacoes: '' },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoSelecionado) {
      showError('Selecione um tipo de produto');
      return;
    }
    
    try {
      // Validações
      if (!formData.P.caixa_id || !formData.M.caixa_id || !formData.G.caixa_id) {
        showError('Selecione caixas para P, M e G');
        return;
      }

      if (formData.P.capacidade <= 0 || formData.M.capacidade <= 0 || formData.G.capacidade <= 0) {
        showError('Capacidade deve ser maior que 0');
        return;
      }

      if (formData.P.peso_medio_item < 0 || formData.M.peso_medio_item < 0 || formData.G.peso_medio_item < 0) {
        showError('Peso médio por item deve ser maior ou igual a 0');
        return;
      }

      // Validar capacidades diferentes
      const capacidades = [formData.P.capacidade, formData.M.capacidade, formData.G.capacidade];
      if (new Set(capacidades).size !== 3) {
        showError('As capacidades P, M e G devem ser diferentes');
        return;
      }

      setSaving(true);
      await tipoProdutoService.updateEmbalagem(tipoSelecionado, formData);
      showSuccess('Configuração de embalagem atualizada com sucesso!');
      carregarConfigTipo(tipoSelecionado);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showError(error.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleCriarTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!novoTipo.nome || !novoTipo.codigo) {
        showError('Nome e código são obrigatórios');
        return;
      }
      
      await tipoProdutoService.create({
        nome: novoTipo.nome,
        codigo: novoTipo.codigo.toLowerCase(),
      });
      
      showSuccess('Tipo de produto criado com sucesso!');
      setShowNovoTipoModal(false);
      setNovoTipo({ nome: '', codigo: '' });
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao criar tipo:', error);
      showError(error.message || 'Erro ao criar tipo');
    }
  };

  const handleDuplicar = async () => {
    if (!tipoSelecionado || !tipoOrigemId) {
      showError('Selecione um tipo de origem');
      return;
    }
    
    try {
      await tipoProdutoService.duplicateEmbalagem(tipoSelecionado, tipoOrigemId);
      showSuccess('Configuração duplicada com sucesso!');
      setShowDuplicarModal(false);
      setTipoOrigemId(0);
      carregarConfigTipo(tipoSelecionado);
    } catch (error: any) {
      console.error('Erro ao duplicar:', error);
      showError(error.message || 'Erro ao duplicar configuração');
    }
  };

  const getCaixasPorTamanho = (tamanho: 'P' | 'M' | 'G') => {
    return caixas.filter(c => c.tamanho === tamanho);
  };

  const getCaixaSelecionada = (tamanho: 'P' | 'M' | 'G') => {
    const caixaId = formData[tamanho].caixa_id;
    return caixas.find(c => c.id === caixaId);
  };

  const calcularPesoVolume = (tamanho: 'P' | 'M' | 'G') => {
    const caixa = getCaixaSelecionada(tamanho);
    if (!caixa) return 0;
    
    const capacidade = Number(formData[tamanho].capacidade) || 0;
    const pesoItem = Number(formData[tamanho].peso_medio_item) || 0;
    const pesoCaixa = Number(caixa.peso_caixa) || 0;
    const resultado = (capacidade * pesoItem) + pesoCaixa;
    return Number.isFinite(resultado) ? resultado : 0;
  };

  const getTipoNome = () => {
    const tipo = tipos.find(t => t.id === tipoSelecionado);
    return tipo?.nome || '';
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
            Configuração de Embalagem por Tipo
          </h1>
          <p className={styles.subtitle}>
            Configure as caixas P/M/G para cada tipo de produto
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowNovoTipoModal(true)} className={styles.secondaryButton}>
            <Plus size={20} />
            Novo Tipo
          </button>
          {tipoSelecionado && (
            <button onClick={() => setShowDuplicarModal(true)} className={styles.secondaryButton}>
              <Copy size={20} />
              Duplicar Config
            </button>
          )}
        </div>
      </div>

      {/* Seletor de Tipo */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Tipo de Produto:</label>
          <select
            value={tipoSelecionado || ''}
            onChange={(e) => setTipoSelecionado(parseInt(e.target.value))}
            className={styles.select}
            style={{ minWidth: '250px' }}
          >
            <option value="">Selecione um tipo</option>
            {tipos.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tipoSelecionado ? (
        <form onSubmit={handleSubmit}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tamanho</th>
                  <th>Caixa</th>
                  <th>Dimensões (A×L×C cm)</th>
                  <th>Capacidade (itens)</th>
                  <th>Peso Médio/Item (kg)</th>
                  <th>Peso do Volume (kg)</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {(['P', 'M', 'G'] as const).map((tamanho) => {
                  const caixa = getCaixaSelecionada(tamanho);
                  const pesoVolume = calcularPesoVolume(tamanho);
                  
                  return (
                    <tr key={tamanho}>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${tamanho}`]}`}>
                          {tamanho === 'P' ? 'Pequena' : tamanho === 'M' ? 'Média' : 'Grande'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={formData[tamanho].caixa_id}
                          onChange={(e) => setFormData({
                            ...formData,
                            [tamanho]: { ...formData[tamanho], caixa_id: parseInt(e.target.value) }
                          })}
                          className={styles.select}
                          required
                        >
                          <option value="0">Selecione uma caixa</option>
                          {getCaixasPorTamanho(tamanho).map(c => (
                            <option key={c.id} value={c.id}>
                              {c.codigo} - {normalizeCaixaNome(c.nome)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {caixa ? (
                          <span>
                            {caixa.altura} × {caixa.largura} × {caixa.comprimento}
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={formData[tamanho].capacidade}
                          onChange={(e) => setFormData({
                            ...formData,
                            [tamanho]: { ...formData[tamanho], capacidade: parseInt(e.target.value) || 1 }
                          })}
                          style={{ width: '100px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={formData[tamanho].peso_medio_item}
                          onChange={(e) => setFormData({
                            ...formData,
                            [tamanho]: { ...formData[tamanho], peso_medio_item: parseFloat(e.target.value) || 0 }
                          })}
                          style={{ width: '100px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                          required
                        />
                      </td>
                      <td>
                        <strong style={{ color: '#4a9fff' }}>
                          {pesoVolume.toFixed(3)}
                        </strong>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={formData[tamanho].observacoes}
                          onChange={(e) => setFormData({
                            ...formData,
                            [tamanho]: { ...formData[tamanho], observacoes: e.target.value }
                          })}
                          placeholder="Opcional"
                          style={{ width: '200px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.infoBox} style={{ marginTop: '1.5rem' }}>
            <Package size={20} />
            <div>
              <strong>Dica:</strong> As capacidades P, M e G devem ser diferentes. 
              O peso do volume é calculado como: (Capacidade × Peso/Item) + Peso da Caixa.
              Esta configuração será usada apenas para produtos do tipo "{getTipoNome()}".
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <Package size={48} />
            <p>Selecione um tipo de produto para configurar</p>
          </div>
        </div>
      )}

      {/* Modal Novo Tipo */}
      {showNovoTipoModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNovoTipoModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Tipo de Produto</h2>
              <button onClick={() => setShowNovoTipoModal(false)} className={styles.closeButton}>×</button>
            </div>
            
            <form onSubmit={handleCriarTipo} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome *</label>
                <input
                  type="text"
                  value={novoTipo.nome}
                  onChange={(e) => setNovoTipo({ ...novoTipo, nome: e.target.value })}
                  placeholder="Ex: Chapéu, Meia, Bolsa"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Código *</label>
                <input
                  type="text"
                  value={novoTipo.codigo}
                  onChange={(e) => setNovoTipo({ ...novoTipo, codigo: e.target.value.toLowerCase() })}
                  placeholder="Ex: chapeu, meia, bolsa"
                  required
                />
                <small>Apenas letras minúsculas, sem espaços</small>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowNovoTipoModal(false)} className={styles.secondaryButton}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryButton}>
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Duplicar */}
      {showDuplicarModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDuplicarModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Duplicar Configuração</h2>
              <button onClick={() => setShowDuplicarModal(false)} className={styles.closeButton}>×</button>
            </div>
            
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Copiar configuração de:</label>
                <select
                  value={tipoOrigemId}
                  onChange={(e) => setTipoOrigemId(parseInt(e.target.value))}
                  className={styles.select}
                >
                  <option value="0">Selecione um tipo</option>
                  {tipos.filter(t => t.id !== tipoSelecionado).map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.infoBox}>
                <Copy size={20} />
                <div>
                  A configuração de embalagem do tipo selecionado será copiada para "{getTipoNome()}".
                  A configuração atual será substituída.
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowDuplicarModal(false)} className={styles.secondaryButton}>
                  Cancelar
                </button>
                <button type="button" onClick={handleDuplicar} className={styles.primaryButton} disabled={!tipoOrigemId}>
                  Duplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
