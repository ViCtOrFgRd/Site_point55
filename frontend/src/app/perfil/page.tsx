/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authService, addressService } from '@/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IMaskInput } from 'react-imask';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEdit2, FiSave, FiX, FiLogIn, FiPlus } from 'react-icons/fi';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import AddressForm from '@/components/AddressForm/AddressForm';
import AddressList from '@/components/AddressList/AddressList';
import {
  NOME_MAX,
  EMAIL_MAX,
  CPF_MAX,
  TELEFONE_MAX,
  SENHA_MIN,
  SENHA_MAX,
  CPF_PATTERN,
  TELEFONE_PATTERN,
  registrationRequestSchema,
  getValidationMessage,
  isValidCpf,
  normalizeCpf,
} from '@/utils/registroValidation';
import { confirmAction } from '@/utils/alerts';
import styles from './perfil.module.scss';

export default function PerfilPage() {
  const { user, login, logout, updateUser, loading: authLoading } = useAuth();
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
    data_nascimento: '',
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
  const [cpfData, setCpfData] = useState({
    novoCpf: '',
    codigo: '',
    expiraEm: '',
  });
  const [cpfNow, setCpfNow] = useState(Date.now());

  const formatCpf = (cpfValue?: string) => {
    const digits = String(cpfValue || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const dispatchPhoneMask = (appended: string, dynamicMasked: any) => {
    const nextDigits = `${dynamicMasked.value}${appended}`.replace(/\D/g, '');
    return dynamicMasked.compiledMasks[nextDigits.length > 10 ? 1 : 0];
  };

  const cpfAtualValido = isValidCpf(profileData.cpf);
  const cpfPodeEditar = Boolean(user) && !cpfAtualValido;
  const cpfCodePending = Boolean(cpfData.expiraEm) && new Date(cpfData.expiraEm).getTime() > cpfNow;
  const cpfCountdown = cpfCodePending
    ? Math.max(0, Math.ceil((new Date(cpfData.expiraEm).getTime() - cpfNow) / 1000))
    : 0;
  const cpfCountdownLabel = `${String(Math.floor(cpfCountdown / 60)).padStart(2, '0')}:${String(cpfCountdown % 60).padStart(2, '0')}`;

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

      const carregarPerfilCompleto = async () => {
        try {
          const response = await authService.getProfile();
          if (response.success && response.data) {
            const perfil = response.data as any;
            setProfileData((prev) => ({
              ...prev,
              nome: perfil.nome || prev.nome,
              telefone: perfil.telefone || prev.telefone,
              cpf: perfil.cpf || prev.cpf,
              data_nascimento: perfil.data_nascimento || prev.data_nascimento,
            }));
          }
        } catch (error) {
          console.error('Erro ao carregar perfil completo na página de perfil:', error);
        }
      };

      carregarPerfilCompleto();
    }
  }, [user]);

  useEffect(() => {
    if (!cpfCodePending) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCpfNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cpfCodePending]);

  const carregarEnderecos = async () => {
    try {
      const response = await addressService.getAll();
      if (response.success && response.data) {
        setEnderecos(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      const message = (error as any)?.message || 'Erro ao carregar endereços';
      toast.error(message);
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

    const parsed = registrationRequestSchema.safeParse(registerData);
    if (!parsed.success) {
      toast.warning(getValidationMessage(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      const response = await authService.register(parsed.data);
      toast.success('Cadastro realizado com sucesso!');
      
      // Se o backend retornar um token, salvar e fazer login
      const responseData: any = response?.data;
      const token = responseData?.token;
      if (token) {
        localStorage.setItem('token', token);
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
      if (response.success && response.data) {
        updateUser(response.data as any);
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestCpfCode = async () => {
    const cpfNormalizado = normalizeCpf(cpfData.novoCpf || profileData.cpf);

    if (!isValidCpf(cpfNormalizado)) {
      toast.warning('Informe um CPF válido para solicitar o código');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authService.requestCpfChangeCode(cpfNormalizado);
      if (response.success) {
        const responseData = response.data as any;
        setCpfData({
          novoCpf: formatCpf(cpfNormalizado),
          codigo: '',
          expiraEm: responseData?.expira_em || '',
        });
        setCpfNow(Date.now());
        toast.success('Código enviado para o seu e-mail. Ele expira em 5 minutos.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao solicitar código de confirmação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCpf = async () => {
    const cpfNormalizado = normalizeCpf(cpfData.novoCpf);
    const codigo = cpfData.codigo.trim();

    if (!isValidCpf(cpfNormalizado)) {
      toast.warning('Informe o mesmo CPF válido usado na solicitação');
      return;
    }

    if (!codigo) {
      toast.warning('Informe o código recebido por e-mail');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authService.confirmCpfChange(cpfNormalizado, codigo);
      if (response.success && response.data) {
        const usuarioAtualizado = response.data as any;
        updateUser(usuarioAtualizado);
        setProfileData((prev) => ({
          ...prev,
          nome: usuarioAtualizado.nome || prev.nome,
          telefone: usuarioAtualizado.telefone || prev.telefone,
          cpf: usuarioAtualizado.cpf || prev.cpf,
          data_nascimento: usuarioAtualizado.data_nascimento || prev.data_nascimento,
        }));
        setCpfData({ novoCpf: '', codigo: '', expiraEm: '' });
        setCpfNow(Date.now());
        toast.success('CPF atualizado com sucesso!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar alteração de CPF');
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
    const confirmed = await confirmAction(
      'Excluir endereço',
      'Tem certeza que deseja excluir este endereço?',
      'Excluir'
    );
    if (!confirmed) {
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

                    <div className={styles.authAuxiliary}>
                      <Link href="/recuperar-senha" className={styles.forgotPasswordLink}>
                        Esqueci minha senha
                      </Link>
                    </div>
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
                    <label><FiUser /> Nome Completo </label>
                    <input
                      type="text"
                      value={registerData.nome}
                      onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                      maxLength={NOME_MAX}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiMail /> E-mail </label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                      maxLength={EMAIL_MAX}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiPhone /> Telefone </label>
                    <IMaskInput
                      value={registerData.telefone}
                      mask={['(00) 0000-0000', '(00) 00000-0000']}
                      dispatch={dispatchPhoneMask}
                      onAccept={(value) => setRegisterData({ ...registerData, telefone: String(value) })}
                      placeholder="(00) 00000-0000"
                      required
                      maxLength={TELEFONE_MAX}
                      pattern={TELEFONE_PATTERN}
                      title="Use apenas números, +, (), hífen e espaços"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>CPF </label>
                    <IMaskInput
                      value={registerData.cpf}
                      mask="000.000.000-00"
                      onAccept={(value) => setRegisterData({ ...registerData, cpf: String(value) })}
                      placeholder="000.000.000-00"
                      required
                      maxLength={CPF_MAX}
                      pattern={CPF_PATTERN}
                      title="Use apenas números, pontos, hífen e espaços"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Data de Nascimento</label>
                    <input
                      type="date"
                      value={registerData.data_nascimento}
                      onChange={(e) => setRegisterData({ ...registerData, data_nascimento: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><FiLock /> Senha </label>
                    <input
                      type="password"
                      value={registerData.senha}
                      onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={SENHA_MIN}
                      maxLength={SENHA_MAX}
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
          <div className={styles.perfilActions}>
            <button
              onClick={() => router.push('/pedidos')}
              className={styles.ordersButton}
            >
              Meus pedidos
            </button>
            <button onClick={logout} className={styles.logoutButton}>
              Sair
            </button>
          </div>
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
                  <IMaskInput
                    mask={['(00) 0000-0000', '(00) 00000-0000']}
                    dispatch={dispatchPhoneMask}
                    value={profileData.telefone}
                    onAccept={(value) => setProfileData({ ...profileData, telefone: String(value) })}
                    disabled={!isEditing}
                    placeholder="(00) 00000-0000"
                    maxLength={TELEFONE_MAX}
                    pattern={TELEFONE_PATTERN}
                    title="Use apenas números, +, (), hífen e espaços"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>CPF</label>
                  {cpfPodeEditar ? (
                    <>
                      <IMaskInput
                        mask="000.000.000-00"
                        value={cpfData.novoCpf || formatCpf(profileData.cpf)}
                        onAccept={(value) => setCpfData((prev) => ({ ...prev, novoCpf: String(value) }))}
                        disabled={isSaving}
                        placeholder="000.000.000-00"
                        maxLength={CPF_MAX}
                        pattern={CPF_PATTERN}
                        title="Use apenas números, pontos, hífen e espaços"
                      />
                      <small>
                        Seu CPF atual está ausente ou inválido. Corrija o número e confirme com o código enviado ao seu e-mail.
                      </small>
                      <div className={styles.cpfActions}>
                        <button
                          type="button"
                          className={styles.saveButton}
                          onClick={handleRequestCpfCode}
                          disabled={isSaving}
                        >
                          {cpfCodePending ? 'Reenviar código' : 'Enviar código'}
                        </button>
                      </div>

                      {cpfCodePending && (
                        <div className={styles.cpfConfirmationBox}>
                          <div className={styles.formGroup}>
                            <label>Código de confirmação</label>
                            <input
                              type="text"
                              value={cpfData.codigo}
                              onChange={(e) => setCpfData((prev) => ({
                                ...prev,
                                codigo: e.target.value.replace(/\D/g, '').slice(0, 6),
                              }))}
                              placeholder="Digite os 6 números"
                              disabled={isSaving}
                              inputMode="numeric"
                            />
                          </div>
                          <small>Tempo restante para confirmar: {cpfCountdownLabel}</small>
                          <div className={styles.cpfActions}>
                            <button
                              type="button"
                              className={styles.saveButton}
                              onClick={handleConfirmCpf}
                              disabled={isSaving}
                            >
                              Confirmar CPF
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formatCpf(profileData.cpf)}
                        disabled
                        className={styles.disabledInput}
                        maxLength={CPF_MAX}
                      />
                      <small>O CPF já está válido e não pode ser alterado por este fluxo</small>
                    </>
                  )}
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
