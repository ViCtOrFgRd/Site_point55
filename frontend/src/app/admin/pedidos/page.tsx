'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiCheckCircle, FiTruck } from 'react-icons/fi';
import styles from './pedidos.module.scss';

export default function AdminPedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});

  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'processando', label: 'Processando' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'devolucao', label: 'Devolucao' },
    { value: 'devolvido', label: 'Devolvido' },
    { value: 'entregue', label: 'Entregue (legado)' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarPedidos();
    }
  }, [user, filtroStatus]);

  useEffect(() => {
    const drafts: Record<number, string> = {};
    pedidos.forEach((pedido) => {
      drafts[pedido.id] = pedido.status;
    });
    setStatusDrafts(drafts);
  }, [pedidos]);

  const carregarPedidos = async () => {
    setLoading(true);
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const response = await orderService.getAll(params);
      if (response.success) {
        setPedidos(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarStatus = async (pedidoId: number, novoStatus: string) => {
    if (!novoStatus) return;

    try {
      const response = await orderService.updateStatus(pedidoId, novoStatus);
      if (response.success) {
        alert('Status atualizado com sucesso!');
        carregarPedidos();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar status');
    }
  };

  const handleStatusChange = (pedidoId: number, value: string) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [pedidoId]: value,
    }));
  };

  const handleAdicionarRastreio = async (pedidoId: number) => {
    const codigo = prompt('Digite o código de rastreio:');
    if (!codigo) return;

    try {
      const response = await orderService.addTracking(pedidoId, codigo);
      if (response.success) {
        alert('Código de rastreio adicionado com sucesso!');
        carregarPedidos();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao adicionar rastreio');
    }
  };

  const pedidosFiltrados = pedidos;
  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter((p) => p.status === 'pendente').length;
  const pedidosEnviados = pedidos.filter((p) => p.status === 'enviado').length;
  const valorTotal = pedidos.reduce((acc, p) => acc + parseFloat(p.valor_total || 0), 0);

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
    <div className={styles.adminPedidos}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Gerenciar Pedidos</h1>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <FiPackage size={24} />
            <div>
              <p>Total de Pedidos</p>
              <h3>{totalPedidos}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiPackage size={24} />
            <div>
              <p>Pendentes</p>
              <h3>{pedidosPendentes}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiTruck size={24} />
            <div>
              <p>Enviados</p>
              <h3>{pedidosEnviados}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiCheckCircle size={24} />
            <div>
              <p>Valor Total</p>
              <h3>R$ {typeof valorTotal === 'number' ? valorTotal.toFixed(2) : parseFloat(valorTotal || 0).toFixed(2)}</h3>
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
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="processando">Processando</option>
            <option value="enviado">Enviado</option>
            <option value="devolucao">Devolucao</option>
            <option value="devolvido">Devolvido</option>
            <option value="entregue">Entregue (legado)</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table} data-testid="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Rastreio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id}>
                  <td>#{pedido.id}</td>
                  <td>{pedido.usuario_nome || 'N/A'}</td>
                  <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
                  <td>R$ {parseFloat(pedido.valor_total).toFixed(2)}</td>
                  <td>
                    <span className={styles.paymentMethod}>
                      {pedido.forma_pagamento === 'pix' ? 'PIX' :
                       pedido.forma_pagamento === 'cartao' ? 'Cartão de Crédito' :
                       pedido.forma_pagamento === 'credito' ? 'Cartão de Crédito' :
                       pedido.forma_pagamento === 'debito' ? 'Cartão de Débito' :
                       pedido.forma_pagamento === 'boleto' ? 'Boleto' :
                       pedido.forma_pagamento || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <select
                      className={styles.statusSelect}
                      value={statusDrafts[pedido.id] || pedido.status}
                      onChange={(event) => handleStatusChange(pedido.id, event.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {pedido.codigo_rastreio || (
                      <span className={styles.textMuted}>Sem rastreio</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/pedidos/${pedido.id}`} className={styles.btnView}>
                        Ver
                      </Link>
                      <button
                        onClick={() => handleAtualizarStatus(pedido.id, statusDrafts[pedido.id] || pedido.status)}
                        className={styles.btnEdit}
                      >
                        Atualizar
                      </button>
                      <button
                        onClick={() => handleAdicionarRastreio(pedido.id)}
                        className={styles.btnPrimary}
                      >
                        Rastreio
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pedidosFiltrados.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
