/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { addressService, shippingService } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import styles from './page.module.scss';

const CHECKOUT_SHIPPING_STORAGE_KEY = 'checkout_shipping_snapshot';

interface EnderecoCarrinho {
  id: number;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  is_principal?: boolean;
}

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCart();
  const { user } = useAuth();
  const [enderecos, setEnderecos] = useState<EnderecoCarrinho[]>([]);
  const [loadingEnderecos, setLoadingEnderecos] = useState(false);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number>(0);
  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);
  const freteRequestKeyRef = useRef<string | null>(null);

  const subtotal = getTotal();
  const freteGratisAcima = Number(process.env.NEXT_PUBLIC_FRETE_GRATIS_ACIMA || 200);
  const enderecoSelecionado = enderecos.find((endereco) => endereco.id === enderecoSelecionadoId);
  const possuiEnderecoSelecionado = !!enderecoSelecionado;
  const frete = freteCalculado;
  const total = typeof frete === 'number' ? subtotal + frete : null;

  const buildItensSignature = () => {
    const itens = items
      .map((item) => {
        const produtoId = item.produto?.id ?? item.id;
        return {
          produto_id: Number(produtoId),
          quantidade: Number(item.quantidade),
        };
      })
      .filter((item) => Number.isFinite(item.produto_id) && Number.isFinite(item.quantidade))
      .sort((a, b) => a.produto_id - b.produto_id);

    return JSON.stringify(itens);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isActive = true;
    setLoadingEnderecos(true);

    addressService.getAll()
      .then((response) => {
        if (!isActive) {
          return;
        }

        const lista: EnderecoCarrinho[] = Array.isArray(response?.data) ? response.data : [];
        setEnderecos(lista);

        if (lista.length === 0) {
          setEnderecoSelecionadoId(0);
          return;
        }

        const principal = lista.find((endereco) => endereco.is_principal);
        const fallbackId = principal?.id || lista[0].id;

        let enderecoIdSnapshot: number | null = null;
        try {
          const snapshotRaw = localStorage.getItem(CHECKOUT_SHIPPING_STORAGE_KEY);
          if (snapshotRaw) {
            const snapshot = JSON.parse(snapshotRaw);
            const idSnapshot = Number(snapshot?.enderecoId);
            if (Number.isFinite(idSnapshot)) {
              enderecoIdSnapshot = idSnapshot;
            }
          }
        } catch {
          enderecoIdSnapshot = null;
        }

        const enderecoExisteNoSnapshot = enderecoIdSnapshot
          ? lista.some((endereco) => endereco.id === enderecoIdSnapshot)
          : false;

        setEnderecoSelecionadoId(enderecoExisteNoSnapshot ? Number(enderecoIdSnapshot) : fallbackId);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setEnderecos([]);
        setEnderecoSelecionadoId(0);
      })
      .finally(() => {
        if (isActive) {
          setLoadingEnderecos(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (items.length === 0) {
      setFreteCalculado(null);
      setFreteLoading(false);
      return;
    }

    if (!user || !enderecoSelecionado?.cep) {
      setFreteCalculado(null);
      setFreteLoading(false);
      return;
    }

    if (subtotal >= freteGratisAcima) {
      setFreteCalculado(0);
      setFreteLoading(false);
      return;
    }

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

    if (itensParaFrete.length === 0) {
      setFreteCalculado(null);
      setFreteLoading(false);
      return;
    }

    const requestKey = JSON.stringify({
      cepDestino: enderecoSelecionado.cep,
      subtotal,
      itens: itensParaFrete,
    });

    if (freteRequestKeyRef.current === requestKey) {
      return;
    }
    freteRequestKeyRef.current = requestKey;

    let isActive = true;
    setFreteLoading(true);

    shippingService.calculate({
      cep_destino: enderecoSelecionado.cep,
      valor_declarado: subtotal,
      subtotal,
      itens: itensParaFrete,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        const responseData: any = response?.data;

        const cotacoes: Array<Record<string, unknown>> = Array.isArray(responseData?.cotacoes) ? responseData.cotacoes : [];
        const primeiraCotacao = cotacoes.find((item) => {
          const valor = typeof item?.valor === 'number'
            ? item.valor
            : Number.parseFloat(String(item?.valor ?? item?.price ?? item?.preco ?? '').replace(',', '.'));
          return Number.isFinite(valor);
        });

        if (primeiraCotacao) {
          const valor = typeof primeiraCotacao.valor === 'number'
            ? primeiraCotacao.valor
            : Number.parseFloat(String(primeiraCotacao.valor ?? primeiraCotacao.price ?? primeiraCotacao.preco ?? '').replace(',', '.'));
          setFreteCalculado(Number.isFinite(valor) ? valor : null);
          return;
        }

        const valorDireto = responseData?.valor ?? responseData?.valor_frete;
        const valorNumero = typeof valorDireto === 'number'
          ? valorDireto
          : Number.parseFloat(String(valorDireto ?? '').replace(',', '.'));

        setFreteCalculado(Number.isFinite(valorNumero) ? valorNumero : null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setFreteCalculado(null);
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
  }, [items, subtotal, user, enderecoSelecionado?.cep, freteGratisAcima]);

  useEffect(() => {
    if (!user || !enderecoSelecionado?.cep || typeof frete !== 'number') {
      localStorage.removeItem(CHECKOUT_SHIPPING_STORAGE_KEY);
      return;
    }

    const payload = {
      enderecoId: enderecoSelecionado.id,
      cepDestino: enderecoSelecionado.cep,
      subtotal,
      frete,
      servico: frete === 0 ? 'Frete gratis' : 'Frete calculado',
      itensSignature: buildItensSignature(),
      updatedAt: Date.now(),
    };

    localStorage.setItem(CHECKOUT_SHIPPING_STORAGE_KEY, JSON.stringify(payload));
  }, [user, enderecoSelecionado?.id, enderecoSelecionado?.cep, subtotal, frete, items]);

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.container}>
          <h1>Seu carrinho está vazio</h1>
          <p>Adicione produtos ao carrinho para continuar comprando</p>
          <Link href="/produtos">
            <button className={styles.shopButton}>Ver Produtos</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Carrinho de Compras</h1>

        <div className={styles.content}>
          {/* Lista de Produtos */}
          <div className={styles.cartItems}>
            {items.map((item) => (
              <div key={`${item.produto.id}-${item.tamanho}-${item.cor}`} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  {item.produto.imagens && item.produto.imagens[0] ? (
                    <Image
                      src={item.produto.imagens[0]}
                      alt={item.produto.nome}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={styles.noImage}>Sem imagem</div>
                  )}
                </div>

                <div className={styles.itemInfo}>
                  <h3>{item.produto.nome}</h3>
                  {item.tamanho && <p>Tamanho: {item.tamanho}</p>}
                  {item.cor && <p>Cor: {item.cor}</p>}
                </div>

                <div className={styles.itemQuantity}>
                  <button onClick={() => updateQuantity(item, item.quantidade - 1)}>
                    <Minus size={18} />
                  </button>
                  <span>{item.quantidade}</span>
                  <button onClick={() => updateQuantity(item, item.quantidade + 1)}>
                    <Plus size={18} />
                  </button>
                </div>

                <div className={styles.itemPrice}>
                  <p className={styles.unitPrice}>
                    R$ {formatPrice(item.produto.preco)}
                  </p>
                  <p className={styles.totalPrice}>
                    R$ {formatPrice(toNumber(item.produto.preco) * item.quantidade)}
                  </p>
                </div>

                <button
                  className={styles.removeButton}
                  onClick={() => removeItem(item)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className={styles.summary}>
            <h2>Resumo do Pedido</h2>

            <div className={styles.shippingBox}>
              <label className={styles.shippingLabel}>Endereco para calcular frete</label>
              {loadingEnderecos ? (
                <p className={styles.shippingHint}>Carregando enderecos...</p>
              ) : enderecos.length > 0 ? (
                <select
                  className={styles.shippingSelect}
                  value={enderecoSelecionadoId}
                  onChange={(event) => setEnderecoSelecionadoId(Number(event.target.value))}
                >
                  {enderecos.map((endereco) => (
                    <option key={endereco.id} value={endereco.id}>
                      {`${endereco.rua}, ${endereco.numero} - ${endereco.bairro} (${endereco.cep})`}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={styles.shippingHint}>Frete a calcular (cadastre um endereco).</p>
              )}
            </div>

            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>R$ {(typeof subtotal === 'number' ? subtotal.toFixed(2) : parseFloat(subtotal || 0).toFixed(2)).replace('.', ',')}</span>
            </div>

            <div className={styles.summaryLine}>
              <span>Frete</span>
              <span>
                {freteLoading ? (
                  'Calculando...'
                ) : !possuiEnderecoSelecionado ? (
                  'A calcular'
                ) : frete === 0 ? (
                  'GRÁTIS'
                ) : typeof frete === 'number' ? (
                  `R$ ${frete.toFixed(2).replace('.', ',')}`
                ) : (
                  'A calcular'
                )}
              </span>
            </div>

            {subtotal < freteGratisAcima && typeof frete === 'number' && frete > 0 && (
              <p className={styles.freteInfo}>
                Falta R$ {Number(freteGratisAcima - subtotal).toFixed(2).replace('.', ',')} para frete grátis
              </p>
            )}

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>
                {typeof total === 'number'
                  ? `R$ ${total.toFixed(2).replace('.', ',')}`
                  : 'A calcular'}
              </span>
            </div>

            <Link href="/checkout">
              <button className={styles.checkoutButton}>Finalizar Compra</button>
            </Link>

            <Link href="/produtos">
              <button className={styles.continueButton}>Continuar Comprando</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
