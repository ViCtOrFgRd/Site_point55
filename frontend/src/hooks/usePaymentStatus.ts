/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { orderService } from '@/services/api';
import { Notificacao } from '@/types';

interface UsePaymentStatusOptions {
  pedidoId: number | null;
  enabled?: boolean;
  interval?: number;
  onStatusChange?: (status: string) => void;
  onPaymentConfirmed?: () => void;
}

interface PaymentStatus {
  status: string;
  asaas_payment_status: string | null;
  data_atualizacao: string;
  loading: boolean;
  error: string | null;
}

const STATUS_PEDIDO_CONFIRMADO = new Set([
  'pago',
  'processando',
  'pronto_para_retirada',
  'retirado',
]);

const STATUS_ASAAS_CONFIRMADO = new Set([
  'CONFIRMED',
  'RECEIVED',
  'RECEIVED_IN_CASH',
]);

const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4);
  }
  if (apiUrl) {
    return apiUrl;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const isPagamentoConfirmado = (statusPedido: string, statusAsaas: string | null) => {
  const pedidoConfirmado = STATUS_PEDIDO_CONFIRMADO.has(String(statusPedido || '').toLowerCase());
  const asaasConfirmado = STATUS_ASAAS_CONFIRMADO.has(String(statusAsaas || '').toUpperCase());
  return pedidoConfirmado || asaasConfirmado;
};

/**
 * Hook para acompanhar status de pagamento por evento (webhook + socket)
 * Sem polling contínuo de requisições GET
 */
export function usePaymentStatus({
  pedidoId,
  enabled = true,
  interval = 8000,
  onStatusChange,
  onPaymentConfirmed,
}: UsePaymentStatusOptions): PaymentStatus {
  const [status, setStatus] = useState<string>('pendente');
  const [asaasStatus, setAsaasStatus] = useState<string | null>(null);
  const [dataAtualizacao, setDataAtualizacao] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const previousStatusRef = useRef<string>('');
  const statusRef = useRef<string>('pendente');
  const asaasStatusRef = useRef<string | null>(null);
  const isConfirmedRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onStatusChangeRef = useRef<typeof onStatusChange>(onStatusChange);
  const onPaymentConfirmedRef = useRef<typeof onPaymentConfirmed>(onPaymentConfirmed);

  const stopPolling = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const applyStatus = (
    newStatus: string,
    newAsaasStatus: string | null,
    newDataAtualizacao: string
  ) => {
    setStatus(newStatus);
    setAsaasStatus(newAsaasStatus);
    setDataAtualizacao(newDataAtualizacao);
    statusRef.current = newStatus;
    asaasStatusRef.current = newAsaasStatus;

    if (previousStatusRef.current && previousStatusRef.current !== newStatus) {
      onStatusChangeRef.current?.(newStatus);
    }

    if (isPagamentoConfirmado(newStatus, newAsaasStatus)) {
      if (!isConfirmedRef.current) {
        onPaymentConfirmedRef.current?.();
      }
      isConfirmedRef.current = true;
      stopPolling();
    } else {
      isConfirmedRef.current = false;
    }

    previousStatusRef.current = newStatus;
  };

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    onPaymentConfirmedRef.current = onPaymentConfirmed;
  }, [onPaymentConfirmed]);

  useEffect(() => {
    if (!pedidoId || !enabled) {
      return;
    }

    const fetchStatus = async () => {
      if (isFetchingRef.current) {
        return;
      }

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        const data = await orderService.getById(pedidoId);

        if (data?.success && data.data) {
          const pedidoData: any = data.data;
          applyStatus(
            pedidoData.status,
            pedidoData.asaas_payment_status,
            pedidoData.data_atualizacao
          );
          return;
        }

        throw new Error(data?.message || 'Erro ao verificar status do pagamento');
      } catch (err: any) {
        setError(err.message || 'Erro ao verificar pagamento');
        console.error('Erro ao verificar status:', err);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    const connectSocket = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token || socketRef.current) {
        return;
      }

      const socket = io(getSocketUrl(), {
        auth: { token },
      });

      socket.on('notification:new', async (notification: Notificacao) => {
        const payload = notification?.payload || {};
        const pedidoIdPayload = Number(payload.pedido_id);
        const tipoEvento = String(notification?.tipo_evento || '').toLowerCase();
        const isEventoPagamento = tipoEvento.includes('payment') || tipoEvento.includes('pagamento');

        if (pedidoIdPayload !== pedidoId || !isEventoPagamento) {
          return;
        }

        const novoStatus = String(payload.status || statusRef.current || 'pendente');
        const novoStatusAsaas = payload.payment_status ? String(payload.payment_status) : asaasStatusRef.current;
        const novaDataAtualizacao = new Date().toISOString();

        applyStatus(novoStatus, novoStatusAsaas, novaDataAtualizacao);

        try {
          const data = await orderService.getById(pedidoId);
          if (data?.success && data.data) {
            const pedidoData: any = data.data;
            applyStatus(
              pedidoData.status,
              pedidoData.asaas_payment_status,
              pedidoData.data_atualizacao
            );
          }
        } catch (refreshError) {
          console.error('Erro ao atualizar pedido após evento de pagamento:', refreshError);
        }
      });

      socketRef.current = socket;
    };

    fetchStatus();
    intervalIdRef.current = setInterval(fetchStatus, Math.max(interval, 3000));
    connectSocket();

    // Cleanup
    return () => {
      stopPolling();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [pedidoId, enabled, interval]);

  return {
    status,
    asaas_payment_status: asaasStatus,
    data_atualizacao: dataAtualizacao,
    loading,
    error,
  };
}
