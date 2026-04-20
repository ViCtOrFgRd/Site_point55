/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { orderService, productService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiTrendingUp, FiShoppingBag, FiDollarSign, FiPackage } from 'react-icons/fi';
import styles from './relatorios.module.scss';

export default function AdminRelatoriosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPedidos: 0,
    totalVendas: 0,
    totalProdutos: 0,
    produtosEstoqueZero: 0,
    pedidosPendentes: 0,
    pedidosEntregues: 0,
    pedidosDevolucao: 0,
    pedidosDevolvidos: 0,
  });

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
    setLoading(true);
    try {
      const [pedidosRes, produtosRes] = await Promise.all([
        orderService.getAll({}),
        productService.getAllAdmin({ limite: 1000 }),
      ]);

      if (pedidosRes.success && produtosRes.success) {
        const pedidos: any[] = Array.isArray(pedidosRes.data) ? pedidosRes.data : [];
        const produtos: any[] = Array.isArray(produtosRes.data) ? produtosRes.data : [];

        const totalVendas = pedidos
          .filter((p: any) => p.status !== 'cancelado')
          .reduce((acc: number, p: any) => acc + parseFloat(p.valor_total || 0), 0);

        setStats({
          totalPedidos: pedidos.length,
          totalVendas,
          totalProdutos: produtos.length,
          produtosEstoqueZero: produtos.filter((p: any) => p.estoque === 0).length,
          pedidosPendentes: pedidos.filter((p: any) => p.status === 'pendente').length,
          pedidosEntregues: pedidos.filter((p: any) => p.status === 'entregue').length,
          pedidosDevolucao: pedidos.filter((p: any) => p.status === 'devolucao').length,
          pedidosDevolvidos: pedidos.filter((p: any) => p.status === 'devolvido').length,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
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
    <div className={styles.adminRelatorios}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Relatórios e Estatísticas</h1>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard} data-testid="metric-card">
            <div className={styles.metricIcon} style={{ background: '#3b82f6' }}>
              <FiShoppingBag size={32} />
            </div>
            <div className={styles.metricInfo}>
              <p>Total de Pedidos</p>
              <h2>{stats.totalPedidos}</h2>
            </div>
          </div>

          <div className={styles.metricCard} data-testid="metric-card">
            <div className={styles.metricIcon} style={{ background: '#10b981' }}>
              <FiDollarSign size={32} />
            </div>
            <div className={styles.metricInfo}>
              <p>Total em Vendas</p>
              <h2>R$ {typeof stats.totalVendas === 'number' ? stats.totalVendas.toFixed(2) : parseFloat(stats.totalVendas || 0).toFixed(2)}</h2>
            </div>
          </div>

          <div className={styles.metricCard} data-testid="metric-card">
            <div className={styles.metricIcon} style={{ background: '#8b5cf6' }}>
              <FiPackage size={32} />
            </div>
            <div className={styles.metricInfo}>
              <p>Total de Produtos</p>
              <h2>{stats.totalProdutos}</h2>
            </div>
          </div>

          <div className={styles.metricCard} data-testid="metric-card">
            <div className={styles.metricIcon} style={{ background: '#ef4444' }}>
              <FiTrendingUp size={32} />
            </div>
            <div className={styles.metricInfo}>
              <p>Produtos sem Estoque</p>
              <h2>{stats.produtosEstoqueZero}</h2>
            </div>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailCard}>
            <h3>Status de Pedidos</h3>
            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Pendentes</span>
                <span className={styles.statusValue}>{stats.pedidosPendentes}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Entregues</span>
                <span className={styles.statusValue}>{stats.pedidosEntregues}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Devolucao</span>
                <span className={styles.statusValue}>{stats.pedidosDevolucao}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Devolvidos</span>
                <span className={styles.statusValue}>{stats.pedidosDevolvidos}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Taxa de Entrega</span>
                <span className={styles.statusValue}>
                  {stats.totalPedidos > 0
                    ? ((stats.pedidosEntregues / stats.totalPedidos) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>Resumo de Estoque</h3>
            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Produtos Ativos</span>
                <span className={styles.statusValue}>{stats.totalProdutos - stats.produtosEstoqueZero}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Sem Estoque</span>
                <span className={styles.statusValue}>{stats.produtosEstoqueZero}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Taxa de Disponibilidade</span>
                <span className={styles.statusValue}>
                  {stats.totalProdutos > 0
                    ? (((stats.totalProdutos - stats.produtosEstoqueZero) / stats.totalProdutos) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.infoBox}>
          <h3>ℹ️ Sobre os Relatórios</h3>
          <p>
            Os dados exibidos nesta página são calculados em tempo real com base nos pedidos e produtos cadastrados no
            sistema. Para relatórios mais detalhados e análises específicas, entre em contato com o suporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
}
