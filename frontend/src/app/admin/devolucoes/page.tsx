/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { returnService } from '@/services/api';
import { Devolucao } from '@/types';
import { FiArrowLeft, FiRefreshCcw, FiCheckCircle, FiClock } from 'react-icons/fi';
import styles from './devolucoes.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_BASE_URL = API_URL.replace('/api', '');

export default function AdminDevolucoesPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
  const [decisaoDrafts, setDecisaoDrafts] = useState<Record<number, string>>({});
  const [instrucoesDrafts, setInstrucoesDrafts] = useState<Record<number, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const statusOptions = [
    { value: 'solicitado', label: 'Solicitado' },
    { value: 'em_analise', label: 'Em analise' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'recusado', label: 'Recusado' },
    { value: 'recorre', label: 'Recorreu' },
    { value: 'concluido', label: 'Concluido' },
  ];

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarDevolucoes();
    }
  }, [user, filtroStatus]);

  useEffect(() => {
    const drafts: Record<number, string> = {};
    const decisao: Record<number, string> = {};
    const instrucoes: Record<number, string> = {};
    const expanded: Record<number, boolean> = {};
    devolucoes.forEach((devolucao) => {
      drafts[devolucao.id] = devolucao.status;
      decisao[devolucao.id] = devolucao.admin_decisao || '';
      instrucoes[devolucao.id] = devolucao.admin_instrucoes || '';
      if (devolucao.justificativa_recorrencia || devolucao.observacoes || devolucao.admin_instrucoes) {
        expanded[devolucao.id] = true;
      }
    });
    setStatusDrafts(drafts);
    setDecisaoDrafts(decisao);
    setInstrucoesDrafts(instrucoes);
    setExpandedRows(expanded);
  }, [devolucoes]);

  const carregarDevolucoes = async () => {
    setLoading(true);
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const response = await returnService.getAll(params);
      if (response.success) {
        setDevolucoes((Array.isArray(response.data) ? response.data : []) as Devolucao[]);
      }
    } catch (error) {
      console.error('Erro ao carregar devolucoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarStatus = async (devolucaoId: number, novoStatus: string) => {
    if (!novoStatus) return;

    const adminDecisao = decisaoDrafts[devolucaoId] || '';
    const adminInstrucoes = instrucoesDrafts[devolucaoId] || '';

    try {
      const response = await returnService.updateStatus(
        devolucaoId,
        novoStatus,
        adminDecisao,
        adminInstrucoes
      );
      if (response.success) {
        toast.success('Status atualizado com sucesso!');
        carregarDevolucoes();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const handleStatusChange = (devolucaoId: number, value: string) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [devolucaoId]: value,
    }));
  };

  const handleDecisaoChange = (devolucaoId: number, value: string) => {
    setDecisaoDrafts((prev) => ({
      ...prev,
      [devolucaoId]: value,
    }));
  };

  const handleInstrucoesChange = (devolucaoId: number, value: string) => {
    setInstrucoesDrafts((prev) => ({
      ...prev,
      [devolucaoId]: value,
    }));
  };

  const toggleExpanded = (devolucaoId: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [devolucaoId]: !prev[devolucaoId],
    }));
  };

  const total = devolucoes.length;
  const emAnalise = devolucoes.filter((d) => d.status === 'em_analise').length;
  const pendentes = devolucoes.filter((d) => d.status === 'solicitado').length;
  const aprovadas = devolucoes.filter((d) => d.status === 'aprovado').length;

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
    <div className={styles.adminDevolucoes}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Gerenciar Devolucoes</h1>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <FiRefreshCcw size={24} />
            <div>
              <p>Total</p>
              <h3>{total}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiClock size={24} />
            <div>
              <p>Solicitadas</p>
              <h3>{pendentes}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiClock size={24} />
            <div>
              <p>Em analise</p>
              <h3>{emAnalise}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiCheckCircle size={24} />
            <div>
              <p>Aprovadas</p>
              <h3>{aprovadas}</h3>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todos os status</option>
            <option value="solicitado">Solicitado</option>
            <option value="em_analise">Em analise</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
            <option value="recorre">Recorreu</option>
            <option value="concluido">Concluido</option>
          </select>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Pedido</th>
                <th>Tipo</th>
                <th>Detalhes</th>
                <th>Resposta Admin</th>
                <th>Itens</th>
                <th>Anexos</th>
                <th>Status</th>
                <th>Data</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {devolucoes.map((devolucao) => (
                <Fragment key={devolucao.id}>
                  <tr>
                  <td>#{devolucao.id}</td>
                  <td>{devolucao.usuario_nome || 'N/A'}</td>
                  <td>
                    <Link href={`/pedidos/${devolucao.pedido_id}`} className={styles.linkButton}>
                      #{devolucao.pedido_id}
                    </Link>
                  </td>
                  <td>{devolucao.tipo}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.detailsButton}
                      onClick={() => toggleExpanded(devolucao.id)}
                    >
                      {expandedRows[devolucao.id] ? 'Ocultar' : 'Ver'} detalhes
                    </button>
                  </td>
                  <td>
                    <div className={styles.adminResponse}>
                      <textarea
                        className={styles.textArea}
                        rows={2}
                        placeholder="Resumo da decisao"
                        value={decisaoDrafts[devolucao.id] || ''}
                        onChange={(event) => handleDecisaoChange(devolucao.id, event.target.value)}
                      />
                      <textarea
                        className={styles.textArea}
                        rows={2}
                        placeholder="Instrucoes para o cliente"
                        value={instrucoesDrafts[devolucao.id] || ''}
                        onChange={(event) => handleInstrucoesChange(devolucao.id, event.target.value)}
                      />
                    </div>
                  </td>
                  <td>
                    {devolucao.itens && devolucao.itens.length > 0 ? (
                      <div className={styles.detailsList}>
                        {devolucao.itens.map((item) => (
                          <div key={item.id} className={styles.detailItem}>
                            <span>{item.produto_nome || `Produto ${item.produto_id}`}</span>
                            <span>Qtd: {item.quantidade}</span>
                            {item.motivo_item && <span>Motivo: {item.motivo_item}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.textMuted}>Sem itens</span>
                    )}
                  </td>
                  <td>
                    {devolucao.anexos && devolucao.anexos.length > 0 ? (
                      <div className={styles.detailsList}>
                        {devolucao.anexos.map((anexo) => {
                          const arquivoUrl = anexo.arquivo_url?.startsWith('http')
                            ? anexo.arquivo_url
                            : `${IMAGE_BASE_URL}${anexo.arquivo_url || ''}`;

                          return (
                            <a
                              key={anexo.id}
                              href={arquivoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.linkButton}
                            >
                              {anexo.arquivo_nome || 'Anexo'}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <span className={styles.textMuted}>Sem anexos</span>
                    )}
                  </td>
                  <td>
                    <select
                      className={styles.statusSelect}
                      value={statusDrafts[devolucao.id] || devolucao.status}
                      onChange={(event) => handleStatusChange(devolucao.id, event.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(devolucao.data_criacao).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleAtualizarStatus(devolucao.id, statusDrafts[devolucao.id] || devolucao.status)}
                        className={styles.btnEdit}
                      >
                        Atualizar
                      </button>
                    </div>
                  </td>
                  </tr>
                  {expandedRows[devolucao.id] && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={11}>
                        <div className={styles.detailsPanel}>
                          <div className={styles.detailsGrid}>
                            <div>
                              <div className={styles.detailsLabel}>Motivo</div>
                              <div className={styles.detailsValue}>{devolucao.motivo}</div>
                            </div>
                            <div>
                              <div className={styles.detailsLabel}>Justificativa</div>
                              <div className={styles.detailsValue}>{devolucao.justificativa}</div>
                            </div>
                            {devolucao.observacoes && (
                              <div>
                                <div className={styles.detailsLabel}>Observacoes</div>
                                <div className={styles.detailsValue}>{devolucao.observacoes}</div>
                              </div>
                            )}
                            {devolucao.justificativa_recorrencia && (
                              <div>
                                <div className={styles.detailsLabel}>Recorrencia</div>
                                <div className={styles.detailsValue}>{devolucao.justificativa_recorrencia}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {devolucoes.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhuma solicitacao encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
