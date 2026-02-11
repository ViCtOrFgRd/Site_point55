'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Smile, ArrowRight } from 'lucide-react';
import styles from './sucesso.module.scss';

export default function CheckoutSucessoPage() {
  const searchParams = useSearchParams();
  const pedidoParam = searchParams.get('pedido');
  const pedidoId = pedidoParam && /^\d+$/.test(pedidoParam) ? pedidoParam : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <CheckCircle size={64} />
        </div>
        <h1>Compra finalizada com sucesso</h1>
        <p>
          Parabens! Seu pedido foi recebido e esta em processamento.
        </p>
        {pedidoId && (
          <div className={styles.orderInfo}>
            <span>Pedido #{pedidoId}</span>
            <Link className={styles.orderLink} href={`/pedidos/${pedidoId}`}>
              Ver detalhes <ArrowRight size={16} />
            </Link>
          </div>
        )}
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            Voltar para Home
          </Link>
          <Link className={styles.secondary} href="/satisfacao">
            Avaliar sua compra <Smile size={16} />
          </Link>
        </div>
        <p className={styles.note}>
          Obrigado por comprar na Point55. Qualquer duvida, fale com nosso suporte.
        </p>
      </div>
    </div>
  );
}
