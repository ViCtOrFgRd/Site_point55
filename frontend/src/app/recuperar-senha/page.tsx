/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiMail, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from './recuperar-senha.module.scss';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!email.trim()) {
      setErro('Por favor, insira seu e-mail');
      return;
    }

    if (!validarEmail(email)) {
      setErro('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);

    try {
      // Chamada para API do backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/recuperar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSucesso(true);
        setEmail('');
      } else {
        const data = await response.json();
        setErro(data.message || 'Erro ao enviar e-mail. Tente novamente.');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Recuperar Senha' }]} />

        <div className={styles.content}>
          <div className={styles.formContainer}>
            <div className={styles.header}>
              <FiLock className={styles.icon} />
              <h1>Recuperar Senha</h1>
              <p>
                Insira seu e-mail cadastrado e enviaremos um link para redefinir sua senha
              </p>
            </div>

            {!sucesso ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="email">E-mail</label>
                  <div className={styles.inputWrapper}>
                    <FiMail className={styles.inputIcon} />
                    <input
                      type="email"
                      id="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.input}
                      disabled={loading}
                    />
                  </div>
                </div>

                {erro && (
                  <div className={styles.erro}>
                    <FiAlertCircle />
                    <span>{erro}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </button>

                <div className={styles.links}>
                  <Link href="/perfil">Voltar para a Minha Conta</Link>
                  <Link href="/cadastro">Criar uma Conta</Link>
                </div>
              </form>
            ) : (
              <div className={styles.sucesso}>
                <FiCheckCircle className={styles.sucessoIcon} />
                <h2>E-mail Enviado com Sucesso!</h2>
                <p>
                  Enviamos um link de recuperação para <strong>{email}</strong>
                </p>
                <p className={styles.instrucoes}>
                  Verifique sua caixa de entrada e siga as instruções no e-mail para 
                  redefinir sua senha. O link é válido por <strong>1 hora</strong>.
                </p>
                <div className={styles.avisos}>
                  <p>
                    <strong>Não recebeu o e-mail?</strong>
                  </p>
                  <ul>
                    <li>Verifique sua caixa de spam ou lixo eletrônico</li>
                    <li>Aguarde alguns minutos e verifique novamente</li>
                    <li>Certifique-se de que digitou o e-mail corretamente</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSucesso(false);
                    setEmail('');
                  }}
                  className={styles.btnVoltar}
                >
                  Enviar Novamente
                </button>
                <Link href="/perfil" className={styles.linkLogin}>
                  Voltar para a Minha Conta
                </Link>
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <h2>Como Funciona</h2>
            
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Digite seu E-mail</h3>
                  <p>
                    Insira o e-mail cadastrado em sua conta Point55
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Receba o Link</h3>
                  <p>
                    Enviaremos automaticamente um e-mail com instruções e um link seguro 
                    para redefinir sua senha
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Crie uma Nova Senha</h3>
                  <p>
                    Clique no link do e-mail e escolha uma nova senha forte e segura
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3>Faça Login</h3>
                  <p>
                    Pronto! Use sua nova senha para acessar sua conta normalmente
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.security}>
              <h3>Segurança</h3>
              <ul>
                <li>O link de recuperação expira em 1 hora por segurança</li>
                <li>Apenas você pode acessar o link enviado para seu e-mail</li>
                <li>Sua senha é criptografada e nunca é enviada por e-mail</li>
                <li>Você receberá uma notificação quando a senha for alterada</li>
              </ul>
            </div>

            <div className={styles.tips}>
              <h3>Dicas para uma Senha Forte</h3>
              <ul>
                <li>Use pelo menos 8 caracteres</li>
                <li>Combine letras maiúsculas e minúsculas</li>
                <li>Inclua números e caracteres especiais</li>
                <li>Evite informações pessoais óbvias</li>
                <li>Não reutilize senhas de outros sites</li>
              </ul>
            </div>

            <div className={styles.help}>
              <h3>Precisa de Ajuda?</h3>
              <p>
                Se você não conseguir recuperar sua senha ou não tiver mais acesso ao 
                e-mail cadastrado, entre em contato conosco:
              </p>
              <div className={styles.contact}>
                <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
                <p><strong>E-mail:</strong> suporte@point55.com.br</p>
                <p><strong>Horário:</strong> Segunda a sexta, 9h às 18h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
