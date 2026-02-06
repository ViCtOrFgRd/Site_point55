'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authService, addressService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEdit2, FiSave, FiX, FiLogIn, FiPlus } from 'react-icons/fi';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import AddressForm from '@/components/AddressForm/AddressForm';
import AddressList from '@/components/AddressList/AddressList';
import styles from './perfil.module.scss';

export default function PerfilPage() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'endereco' | 'senha' | 'login'>('login');
  const [isSaving, setIsSaving] = useState(false);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  
  // Estados de Login/Registro
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', senha: '' });
  const [registerData, setRegisterData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cpf: '',
  });

  // Estados de Perfil
  const [profileData, setProfileData] = useState({
    nome: user?.nome || '',
    telefone: user?.telefone || '',
    cpf: user?.cpf || '',
    data_nascimento: user?.data_nascimento || '',
  });

  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  useEffect(() => {
    if (user) {
      setActiveTab('dados');
      setProfileData({
        nome: user.nome || '',
        telefone: user.telefone || '',
        cpf: user.cpf || '',
        data_nascimento: user.data_nascimento || '',
      });
      carregarEnderecos();
    }
  }, [user]);

  const carregarEnderecos = async () => {
    try {
      const response = await addressService.getAll();
      if (response.success && response.data) {
        setEnderecos(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await login(loginData.email, loginData.senha);
      toast.success('Login realizado com sucesso!');
      setLoginData({ email: '', senha: '' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await authService.register(registerData);
      toast.success('Cadastro realizado com sucesso!');
      
      // Se o backend retornar um token, salvar e fazer login
      if (response.token) {
        localStorage.setItem('token', response.token);
        window.location.reload(); // Recarregar para atualizar contexto
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer registro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      toast.warning('As senhas não coincidem');
      return;
    }

    if (passwordData.novaSenha.length < 6) {
      toast.warning('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(
        passwordData.senhaAtual,
        passwordData.novaSenha
      );
      
      toast.success('Senha alterada com sucesso!');
      setPasswordData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  // Funções de CRUD de Endereços
  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) {
      return;
    }

    try {
      await addressService.delete(id);
      toast.success('Endereço excluído com sucesso!');
      carregarEnderecos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir endereço');
    }
  };

  const handleSetPrincipal = async (id: number) => {
    try {
      await addressService.setPrincipal(id);
      toast.success('Endereço principal atualizado!');
      carregarEnderecos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao definir endereço principal');
    }
  };

  const handleSubmitAddress = async (data: any) => {
    try {
      if (editingAddress) {
        await addressService.update(editingAddress.id, data);
        toast.success('Endereço atualizado com sucesso!');
      } else {
        await addressService.create(data);
        toast.success('Endereço adicionado com sucesso!');
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      carregarEnderecos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar endereço');
      throw error; // Propagar erro para o formulário
    }
  };

  // Se não está autenticado, mostrar tela de login/registro
  if (!user && !authLoading) {
    return (
      <div className={styles.perfilPage}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Minha Conta' }]} />

          <div className={styles.authContainer}>
            <div className={styles.authCard}>
              <div className={styles.authTabs}>
                <button
                  className={isLogin ? styles.active : ''}
                  onClick={() => setIsLogin(true)}
                >
                  Entrar
                </button>
                <button
                  className={!isLogin ? styles.active : ''}
                  onClick={() => setIsLogin(false)}
                >
                  Cadastrar
                </button>
              </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className={styles.authForm}>
                  <h2>Bem-vindo de volta!</h2>
                  <p>Entre com sua conta para continuar</p>

                  <div className={styles.formGroup}>
                    <label><FiMail /> E-mail</label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiLock /> Senha</label>
                    <input
                      type="password"
                      value={loginData.senha}
                      onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button type="submit" disabled={isSaving} className={styles.submitButton}>
                    {isSaving ? 'Entrando...' : 'Entrar'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className={styles.authForm}>
                  <h2>Crie sua conta</h2>
                  <p>Preencha seus dados para começar</p>

                  <div className={styles.formGroup}>
                    <label><FiUser /> Nome Completo</label>
                    <input
                      type="text"
                      value={registerData.nome}
                      onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiMail /> E-mail</label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiPhone /> Telefone</label>
                    <input
                      type="tel"
                      value={registerData.telefone}
                      onChange={(e) => setRegisterData({ ...registerData, telefone: e.target.value })}
                      placeholder="(11) 98765-4321"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiLock /> Senha</label>
                    <input
                      type="password"
                      value={registerData.senha}
                      onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>

                  <button type="submit" disabled={isSaving} className={styles.submitButton}>
                    {isSaving ? 'Cadastrando...' : 'Cadastrar'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.perfilPage}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Meu Perfil', href: '/perfil' }]} />

        <div className={styles.perfilHeader}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              <FiUser size={48} />
            </div>
            <div>
              <h1>{user?.nome}</h1>
              <p>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className={styles.logoutButton}>
            Sair
          </button>
        </div>

        <div className={styles.perfilContent}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'dados' ? styles.active : ''}`}
              onClick={() => setActiveTab('dados')}
            >
              <FiUser /> Dados Pessoais
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'endereco' ? styles.active : ''}`}
              onClick={() => setActiveTab('endereco')}
            >
              <FiMapPin /> Endereços
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'senha' ? styles.active : ''}`}
              onClick={() => setActiveTab('senha')}
            >
              <FiLock /> Alterar Senha
            </button>
          </div>

          {/* Dados Pessoais */}
          {activeTab === 'dados' && (
            <div className={styles.tabContent}>
              <div className={styles.contentHeader}>
                <h2>Dados Pessoais</h2>
                {!isEditing ? (
                  <button 
                    className={styles.editButton}
                    onClick={() => setIsEditing(true)}
                  >
                    <FiEdit2 /> Editar
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => setIsEditing(false)}
                    >
                      <FiX /> Cancelar
                    </button>
                    <button 
                      className={styles.saveButton}
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      <FiSave /> {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    value={profileData.nome}
                    onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={profileData.telefone}
                    onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>CPF</label>
                  <input
                    type="text"
                    value={profileData.cpf}
                    disabled
                    className={styles.disabledInput}
                  />
                  <small>O CPF não pode ser alterado</small>
                </div>
              </div>
            </div>
          )}

          {/* Endereços */}
          {activeTab === 'endereco' && (
            <div className={styles.tabContent}>
              <div className={styles.contentHeader}>
                <h2>Meus Endereços</h2>
                <button 
                  className={styles.addButton}
                  onClick={handleAddAddress}
                >
                  <FiPlus /> Novo Endereço
                </button>
              </div>

              <AddressList
                addresses={enderecos}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetPrincipal={handleSetPrincipal}
              />

              {showAddressForm && (
                <AddressForm
                  address={editingAddress}
                  onSubmit={handleSubmitAddress}
                  onCancel={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                  }}
                  isEdit={!!editingAddress}
                />
              )}
            </div>
          )}

          {/* Alterar Senha */}
          {activeTab === 'senha' && (
            <div className={styles.tabContent}>
              <div className={styles.contentHeader}>
                <h2>Alterar Senha</h2>
              </div>

              <form onSubmit={handleChangePassword} className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label>Senha Atual</label>
                  <input
                    type="password"
                    value={passwordData.senhaAtual}
                    onChange={(e) => setPasswordData({ ...passwordData, senhaAtual: e.target.value })}
                    required
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nova Senha</label>
                  <input
                    type="password"
                    value={passwordData.novaSenha}
                    onChange={(e) => setPasswordData({ ...passwordData, novaSenha: e.target.value })}
                    required
                    placeholder="Digite sua nova senha"
                    minLength={6}
                  />
                  <small>A senha deve ter pelo menos 6 caracteres</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordData.confirmarSenha}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmarSenha: e.target.value })}
                    required
                    placeholder="Confirme sua nova senha"
                    minLength={6}
                  />
                </div>

                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
