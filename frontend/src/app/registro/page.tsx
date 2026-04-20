/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IMaskInput } from 'react-imask';
import { useAuth } from '@/contexts/AuthContext';
import {
  NOME_MAX,
  EMAIL_MAX,
  CPF_MAX,
  TELEFONE_MAX,
  SENHA_MIN,
  SENHA_MAX,
  CPF_PATTERN,
  TELEFONE_PATTERN,
  registrationFormSchema,
  getValidationMessage,
} from '@/utils/registroValidation';
import styles from './registro.module.scss';

export default function RegistroPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    telefone: '',
    data_nascimento: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatchPhoneMask = (appended: string, dynamicMasked: any) => {
    const nextDigits = `${dynamicMasked.value}${appended}`.replace(/\D/g, '');
    return dynamicMasked.compiledMasks[nextDigits.length > 10 ? 1 : 0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = registrationFormSchema.safeParse({
      nome: formData.nome,
      email: formData.email,
      senha: formData.password,
      confirmPassword: formData.confirmPassword,
      cpf: formData.cpf,
      telefone: formData.telefone,
      data_nascimento: formData.data_nascimento,
    });

    if (!parsed.success) {
      setError(getValidationMessage(parsed.error));
      return;
    }

    setLoading(true);

    try {
      // Usar o método register do AuthContext
      await register({
        nome: parsed.data.nome,
        email: parsed.data.email,
        senha: parsed.data.senha,
        cpf: parsed.data.cpf,
        telefone: parsed.data.telefone,
        data_nascimento: parsed.data.data_nascimento
      });

      // Redirecionar para página inicial
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.registerBox}>
        <h1 className={styles.title}>Criar nova conta</h1>
        
        {error && (
          <div className={styles.error} role="alert" data-testid="register-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nome">Nome completo (máx. 255 caracteres)</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Seu nome completo"
              disabled={loading}
              maxLength={NOME_MAX}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail (máx. 255 caracteres)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
              disabled={loading}
              maxLength={EMAIL_MAX}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF (11 números)</label>
            <IMaskInput
              id="cpf"
              name="cpf"
              mask="000.000.000-00"
              value={formData.cpf}
              onAccept={(value) => setFormData((prev) => ({ ...prev, cpf: String(value) }))}
              placeholder="000.000.000-00"
              disabled={loading}
              required
              maxLength={CPF_MAX}
              pattern={CPF_PATTERN}
              title="Use apenas números, pontos, hífen e espaços"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone (10 a 11 números)</label>
            <IMaskInput
              id="telefone"
              name="telefone"
              mask={['(00) 0000-0000', '(00) 00000-0000']}
              dispatch={dispatchPhoneMask}
              value={formData.telefone}
              onAccept={(value) => setFormData((prev) => ({ ...prev, telefone: String(value) }))}
              placeholder="(00) 00000-0000"
              disabled={loading}
              required
              maxLength={TELEFONE_MAX}
              pattern={TELEFONE_PATTERN}
              title="Use apenas números, +, (), hífen e espaços"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="data_nascimento">Data de nascimento (obrigatória)</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Senha (mín. 6 e máx. 255 caracteres)</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              minLength={SENHA_MIN}
              maxLength={SENHA_MAX}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmar senha (mín. 6 e máx. 255 caracteres)</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Digite a senha novamente"
              disabled={loading}
              minLength={SENHA_MIN}
              maxLength={SENHA_MAX}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Já tem uma conta?{' '}
            <Link href="/perfil" className={styles.link}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
