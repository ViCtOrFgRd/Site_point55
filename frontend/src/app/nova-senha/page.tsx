/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import styles from './nova-senha.module.scss';

function NovaSenhaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setErro('Token não encontrado');
    }
  }, [searchParams]);

  const validarSenha = (senha: string): string[] => {
    const erros = [];
    if (senha.length < 8) erros.push('Mínimo de 8 caracteres');
    if (!/[A-Z]/.test(senha)) erros.push('Uma letra maiúscula');
    if (!/[a-z]/.test(senha)) erros.push('Uma letra minúscula');
    if (!/[0-9]/.test(senha)) erros.push('Um número');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) erros.push('Um caractere especial');
    return erros;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!token) {
      setErro('Token inválido');
      return;
    }

    if (!novaSenha || !confirmarSenha) {
      setErro('Preencha todos os campos');
      return;
    }

    const errosValidacao = validarSenha(novaSenha);
    if (errosValidacao.length > 0) {
      setErro(`Senha deve conter: ${errosValidacao.join(', ')}`);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/redefinir-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          novaSenha,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSucesso(true);
        setTimeout(() => {
          router.push('/perfil');
        }, 3000);
      } else {
        setErro(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className={styles.container}>
        <Breadcrumbs
          items={[
            { label: 'Início', href: '/' },
            { label: 'Nova Senha', href: '/nova-senha' },
          ]}
        />

        <div className={styles.content}>
          <div className={styles.sucessoCard}>
            <FiCheckCircle className={styles.sucessoIcon} />
            <h1>Senha Redefinida!</h1>
            <p>Sua senha foi alterada com sucesso.</p>
            <p>Redirecionando para a sua conta...</p>
            <Link href="/perfil" className={styles.loginLink}>
              Ir para Minha Conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Nova Senha', href: '/nova-senha' },
        ]}
      />

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <FiLock className={styles.icon} />
            <h1>Redefinir Senha</h1>
            <p>Digite sua nova senha abaixo</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="novaSenha">Nova Senha</label>
              <div className={styles.inputWrapper}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  id="novaSenha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
              <div className={styles.inputWrapper}>
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  id="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite novamente sua nova senha"
                  required
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarConfirmar ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className={styles.requisitos}>
              <p>A senha deve conter:</p>
              <ul>
                <li className={novaSenha.length >= 8 ? styles.valido : ''}>
                  Mínimo de 8 caracteres
                </li>
                <li className={/[A-Z]/.test(novaSenha) ? styles.valido : ''}>
                  Uma letra maiúscula
                </li>
                <li className={/[a-z]/.test(novaSenha) ? styles.valido : ''}>
                  Uma letra minúscula
                </li>
                <li className={/[0-9]/.test(novaSenha) ? styles.valido : ''}>
                  Um número
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(novaSenha) ? styles.valido : ''}>
                  Um caractere especial (!@#$%...)
                </li>
              </ul>
            </div>

            {erro && (
              <div className={styles.erro}>
                <FiAlertCircle />
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !token}
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>

          <div className={styles.footer}>
            <Link href="/perfil">Voltar para Minha Conta</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NovaSenhaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NovaSenhaContent />
    </Suspense>
  );
}
