/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Save, Package } from 'lucide-react';
import { configFreteService, caixaService } from '@/services/api';
import { showSuccess, showError } from '@/utils/alerts';
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

interface ConfigLinha {
  caixa_id: number;
  capacidade_media: number;
  peso_medio_item: number;
  caixa?: {
    codigo: string;
    nome: string;
    altura: number;
    largura: number;
    comprimento: number;
    peso_caixa: number;
  };
}

interface ConfigFallback {
  P: ConfigLinha | null;
  M: ConfigLinha | null;
  G: ConfigLinha | null;
}

type FormLinha = {
  caixa_id: number;
  capacidade_media: number;
  peso_medio_item: number;
};

type FormDataState = {
  P: FormLinha;
  M: FormLinha;
  G: FormLinha;
};

const defaultFormData: FormDataState = {
  P: { caixa_id: 0, capacidade_media: 1, peso_medio_item: 0.5 },
  M: { caixa_id: 0, capacidade_media: 3, peso_medio_item: 0.5 },
  G: { caixa_id: 0, capacidade_media: 6, peso_medio_item: 0.5 },
};

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

export default function ConfigFallbackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [config, setConfig] = useState<ConfigFallback>({
    P: null,
    M: null,
    G: null,
  });
  const [formData, setFormData] = useState<FormDataState>(defaultFormData);

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
    try {
      setLoading(true);
      
      // Carregar caixas ativas
      const caixasResponse = await caixaService.getAll({ ativo: true });
      if (caixasResponse.success && caixasResponse.data) {
        setCaixas(Array.isArray(caixasResponse.data) ? caixasResponse.data : []);
      }
      
      // Carregar config fallback
      const configResponse = await configFreteService.getFallback();
      if (configResponse.success && configResponse.data) {
        const configData = (configResponse.data && typeof configResponse.data === 'object')
          ? configResponse.data
          : { P: null, M: null, G: null };
        setConfig(configData as ConfigFallback);
        
        // Preencher formData
        const newFormData: FormDataState = {
          ...defaultFormData,
          P: { ...defaultFormData.P },
          M: { ...defaultFormData.M },
          G: { ...defaultFormData.G },
        };
        ['P', 'M', 'G'].forEach(tamanho => {
          const cfg = (configData as any)[tamanho];
          if (cfg) {
            (newFormData as any)[tamanho] = {
              caixa_id: cfg.caixa_id,
              capacidade_media: cfg.capacidade_media,
              peso_medio_item: cfg.peso_medio_item,
            };
          }
        });
        setFormData(newFormData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações
      if (!formData.P.caixa_id || !formData.M.caixa_id || !formData.G.caixa_id) {
        showError('Selecione caixas para P, M e G');
        return;
      }

      if (formData.P.capacidade_media <= 0 || formData.M.capacidade_media <= 0 || formData.G.capacidade_media <= 0) {
        showError('Capacidade deve ser maior que 0');
        return;
      }

      if (formData.P.peso_medio_item < 0 || formData.M.peso_medio_item < 0 || formData.G.peso_medio_item < 0) {
        showError('Peso médio por item deve ser maior ou igual a 0');
        return;
      }

      setSaving(true);
      await configFreteService.updateFallback(formData);
      showSuccess('Configuração fallback atualizada com sucesso!');
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showError(error.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const getCaixasPorTamanho = (tamanho: 'P' | 'M' | 'G') => {
    return caixas.filter(c => c.tamanho === tamanho);
  };

  const getCaixaSelecionada = (tamanho: 'P' | 'M' | 'G') => {
    const caixaId = formData?.[tamanho]?.caixa_id || 0;
    return caixas.find(c => c.id === caixaId);
  };

  const calcularPesoVolume = (tamanho: 'P' | 'M' | 'G') => {
    const caixa = getCaixaSelecionada(tamanho);
    if (!caixa) return 0;
    
    const capacidade = Number(formData[tamanho].capacidade_media) || 0;
    const pesoItem = Number(formData[tamanho].peso_medio_item) || 0;
    const pesoCaixa = Number(caixa.peso_caixa) || 0;
    const resultado = (capacidade * pesoItem) + pesoCaixa;
    return Number.isFinite(resultado) ? resultado : 0;
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Settings className={styles.spinner} />
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
            <Settings size={32} />
            Configuração Fallback de Frete
          </h1>
          <p className={styles.subtitle}>
            Define as caixas e capacidades padrão para tipos de produto sem configuração específica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tamanho</th>
                <th>Caixa</th>
                <th>Dimensões (A×L×C cm)</th>
                <th>Capacidade Média (itens)</th>
                <th>Peso Médio/Item (kg)</th>
                <th>Peso do Volume (kg)</th>
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
                        value={formData[tamanho].capacidade_media}
                        onChange={(e) => setFormData({
                          ...formData,
                          [tamanho]: { ...formData[tamanho], capacidade_media: parseInt(e.target.value) || 1 }
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.infoBox} style={{ marginTop: '1.5rem' }}>
          <Package size={20} />
          <div>
            <strong>Observação:</strong> Esta configuração será usada automaticamente para produtos cujo tipo não possua configuração específica de embalagem. 
            O peso do volume é calculado como: (Capacidade × Peso/Item) + Peso da Caixa.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      </form>
    </div>
  );
}
