'use client';

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toNumber, formatPrice } from '@/utils/formatPrice';
import styles from './page.module.scss';

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCart();

  const subtotal = getTotal();
  const frete = subtotal > 200 ? 0 : 15.00;
  const total = subtotal + frete;

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
                  <button onClick={() => updateQuantity(item.produto.id, item.quantidade - 1)}>
                    <Minus size={18} />
                  </button>
                  <span>{item.quantidade}</span>
                  <button onClick={() => updateQuantity(item.produto.id, item.quantidade + 1)}>
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
                  onClick={() => removeItem(item.produto.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className={styles.summary}>
            <h2>Resumo do Pedido</h2>

            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>R$ {(typeof subtotal === 'number' ? subtotal.toFixed(2) : parseFloat(subtotal || 0).toFixed(2)).replace('.', ',')}</span>
            </div>

            <div className={styles.summaryLine}>
              <span>Frete</span>
              <span>
                {frete === 0 ? (
                  <strong style={{ color: '#059669' }}>GRÁTIS</strong>
                ) : (
                  `R$ ${(typeof frete === 'number' ? frete.toFixed(2) : parseFloat(frete || 0).toFixed(2)).replace('.', ',')}`
                )}
              </span>
            </div>

            {subtotal < 200 && (
              <p className={styles.freteInfo}>
                Falta R$ {(typeof subtotal === 'number' ? (200 - subtotal).toFixed(2) : parseFloat((200 - subtotal) || 0).toFixed(2)).replace('.', ',')} para frete grátis
              </p>
            )}

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>R$ {(typeof total === 'number' ? total.toFixed(2) : parseFloat(total || 0).toFixed(2)).replace('.', ',')}</span>
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
