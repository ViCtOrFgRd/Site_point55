'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { carrinhoService } from '@/services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantidade: number, tamanho?: string, cor?: string) => void;
  removeItem: (item: CartItem) => void;
  updateQuantity: (item: CartItem, quantidade: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemsCount: () => number;
  syncWithBackend: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const getStorageKey = (userId?: number | null) => (userId ? `cart_user_${userId}` : 'cart_guest');
  const getItemKey = (item: CartItem) =>
    `${item.produto?.id || item.produto_id || '0'}-${item.tamanho || ''}-${item.cor || ''}`;

  // Carregar carrinho: do backend se logado, senão do localStorage
  useEffect(() => {
    const loadCart = async () => {
      const storageKey = getStorageKey(user?.id);
      setItems([]);
      if (user) {
        try {
          const response = await carrinhoService.get();
          if (response.success && response.data) {
            // Converter formato backend para frontend, preservando o ID
            const backendItems = response.data.itens || [];
            const formattedItems = backendItems.map((item: any) => ({
              id: item.id, // Preservar ID do banco para deletar/atualizar
              produto_id: item.produto_id,
              produto: item.produto || item,
              quantidade: item.quantidade,
              tamanho: item.tamanho,
              cor: item.cor,
            }));
            setItems(formattedItems);
          }
        } catch (error) {
          // Se falhar, carrega do localStorage do usuario
          const savedCart = localStorage.getItem(storageKey);
          if (savedCart) {
            setItems(JSON.parse(savedCart));
          }
        }
      } else {
        // Usuário não logado: usa localStorage
        const savedCart = localStorage.getItem(storageKey);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      }
    };
    loadCart();
  }, [user]);

  // Sincronizar carrinho do localStorage com backend após login
  useEffect(() => {
    const syncGuestCart = async () => {
      if (!user || syncing) return;

      const guestCart = localStorage.getItem(getStorageKey(null));
      if (!guestCart) return;

      const parsed = JSON.parse(guestCart);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.removeItem(getStorageKey(null));
        return;
      }

      try {
        setSyncing(true);
        const itensParaSync = parsed.map((item: any) => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          tamanho: item.tamanho,
          cor: item.cor,
        }));
        await carrinhoService.sync(itensParaSync);
        localStorage.removeItem(getStorageKey(null));

        const response = await carrinhoService.get();
        if (response.success && response.data) {
          const backendItems = response.data.itens || [];
          const formattedItems = backendItems.map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto: item.produto || item,
            quantidade: item.quantidade,
            tamanho: item.tamanho,
            cor: item.cor,
          }));
          setItems(formattedItems);
        }
      } catch (error) {
        console.error('Erro ao sincronizar carrinho:', error);
      } finally {
        setSyncing(false);
      }
    };

    syncGuestCart();
  }, [user]);

  // Salvar no localStorage sempre (backup)
  useEffect(() => {
    const storageKey = getStorageKey(user?.id);
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, user]);

  const addItem = async (product: Product, quantidade: number, tamanho?: string, cor?: string) => {
    if (user) {
      // Usuário logado: salva no backend
      try {
        await carrinhoService.addItem({
          produto_id: product.id,
          quantidade,
          tamanho,
          cor,
        });
        
        // Atualiza estado local
        const response = await carrinhoService.get();
        if (response.success && response.data) {
          const backendItems = response.data.itens || [];
          const formattedItems = backendItems.map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto: item.produto || item,
            quantidade: item.quantidade,
            tamanho: item.tamanho,
            cor: item.cor,
          }));
          setItems(formattedItems);
        }
        showToast('Produto adicionado ao carrinho', 'success');
      } catch (error: any) {
        showToast(error.message || 'Erro ao adicionar ao carrinho', 'error');
        // Fallback: adiciona localmente
        addItemLocally(product, quantidade, tamanho, cor);
      }
    } else {
      // Usuário não logado: salva apenas localmente
      addItemLocally(product, quantidade, tamanho, cor);
      showToast('Produto adicionado ao carrinho', 'success');
    }
  };

  const addItemLocally = (product: Product, quantidade: number, tamanho?: string, cor?: string) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) =>
          item.produto.id === product.id &&
          item.tamanho === tamanho &&
          item.cor === cor
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.produto.id === product.id && item.tamanho === tamanho && item.cor === cor
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }

      return [...prevItems, { produto: product, quantidade, tamanho, cor }];
    });
  };

  const removeItem = async (item: CartItem) => {
    const itemKey = getItemKey(item);

    if (user) {
      try {
        const itemToRemove = items.find((i) => getItemKey(i) === itemKey);

        if (!itemToRemove) {
          showToast('Produto não encontrado no carrinho', 'error');
          return;
        }

        // Se tem ID do banco, deleta pelo ID
        if (itemToRemove.id) {
          await carrinhoService.removeItem(itemToRemove.id);
        }

        // Remove do estado local - apenas a variante selecionada
        setItems((prevItems) => prevItems.filter((i) => getItemKey(i) !== itemKey));

        showToast('Produto removido do carrinho', 'success');
      } catch (error: any) {
        console.error('Erro ao remover item:', error);
        showToast(error.message || 'Erro ao remover produto', 'error');
      }
    } else {
      // Sem usuário, remove apenas localmente
      const filtered = items.filter((i) => getItemKey(i) !== itemKey);
      setItems(filtered);
      localStorage.setItem(getStorageKey(null), JSON.stringify(filtered));
      showToast('Produto removido do carrinho', 'success');
    }
  };

  const updateQuantity = async (item: CartItem, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(item);
      return;
    }

    const itemKey = getItemKey(item);

    if (user) {
      try {
        const itemToUpdate = items.find((i) => getItemKey(i) === itemKey);
        
        if (!itemToUpdate) {
          showToast('Produto não encontrado no carrinho', 'error');
          return;
        }

        // Se tem ID do banco, atualiza pelo ID
        if (itemToUpdate.id) {
          await carrinhoService.updateItem(itemToUpdate.id, quantidade);
        }

        // Atualiza no estado local
        setItems((prevItems) =>
          prevItems.map((cartItem) =>
            getItemKey(cartItem) === itemKey
              ? { ...cartItem, quantidade }
              : cartItem
          )
        );
      } catch (error: any) {
        console.error('Erro ao atualizar quantidade:', error);
        showToast(error.message || 'Erro ao atualizar quantidade', 'error');
      }
    } else {
      // Sem usuário, atualiza apenas localmente
      setItems((prevItems) =>
        prevItems.map((item) =>
          getItemKey(item) === itemKey ? { ...item, quantidade } : item
        )
      );
      // Salva no localStorage
      const updated = items.map((item) =>
        getItemKey(item) === itemKey ? { ...item, quantidade } : item
      );
      localStorage.setItem(getStorageKey(null), JSON.stringify(updated));
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await carrinhoService.clear();
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
      }
    }
    setItems([]);
    localStorage.removeItem(getStorageKey(user?.id));
  };

  const syncWithBackend = async () => {
    if (!user) return;
    
    try {
      const itensParaSync = items.map(item => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        tamanho: item.tamanho,
        cor: item.cor,
      }));
      await carrinhoService.sync(itensParaSync);
      showToast('Carrinho sincronizado com sucesso', 'success');
    } catch (error: any) {
      showToast(error.message || 'Erro ao sincronizar carrinho', 'error');
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const preco = parseFloat(item.produto?.preco || 0) || 0;
      return total + (preco * item.quantidade);
    }, 0);
  };

  const getItemsCount = () => {
    return items.reduce((count, item) => count + item.quantidade, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemsCount,
        syncWithBackend,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
