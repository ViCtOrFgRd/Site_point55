/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instagram, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { newsletterService } from '@/services/api';
import styles from './Footer.module.scss';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!email || !email.includes('@')) {
      toast.error('Por favor, digite um e-mail válido');
      return;
    }
    
    setLoading(true);
    try {
      await newsletterService.subscribe(email);
      toast.success('✨ Inscrito com sucesso! Fique atento às nossas ofertas');
      setEmail(''); // Limpa o campo
    } catch (error: any) {
      toast.error(error.message || 'Erro ao se inscrever na newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className={styles.footer}>
      {/* Newsletter */}
      <div className={styles.newsletter}>
        <div className={styles.container}>
          <h3>OBTENHA DESCONTOS EXCLUSIVOS</h3>
          <p>Inscreva-se na nossa newsletter e receba ofertas especiais</p>
          <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Inscrevendo...' : 'Inscrever'}
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className={styles.links}>
        <div className={styles.container}>
          <div className={styles.linkGrid}>
            {/* Sua Conta */}
            <div className={styles.linkColumn}>
              <h4>Sua Conta</h4>
              <Link href="/perfil">Meu perfil</Link>
              <Link href="/pedidos">Minhas compras</Link>
              <Link href="/carrinho">Carrinho</Link>
              <Link href="/favoritos">Favoritos</Link>
            </div>

            {/* Institucional */}
            <div className={styles.linkColumn}>
              <h4>Institucional</h4>
              <Link href="/sobre">Sobre nós</Link>
              <Link href="/politica">Política de privacidade</Link>
              <Link href="/termos">Termos de uso</Link>
              <Link href="/faq">FAQ</Link>
            </div>

            {/* Atendimento */}
            <div className={styles.linkColumn}>
              <h4>Atendimento</h4>
              <a href="https://wa.me/5511993385579" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a href="mailto:atendimento.sacpoint@gmail.com">
                <Mail size={18} /> E-mail
              </a>
              <p>Seg-Sex: 9h às 19h</p>
            </div>

            {/* Ajuda */}
            <div className={styles.linkColumn}>
              <h4>Precisa de ajuda?</h4>
              <Link href="/frete">Política de Frete (prazos, valores e regiões atendidas)</Link>
              <Link href="/trocas">Trocas e Devoluções (regras, prazos e solicitação)</Link>
              <Link href="/rastreio">Rastrear Pedido (acompanhe o status da compra)</Link>
              <Link href="/tabela-medidas">Tabela de Medidas (escolha o tamanho ideal)</Link>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className={styles.social}>
            <h4>Siga-nos</h4>
            <div className={styles.socialIcons}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Instagram size={24} />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={24} />
              </a>
              <a href="https://wa.me/5511993385579" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Pagamentos e Selos */}
      <div className={styles.bottom}>
        <div className={styles.container}>
          <div className={styles.payments}>
            <p>Formas de pagamento</p>
            <div className={styles.paymentIcons}>
              <span>💳 Visa</span>
              <span>💳 Mastercard</span>
              <span>💳 Elo</span>
              <span>💰 PIX</span>
              <span>📄 Boleto</span>
            </div>
          </div>
          <div className={styles.copyright}>
            <p>© 2026 Point55. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
