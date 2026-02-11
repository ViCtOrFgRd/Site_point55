'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  const router = useRouter();
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});

  const statusOptions = [
    { value: 'solicitado', label: 'Solicitado' },
    { value: 'em_analise', label: 'Em analise' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'recusado', label: 'Recusado' },
    { value: 'recorre', label: 'Recorreu' },
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
    devolucoes.forEach((devolucao) => {
      drafts[devolucao.id] = devolucao.status;
    });
    setStatusDrafts(drafts);
  }, [devolucoes]);

  const carregarDevolucoes = async () => {
    setLoading(true);
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const response = await returnService.getAll(params);
      if (response.success) {
        setDevolucoes(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar devolucoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarStatus = async (devolucaoId: number, novoStatus: string) => {
    if (!novoStatus) return;

    const adminDecisao = prompt('Resumo da decisao (opcional):') || '';
    const adminInstrucoes = prompt('Instrucoes para o cliente (opcional):') || '';

    try {
      const response = await returnService.updateStatus(
        devolucaoId,
        novoStatus,
        adminDecisao,
        adminInstrucoes
      );
      if (response.success) {
        alert('Status atualizado com sucesso!');
        carregarDevolucoes();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar status');
    }
  };

  const handleStatusChange = (devolucaoId: number, value: string) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [devolucaoId]: value,
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
                <th>Motivo</th>
                <th>Justificativa</th>
                <th>Itens</th>
                <th>Anexos</th>
                <th>Status</th>
                <th>Data</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {devolucoes.map((devolucao) => (
                <tr key={devolucao.id}>
                  <td>#{devolucao.id}</td>
                  <td>{devolucao.usuario_nome || 'N/A'}</td>
                  <td>
                    <Link href={`/pedidos/${devolucao.pedido_id}`} className={styles.linkButton}>
                      #{devolucao.pedido_id}
                    </Link>
                  </td>
                  <td>{devolucao.tipo}</td>
                  <td className={styles.longText}>{devolucao.motivo}</td>
                  <td className={styles.longText}>{devolucao.justificativa}</td>
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
