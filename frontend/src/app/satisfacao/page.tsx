'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import styles from './satisfacao.module.scss';

export default function SatisfacaoPage() {
  const [nota, setNota] = useState<number | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota) return;
    setEnviado(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Como foi sua compra?</h1>
        <p>Nos ajude com uma avaliacao rapida. Leva menos de 1 minuto.</p>

        {enviado ? (
          <div className={styles.thanks}>
            <span>Obrigado pelo feedback!</span>
            <Link href="/" className={styles.primary}>
              Voltar para Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className={styles.form}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`${styles.star} ${nota && value <= nota ? styles.active : ''}`}
                  onClick={() => setNota(value)}
                  aria-label={`Nota ${value}`}
                >
                  <Star size={22} />
                </button>
              ))}
            </div>
            <button type="submit" className={styles.primary} disabled={!nota}>
              Enviar avaliacao
            </button>
            <Link href="/" className={styles.secondary}>
              Pular e voltar para Home
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
