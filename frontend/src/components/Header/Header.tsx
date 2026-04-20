/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSettings, FiLogOut, FiPackage } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from '@/components/SearchBar/SearchBar';
import NotificationsBell from '@/components/NotificationsBell/NotificationsBell';
import styles from './Header.module.scss';

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/perfil');
  };

  return (
    <>
      {/* Header Principal */}
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <img src="/logan/logan2.jpeg" alt="Point55" className={styles.logoIcon} />
            <span className={styles.logoText}>Point55</span>
          </Link>

          {/* Menu Desktop */}
          <nav className={styles.navDesktop}>
            <Link href="/">Home</Link>
            <Link href="/produtos">Produtos</Link>
            <Link href="/produtos?categoria=roupas-femininas">Feminino</Link>
            <Link href="/produtos?categoria=roupas-masculinas">Masculino</Link>
            <Link href="/produtos?categoria=acessorios">Acessórios</Link>
            <Link href="/promocoes">Promoções</Link>
          </nav>

          {/* Barra de Busca */}
          <div className={styles.searchBarWrapper}>
            <SearchBar limit={8} orderBy="vendas" direction="DESC" />
          </div>

          {/* Ações */}
          <div className={styles.actions}>
            {user && <NotificationsBell />}
            {user && user.is_admin && (
              <Link href="/admin" className={styles.iconButton} title="Painel Admin">
                <FiSettings size={22} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => router.push('/perfil')}
              className={styles.iconButton}
              title="Perfil"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <FiUser size={22} />
            </button>
            <Link href="/pedidos" className={styles.iconButton} title="Meus pedidos">
              <FiPackage size={22} />
            </Link>
            <Link href="/carrinho" className={styles.iconButton} title="Carrinho">
              <FiShoppingCart size={22} />
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount}</span>
              )}
            </Link>
            {user && (
              <button 
                onClick={handleLogout} 
                className={styles.iconButton} 
                title="Sair"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <FiLogOut size={22} />
              </button>
            )}
          </div>

          {/* Menu Mobile Toggle */}
          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Menu Mobile */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileSearch}>
              <SearchBar limit={8} orderBy="vendas" direction="DESC" />
            </div>
            <nav>
              <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/produtos" onClick={() => setMenuOpen(false)}>Produtos</Link>
              <Link href="/produtos?categoria=roupas-femininas" onClick={() => setMenuOpen(false)}>Feminino</Link>
              <Link href="/produtos?categoria=roupas-masculinas" onClick={() => setMenuOpen(false)}>Masculino</Link>
              <Link href="/produtos?categoria=acessorios" onClick={() => setMenuOpen(false)}>Acessórios</Link>
              <Link href="/promocoes" onClick={() => setMenuOpen(false)}>Promoções</Link>
              {user && user.is_admin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>
                  <FiSettings /> Admin
                </Link>
              )}
              <Link href="/pedidos" onClick={() => setMenuOpen(false)}>
                <FiPackage /> Meus pedidos
              </Link>
              {user && (
                <button 
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', padding: '10px 0' }}
                >
                  <FiLogOut /> Sair
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
