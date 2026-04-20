/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiCheckCircle, FiTruck, FiX } from 'react-icons/fi';
import { confirmAction, promptText, showError, showSuccess } from '@/utils/alerts';
import styles from './pedidos.module.scss';

type AbaAtiva = 'todos' | 'retiradas' | 'reembolsos';

interface PedidoAdmin {
  id: number;
  pedido_id?: number;
  itens_resumo?: string;
  usuario_nome?: string;
  data_pedido?: string;
  valor_total?: number;
  total?: number;
  forma_pagamento?: string;
  asaas_payment_status?: string;
  status: string;
  pedido_status?: string;
  codigo_rastreio?: string;
  superfrete_pedido_id?: string | number;
  superfrete_status?: string;
  superfrete_etiqueta_url?: string;
  retirada_codigo?: string;
  pagamento_verificado?: boolean;
  motivo?: string;
  reembolso_status?: string;
  entrega_tipo?: string;
}

interface ReembolsoAdmin {
  id?: number;
  pedido_id: number;
  itens_resumo?: string;
  usuario_nome?: string;
  data_pedido?: string;
  valor_total?: number;
  total?: number;
  forma_pagamento?: string;
  asaas_payment_status?: string;
  pedido_status?: string;
  status?: string;
  motivo?: string;
  reembolso_status?: string;
  retirada_codigo?: string;
  codigo_rastreio?: string;
  superfrete_pedido_id?: string | number;
  superfrete_status?: string;
  superfrete_etiqueta_url?: string;
  entrega_tipo?: string;
}

interface FormRetirada {
  codigo: string;
  nome_retirada: string;
  observacao: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  cartao: 'Cartão de Crédito',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  boleto: 'Boleto',
  local: 'Pagamento na retirada',
};

const formatarPagamento = (formaPagamento?: string) => {
  if (!formaPagamento) return 'N/A';
  return PAYMENT_LABELS[formaPagamento] || formaPagamento;
};

const STATUS_ASAAS_PAGO = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);
const STATUS_ETIQUETA_PRONTA_LOCAL = 'label_paid_ready_to_print';

const normalizarStatusEtiqueta = (status?: string) => String(status || '').trim().toLowerCase();

const isEtiquetaProntaParaImpressao = (status?: string) => {
  const normalized = normalizarStatusEtiqueta(status);
  if (!normalized) {
    return false;
  }

  if (normalized === STATUS_ETIQUETA_PRONTA_LOCAL) {
    return true;
  }

  const readyKeywords = ['paid', 'pago', 'ready', 'printed', 'released', 'success', 'approved', 'completed', 'generated'];
  return readyKeywords.some((keyword) => normalized.includes(keyword));
};

const formatarValor = (valor?: number | string | null) => `R$ ${Number(valor || 0).toFixed(2)}`;

const obterPedidoId = (pedido: PedidoAdmin | ReembolsoAdmin, abaAtiva: AbaAtiva) => (
  abaAtiva === 'reembolsos' ? pedido.pedido_id : (pedido as PedidoAdmin).id
);

const isEntregaPedido = (pedido: PedidoAdmin | ReembolsoAdmin) =>
  String(pedido.entrega_tipo || '').toLowerCase() === 'entrega';

export default function AdminPedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [retiradas, setRetiradas] = useState<PedidoAdmin[]>([]);
  const [reembolsos, setReembolsos] = useState<ReembolsoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoAdmin | null>(null);
  const [formRetirada, setFormRetirada] = useState<FormRetirada>({
    codigo: '',
    nome_retirada: '',
    observacao: '',
  });
  const [erroModal, setErroModal] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);
  const [labelActionId, setLabelActionId] = useState<number | null>(null);

  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'pendente_pagamento_retirada', label: 'Aguardando pagamento (retirada)' },
    { value: 'aguardando_pagamento_retirada', label: 'Aguardando pagamento (retirada)' },
    { value: 'pronto_para_retirada', label: 'Pronto para retirada' },
    { value: 'retirado', label: 'Retirado' },
    { value: 'pago', label: 'Pago' },
    { value: 'processando', label: 'Processando' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'devolvido', label: 'Devolvido' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      if (abaAtiva === 'retiradas') {
        carregarRetiradas();
      } else if (abaAtiva === 'reembolsos') {
        carregarReembolsos();
      } else {
        carregarPedidos();
      }
    }
  }, [user, filtroStatus, abaAtiva]);

  useEffect(() => {
    if (abaAtiva === 'reembolsos') {
      setStatusDrafts({});
      return;
    }

    const drafts: Record<number, string> = {};
    const base = abaAtiva === 'retiradas' ? retiradas : pedidos;
    base.forEach((pedido) => {
      drafts[pedido.id] = pedido.status;
    });
    setStatusDrafts(drafts);
  }, [pedidos, retiradas, abaAtiva]);

  const carregarPedidos = async () => {
    setLoading(true);
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const response = await orderService.getAll(params);
      if (response.success) {
        setPedidos((Array.isArray(response.data) ? response.data : []) as PedidoAdmin[]);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarRetiradas = async () => {
    setLoading(true);
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const response = await orderService.getRetiradasAdmin(params);
      if (response.success) {
        setRetiradas((Array.isArray(response.data) ? response.data : []) as PedidoAdmin[]);
      }
    } catch (error) {
      console.error('Erro ao carregar retiradas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarReembolsos = async () => {
    setLoading(true);
    try {
      const response = await orderService.getReembolsosAdmin();
      if (response.success) {
        setReembolsos((Array.isArray(response.data) ? response.data : []) as ReembolsoAdmin[]);
      }
    } catch (error) {
      console.error('Erro ao carregar fila de reembolsos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarStatus = async (pedidoId: number | undefined, novoStatus: string) => {
    if (!pedidoId) return;
    if (!novoStatus) return;

    try {
      const response = await orderService.updateStatus(pedidoId, novoStatus);
      if (response.success) {
        await showSuccess('Status atualizado com sucesso!');
        carregarPedidos();
      }
    } catch (error: any) {
      await showError(error.message || 'Erro ao atualizar status');
    }
  };

  const handleStatusChange = (pedidoId: number, value: string) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [pedidoId]: value,
    }));
  };

  const handleAdicionarRastreio = async (pedidoId: number) => {
    const codigo = await promptText('Adicionar rastreio', 'Digite o código de rastreio', {
      placeholder: 'Ex.: BR123456789',
      confirmText: 'Salvar rastreio',
      minLength: 3,
      emptyMessage: 'Digite o código de rastreio',
      minLengthMessage: 'Código de rastreio muito curto',
    });
    if (!codigo) return;

    try {
      const response = await orderService.addTracking(pedidoId, codigo);
      if (response.success) {
        await showSuccess('Código de rastreio adicionado com sucesso!');
        carregarPedidos();
      }
    } catch (error: any) {
      await showError(error.message || 'Erro ao adicionar rastreio');
    }
  };

  const handleConfirmarRetirada = (pedido: PedidoAdmin) => {
    setPedidoSelecionado(pedido);
    setFormRetirada({
      codigo: '',
      nome_retirada: pedido.usuario_nome || '',
      observacao: '',
    });
    setErroModal('');
    setModalAberto(true);
  };

  const handleSubmeterRetirada = async () => {
    if (!pedidoSelecionado) {
      setErroModal('Pedido não selecionado');
      return;
    }

    if (!formRetirada.codigo.trim()) {
      setErroModal('Digite o código de retirada');
      return;
    }

    if (!formRetirada.nome_retirada.trim()) {
      setErroModal('Digite o nome de quem retirou');
      return;
    }

    setLoadingModal(true);
    setErroModal('');

    try {
      const response = await orderService.confirmarRetirada(pedidoSelecionado.id, {
        codigo: formRetirada.codigo,
        nome_retirada: formRetirada.nome_retirada,
        observacao: formRetirada.observacao || undefined,
      });

      if (response.success) {
        await showSuccess('Retirada confirmada com sucesso!');
        setModalAberto(false);
        carregarRetiradas();
      } else {
        setErroModal(response.message || 'Erro ao confirmar retirada');
      }
    } catch (error: any) {
      setErroModal(error.message || 'Erro ao confirmar retirada');
    } finally {
      setLoadingModal(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPedidoSelecionado(null);
    setFormRetirada({ codigo: '', nome_retirada: '', observacao: '' });
    setErroModal('');
  };

  const handleImprimirEtiqueta = async (pedidoId: number) => {
    try {
      const response = await orderService.printLabel(pedidoId);
      const url = (response?.data as any)?.url;

      if (url) {
        setPedidos((prev) =>
          prev.map((pedido) =>
            pedido.id === pedidoId ? { ...pedido, superfrete_etiqueta_url: url } : pedido
          )
        );
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        await showError('Link da etiqueta não encontrado.');
      }
    } catch (error: any) {
      await showError(error.message || 'Confirme e realize o pagamento da etiqueta antes de imprimir');
    }
  };

  const handleCriarEtiqueta = async (pedido: PedidoAdmin) => {
    const confirmar = await confirmAction(
      'Criar etiqueta',
      `Criar etiqueta do SuperFrete para o pedido #${pedido.id}?`,
      'Criar etiqueta'
    );

    if (!confirmar) return;

    setLabelActionId(pedido.id);

    try {
      const response = await orderService.createLabel(pedido.id);
      if (response.success) {
        await showSuccess('Etiqueta criada com sucesso. Agora finalize a compra da etiqueta.');
        await carregarPedidos();
      }
    } catch (error: any) {
      await showError(error.message || 'Erro ao criar etiqueta');
    } finally {
      setLabelActionId(null);
    }
  };

  const handleFinalizarEtiqueta = async (pedido: PedidoAdmin) => {
    const confirmar = await confirmAction(
      'Finalizar etiqueta',
      `Finalizar a etiqueta do SuperFrete para o pedido #${pedido.id}?`,
      'Finalizar etiqueta'
    );

    if (!confirmar) return;

    setLabelActionId(pedido.id);

    try {
      const response = await orderService.payLabel(pedido.id);
      if (response.success) {
        await showSuccess('Etiqueta finalizada com sucesso.');
        await carregarPedidos();
      }
    } catch (error: any) {
      await showError(error.message || 'Erro ao finalizar etiqueta');
    } finally {
      setLabelActionId(null);
    }
  };

  const handleProcessarReembolso = async (pedidoId: number) => {
    const confirmar = await confirmAction(
      'Processar reembolso manual',
      `Confirmar solicitação de reembolso manual no Asaas para o pedido #${pedidoId}?`,
      'Confirmar'
    );
    if (!confirmar) return;

    try {
      const response = await orderService.processarReembolsoAdmin(pedidoId);
      if (response.success) {
        await showSuccess(response.message || 'Reembolso solicitado com sucesso');
        carregarReembolsos();
        carregarPedidos();
      }
    } catch (error: any) {
      await showError(error.message || 'Erro ao processar reembolso');
    }
  };

  const basePedidos: Array<PedidoAdmin | ReembolsoAdmin> = abaAtiva === 'retiradas'
    ? retiradas
    : (abaAtiva === 'reembolsos' ? reembolsos : pedidos);
  const pedidosFiltrados = basePedidos;
  const totalPedidos = basePedidos.length;
  const pedidosPendentes = abaAtiva === 'reembolsos'
    ? basePedidos.filter((p) => p.reembolso_status === 'pendente').length
    : basePedidos.filter((p) => p.status === 'pendente').length;
  const pedidosEnviados = abaAtiva === 'reembolsos'
    ? basePedidos.filter((p) => p.pedido_status === 'cancelado').length
    : basePedidos.filter((p) => p.status === 'enviado').length;
  const valorTotal = basePedidos.reduce((acc, p) => acc + Number(p.valor_total ?? p.total ?? 0), 0);

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.adminPedidos}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/admin" className={styles.backButton}>
              <FiArrowLeft /> Voltar
            </Link>
            <h1>Gerenciar Pedidos</h1>
          </div>
        </div>

        <div className={styles.filters}>
          <button
            className={abaAtiva === 'todos' ? styles.btnPrimary : styles.btnEdit}
            onClick={() => setAbaAtiva('todos')}
          >
            Todos os pedidos
          </button>
          <button
            className={abaAtiva === 'retiradas' ? styles.btnPrimary : styles.btnEdit}
            onClick={() => setAbaAtiva('retiradas')}
          >
            Retiradas no local
          </button>
          <button
            className={abaAtiva === 'reembolsos' ? styles.btnPrimary : styles.btnEdit}
            onClick={() => setAbaAtiva('reembolsos')}
          >
            Reembolsos
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <FiPackage size={24} />
            <div>
              <p>Total de Pedidos</p>
              <h3>{totalPedidos}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiPackage size={24} />
            <div>
              <p>Pendentes</p>
              <h3>{pedidosPendentes}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiTruck size={24} />
            <div>
              <p>Enviados</p>
              <h3>{pedidosEnviados}</h3>
            </div>
          </div>
          <div className={styles.statCard}>
            <FiCheckCircle size={24} />
            <div>
              <p>Valor Total</p>
              <h3>R$ {Number(valorTotal || 0).toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {abaAtiva !== 'reembolsos' && (
          <div className={styles.filters}>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="pendente_pagamento_retirada">Aguardando pagamento (retirada)</option>
              <option value="aguardando_pagamento_retirada">Aguardando pagamento (retirada)</option>
              <option value="pronto_para_retirada">Pronto para retirada</option>
              <option value="retirado">Retirado</option>
              <option value="pago">Pago</option>
              <option value="processando">Processando</option>
              <option value="enviado">Enviado</option>
              <option value="devolucao">Devolução</option>
              <option value="devolvido">Devolvido</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}

        <p className={styles.tableHint}>Em telas menores, role a tabela para o lado para visualizar todos os campos.</p>

        <div className={styles.tableContainer}>
          <table className={styles.table} data-testid="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código retirada</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Status Asaas</th>
                <th>Status</th>
                <th>Itens</th>
                <th>Rastreio</th>
                <th>Etiqueta</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido, index) => (
                <tr
                  key={`pedido-${obterPedidoId(pedido, abaAtiva) ?? index}`}
                >
                  <td>#{obterPedidoId(pedido, abaAtiva)}</td>
                  <td>{abaAtiva === 'reembolsos' ? '-' : (pedido.retirada_codigo || '-')}</td>
                  <td>{pedido.usuario_nome || 'N/A'}</td>
                  <td>{pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{formatarValor(pedido.valor_total ?? pedido.total ?? 0)}</td>
                  <td>
                    <span className={styles.paymentMethod}>
                      {formatarPagamento(pedido.forma_pagamento)}
                    </span>
                  </td>
                  <td>{pedido.asaas_payment_status || 'N/A'}</td>
                  <td>
                    {abaAtiva === 'reembolsos' ? (
                      <span>{pedido.pedido_status || 'cancelado'}</span>
                    ) : (
                      <select
                        className={styles.statusSelect}
                        value={statusDrafts[(pedido as PedidoAdmin).id] || pedido.status}
                        onChange={(event) => handleStatusChange((pedido as PedidoAdmin).id, event.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {pedido.itens_resumo ? (
                      <div className={styles.itemsSummary}>{pedido.itens_resumo}</div>
                    ) : (
                      <span className={styles.textMuted}>Sem itens</span>
                    )}
                  </td>
                  <td>
                    {abaAtiva === 'reembolsos' ? (
                      <span className={styles.textMuted}>{pedido.motivo || 'pendente'}</span>
                    ) : pedido.codigo_rastreio || (
                      <span className={styles.textMuted}>Sem rastreio</span>
                    )}
                  </td>
                  <td>
                    {abaAtiva === 'reembolsos' ? (
                      <span className={styles.textMuted}>{pedido.reembolso_status || 'pendente'}</span>
                    ) : !isEntregaPedido(pedido) ? (
                      <span className={styles.textMuted}>Retirada local</span>
                    ) : pedido.superfrete_pedido_id ? (
                      <div className={styles.actions}>
                        {isEtiquetaProntaParaImpressao((pedido as PedidoAdmin).superfrete_status) ? (
                          <button
                            onClick={() => handleImprimirEtiqueta((pedido as PedidoAdmin).id)}
                            className={styles.btnPrimary}
                            disabled={labelActionId === (pedido as PedidoAdmin).id}
                          >
                            Imprimir
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFinalizarEtiqueta(pedido as PedidoAdmin)}
                              className={styles.btnEdit}
                              disabled={labelActionId === (pedido as PedidoAdmin).id}
                            >
                              Confirmar e pagar
                            </button>
                            <span className={styles.textMuted}>Aguardando confirmação no admin</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleCriarEtiqueta(pedido as PedidoAdmin)}
                          className={styles.btnPrimary}
                          disabled={labelActionId === (pedido as PedidoAdmin).id}
                        >
                          Criar etiqueta
                        </button>
                        {!STATUS_ASAAS_PAGO.has(String(pedido.asaas_payment_status || '').toUpperCase()) && (
                          <span className={styles.textMuted}>Pagamento nao confirmado</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/pedidos/${abaAtiva === 'reembolsos' ? pedido.pedido_id : pedido.id}`} className={styles.btnView}>
                        Ver
                      </Link>
                      {abaAtiva === 'reembolsos' && (
                        <button
                          onClick={() => handleProcessarReembolso(pedido.pedido_id as number)}
                          className={styles.btnPrimary}
                        >
                          Reembolsar
                        </button>
                      )}
                      {abaAtiva === 'retiradas' && pedido.status === 'pronto_para_retirada' && (
                        <button
                          onClick={() => handleConfirmarRetirada(pedido as PedidoAdmin)}
                          className={styles.btnPrimary}
                        >
                          Confirmar retirada
                        </button>
                      )}
                      {abaAtiva !== 'reembolsos' && (
                        <button
                          onClick={() => handleAtualizarStatus((pedido as PedidoAdmin).id, statusDrafts[(pedido as PedidoAdmin).id] || pedido.status || '')}
                          className={styles.btnEdit}
                        >
                          Atualizar
                        </button>
                      )}
                      {abaAtiva !== 'reembolsos' && (
                        <button
                          onClick={() => handleAdicionarRastreio((pedido as PedidoAdmin).id)}
                          className={styles.btnPrimary}
                        >
                          Rastreio
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pedidosFiltrados.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Confirmar Retirada */}
      {modalAberto && pedidoSelecionado && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Confirmar Retirada - Pedido #{pedidoSelecionado.id}</h2>
              <button onClick={fecharModal} className={styles.closeButton}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Resumo do Pedido */}
              <div className={styles.pedidoResumo}>
                <p><strong>Código de retirada:</strong> {pedidoSelecionado.retirada_codigo || 'Ainda não gerado'}</p>
                <p><strong>Cliente:</strong> {pedidoSelecionado.usuario_nome}</p>
                <p><strong>Data:</strong> {pedidoSelecionado.data_pedido ? new Date(pedidoSelecionado.data_pedido).toLocaleDateString('pt-BR') : '-'}</p>
                <p><strong>Valor:</strong> {formatarValor(pedidoSelecionado.valor_total ?? pedidoSelecionado.total ?? 0)}</p>
                <p><strong>Forma de Pagamento:</strong> {formatarPagamento(pedidoSelecionado.forma_pagamento)}</p>
                <p><strong>Pagamento verificado:</strong> {pedidoSelecionado.pagamento_verificado ? 'Sim' : 'Não'}</p>
                {pedidoSelecionado.asaas_payment_status && (
                  <p><strong>Status Asaas:</strong> {pedidoSelecionado.asaas_payment_status}</p>
                )}
              </div>

              {/* Formulário */}
              <div className={styles.formGroup}>
                <label htmlFor="codigo">Código de Retirada *</label>
                <input
                  id="codigo"
                  type="text"
                  placeholder="Digite ou escaneie o código (ex: 01123456)"
                  value={formRetirada.codigo}
                  onChange={(e) => setFormRetirada({ ...formRetirada, codigo: e.target.value.toUpperCase() })}
                  disabled={loadingModal}
                  autoFocus
                  maxLength={8}
                />
                <small>Digite exatamente 8 dígitos</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome de quem retirou *</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Nome do cliente ou terceiro que retira"
                  value={formRetirada.nome_retirada}
                  onChange={(e) => setFormRetirada({ ...formRetirada, nome_retirada: e.target.value })}
                  disabled={loadingModal}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="observacao">Observação Interna (opcional)</label>
                <textarea
                  id="observacao"
                  placeholder="Anotações sobre a retirada (ex: cliente apresentou documento, foi terceiro, etc)"
                  value={formRetirada.observacao}
                  onChange={(e) => setFormRetirada({ ...formRetirada, observacao: e.target.value })}
                  disabled={loadingModal}
                  rows={3}
                />
              </div>

              {erroModal && (
                <div className={styles.errorAlert}>
                  <strong>Erro:</strong> {erroModal}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={fecharModal}
                disabled={loadingModal}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmeterRetirada}
                disabled={loadingModal}
                className={styles.btnPrimary}
              >
                {loadingModal ? 'Processando...' : 'Confirmar Retirada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
