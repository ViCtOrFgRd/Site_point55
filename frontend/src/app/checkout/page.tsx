/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, addressService, couponService, shippingService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { CreditCard, MapPin, Package } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import AddressForm from '@/components/AddressForm/AddressForm';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import { useNotification } from '@/hooks/useNotification';
import styles from './checkout.module.scss';

const CHECKOUT_SHIPPING_STORAGE_KEY = 'checkout_shipping_snapshot';
const PICKUP_OPTION = { servico: 'Retirar no local', valor: 0, prazo: 0 };

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { success, error: notifyError } = useNotification();

  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [frete, setFrete] = useState<number | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteErro, setFreteErro] = useState<string>('');
  const [shippingOptions, setShippingOptions] = useState<Array<{ servico: string; valor: number; prazo?: number | null }>>([]);
  const [selectedServico, setSelectedServico] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const freteRequestKeyRef = useRef<string | null>(null);
  const appliedSnapshotKeyRef = useRef<string | null>(null);

  const [checkoutData, setCheckoutData] = useState({
    endereco_entrega_id: 0,
    forma_pagamento: 'pix' as 'cartao' | 'pix' | 'boleto' | 'local',
    cupom_codigo: '',
    entrega_tipo: 'entrega' as 'entrega' | 'retirada_local',
    pagamento_na_retirada: false,
  });
  const [parcelasCartao, setParcelasCartao] = useState(1);

  const getPrecoProdutoPorPagamento = (produto: any, formaPagamento: 'cartao' | 'pix' | 'boleto' | 'local') => {
    const precoBase = toNumber(produto?.preco);

    if (formaPagamento === 'pix') {
      return toNumber(produto?.preco_pix || precoBase);
    }

    if (formaPagamento === 'boleto') {
      return toNumber(produto?.preco_boleto || precoBase);
    }

    if (formaPagamento === 'cartao') {
      return toNumber(produto?.preco_credito || precoBase);
    }

    return precoBase;
  };

  const subtotal = items.reduce((totalItens, item) => {
    const precoUnitario = getPrecoProdutoPorPagamento(item.produto, checkoutData.forma_pagamento);
    return totalItens + (precoUnitario * item.quantidade);
  }, 0);

  const parcelasPonderadas = items.reduce(
    (acc, item) => {
      const limiteProduto = Number(item.produto?.parcelas_maximas || 1);
      const limiteValido = Number.isFinite(limiteProduto) && limiteProduto > 0 ? limiteProduto : 1;
      const quantidade = Number(item.quantidade || 1);
      const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;

      acc.somaLimites += (limiteValido * quantidadeValida);
      acc.somaQuantidades += quantidadeValida;
      return acc;
    },
    { somaLimites: 0, somaQuantidades: 0 }
  );

  const mediaParcelas = parcelasPonderadas.somaQuantidades > 0
    ? (parcelasPonderadas.somaLimites / parcelasPonderadas.somaQuantidades)
    : 1;

  const parcelasMaximasCheckout = Math.min(12, Math.max(1, Math.floor(mediaParcelas)));
  const freteGratisAcima = Number(process.env.NEXT_PUBLIC_FRETE_GRATIS_ACIMA || 200);
  const isFreteGratis = Number.isFinite(subtotal) && subtotal >= freteGratisAcima;
  const isPagamentoNaRetirada = checkoutData.forma_pagamento === 'local';
  const isRetiradaLocal = checkoutData.entrega_tipo === 'retirada_local';
  const exigeEnderecoEntrega = !isRetiradaLocal || checkoutData.forma_pagamento !== 'local';
  const freteResolvido = isRetiradaLocal || frete !== null;
  
  // Calcular desconto do cupom
  const calcularDesconto = () => {
    if (!cupomAplicado) return 0;
    
    // Verificar valor mínimo
    if (cupomAplicado.valor_minimo && subtotal < cupomAplicado.valor_minimo) {
      return 0;
    }
    
    if (cupomAplicado.tipo_desconto === 'percentual') {
      return subtotal * (cupomAplicado.valor_desconto / 100);
    } else {
      return cupomAplicado.valor_desconto;
    }
  };
  
  const desconto = calcularDesconto();
  const total = freteResolvido
    ? subtotal + (isRetiradaLocal ? 0 : Number(frete || 0)) - desconto
    : null;
  const valorParcelaCartao = checkoutData.forma_pagamento === 'cartao' && typeof total === 'number'
    ? (total / Math.max(1, parcelasCartao))
    : null;

  useEffect(() => {
    if (parcelasCartao > parcelasMaximasCheckout) {
      setParcelasCartao(parcelasMaximasCheckout);
    }
  }, [parcelasCartao, parcelasMaximasCheckout]);

  const buildItensSignature = () => {
    const itens = items
      .map((item) => ({
        produto_id: Number(item.produto?.id ?? item.id),
        quantidade: Number(item.quantidade),
      }))
      .filter((item) => Number.isFinite(item.produto_id) && Number.isFinite(item.quantidade))
      .sort((a, b) => a.produto_id - b.produto_id);

    return JSON.stringify(itens);
  };

  const getShippingSnapshot = () => {
    try {
      const raw = localStorage.getItem(CHECKOUT_SHIPPING_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const getEnderecoValidationMessage = (endereco: any) => {
    if (!endereco) {
      return 'Selecione um endereco para calcular o frete.';
    }

    const cepRaw = String(endereco.cep ?? '').trim();
    const cepDigits = cepRaw.replace(/\D/g, '');

    if (!cepRaw) {
      return 'CEP nao informado. Verifique o endereco selecionado.';
    }

    if (cepDigits.length !== 8) {
      return 'CEP invalido. Informe um CEP com 8 digitos.';
    }

    if (!String(endereco.rua ?? '').trim()) {
      return 'Rua nao informada. Verifique o endereco selecionado.';
    }

    if (!String(endereco.numero ?? '').trim()) {
      return 'Numero nao informado. Verifique o endereco selecionado.';
    }

    if (!String(endereco.bairro ?? '').trim()) {
      return 'Bairro nao informado. Verifique o endereco selecionado.';
    }

    if (!String(endereco.cidade ?? '').trim() || !String(endereco.estado ?? '').trim()) {
      return 'Cidade/UF incompletos. Verifique o endereco selecionado.';
    }

    return null;
  };

  useEffect(() => {
    if (isFinalizando) {
      return;
    }

    if (!user) {
      router.push('/perfil');
      return;
    }

    if (items.length === 0) {
      router.push('/carrinho');
      return;
    }

    carregarEnderecos();
  }, [user, items, isFinalizando]);

  useEffect(() => {
    if (isPagamentoNaRetirada) {
      setFreteLoading(false);
      setFrete(0);
      setFreteErro('');
      setShippingOptions([PICKUP_OPTION]);
      setSelectedServico(PICKUP_OPTION.servico);

      if (!isRetiradaLocal || !checkoutData.pagamento_na_retirada) {
        setCheckoutData((prev) => ({
          ...prev,
          entrega_tipo: 'retirada_local',
          pagamento_na_retirada: true,
        }));
      }

      return;
    }

    const enderecoSelecionado = enderecos.find(
      (endereco) => endereco.id === checkoutData.endereco_entrega_id
    );

    if (!enderecoSelecionado || subtotal <= 0) {
      setFreteLoading(false);
      setFrete(null);
      setFreteErro('');
      setShippingOptions([]);
      setSelectedServico('');
      return;
    }

    if (subtotal >= freteGratisAcima) {
      setFreteLoading(false);
      setFrete(0);
      setFreteErro('');
      setShippingOptions([
        { servico: 'Frete gratis', valor: 0, prazo: null },
        PICKUP_OPTION,
      ]);
      setSelectedServico('Frete gratis');
      setCheckoutData((prev) => ({
        ...prev,
        entrega_tipo: 'entrega',
        pagamento_na_retirada: false,
      }));
      return;
    }

    const enderecoValidationMessage = getEnderecoValidationMessage(enderecoSelecionado);
    if (enderecoValidationMessage) {
      setFreteLoading(false);
      setFrete(null);
      setShippingOptions([]);
      setSelectedServico('');
      setFreteErro(enderecoValidationMessage);
      return;
    }

    const cepDestino = String(enderecoSelecionado.cep ?? '').replace(/\D/g, '');

    let isActive = true;
    setFreteLoading(true);
    setFreteErro('');

    // Preparar itens para cálculo de volumes
    const itensParaFrete = items.reduce<Array<{ produto_id: number; quantidade: number }>>((acc, item) => {
      const produtoId = item.produto?.id ?? item.id;
      if (typeof produtoId === 'number') {
        acc.push({
          produto_id: produtoId,
          quantidade: item.quantidade,
        });
      }
      return acc;
    }, []);

    const itensSignature = buildItensSignature();
    const requestKey = JSON.stringify({ cepDestino, subtotal, itensSignature });
    if (freteRequestKeyRef.current === requestKey) {
      return;
    }

    const snapshot = getShippingSnapshot();
    const snapshotEnderecoId = Number(snapshot?.enderecoId);
    const snapshotSubtotal = Number(snapshot?.subtotal);
    const snapshotFrete = Number(snapshot?.frete);
    const snapshotItensSignature = String(snapshot?.itensSignature || '');

    const snapshotCompativel =
      Number.isFinite(snapshotEnderecoId) &&
      snapshotEnderecoId === checkoutData.endereco_entrega_id &&
      Number.isFinite(snapshotSubtotal) &&
      Math.abs(snapshotSubtotal - subtotal) < 0.01 &&
      Number.isFinite(snapshotFrete) &&
      snapshotItensSignature === itensSignature;

    if (snapshotCompativel && appliedSnapshotKeyRef.current !== requestKey) {
      appliedSnapshotKeyRef.current = requestKey;
      setFrete(snapshotFrete);
      setFreteErro('');
      const servicoSnapshot = String(snapshot?.servico || (snapshotFrete === 0 ? 'Frete gratis' : 'Frete calculado'));
      setSelectedServico(servicoSnapshot);
      setShippingOptions([
        PICKUP_OPTION,
        { servico: servicoSnapshot, valor: snapshotFrete, prazo: null },
      ]);
      setCheckoutData((prev) => ({
        ...prev,
        entrega_tipo: 'entrega',
        pagamento_na_retirada: false,
      }));
      setFreteLoading(false);
      return;
    }

    freteRequestKeyRef.current = requestKey;

    shippingService
      .calculate({
        cep_destino: cepDestino,
        valor_declarado: subtotal,
        subtotal,
        itens: itensParaFrete, // Enviar itens para cálculo automático
      })
      .then((response) => {
        if (!isActive) {
          return;
        }
        const responseData: any = response?.data;
        const cotacoes = Array.isArray(responseData?.cotacoes)
          ? responseData.cotacoes
          : [];
        const normalizedOptions = cotacoes
          .map((item: any) => {
            const valorNumero = typeof item?.valor === 'number'
              ? item.valor
              : Number.parseFloat(String(item?.valor ?? item?.price ?? item?.preco ?? '').replace(',', '.'));
            return {
              servico: String(item?.servico ?? item?.name ?? item?.nome ?? item?.id ?? 'servico'),
              valor: valorNumero,
              prazo: item?.prazo ?? item?.delivery_time ?? null,
            };
          })
          .filter((item: any) => Number.isFinite(item.valor));

        const valor = responseData?.valor ?? responseData?.valor_frete;
        const valorNumero = typeof valor === 'number'
          ? valor
          : Number.parseFloat(String(valor ?? '').replace(',', '.'));
        const servico = responseData?.servico ? String(responseData.servico) : '';

        if (normalizedOptions.length > 0) {
          const withPickup = [
            PICKUP_OPTION,
            ...normalizedOptions,
          ];
          setShippingOptions(withPickup);
          const defaultService = servico || normalizedOptions[0].servico;
          const defaultOption = normalizedOptions.find((item: any) => item.servico === defaultService) || normalizedOptions[0];
          setSelectedServico(defaultService);
          setFrete(defaultOption.valor);
          setCheckoutData((prev) => ({
            ...prev,
            entrega_tipo: 'entrega',
            pagamento_na_retirada: false,
          }));
          return;
        }

        if (Number.isFinite(valorNumero)) {
          const fallbackServico = servico || 'Frete padrao';
          setShippingOptions([
            PICKUP_OPTION,
            { servico: fallbackServico, valor: valorNumero, prazo: null },
          ]);
          setSelectedServico(fallbackServico);
          setFrete(valorNumero);
          setFreteErro('');
          setCheckoutData((prev) => ({
            ...prev,
            entrega_tipo: 'entrega',
            pagamento_na_retirada: false,
          }));
          return;
        }

        setShippingOptions([]);
        setSelectedServico('');
        setFrete(null);
        setFreteErro('Nao foi possivel calcular o frete. Verifique o endereco e tente novamente.');
        setCheckoutData((prev) => ({
          ...prev,
          entrega_tipo: prev.entrega_tipo,
          forma_pagamento: prev.forma_pagamento,
          pagamento_na_retirada: prev.pagamento_na_retirada,
        }));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setShippingOptions([]);
        setSelectedServico('');
        setFrete(null);
        setFreteErro('Nao foi possivel calcular o frete. Verifique os dados do endereco e tente novamente.');
        setCheckoutData((prev) => ({
          ...prev,
          entrega_tipo: prev.entrega_tipo,
          forma_pagamento: prev.forma_pagamento,
          pagamento_na_retirada: prev.pagamento_na_retirada,
        }));
      })
      .finally(() => {
        if (isActive) {
          setFreteLoading(false);
        }
        if (freteRequestKeyRef.current === requestKey) {
          freteRequestKeyRef.current = null;
        }
      });

    return () => {
      isActive = false;
      if (freteRequestKeyRef.current === requestKey) {
        freteRequestKeyRef.current = null;
      }
    };
  }, [checkoutData.endereco_entrega_id, checkoutData.forma_pagamento, checkoutData.pagamento_na_retirada, isPagamentoNaRetirada, isRetiradaLocal, enderecos, subtotal, freteGratisAcima]);

  const carregarEnderecos = async () => {
    try {
      const response = await addressService.getAll();
      if (response.success && response.data) {
        const enderecosData: any[] = Array.isArray(response.data) ? response.data : [];
        setEnderecos(enderecosData);
        const snapshot = getShippingSnapshot();
        const enderecoSnapshotId = Number(snapshot?.enderecoId);
        const enderecoSnapshot = Number.isFinite(enderecoSnapshotId)
          ? enderecosData.find((e: any) => e.id === enderecoSnapshotId)
          : null;
        
        // Selecionar endereço principal automaticamente
        const principal = enderecosData.find((e: any) => e.is_principal);
        if (enderecoSnapshot) {
          setCheckoutData(prev => ({ ...prev, endereco_entrega_id: enderecoSnapshot.id }));
        } else if (principal) {
          setCheckoutData(prev => ({ ...prev, endereco_entrega_id: principal.id }));
        } else if (enderecosData.length > 0) {
          setCheckoutData(prev => ({ ...prev, endereco_entrega_id: enderecosData[0].id }));
        }
      }
    } catch (error) {
      const message = (error as any)?.message || 'Erro ao carregar enderecos';
      notifyError(message);
    }
  };

  const validarCupom = async () => {
    if (!checkoutData.cupom_codigo.trim()) {
      notifyError('Digite um codigo de cupom');
      return;
    }
    
    setValidandoCupom(true);
    try {
      const response = await couponService.validate(checkoutData.cupom_codigo, subtotal);
      
      if (response.success && response.data) {
        const cupom: any = response.data;
        
        // Verificar valor mínimo
        if (cupom.valor_minimo && subtotal < cupom.valor_minimo) {
          notifyError(`Cupom requer compra minima de R$ ${parseFloat(cupom.valor_minimo).toFixed(2)}`);
          return;
        }
        
        setCupomAplicado(cupom);
        success('Cupom aplicado com sucesso');
      }
    } catch (err: any) {
      const message = err?.message || 'Cupom invalido ou expirado';
      notifyError(message);
      setCupomAplicado(null);
    } finally {
      setValidandoCupom(false);
    }
  };

  const removerCupom = () => {
    setCupomAplicado(null);
    setCheckoutData(prev => ({ ...prev, cupom_codigo: '' }));
    success('Cupom removido');
  };

  const handleFinalizarPedido = async () => {
    if (!freteResolvido) {
      notifyError('Aguarde o cálculo do frete para finalizar o pedido');
      return;
    }

    if (exigeEnderecoEntrega && checkoutData.endereco_entrega_id === 0) {
      notifyError('Por favor, selecione um endereco de entrega');
      return;
    }

    // Validar se todos os itens têm produtos válidos
    if (items.some(item => !item.produto || !item.produto.id)) {
      notifyError('Erro: alguns itens do carrinho estao invalidos');
      return;
    }

    setLoading(true);
    setIsFinalizando(true);

    try {
      const retiradaSelecionada = selectedServico === 'Retirar no local';
      const entregaTipoFinal = retiradaSelecionada ? 'retirada_local' : checkoutData.entrega_tipo;

      // Preparar dados do pedido
      const pedidoData = {
        itens: items.map(item => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          tamanho: item.tamanho,
          cor: item.cor,
        })),
        endereco_entrega_id: checkoutData.endereco_entrega_id,
        forma_pagamento: checkoutData.forma_pagamento,
        parcelas: checkoutData.forma_pagamento === 'cartao' ? parcelasCartao : undefined,
        cupom_codigo: cupomAplicado ? cupomAplicado.codigo : undefined,
        entrega_tipo: entregaTipoFinal,
        frete_valor: entregaTipoFinal === 'retirada_local' ? 0 : Number(frete || 0),
        pagamento_na_retirada: checkoutData.forma_pagamento === 'local',
      };

      const response = await orderService.create(pedidoData);

      if (response.success && response.data) {
        const pedidoCriado: any = response.data;
        await clearCart();
        success('Pedido criado com sucesso');
        const codigoRetirada = pedidoCriado.retirada_codigo
          ? `&codigo=${encodeURIComponent(String(pedidoCriado.retirada_codigo))}`
          : '';
        router.push(`/checkout/sucesso?pedido=${pedidoCriado.id}${codigoRetirada}`);
      }
    } catch (error: any) {
      const message = error.message || 'Erro ao criar pedido. Tente novamente.';
      notifyError(message);
      setIsFinalizando(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGerenciarEnderecos = () => {
    router.push('/perfil?tab=endereco');
  };

  const handleNovoEndereco = () => {
    setShowAddressForm(true);
  };

  const handleSubmitNovoEndereco = async (data: any) => {
    const response = await addressService.create(data);

    if (!response.success) {
      throw new Error(response.message || 'Erro ao cadastrar endereco');
    }

    const novoEnderecoId = Number((response.data as any)?.id);
    await carregarEnderecos();

    if (Number.isFinite(novoEnderecoId) && novoEnderecoId > 0) {
      setCheckoutData((prev) => ({ ...prev, endereco_entrega_id: novoEnderecoId }));
    }

    setShowAddressForm(false);
    success('Endereco cadastrado com sucesso');
  };

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Carrinho', href: '/carrinho' },
          { label: 'Checkout' }
        ]} />

        <h1>Finalizar Compra</h1>

        <div className={styles.checkoutContent}>
          {/* Formulário de Checkout */}
          <div className={styles.checkoutForm}>
            {/* Etapa 1: Endereço */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2><MapPin size={24} /> Endereço de Entrega</h2>
              </div>

              {isRetiradaLocal && !exigeEnderecoEntrega && (
                <div className={styles.noAddress}>
                  <p>Retirada no local selecionada. Endereco de entrega nao e necessario.</p>
                  <p><strong>Local:</strong> Shopping Jequitibas</p>
                  <p><strong>Endereco:</strong> Av. Jequitibas, 1234</p>
                  <p><strong>Horario:</strong> Segunda a sabado, 10h as 17h</p>
                </div>
              )}

              {enderecos.length === 0 ? (
                <div className={styles.noAddress}>
                  <p>Você ainda não tem endereços cadastrados.</p>
                  <button type="button" onClick={handleNovoEndereco}>
                    Cadastrar Endereço
                  </button>
                </div>
              ) : (
                <div className={styles.addressList}>
                  {enderecos.map((endereco) => (
                    <label key={endereco.id} className={styles.addressOption}>
                      <input
                        type="radio"
                        name="endereco"
                        value={endereco.id}
                        checked={checkoutData.endereco_entrega_id === endereco.id}
                        onChange={() => setCheckoutData(prev => ({ 
                          ...prev, 
                          endereco_entrega_id: endereco.id 
                        }))}
                      />
                      <div className={styles.addressDetails}>
                        <strong>{endereco.rua}, {endereco.numero}</strong>
                        {endereco.complemento && <span> - {endereco.complemento}</span>}
                        <p>{endereco.bairro} - {endereco.cidade}/{endereco.estado}</p>
                        <p>CEP: {endereco.cep}</p>
                        {endereco.is_principal && <span className={styles.badge}>Principal</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {showAddressForm && (
                <AddressForm
                  onSubmit={handleSubmitNovoEndereco}
                  onCancel={() => setShowAddressForm(false)}
                  isEdit={false}
                />
              )}
            </div>

            {/* Etapa 2: Forma de Pagamento */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2><CreditCard size={24} /> Forma de Pagamento</h2>
              </div>

              <div className={styles.paymentOptions}>
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="pagamento"
                    value="pix"
                    checked={checkoutData.forma_pagamento === 'pix'}
                    onChange={(e) => setCheckoutData(prev => ({ 
                      ...prev, 
                      forma_pagamento: e.target.value as any,
                      pagamento_na_retirada: false,
                      entrega_tipo: prev.entrega_tipo
                    }))}
                  />
                  <div>
                    <strong>PIX</strong>
                    <p>Aprovação imediata</p>
                  </div>
                </label>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="pagamento"
                    value="cartao"
                    checked={checkoutData.forma_pagamento === 'cartao'}
                    onChange={(e) => setCheckoutData(prev => ({ 
                      ...prev, 
                      forma_pagamento: e.target.value as any,
                      pagamento_na_retirada: false,
                      entrega_tipo: prev.entrega_tipo
                    }))}
                  />
                  <div>
                    <strong>Cartão de Crédito / Cartão de Débito</strong>
                    <p></p>
                  </div>
                </label>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="pagamento"
                    value="boleto"
                    checked={checkoutData.forma_pagamento === 'boleto'}
                    onChange={(e) => setCheckoutData(prev => ({ 
                      ...prev, 
                      forma_pagamento: e.target.value as any,
                      pagamento_na_retirada: false,
                      entrega_tipo: prev.entrega_tipo
                    }))}
                  />
                  <div>
                    <strong>Boleto Bancário</strong>
                    <p>Vencimento em 3 dias úteis</p>
                  </div>
                </label>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="pagamento"
                    value="local"
                    checked={checkoutData.forma_pagamento === 'local'}
                    onChange={(e) => setCheckoutData(prev => ({ 
                      ...prev, 
                      forma_pagamento: e.target.value as any,
                      pagamento_na_retirada: true,
                      entrega_tipo: 'retirada_local'
                    }))}
                  />
                  <div>
                    <strong>Pagamento na retirada</strong>
                    <p>Pague no local ao retirar o pedido</p>
                  </div>
                </label>

              </div>

            </div>

            {/* Cupom de Desconto */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Cupom de Desconto</h3>
              </div>
              
              {cupomAplicado ? (
                <div className={styles.cupomAplicado}>
                  <div className={styles.cupomInfo}>
                    <span className={styles.cupomCodigo}>✅ {cupomAplicado.codigo}</span>
                    <span className={styles.cupomDescricao}>{cupomAplicado.descricao}</span>
                  </div>
                  <button 
                    type="button"
                    className={styles.removerCupom}
                    onClick={removerCupom}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className={styles.couponInput}>
                  <input
                    type="text"
                    placeholder="Digite seu cupom"
                    value={checkoutData.cupom_codigo}
                    onChange={(e) => setCheckoutData(prev => ({ 
                      ...prev, 
                      cupom_codigo: e.target.value.toUpperCase() 
                    }))}
                    disabled={validandoCupom}
                  />
                  <button 
                    type="button"
                    onClick={validarCupom}
                    disabled={validandoCupom || !checkoutData.cupom_codigo.trim()}
                  >
                    {validandoCupom ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className={styles.orderSummary}>
            <h2><Package size={24} /> Resumo do Pedido</h2>

            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={`${item.produto.id}-${item.tamanho}-${item.cor}`} className={styles.summaryItem}>
                  <span>
                    {item.quantidade}x {item.produto.nome}
                    {(item.tamanho || item.cor) && (
                      <> ({item.tamanho ? `Tam: ${item.tamanho}` : ''}{item.tamanho && item.cor ? ' | ' : ''}{item.cor ? `Cor: ${item.cor}` : ''})</>
                    )}
                  </span>
                  <span>R$ {formatPrice(getPrecoProdutoPorPagamento(item.produto, checkoutData.forma_pagamento) * item.quantidade)}</span>
                </div>
              ))}
            </div>

            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>R$ {typeof subtotal === 'number' ? subtotal.toFixed(2) : parseFloat(subtotal || 0).toFixed(2)}</span>
            </div>

            <div className={styles.summaryLine}>
              <span>Frete</span>
              <span>
                {freteLoading || frete === null
                  ? 'Calculando...'
                  : frete === 0
                    ? 'GRÁTIS'
                    : `R$ ${frete.toFixed(2)}`}
              </span>
            </div>

            {!!freteErro && !isRetiradaLocal && (
              <div className={styles.noAddress}>
                <p>{freteErro}</p>
                <div className={styles.addressActions}>
                  <button type="button" onClick={handleGerenciarEnderecos}>
                    Editar endereco
                  </button>
                  <button type="button" onClick={handleNovoEndereco}>
                    Inserir novo endereco
                  </button>
                </div>
              </div>
            )}

            {shippingOptions.length > 0 && (
              <div className={styles.shippingOptions}>
                <span className={styles.shippingTitle}>Opcoes de entrega</span>
                {shippingOptions.map((option) => (
                  <label key={`${option.servico}-${option.valor}`} className={styles.shippingOption}>
                    <input
                      type="radio"
                      name="shipping"
                      value={option.servico}
                      checked={selectedServico === option.servico}
                      disabled={isPagamentoNaRetirada && option.servico !== PICKUP_OPTION.servico}
                      onChange={() => {
                        const isRetirada = option.servico === 'Retirar no local';
                        setSelectedServico(option.servico);
                        setFrete(option.valor);
                        setCheckoutData(prev => {
                          return {
                            ...prev,
                            entrega_tipo: isRetirada ? 'retirada_local' : 'entrega',
                            pagamento_na_retirada: isRetirada ? prev.forma_pagamento === 'local' : false,
                          };
                        });
                      }}
                    />
                    <div className={styles.shippingMeta}>
                      <span>{option.servico}</span>
                      {option.servico === 'Retirar no local' ? (
                        <small>Pronto em ate 5 horas</small>
                      ) : option.servico === 'Frete gratis' ? (
                        <small>Entrega gratuita</small>
                      ) : option.prazo ? (
                        <small>{option.prazo} dia(s)</small>
                      ) : null}
                    </div>
                    <span className={styles.shippingPrice}>R$ {option.valor.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}

            {desconto > 0 && (
              <div className={styles.summaryLine}>
                <span>Desconto</span>
                <span className={styles.discount}>-R$ {typeof desconto === 'number' ? desconto.toFixed(2) : parseFloat(desconto || 0).toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>
                {typeof total === 'number'
                  ? `R$ ${total.toFixed(2)}`
                  : 'Aguardando frete...'}
              </span>
            </div>

            {checkoutData.forma_pagamento === 'cartao' && typeof total === 'number' && (
              <div className={styles.installmentsBox}>
                <div className={styles.installmentsHeader}>
                  <label htmlFor="parcelas-cartao">Parcelamento</label>
                  <select
                    id="parcelas-cartao"
                    value={parcelasCartao}
                    onChange={(e) => setParcelasCartao(Number(e.target.value) || 1)}
                  >
                    {Array.from({ length: parcelasMaximasCheckout }, (_, index) => index + 1).map((parcela) => (
                      <option key={parcela} value={parcela}>
                        {parcela}x
                      </option>
                    ))}
                  </select>
                </div>
                <p className={styles.installmentsValue}>
                  {parcelasCartao}x de R$ {formatPrice(valorParcelaCartao || 0)} sem juros
                </p>
              </div>
            )}

            <div className={styles.paymentPreview}>
              <span>Forma selecionada:</span>
              <strong>
                {checkoutData.forma_pagamento === 'pix' && 'PIX'}
                {checkoutData.forma_pagamento === 'cartao' && 'Cartão'}
                {checkoutData.forma_pagamento === 'boleto' && 'Boleto'}
                {checkoutData.forma_pagamento === 'local' && 'Pagamento na retirada'}
              </strong>
            </div>

            <button
              className={styles.finalizeButton}
              onClick={handleFinalizarPedido}
              disabled={loading || !freteResolvido || (exigeEnderecoEntrega && checkoutData.endereco_entrega_id === 0)}
            >
              {loading ? 'Processando...' : 'Finalizar Pedido'}
            </button>

            <p className={styles.securePayment}>
              🔒 Pagamento seguro e protegido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
