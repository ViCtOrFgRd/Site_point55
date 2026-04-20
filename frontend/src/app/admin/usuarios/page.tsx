/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiUsers, FiShield, FiSearch, FiTrash2 } from 'react-icons/fi';
import { confirmAction } from '@/utils/alerts';
import styles from './usuarios.module.scss';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  is_admin: boolean;
  data_criacao: string;
}

export default function AdminUsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarUsuarios();
    }
  }, [user]);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll();
      if (response.success) {
        setUsuarios(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    const confirmed = await confirmAction(
      currentStatus ? 'Remover privilégios de admin' : 'Conceder privilégios de admin',
      `Tem certeza que deseja ${currentStatus ? 'remover' : 'conceder'} privilégios de admin?`,
      'Confirmar'
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await userService.toggleAdmin(userId);
      if (response.success) {
        toast.success('Permissões atualizadas com sucesso!');
        carregarUsuarios();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar permissões');
    }
  };

  const handleDeleteUser = async (usuario: Usuario) => {
    const confirmed = await confirmAction(
      'Excluir usuário',
      `Tem certeza que deseja excluir o usuário ${usuario.nome}? Esta ação não pode ser desfeita.`,
      'Excluir'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await userService.delete(usuario.id);
      if (response.success) {
        toast.success('Usuário excluído com sucesso!');
        carregarUsuarios();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário');
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      !busca ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  const totalAdmins = usuarios.filter((u) => u.is_admin).length;
  const totalUsuarios = usuarios.length;

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
    <div className={styles.adminUsuarios}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Gerenciar Usuários</h1>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <FiUsers size={24} />
            <div>
              <p>Total de Usuários</p>
              <h3>{totalUsuarios}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiShield size={24} />
            <div>
              <p>Administradores</p>
              <h3>{totalAdmins}</h3>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table} data-testid="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Permissão</th>
                <th>Data de Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td>#{usuario.id}</td>
                  <td>
                    <div className={styles.userInfo}>
                      <span>{usuario.nome}</span>
                    </div>
                  </td>
                  <td>{usuario.email}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        usuario.is_admin ? styles.badgeAdmin : styles.badgeUser
                      }`}
                    >
                      {usuario.is_admin ? (
                        <>
                          <FiShield /> Admin
                        </>
                      ) : (
                        <>
                          <FiUsers /> Usuário
                        </>
                      )}
                    </span>
                  </td>
                  <td>{new Date(usuario.data_criacao).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleToggleAdmin(usuario.id, usuario.is_admin)}
                        className={usuario.is_admin ? styles.btnRemoveAdmin : styles.btnMakeAdmin}
                        title={usuario.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                        disabled={usuario.id === user.id}
                      >
                        <FiShield />
                        {usuario.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>

                      {!usuario.is_admin && usuario.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(usuario)}
                          className={styles.btnDeleteUser}
                          title="Excluir usuário"
                        >
                          <FiTrash2 />
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuariosFiltrados.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
