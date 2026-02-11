'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderService, addressService, couponService, shippingService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { CreditCard, MapPin, Package } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import { useNotification } from '@/hooks/useNotification';
import styles from './checkout.module.scss';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
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
  const [shippingOptions, setShippingOptions] = useState<Array<{ servico: string; valor: number; prazo?: number | null }>>([]);
  const [selectedServico, setSelectedServico] = useState<string>('');

  const [checkoutData, setCheckoutData] = useState({
    endereco_entrega_id: 0,
    forma_pagamento: 'pix' as 'cartao' | 'pix' | 'boleto' | 'local',
    cupom_codigo: '',
  });

  const subtotal = getTotal();
  const freteGratisAcima = Number(process.env.NEXT_PUBLIC_FRETE_GRATIS_ACIMA || 200);
  const freteFallback = Number(process.env.NEXT_PUBLIC_FRETE_PADRAO || 15);
  const freteValor = frete === null ? freteFallback : frete;
  
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
  const total = subtotal + freteValor - desconto;

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
    const enderecoSelecionado = enderecos.find(
      (endereco) => endereco.id === checkoutData.endereco_entrega_id
    );

    if (!enderecoSelecionado || subtotal <= 0) {
      setFrete(null);
      setShippingOptions([]);
      setSelectedServico('');
      return;
    }

    if (subtotal >= freteGratisAcima) {
      setFrete(0);
      setShippingOptions([
        { servico: 'Retirar no local', valor: 0, prazo: 0 },
      ]);
      setSelectedServico('Retirar no local');
      return;
    }

    const cepDestino = enderecoSelecionado.cep;

    if (!cepDestino) {
      setFrete(null);
      return;
    }

    let isActive = true;
    setFreteLoading(true);

    shippingService
      .calculate({
        cep_destino: cepDestino,
        valor_declarado: subtotal,
        subtotal,
      })
      .then((response) => {
        if (!isActive) {
          return;
        }
        const cotacoes = Array.isArray(response?.data?.cotacoes)
          ? response.data.cotacoes
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

        const valor = response?.data?.valor ?? response?.data?.valor_frete;
        const valorNumero = typeof valor === 'number'
          ? valor
          : Number.parseFloat(String(valor ?? '').replace(',', '.'));
        const servico = response?.data?.servico ? String(response.data.servico) : '';

        if (normalizedOptions.length > 0) {
          const withPickup = [
            { servico: 'Retirar no local', valor: 0, prazo: 0 },
            ...normalizedOptions,
          ];
          setShippingOptions(withPickup);
          const defaultService = servico || normalizedOptions[0].servico;
          const defaultOption = normalizedOptions.find((item) => item.servico === defaultService) || normalizedOptions[0];
          setSelectedServico(defaultService);
          setFrete(defaultOption.valor);
          return;
        }

        if (Number.isFinite(valorNumero)) {
          setShippingOptions(servico ? [{ servico, valor: valorNumero, prazo: null }] : []);
          setSelectedServico(servico || 'servico');
          setFrete(valorNumero);
          return;
        }

        setShippingOptions([{ servico: 'Retirar no local', valor: 0, prazo: 0 }]);
        setSelectedServico('Retirar no local');
        setFrete(0);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setShippingOptions([{ servico: 'Retirar no local', valor: 0, prazo: 0 }]);
        setSelectedServico('Retirar no local');
        setFrete(0);
      })
      .finally(() => {
        if (isActive) {
          setFreteLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [checkoutData.endereco_entrega_id, enderecos, subtotal, freteGratisAcima, freteFallback]);

  const carregarEnderecos = async () => {
    try {
      const response = await addressService.getAll();
      if (response.success && response.data) {
        setEnderecos(response.data);
        
        // Selecionar endereço principal automaticamente
        const principal = response.data.find((e: any) => e.is_principal);
        if (principal) {
          setCheckoutData(prev => ({ ...prev, endereco_entrega_id: principal.id }));
        } else if (response.data.length > 0) {
          setCheckoutData(prev => ({ ...prev, endereco_entrega_id: response.data[0].id }));
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
        const cupom = response.data;
        
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
    if (checkoutData.endereco_entrega_id === 0) {
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
        cupom_codigo: cupomAplicado ? cupomAplicado.codigo : undefined,
      };

      const response = await orderService.create(pedidoData);

      if (response.success && response.data) {
        await clearCart();
        success('Pedido criado com sucesso');
        router.push(`/checkout/sucesso?pedido=${response.data.id}`);
      }
    } catch (error: any) {
      const message = error.message || 'Erro ao criar pedido. Tente novamente.';
      notifyError(message);
      setIsFinalizando(false);
    } finally {
      setLoading(false);
    }
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

              {enderecos.length === 0 ? (
                <div className={styles.noAddress}>
                  <p>Você ainda não tem endereços cadastrados.</p>
                  <button onClick={() => router.push('/perfil?tab=endereco')}>
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
                      forma_pagamento: e.target.value as any 
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
                      forma_pagamento: e.target.value as any 
                    }))}
                  />
                  <div>
                    <strong>Cartão de Crédito</strong>
                    <p>Parcele em até 12x</p>
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
                      forma_pagamento: e.target.value as any 
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
                      forma_pagamento: e.target.value as any 
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
                  <span>{item.quantidade}x {item.produto.nome}</span>
                  <span>R$ {formatPrice(toNumber(item.produto.preco) * item.quantidade)}</span>
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
                      onChange={() => {
                        setSelectedServico(option.servico);
                        setFrete(option.valor);
                      }}
                    />
                    <div className={styles.shippingMeta}>
                      <span>{option.servico}</span>
                      {option.servico === 'Retirar no local' ? (
                        <small>Pronto em ate 5 horas</small>
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
              <span>R$ {typeof total === 'number' ? total.toFixed(2) : parseFloat(total || 0).toFixed(2)}</span>
            </div>

            <button
              className={styles.finalizeButton}
              onClick={handleFinalizarPedido}
              disabled={loading || checkoutData.endereco_entrega_id === 0}
            >
              {loading ? 'Processando...' : 'Finalizar Pedido'}
            </button>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="pagamento"
                    value="local"
                    checked={checkoutData.forma_pagamento === 'local'}
                    onChange={(e) => setCheckoutData(prev => ({ 
                      ...prev, 
                      forma_pagamento: e.target.value as any 
                    }))}
                  />
                  <div>
                    <strong>Pagamento na retirada</strong>
                    <p>Pague no local ao retirar o pedido</p>
                  </div>
                </label>

            <p className={styles.securePayment}>
              🔒 Pagamento seguro e protegido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
