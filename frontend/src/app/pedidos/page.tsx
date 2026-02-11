'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { Pedido } from '@/types';
import { orderService } from '@/services/api';
import { FiPackage, FiClock, FiCheck, FiTruck, FiX, FiFilter, FiRefreshCcw } from 'react-icons/fi';
import styles from './pedidos.module.scss';

export default function PedidosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/perfil');
      return;
    }
    carregarPedidos();
  }, [user, filtroStatus]);

  const carregarPedidos = async () => {
    setLoading(true);

    try {
      const params: any = {};
      if (filtroStatus) {
        params.status = filtroStatus;
      }

      const response = await orderService.getAll(params);
      if (response.success && response.data) {
        setPedidos(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <FiClock />;
      case 'pago':
      case 'processando':
        return <FiPackage />;
      case 'enviado':
        return <FiTruck />;
      case 'devolucao':
        return <FiRefreshCcw />;
      case 'devolvido':
      case 'entregue':
        return <FiCheck />;
      case 'cancelado':
        return <FiX />;
      default:
        return <FiPackage />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pendente: 'Pendente',
      pago: 'Pago',
      processando: 'Processando',
      enviado: 'Enviado',
      devolucao: 'Devolucao',
      devolvido: 'Devolvido',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pendente: '#FFA726',
      pago: '#42A5F5',
      processando: '#AB47BC',
      enviado: '#29B6F6',
      devolucao: '#FFB74D',
      devolvido: '#66BB6A',
      entregue: '#66BB6A',
      cancelado: '#EF5350',
    };
    return colorMap[status] || '#999';
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Filtrar pedidos no frontend (já virá filtrado da API se filtroStatus estiver definido)
  const pedidosFiltrados = filtroStatus === ''
    ? pedidos
    : pedidos.filter(p => p.status === filtroStatus);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs items={[{ label: 'Meus Pedidos' }]} />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Meus Pedidos</h1>
          <p>Acompanhe o status dos seus pedidos</p>
        </div>

        {/* Filtros */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${filtroStatus === '' ? styles.active : ''}`}
            onClick={() => setFiltroStatus('')}
          >
            <FiFilter /> Todos ({pedidos.length})
          </button>
          <button
            className={`${styles.filterButton} ${filtroStatus === 'processando' ? styles.active : ''}`}
            onClick={() => setFiltroStatus('processando')}
          >
            <FiPackage /> Processando
          </button>
          <button
            className={`${styles.filterButton} ${filtroStatus === 'enviado' ? styles.active : ''}`}
            onClick={() => setFiltroStatus('enviado')}
          >
            <FiTruck /> Enviados
          </button>
          <button
            className={`${styles.filterButton} ${filtroStatus === 'devolucao' ? styles.active : ''}`}
            onClick={() => setFiltroStatus('devolucao')}
          >
            <FiRefreshCcw /> Devolucao
          </button>
          <button
            className={`${styles.filterButton} ${filtroStatus === 'devolvido' ? styles.active : ''}`}
            onClick={() => setFiltroStatus('devolvido')}
          >
            <FiCheck /> Devolvidos
          </button>
        </div>

        {/* Lista de Pedidos */}
        {pedidosFiltrados.length > 0 ? (
          <div className={styles.pedidosList}>
            {pedidosFiltrados.map((pedido) => (
              <Link
                key={pedido.id}
                href={`/pedidos/${pedido.id}`}
                className={styles.pedidoCard}
              >
                <div className={styles.pedidoHeader}>
                  <div className={styles.pedidoInfo}>
                    <h3>Pedido #{pedido.id}</h3>
                    <p className={styles.pedidoData}>
                      {formatarData(pedido.data_pedido)}
                    </p>
                  </div>
                  <div
                    className={styles.statusBadge}
                    style={{ background: getStatusColor(pedido.status) }}
                  >
                    {getStatusIcon(pedido.status)}
                    <span>{getStatusText(pedido.status)}</span>
                  </div>
                </div>

                <div className={styles.pedidoDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Pagamento:</span>
                    <span className={styles.value}>
                      {pedido.forma_pagamento === 'pix'
                        ? 'PIX'
                        : pedido.forma_pagamento === 'cartao'
                        ? 'Cartão de Crédito'
                        : 'Boleto'}
                    </span>
                  </div>
                  {pedido.codigo_rastreio && (
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Rastreio:</span>
                      <span className={styles.value}>{pedido.codigo_rastreio}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Total:</span>
                    <span className={styles.totalValue}>
                      R$ {typeof pedido.total === 'number' ? pedido.total.toFixed(2) : parseFloat(pedido.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FiPackage />
            <h3>Nenhum pedido encontrado</h3>
            <p>Você ainda não fez nenhum pedido com este filtro.</p>
            <Link href="/produtos">
              <button className={styles.shopButton}>Ir às Compras</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
