'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { returnService } from '@/services/api';
import { Devolucao } from '@/types';
import { FiRefreshCcw, FiClock, FiCheckCircle, FiX } from 'react-icons/fi';
import styles from './devolucoes.module.scss';

export default function DevolucoesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/perfil');
      return;
    }
    carregarDevolucoes();
  }, [user]);

  const carregarDevolucoes = async () => {
    setLoading(true);
    try {
      const response = await returnService.getAll();
      if (response.success) {
        setDevolucoes(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar devolucoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <FiCheckCircle />;
      case 'recusado':
        return <FiX />;
      case 'em_analise':
      case 'recorre':
        return <FiClock />;
      default:
        return <FiRefreshCcw />;
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Carregando devolucoes...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs items={[{ label: 'Minhas Devolucoes' }]} />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Minhas Devolucoes</h1>
          <p>Acompanhe o status das suas solicitacoes.</p>
        </div>

        {devolucoes.length === 0 ? (
          <div className={styles.empty}>
            <FiRefreshCcw />
            <h3>Nenhuma solicitacao encontrada</h3>
            <p>Solicite uma troca ou devolucao no detalhe do pedido.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {devolucoes.map((devolucao) => (
              <div key={devolucao.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>Solicitacao #{devolucao.id}</h3>
                    <p>Pedido #{devolucao.pedido_id}</p>
                  </div>
                  <span className={styles.status}>
                    {getStatusIcon(devolucao.status)} {devolucao.status}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p><strong>Tipo:</strong> {devolucao.tipo}</p>
                  <p><strong>Motivo:</strong> {devolucao.motivo}</p>
                  {devolucao.admin_instrucoes && (
                    <p><strong>Instrucoes:</strong> {devolucao.admin_instrucoes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
