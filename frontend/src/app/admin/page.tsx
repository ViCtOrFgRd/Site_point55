/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { FiBox, FiShoppingBag, FiStar, FiTag, FiUsers, FiBarChart2, FiAward, FiPercent, FiRefreshCcw, FiPackage, FiSettings, FiSliders, FiFileText } from 'react-icons/fi';
import styles from './admin.module.scss';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  const adminCards = [
    {
      title: 'Categorias',
      icon: <FiTag size={32} />,
      description: 'Gerenciar categorias e imagens',
      link: '/admin/categorias',
      color: '#16a34a',
    },
    {
      title: 'Produtos',
      icon: <FiBox size={32} />,
      description: 'Gerenciar catálogo de produtos',
      link: '/admin/produtos',
      color: '#3498db',
    },
    {
      title: 'Pedidos',
      icon: <FiShoppingBag size={32} />,
      description: 'Gerenciar pedidos e entregas',
      link: '/admin/pedidos',
      color: '#e74c3c',
    },
    {
      title: 'Devolucoes',
      icon: <FiRefreshCcw size={32} />,
      description: 'Gerenciar trocas e devolucoes',
      link: '/admin/devolucoes',
      color: '#e67e22',
    },
    {
      title: 'Banners',
      icon: <FiBox size={32} />,
      description: 'Gerenciar banners do site',
      link: '/admin/banners',
      color: '#9b59b6',
    },
    {
      title: 'Badges',
      icon: <FiAward size={32} />,
      description: 'Gerenciar badges de produtos',
      link: '/admin/badges',
      color: '#FF6B6B',
    },
    {
      title: 'Promoções',
      icon: <FiPercent size={32} />,
      description: 'Gerenciar promoções e campanhas',
      link: '/admin/promocoes',
      color: '#51CF66',
    },
    {
      title: 'Avaliações',
      icon: <FiStar size={32} />,
      description: 'Moderar avaliações e comentários',
      link: '/admin/avaliacoes',
      color: '#f39c12',
    },
    {
      title: 'Cupons',
      icon: <FiTag size={32} />,
      description: 'Gerenciar cupons de desconto',
      link: '/admin/cupons',
      color: '#9b59b6',
    },
    {
      title: 'Usuários',
      icon: <FiUsers size={32} />,
      description: 'Gerenciar usuários do sistema',
      link: '/admin/usuarios',
      color: '#1abc9c',
    },
    {
      title: 'Catálogo de Caixas',
      icon: <FiPackage size={32} />,
      description: 'Gerenciar caixas P/M/G de frete',
      link: '/admin/caixas-catalogo',
      color: '#8b5cf6',
    },
    {
      title: 'Config Fallback',
      icon: <FiSettings size={32} />,
      description: 'Config padrão de embalagem',
      link: '/admin/config-fallback',
      color: '#06b6d4',
    },
    {
      title: 'Config por Tipo',
      icon: <FiSliders size={32} />,
      description: 'Config embalagem por tipo',
      link: '/admin/config-tipo',
      color: '#f59e0b',
    },
    {
      title: 'Conteúdo Institucional',
      icon: <FiFileText size={32} />,
      description: 'Editar páginas institucionais',
      link: '/admin/conteudo-institucional',
      color: '#0ea5e9',
    },
    {
      title: 'Relatórios',
      icon: <FiBarChart2 size={32} />,
      description: 'Visualizar estatísticas e relatórios',
      link: '/admin/relatorios',
      color: '#34495e',
    },
  ];

  return (
    <div className={styles.adminPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Painel Administrativo</h1>
          <p>Bem-vindo, {user.nome}</p>
        </div>

        <div className={styles.cardsGrid} data-testid="admin-dashboard">
          {adminCards.map((card, index) => (
            <Link
              href={card.link}
              key={index}
              className={styles.adminCard}
              style={{ '--card-color': card.color } as any}
              data-testid="metric-card"
            >
              <div className={styles.cardIcon}>{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
