'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { orderService } from '@/services/api';
import { FiPackage, FiTruck, FiCheck, FiMapPin, FiCreditCard, FiCopy, FiX } from 'react-icons/fi';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import styles from './pedido-detalhes.module.scss';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Pedido {
  id: number;
  usuario_id: number;
  status: string;
  valor_subtotal: number;
  valor_frete: number;
  valor_desconto: number;
  valor_total: number;
  forma_pagamento: string;
  codigo_rastreio?: string;
  data_criacao: string;
  data_atualizacao: string;
  itens: any[];
  endereco_entrega: any;
}

export default function PedidoDetalhesPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.warning('Faça login para ver seus pedidos');
      router.push('/perfil');
      return;
    }
    carregarPedido();
  }, [id, user]);

  const carregarPedido = async () => {
    setLoading(true);
    try {
      const response = await orderService.getById(parseInt(id));
      if (response.success && response.data) {
        setPedido(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar pedido');
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const copiarRastreio = () => {
    if (pedido?.codigo_rastreio) {
      navigator.clipboard.writeText(pedido.codigo_rastreio);
      toast.success('Código de rastreio copiado!');
    }
  };

  const handleCancelarPedido = async () => {
    if (!pedido) return;
    
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
      return;
    }

    try {
      await orderService.cancel(pedido.id);
      toast.success('Pedido cancelado com sucesso');
      carregarPedido();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar pedido');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pendente: '#FFA726',
      pago: '#42A5F5',
      processando: '#AB47BC',
      enviado: '#29B6F6',
      entregue: '#66BB6A',
      cancelado: '#EF5350',
    };
    return colorMap[status] || '#999';
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFormaPagamento = (forma: string) => {
    const formasMap: Record<string, string> = {
      pix: 'PIX',
      cartao: 'Cartão de Crédito',
      boleto: 'Boleto Bancário',
    };
    return formasMap[forma] || forma;
  };

  if (loading || !pedido) {
    return (
      <div className={styles.loading}>
        <p>Carregando pedido...</p>
      </div>
    );
  }

  const podeCandelar = pedido.status === 'pendente' || pedido.status === 'processando';

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Meus Pedidos', href: '/pedidos' },
          { label: `Pedido #${pedido.id}` },
        ]}
      />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Pedido #{pedido.id}</h1>
            <p>Realizado em {formatarData(pedido.data_criacao)}</p>
          </div>
          <div
            className={styles.statusBadge}
            style={{ background: getStatusColor(pedido.status) }}
          >
            {pedido.status}
          </div>
        </div>

        <div className={styles.content}>
          {/* Status do Pedido */}
          <div className={styles.trackingCard}>
            <h2>Status do Pedido</h2>
            <div className={styles.timeline}>
              <div className={`${styles.timelineItem} ${styles.completed}`}>
                <div className={styles.timelineIcon}>
                  <FiCheck />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Pedido Confirmado</h4>
                  <p>{formatarData(pedido.data_criacao)}</p>
                </div>
              </div>

              <div className={`${styles.timelineItem} ${pedido.status !== 'pendente' ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}>
                  <FiPackage />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Pedido Processando</h4>
                  {pedido.status !== 'pendente' && <p>Pedido em preparação</p>}
                </div>
              </div>

              <div className={`${styles.timelineItem} ${pedido.status === 'enviado' || pedido.status === 'entregue' ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}>
                  <FiTruck />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Pedido Enviado</h4>
                  {(pedido.status === 'enviado' || pedido.status === 'entregue') && (
                    <p>{formatarData(pedido.data_atualizacao)}</p>
                  )}
                </div>
              </div>

              <div className={`${styles.timelineItem} ${pedido.status === 'entregue' ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}>
                  <FiCheck />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Pedido Entregue</h4>
                  {pedido.status === 'entregue' && <p>Pedido entregue com sucesso</p>}
                </div>
              </div>
            </div>

            {pedido.codigo_rastreio && (
              <div className={styles.trackingInfo}>
                <div className={styles.trackingCode}>
                  <FiMapPin />
                  <div>
                    <strong>Código de Rastreio</strong>
                    <p>{pedido.codigo_rastreio}</p>
                  </div>
                </div>
                <button className={styles.copyButton} onClick={copiarRastreio}>
                  <FiCopy /> Copiar
                </button>
              </div>
            )}
          </div>

          {/* Itens do Pedido */}
          <div className={styles.itemsCard}>
            <h2>Itens do Pedido</h2>
            <div className={styles.itemsList}>
              {pedido.itens && pedido.itens.map((item: any) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {item.produto_imagem ? (
                      <img src={item.produto_imagem} alt={item.produto_nome} />
                    ) : (
                      <div className={styles.noImage}>Sem imagem</div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/produtos/${item.produto_id}`}>
                      <h4>{item.produto_nome}</h4>
                    </Link>
                    {item.tamanho && <p>Tamanho: {item.tamanho}</p>}
                    {item.cor && (
                      <p>
                        Cor:{' '}
                        <span
                          className={styles.colorDot}
                          style={{ background: item.cor }}
                        />
                      </p>
                    )}
                    <p>Quantidade: {item.quantidade}</p>
                  </div>
                  <div className={styles.itemPrice}>
                    R$ {formatPrice(toNumber(item.preco_unitario) * item.quantidade)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Endereço de Entrega */}
          {pedido.endereco_entrega && (
            <div className={styles.addressCard}>
              <h2><FiMapPin /> Endereço de Entrega</h2>
              <div className={styles.address}>
                <p>{pedido.endereco_entrega.rua}, {pedido.endereco_entrega.numero}</p>
                {pedido.endereco_entrega.complemento && <p>{pedido.endereco_entrega.complemento}</p>}
                <p>{pedido.endereco_entrega.bairro}</p>
                <p>{pedido.endereco_entrega.cidade} - {pedido.endereco_entrega.estado}</p>
                <p>CEP: {pedido.endereco_entrega.cep}</p>
              </div>
            </div>
          )}

          {/* Resumo do Pedido */}
          <div className={styles.summaryCard}>
            <h2>Resumo do Pedido</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>R$ {typeof pedido.valor_subtotal === 'number' ? pedido.valor_subtotal.toFixed(2) : parseFloat(pedido.valor_subtotal || 0).toFixed(2)}</span>
            </div>
            {pedido.valor_desconto > 0 && (
              <div className={styles.summaryRow}>
                <span>Desconto</span>
                <span className={styles.discount}>
                  -R$ {typeof pedido.valor_desconto === 'number' ? pedido.valor_desconto.toFixed(2) : parseFloat(pedido.valor_desconto || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Frete</span>
              <span>{pedido.valor_frete === 0 ? 'Grátis' : `R$ ${typeof pedido.valor_frete === 'number' ? pedido.valor_frete.toFixed(2) : parseFloat(pedido.valor_frete || 0).toFixed(2)}`}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <strong>Total</strong>
              <strong>R$ {typeof pedido.valor_total === 'number' ? pedido.valor_total.toFixed(2) : parseFloat(pedido.valor_total || 0).toFixed(2)}</strong>
            </div>
            <div className={styles.paymentInfo}>
              <FiCreditCard />
              <span>
                Pagamento via{' '}
                <strong>{getFormaPagamento(pedido.forma_pagamento)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/pedidos">
            <button className={styles.backButton}>Voltar aos Pedidos</button>
          </Link>
          {podeCandelar && (
            <button className={styles.cancelButton} onClick={handleCancelarPedido}>
              <FiX /> Cancelar Pedido
            </button>
          )}
          <button className={styles.helpButton}>Precisa de Ajuda?</button>
        </div>
      </div>
    </div>
  );
}
