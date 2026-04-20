/* eslint-disable @next/next/no-img-element, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { orderService, returnService } from '@/services/api';
import { Devolucao } from '@/types';
import { FiPackage, FiTruck, FiCheck, FiMapPin, FiCreditCard, FiCopy, FiX, FiRefreshCcw } from 'react-icons/fi';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import { confirmAction, promptText } from '@/utils/alerts';
import styles from './pedido-detalhes.module.scss';

interface Pedido {
  id: number;
  usuario_id: number;
  status: string;
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  entrega_tipo?: string;
  retirada_prazo_vencimento?: string | null;
  retirada_confirmada_em?: string | null;
  retirada_confirmado_por_nome?: string | null;
  retirada_observacao?: string | null;
  pagamento_na_retirada?: boolean;
  retirada_codigo?: string | null;
  codigo_rastreio?: string;
  data_pedido: string;
  data_atualizacao: string;
  itens: any[];
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  asaas_invoice_url?: string | null;
  asaas_boleto_url?: string | null;
  asaas_pix_qr_code?: string | null;
  asaas_pix_payload?: string | null;
  asaas_payment_status?: string | null;
  asaas_billing_type?: string | null;
}

const isPedidoRetiradaLocal = (pedido: Pedido) => {
  const entregaTipo = String(pedido.entrega_tipo || '').toLowerCase().trim();
  const status = String(pedido.status || '').toLowerCase().trim();

  return (
    ['retirada_local', 'retirada no local', 'retirada-no-local', 'retirada', 'retirar_no_local'].includes(entregaTipo) ||
    ['pronto_para_retirada', 'aguardando_pagamento_retirada', 'pendente_pagamento_retirada', 'retirado'].includes(status) ||
    Boolean(pedido.retirada_codigo)
  );
};

export default function PedidoDetalhesPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loadingDevolucoes, setLoadingDevolucoes] = useState(false);
  const [submittingDevolucao, setSubmittingDevolucao] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'troca',
    motivo: '',
    justificativa: '',
    observacoes: '',
  });
  const [selectedItems, setSelectedItems] = useState<Record<number, { quantidade: number; motivo_item: string }>>({});
  const [anexos, setAnexos] = useState<FileList | null>(null);

  useEffect(() => {
    if (!user) {
      toast.warning('Faça login para ver seus pedidos');
      router.push('/perfil');
      return;
    }
    if (!id) {
      return;
    }
    carregarPedido();
  }, [id, user]);

  const carregarPedido = async () => {
    setLoading(true);
    try {
      if (!id) return;
      const response = await orderService.getById(parseInt(id));
      if (response.success && response.data) {
        const pedidoData: any = response.data;
        setPedido(pedidoData);
        carregarDevolucoes(pedidoData.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar pedido');
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const carregarDevolucoes = async (pedidoId: number) => {
    setLoadingDevolucoes(true);
    try {
      const response = await returnService.getAll({ pedido_id: pedidoId });
      if (response.success) {
        setDevolucoes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar devolucoes:', error);
    } finally {
      setLoadingDevolucoes(false);
    }
  };

  const handleToggleItem = (itemId: number, quantidadeMax: number) => {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return {
        ...prev,
        [itemId]: {
          quantidade: Math.min(1, quantidadeMax),
          motivo_item: '',
        },
      };
    });
  };

  const handleQuantidadeChange = (itemId: number, value: string, quantidadeMax: number) => {
    const quantidade = Math.max(1, Math.min(quantidadeMax, Number.parseInt(value || '1', 10)));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantidade,
      },
    }));
  };

  const handleMotivoItemChange = (itemId: number, value: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        motivo_item: value,
      },
    }));
  };

  const resetForm = () => {
    setFormData({ tipo: 'troca', motivo: '', justificativa: '', observacoes: '' });
    setSelectedItems({});
    setAnexos(null);
  };

  const handleEnviarDevolucao = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pedido) return;

    const itensPayload = Object.entries(selectedItems).map(([itemId, item]) => ({
      pedido_item_id: Number.parseInt(itemId, 10),
      quantidade: item.quantidade,
      motivo_item: item.motivo_item,
    }));

    if (itensPayload.length === 0) {
      toast.warning('Selecione pelo menos um item');
      return;
    }

    setSubmittingDevolucao(true);
    try {
      if (anexos && anexos.length > 0) {
        const form = new FormData();
        form.append('pedido_id', String(pedido.id));
        form.append('tipo', formData.tipo);
        form.append('motivo', formData.motivo);
        form.append('justificativa', formData.justificativa);
        if (formData.observacoes) {
          form.append('observacoes', formData.observacoes);
        }
        form.append('itens', JSON.stringify(itensPayload));
        Array.from(anexos).forEach((file) => form.append('anexos', file));
        await returnService.create(form);
      } else {
        await returnService.create({
          pedido_id: pedido.id,
          tipo: formData.tipo,
          motivo: formData.motivo,
          justificativa: formData.justificativa,
          observacoes: formData.observacoes || undefined,
          itens: itensPayload,
        });
      }

      toast.success('Solicitacao enviada com sucesso');
      resetForm();
      carregarDevolucoes(pedido.id);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar solicitacao');
    } finally {
      setSubmittingDevolucao(false);
    }
  };

  const handleRecorrer = async (devolucaoId: number) => {
    const justificativa = await promptText(
      'Recorrer da devolução',
      'Informe a justificativa (mínimo 10 caracteres)',
      {
        placeholder: 'Descreva os motivos da recorrência',
        confirmText: 'Enviar recorrência',
        minLength: 10,
        emptyMessage: 'Informe a justificativa',
        minLengthMessage: 'A justificativa deve ter no mínimo 10 caracteres',
      }
    );
    if (!justificativa) {
      return;
    }

    try {
      await returnService.appeal(devolucaoId, justificativa.trim());
      toast.success('Recorrencia enviada');
      if (pedido) {
        carregarDevolucoes(pedido.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao recorrer');
    }
  };

  const copiarRastreio = () => {
    if (pedido?.codigo_rastreio) {
      navigator.clipboard.writeText(pedido.codigo_rastreio);
      toast.success('Código de rastreio copiado!');
    }
  };

  const copiarPix = () => {
    if (pedido?.asaas_pix_payload) {
      navigator.clipboard.writeText(pedido.asaas_pix_payload);
      toast.success('Código PIX copiado!');
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

  const handleCancelarPedido = async () => {
    if (!pedido) return;

    const confirmed = await confirmAction(
      'Cancelar pedido',
      'Tem certeza que deseja cancelar este pedido?',
      'Cancelar pedido'
    );
    if (!confirmed) {
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
      pendente_pagamento_retirada: '#FFA726',
      aguardando_pagamento_retirada: '#FFA726',
      pronto_para_retirada: '#7E57C2',
      retirado: '#66BB6A',
      pago: '#42A5F5',
      processando: '#AB47BC',
      enviado: '#29B6F6',
      devolucao: '#FFB74D',
      devolvido: '#66BB6A',
      entregue: '#66BB6A',
      cancelado: '#EF5350',
    };
    return colorMap[status] || '#999';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pendente: 'Pendente',
      pendente_pagamento_retirada: 'Aguardando pagamento',
      aguardando_pagamento_retirada: 'Aguardando pagamento',
      pronto_para_retirada: 'Pronto para retirada',
      retirado: 'Retirado',
      pago: 'Pago',
      processando: 'Processando',
      enviado: 'Enviado',
      devolucao: 'Devolucao',
      devolvido: 'Devolvido',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return statusMap[status] || status;
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
      local: 'Pagamento na retirada',
    };
    return formasMap[forma] || forma;
  };

  const formatarValor = (valor?: number | string | null) => {
    return formatPrice(toNumber(valor || 0));
  };

  if (loading || !pedido) {
    return (
      <div className={styles.loading}>
        <p>Carregando pedido...</p>
      </div>
    );
  }

  const enderecoDisponivel = Boolean(pedido.rua || pedido.cep);
  const isRetiradaLocal = isPedidoRetiradaLocal(pedido);
  const shouldShowPayment = ['pix', 'boleto', 'cartao'].includes(pedido.forma_pagamento);
  const pixQr = shouldShowPayment ? getPixImageSrc(pedido.asaas_pix_qr_code) : null;
  const boletoUrl = shouldShowPayment ? (pedido.asaas_boleto_url || pedido.asaas_invoice_url) : null;
  const cartaoUrl = shouldShowPayment ? pedido.asaas_invoice_url : null;

  const podeCandelar = ['pendente', 'processando', 'pago', 'pronto_para_retirada', 'pendente_pagamento_retirada', 'aguardando_pagamento_retirada'].includes(pedido.status);
  const podeSolicitar = ['devolucao', 'entregue'].includes(pedido.status);
  const statusEnviado = ['enviado', 'devolucao', 'devolvido', 'entregue'].includes(pedido.status);
  const statusEntregue = ['devolucao', 'devolvido', 'entregue'].includes(pedido.status);
  const etapaFinalTitulo = pedido.status === 'devolvido'
    ? 'Pedido Devolvido'
    : pedido.status === 'devolucao'
    ? 'Pedido em Devolucao'
    : 'Pedido Entregue';
  const etapaFinalMensagem = pedido.status === 'devolvido'
    ? 'Devolucao concluida'
    : pedido.status === 'devolucao'
    ? 'Devolucao em andamento'
    : 'Pedido entregue com sucesso';

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
            {isRetiradaLocal && (
              <p>
                Código de retirada: {pedido.retirada_codigo || 'disponível após confirmação do pagamento'}
              </p>
            )}
            <p>Realizado em {formatarData(pedido.data_pedido)}</p>
          </div>
          <div
            className={styles.statusBadge}
            style={{ background: getStatusColor(pedido.status) }}
          >
            {getStatusText(pedido.status)}
          </div>
        </div>

        <div className={styles.content}>
          {/* Status do Pedido */}
          <div className={styles.trackingCard}>
            <h2>Status do Pedido</h2>
            <div className={styles.timeline}>
              {/* Etapa 1: Pedido Confirmado */}
              <div className={`${styles.timelineItem} ${styles.completed}`}>
                <div className={styles.timelineIcon}>
                  <FiCheck />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Pedido Confirmado</h4>
                  <p>{formatarData(pedido.data_pedido)}</p>
                </div>
              </div>

              {/* Etapa 2: Pedido em Preparação */}
              <div className={`${styles.timelineItem} ${pedido.status !== 'pendente' ? styles.completed : ''}`}>
                <div className={styles.timelineIcon}>
                  <FiPackage />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Pedido em Preparação</h4>
                  {pedido.status !== 'pendente' && <p>Preparando seu pedido</p>}
                </div>
              </div>

              {isRetiradaLocal ? (
                <>
                  {/* Etapa 3 (Retirada): Pedido Preparado */}
                  <div className={`${styles.timelineItem} ${['pronto_para_retirada', 'retirado'].includes(pedido.status) ? styles.completed : ''}`}>
                    <div className={styles.timelineIcon}>
                      <FiCheck />
                    </div>
                    <div className={styles.timelineContent}>
                      <h4>Pedido Preparado</h4>
                      {['pronto_para_retirada', 'retirado'].includes(pedido.status) && (
                        <p>Seu pedido está pronto para retirada</p>
                      )}
                    </div>
                  </div>

                  {/* Etapa 4 (Retirada): Pedido Retirado */}
                  <div className={`${styles.timelineItem} ${pedido.status === 'retirado' ? styles.completed : ''}`}>
                    <div className={styles.timelineIcon}>
                      <FiCheck />
                    </div>
                    <div className={styles.timelineContent}>
                      <h4>Pedido Retirado</h4>
                      {pedido.status === 'retirado' && (
                        <>
                          <p>Retirado por: {pedido.retirada_confirmado_por_nome}</p>
                          <p>{formatarData(pedido.retirada_confirmada_em || '')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Etapa 3 (Entrega): Pedido Enviado */}
                  <div className={`${styles.timelineItem} ${statusEnviado ? styles.completed : ''}`}>
                    <div className={styles.timelineIcon}>
                      <FiTruck />
                    </div>
                    <div className={styles.timelineContent}>
                      <h4>Pedido Enviado</h4>
                      {statusEnviado && (
                        <p>{formatarData(pedido.data_atualizacao)}</p>
                      )}
                    </div>
                  </div>

                  {/* Etapa 4 (Entrega): Pedido Entregue */}
                  <div className={`${styles.timelineItem} ${statusEntregue ? styles.completed : ''}`}>
                    <div className={styles.timelineIcon}>
                      <FiCheck />
                    </div>
                    <div className={styles.timelineContent}>
                      <h4>{etapaFinalTitulo}</h4>
                      {statusEntregue && <p>{etapaFinalMensagem}</p>}
                    </div>
                  </div>
                </>
              )}
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
              {pedido.itens && pedido.itens.map((item: any) => {
                const itemImage = Array.isArray(item.produto_imagens)
                  ? item.produto_imagens[0]
                  : item.produto_imagens;
                return (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {itemImage ? (
                      <img src={itemImage} alt={item.produto_nome} />
                    ) : (
                      <div className={styles.noImage}>Sem imagem</div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/produtos/${item.produto_id}`}>
                      <h4>{item.produto_nome}</h4>
                    </Link>
                    {item.tamanho && <p>Tamanho: <strong>{item.tamanho}</strong></p>}
                    {item.cor && (
                      <p>
                        Cor: <strong>{item.cor}</strong>
                        <span
                          className={styles.colorDot}
                          style={{ background: item.cor }}
                          title={`Cor: ${item.cor}`}
                          aria-label={`Cor: ${item.cor}`}
                        />
                      </p>
                    )}
                    <p>Quantidade: {item.quantidade}</p>
                  </div>
                  <div className={styles.itemPrice}>
                    R$ {formatPrice(toNumber(item.preco_unitario) * item.quantidade)}
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Endereço de Entrega */}
          {enderecoDisponivel && !isRetiradaLocal && (
            <div className={styles.addressCard}>
              <h2><FiMapPin /> Endereço de Entrega</h2>
              <div className={styles.address}>
                <p>{pedido.rua}, {pedido.numero}</p>
                {pedido.complemento && <p>{pedido.complemento}</p>}
                <p>{pedido.bairro}</p>
                <p>{pedido.cidade} - {pedido.estado}</p>
                <p>CEP: {pedido.cep}</p>
              </div>
            </div>
          )}

          {/* Retirada no Local */}
          {isRetiradaLocal && (
            <div className={styles.retiradaCard}>
              <h2><FiMapPin /> Retirada no Local</h2>
              
              {/* Código de Retirada em destaque */}
              {pedido.retirada_codigo && (
                <div className={styles.codigoRetirada}>
                  <p className={styles.labelCodigo}>Código de Retirada</p>
                  <div className={styles.codigoBox}>
                    <span className={styles.codigo}>{pedido.retirada_codigo}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pedido.retirada_codigo || '');
                        toast.success('Código copiado para a área de transferência!');
                      }}
                      className={styles.copiarButton}
                    >
                      <FiCopy /> Copiar
                    </button>
                  </div>
                  <small>Apresente este código no local para confirmar sua retirada</small>
                </div>
              )}

              <div className={styles.address}>
                <p><strong>Local:</strong> Shopping Jequitibas</p>
                <p><strong>Endereco:</strong> Av. Jequitibas, 1234</p>
                <p><strong>Horario:</strong> Segunda a sabado, 10h as 17h</p>
                {pedido.retirada_prazo_vencimento && (
                  <p><strong>Prazo para retirada:</strong> {new Date(pedido.retirada_prazo_vencimento).toLocaleDateString('pt-BR')}</p>
                )}
                {pedido.retirada_confirmada_em && (
                  <>
                    <p><strong>Retirado em:</strong> {formatarData(pedido.retirada_confirmada_em)}</p>
                    <p><strong>Retirado por:</strong> {pedido.retirada_confirmado_por_nome}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Resumo do Pedido */}
          <div className={styles.summaryCard}>
            <h2>Resumo do Pedido</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>R$ {formatarValor(pedido.subtotal)}</span>
            </div>
            {pedido.desconto > 0 && (
              <div className={styles.summaryRow}>
                <span>Desconto</span>
                <span className={styles.discount}>
                  -R$ {formatarValor(pedido.desconto)}
                </span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Frete</span>
              <span>{pedido.frete === 0 ? 'Grátis' : `R$ ${formatarValor(pedido.frete)}`}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <strong>Total</strong>
              <strong>R$ {formatarValor(pedido.total)}</strong>
            </div>
            <div className={styles.paymentInfo}>
              <FiCreditCard />
              <span>
                Pagamento via{' '}
                <strong>{getFormaPagamento(pedido.forma_pagamento)}</strong>
              </span>
            </div>

            {shouldShowPayment && (
              <div className={styles.paymentBox}>
                <h3>Pagamento</h3>

                {pedido.forma_pagamento === 'pix' && (
                  <div className={styles.pixBox}>
                    {pixQr && (
                      <img
                        className={styles.pixQr}
                        src={pixQr}
                        alt="QR Code PIX"
                      />
                    )}
                    {pedido.asaas_pix_payload && (
                      <button className={styles.copyButton} onClick={copiarPix}>
                        <FiCopy /> Copiar codigo PIX
                      </button>
                    )}
                    {!pixQr && !pedido.asaas_pix_payload && (
                      <p>QR Code indisponivel no momento.</p>
                    )}
                  </div>
                )}

                {pedido.forma_pagamento === 'boleto' && boletoUrl && (
                  <a className={styles.paymentLink} href={boletoUrl} target="_blank" rel="noreferrer">
                    Abrir boleto
                  </a>
                )}

                {pedido.forma_pagamento === 'cartao' && cartaoUrl && (
                  <a className={styles.paymentLink} href={cartaoUrl} target="_blank" rel="noreferrer">
                    Pagar com cartao
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.devolucaoSection}>
          <div className={styles.devolucaoCard}>
            <h2>Troca ou Devolucao</h2>
            {!podeSolicitar ? (
              <p className={styles.devolucaoInfo}>
                Solicitacoes estao disponiveis apenas para pedidos com status Devolucao ou Entregue.
              </p>
            ) : (
              <form className={styles.devolucaoForm} onSubmit={handleEnviarDevolucao}>
                <div className={styles.formRow}>
                  <label htmlFor="tipo">Tipo</label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(event) => setFormData((prev) => ({ ...prev, tipo: event.target.value }))}
                  >
                    <option value="troca">Troca</option>
                    <option value="devolucao">Devolucao</option>
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="motivo">Motivo</label>
                  <input
                    id="motivo"
                    type="text"
                    value={formData.motivo}
                    onChange={(event) => setFormData((prev) => ({ ...prev, motivo: event.target.value }))}
                    placeholder="Ex: Tamanho incorreto"
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="justificativa">Justificativa</label>
                  <textarea
                    id="justificativa"
                    value={formData.justificativa}
                    onChange={(event) => setFormData((prev) => ({ ...prev, justificativa: event.target.value }))}
                    placeholder="Descreva o que aconteceu"
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="observacoes">Observacoes (opcional)</label>
                  <textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(event) => setFormData((prev) => ({ ...prev, observacoes: event.target.value }))}
                    placeholder="Detalhes adicionais"
                  />
                </div>

                <div className={styles.itensBox}>
                  <h3>Itens para devolver/trocar</h3>
                  {pedido.itens?.map((item: any) => {
                    const isSelected = Boolean(selectedItems[item.id]);
                    const variacoesItem = [
                      item.tamanho ? `Tam: ${item.tamanho}` : null,
                      item.cor ? `Cor: ${item.cor}` : null,
                    ].filter(Boolean).join(' | ');

                    return (
                      <div key={item.id} className={styles.itemRow}>
                        <label className={styles.itemLabel}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(item.id, item.quantidade)}
                          />
                          <span>{item.produto_nome}{variacoesItem ? ` (${variacoesItem})` : ''}</span>
                          <span className={styles.itemQtd}>Qtd: {item.quantidade}</span>
                        </label>
                        {isSelected && (
                          <div className={styles.itemFields}>
                            <input
                              type="number"
                              min={1}
                              max={item.quantidade}
                              value={selectedItems[item.id]?.quantidade || 1}
                              onChange={(event) => handleQuantidadeChange(item.id, event.target.value, item.quantidade)}
                            />
                            <input
                              type="text"
                              placeholder="Motivo do item (opcional)"
                              value={selectedItems[item.id]?.motivo_item || ''}
                              onChange={(event) => handleMotivoItemChange(item.id, event.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="anexos">Anexos (opcional)</label>
                  <input
                    id="anexos"
                    type="file"
                    multiple
                    onChange={(event) => setAnexos(event.target.files)}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submittingDevolucao}
                >
                  {submittingDevolucao ? 'Enviando...' : 'Enviar solicitacao'}
                </button>
              </form>
            )}
          </div>

          <div className={styles.devolucaoCard}>
            <h2>Minhas solicitacoes</h2>
            {loadingDevolucoes ? (
              <p>Carregando solicitacoes...</p>
            ) : devolucoes.length === 0 ? (
              <p>Nenhuma solicitacao registrada.</p>
            ) : (
              <div className={styles.devolucaoList}>
                {devolucoes.map((devolucao) => (
                  <div key={devolucao.id} className={styles.devolucaoItem}>
                    <div>
                      <strong>#{devolucao.id}</strong> - {devolucao.tipo}
                    </div>
                    <span className={styles.devolucaoStatus}>
                      <FiRefreshCcw /> {devolucao.status}
                    </span>
                    <p>Motivo: {devolucao.motivo}</p>
                    {devolucao.admin_instrucoes && (
                      <p>Instrucoes: {devolucao.admin_instrucoes}</p>
                    )}
                    {devolucao.status === 'recusado' && (
                      <button
                        type="button"
                        className={styles.appealButton}
                        onClick={() => handleRecorrer(devolucao.id)}
                      >
                        Recorrer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
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
