/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Smile, ArrowRight, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { orderService } from '@/services/api';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { usePixTimer } from '@/hooks/usePixTimer';
import { useNotification } from '@/hooks/useNotification';
import styles from './sucesso.module.scss';

function CheckoutSucessoContent() {
  const searchParams = useSearchParams();
  const pedidoParam = searchParams.get('pedido');
  const codigoRetiradaParam = searchParams.get('codigo');
  const pedidoId = pedidoParam && /^\d+$/.test(pedidoParam) ? Number(pedidoParam) : null;
  const [pedido, setPedido] = useState<any>(null);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const { success: notifySuccess } = useNotification();

  const isPedidoPagoPorStatus = ['pago', 'processando', 'pronto_para_retirada', 'retirado'].includes(
    String(pedido?.status || '').toLowerCase()
  );
  const isAsaasPago = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(
    String(pedido?.asaas_payment_status || '').toUpperCase()
  );
  const isPago = isPedidoPagoPorStatus || isAsaasPago;

  // Status em tempo real via webhook + socket
  usePaymentStatus({
    pedidoId,
    enabled: pedidoId !== null && pedido?.status !== 'pago',
    onPaymentConfirmed: () => {
      notifySuccess('🎉 Pagamento confirmado! Seu pedido está sendo processado.');
      // Recarregar dados do pedido
      if (pedidoId) {
        orderService.getById(pedidoId).then((response) => {
          if (response.success && response.data) {
            setPedido(response.data as any);
          }
        });
      }
    },
  });

  // Timer de expiração do PIX (15 minutos)
  const pixTimer = usePixTimer({
    expirationMinutes: 15,
    createdAt: pedido?.data_pedido,
    expiresAt: pedido?.asaas_due_date,
    onExpire: () => {
      if (isPago) {
        return;
      }
    },
  });

  useEffect(() => {
    if (!pedidoId) {
      return;
    }

    orderService
      .getById(pedidoId)
      .then((response) => {
        if (response.success && response.data) {
          setPedido(response.data as any);
        }
      })
      .catch(() => {
        setPedido(null);
      });
  }, [pedidoId]);

  const handleRefreshQrCode = async () => {
    if (!pedidoId || refreshingQr) return;

    setRefreshingQr(true);
    try {
      const response = await orderService.refreshPix(pedidoId);
      if (response.success && response.data) {
        setPedido(response.data as any);
        notifySuccess('QR Code atualizado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao atualizar QR Code:', error);
    } finally {
      setRefreshingQr(false);
    }
  };

  const getPixImageSrc = (value?: string | null) => {
    if (!value) return null;
    if (value.startsWith('data:image')) return value;
    if (/^[A-Za-z0-9+/=]+$/.test(value)) {
      return `data:image/png;base64,${value}`;
    }
    return value;
  };

  const copyToClipboard = (value?: string | null) => {
    if (!value || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(value);
  };

  const shouldShowPayment = pedido && ['pix', 'boleto', 'cartao'].includes(pedido.forma_pagamento);
  const pixQr = shouldShowPayment ? getPixImageSrc(pedido?.asaas_pix_qr_code) : null;
  const pixPayload = shouldShowPayment ? pedido?.asaas_pix_payload : null;
  const boletoUrl = shouldShowPayment ? pedido?.asaas_boleto_url || pedido?.asaas_invoice_url : null;
  const cartaoUrl = shouldShowPayment ? pedido?.asaas_invoice_url : null;
  const codigoRetirada = pedido?.retirada_codigo || codigoRetiradaParam;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          {isPago ? (
            <CheckCircle size={64} className={styles.successIcon} />
          ) : (
            <Clock size={64} className={styles.pendingIcon} />
          )}
        </div>
        
        <h1>{isPago ? 'Pagamento Confirmado!' : 'Compra finalizada com sucesso'}</h1>
        
        <p>
          {isPago 
            ? 'Seu pagamento foi confirmado e o pedido está sendo processado.'
            : 'Parabéns! Seu pedido foi recebido e está aguardando pagamento.'}
        </p>
        
        {pedidoId && (
          <div className={styles.orderInfo}>
            <span>Pedido #{pedidoId}</span>
            <Link className={styles.orderLink} href={`/pedidos/${pedidoId}`}>
              Ver detalhes <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {codigoRetirada && (
          <div className={styles.orderInfo}>
            <span><strong>Código de retirada:</strong> {codigoRetirada}</span>
          </div>
        )}

        {/* Status em tempo real */}
        {!isPago && (
          <div className={styles.statusBadge}>
            <div className={styles.statusDot}></div>
            Aguardando confirmação do pagamento...
          </div>
        )}

        {shouldShowPayment && !isPago && (
          <div className={styles.paymentBox}>
            <h2>Pagamento</h2>

            {pedido?.forma_pagamento === 'pix' && (
              <div className={styles.pixBox}>
                {/* Timer de expiração */}
                <div className={styles.pixTimer}>
                  {pixTimer.isExpired ? (
                    <div className={styles.expired}>
                      <AlertCircle size={20} />
                      <span>QR Code expirado</span>
                      <button onClick={handleRefreshQrCode} disabled={refreshingQr}>
                        <RefreshCw size={16} className={refreshingQr ? styles.spinning : ''} />
                        {refreshingQr ? 'Atualizando...' : 'Gerar novo QR Code'}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.timerActive}>
                      <Clock size={16} />
                      <span>Expira em: {pixTimer.formattedTime}</span>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progress} 
                          style={{ width: `${pixTimer.percentRemaining}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {pixQr && !pixTimer.isExpired && (
                  <img
                    className={styles.pixQr}
                    src={pixQr}
                    alt="QR Code PIX"
                  />
                )}
                
                {pixPayload && !pixTimer.isExpired && (
                  <div className={styles.pixPayload}>
                    <span>Código copia e cola</span>
                    <button onClick={() => copyToClipboard(pixPayload)}>Copiar</button>
                  </div>
                )}
                
                {!pixQr && !pixPayload && !pixTimer.isExpired && (
                  <p>QR Code indisponível no momento.</p>
                )}

                <button 
                  className={styles.refreshButton}
                  onClick={handleRefreshQrCode}
                  disabled={refreshingQr}
                >
                  <RefreshCw size={16} className={refreshingQr ? styles.spinning : ''} />
                  {refreshingQr ? 'Atualizando...' : 'Atualizar QR Code'}
                </button>
              </div>
            )}

            {pedido?.forma_pagamento === 'boleto' && boletoUrl && (
              <div className={styles.paymentLink}>
                <a href={boletoUrl} target="_blank" rel="noreferrer">
                  Abrir boleto
                </a>
              </div>
            )}

            {pedido?.forma_pagamento === 'cartao' && cartaoUrl && (
              <div className={styles.paymentLink}>
                <a href={cartaoUrl} target="_blank" rel="noreferrer">
                  Pagar com cartão
                </a>
              </div>
            )}
          </div>
        )}

        {isPago && (
          <div className={styles.successMessage}>
            ✅ Pagamento confirmado com sucesso!
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

export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.card}>Carregando pedido...</div></div>}>
      <CheckoutSucessoContent />
    </Suspense>
  );
}
