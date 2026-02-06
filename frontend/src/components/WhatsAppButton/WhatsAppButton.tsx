'use client';

import { MessageCircle } from 'lucide-react';
import styles from './WhatsAppButton.module.scss';

export default function WhatsAppButton() {
  const phoneNumber = '5511993385579';
  const message = 'Olá! Estou visualizando alguns produtos no site e gostaria de mais informações sobre os produtos.';

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      className={styles.whatsappButton}
      onClick={handleClick}
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={28} />
    </button>
  );
}
