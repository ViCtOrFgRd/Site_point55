# Guia de Alertas e Ícones

## 📦 Bibliotecas Instaladas

1. **Sonner** - Toasts/notificações elegantes
2. **Lucide React** - Ícones modernos SVG
3. **SweetAlert2** - Alertas modais bonitos

---

## 🔔 1. SONNER - Toasts/Notificações

### Instalação
```bash
npm install sonner
```

### Setup no Layout Principal

**`src/app/layout.tsx`:**
```typescript
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
```

### Exemplos de Uso

```typescript
import { toast } from 'sonner';

// Sucesso
toast.success('Produto adicionado ao carrinho!');

// Erro
toast.error('Falha ao atualizar produto');

// Informação
toast.info('Carregando dados...');

// Aviso
toast.warning('Estoque baixo');

// Personalizado
toast.custom((t) => (
  <div className="p-4 bg-white rounded shadow">
    <p>Mensagem customizada</p>
    <button onClick={() => toast.dismiss(t)}>Fechar</button>
  </div>
));

// Com Ação
toast.promise(
  new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
  {
    loading: 'Salvando...',
    success: 'Salvo com sucesso!',
    error: 'Erro ao salvar'
  }
);
```

### Estilos
```typescript
<Toaster
  position="top-right"
  richColors
  theme="light"
  expand={false}
  duration={4000}
/>
```

---

## 🎨 2. LUCIDE REACT - Ícones

### Instalação
```bash
npm install lucide-react
```

### Exemplos de Uso

```typescript
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Trash2,
  Check,
  AlertCircle,
  Search,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

// Ícone simples
<ShoppingCart size={24} />

// Com cores e estilos
<Heart size={20} color="red" fill="red" />

// Em botão
<button className="flex items-center gap-2">
  <ShoppingCart size={18} />
  Adicionar ao Carrinho
</button>

// Ícone grande
<Star size={40} className="text-yellow-400" />

// Com animação
<Search className="animate-spin" size={24} />
```

### Ícones Úteis para E-commerce

```typescript
import {
  ShoppingCart,    // Carrinho
  Heart,           // Favoritos
  Star,            // Avaliação
  Trash2,          // Deletar
  Edit,            // Editar
  Check,           // Confirmado
  X,               // Fechar/Cancelar
  AlertCircle,     // Alerta
  InfoIcon,        // Informação
  ChevronDown,     // Menu dropdown
  Menu,            // Menu mobile
  Search,          // Pesquisa
  MapPin,          // Localização
  Phone,           // Telefone
  Mail,            // Email
  Package,         // Envio
  Eye,             // Ver
  EyeOff,          // Ocultar
  ArrowRight,      // Próximo
  ArrowLeft        // Anterior
} from 'lucide-react';
```

---

## 🚨 3. SWEETALERT2 - Alertas Modais

### Instalação
```bash
npm install sweetalert2
```

### Exemplos de Uso

```typescript
import Swal from 'sweetalert2';

// Alerta Simples
Swal.fire('Aviso!', 'Sua sessão expirou', 'warning');

// Confirmação
Swal.fire({
  title: 'Deletar produto?',
  text: 'Essa ação não pode ser desfeita',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#d33',
  cancelButtonColor: '#3085d6',
  confirmButtonText: 'Sim, deletar!',
  cancelButtonText: 'Cancelar'
}).then((result) => {
  if (result.isConfirmed) {
    // Deletar
  }
});

// Entrada de Texto
Swal.fire({
  title: 'Código do Cupom',
  input: 'text',
  inputLabel: 'Digite seu código',
  inputPlaceholder: 'Ex: PROMO2025',
  showCancelButton: true,
  confirmButtonText: 'Aplicar'
}).then((result) => {
  if (result.isConfirmed) {
    console.log(result.value);
  }
});

// Sucesso
Swal.fire({
  title: 'Perfeito!',
  text: 'Pedido realizado com sucesso',
  icon: 'success',
  confirmButtonText: 'Ok'
});

// Loading
Swal.fire({
  title: 'Processando...',
  allowOutsideClick: false,
  allowEscapeKey: false,
  didOpen: async () => {
    Swal.showLoading();
    // Fazer requisição
    await fetch('/api/pedidos');
    Swal.hideLoading();
    Swal.fire('Concluído!', '', 'success');
  }
});
```

---

## 🎯 Exemplo Completo: Adicionar ao Carrinho

```typescript
'use client';

import { ShoppingCart, Heart, Star } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useState } from 'react';

export function ProdutoCard({ produto }) {
  const [favorito, setFavorito] = useState(false);

  const handleAdicionarCarrinho = async () => {
    try {
      toast.loading('Adicionando ao carrinho...');
      
      const response = await fetch('/api/carrinho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId: produto.id })
      });

      if (!response.ok) throw new Error();

      toast.success('✨ Produto adicionado ao carrinho!');
    } catch {
      toast.error('❌ Erro ao adicionar produto');
    }
  };

  const handleComprarAgora = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Comprar Agora?',
      text: `${produto.nome} - R$ ${produto.preco}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, comprar!',
      cancelButtonText: 'Cancelar'
    });

    if (isConfirmed) {
      toast.promise(
        fetch('/api/checkout', { method: 'POST' }),
        {
          loading: 'Processando...',
          success: 'Redirecionando para pagamento!',
          error: 'Erro no checkout'
        }
      );
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <img src={produto.imagem} alt={produto.nome} />
      
      <h3 className="text-lg font-bold">{produto.nome}</h3>
      
      <div className="flex items-center gap-1 my-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < produto.avaliacacao ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>

      <p className="text-2xl font-bold text-green-600">
        R$ {produto.preco.toFixed(2)}
      </p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleAdicionarCarrinho}
          className="flex-1 bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <ShoppingCart size={20} />
          Carrinho
        </button>

        <button
          onClick={() => setFavorito(!favorito)}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          <Heart
            size={20}
            className={favorito ? 'fill-red-500 text-red-500' : ''}
          />
        </button>

        <button
          onClick={handleComprarAgora}
          className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Comprar Agora
        </button>
      </div>
    </div>
  );
}
```

---

## 📱 Personalizações CSS

### Para Sonner com Tailwind
```css
/* Adicione em seu CSS global */
:root {
  --sonner-text-color: #000;
  --sonner-border-radius: 8px;
  --sonner-background-color: #ffffff;
  --sonner-success-color: #10b981;
  --sonner-error-color: #ef4444;
  --sonner-warning-color: #f59e0b;
  --sonner-info-color: #3b82f6;
}
```

### Para SweetAlert2 com Tailwind
```typescript
Swal.fire({
  // ... outras configs
  customClass: {
    container: 'my-swal-container',
    popup: 'rounded-lg shadow-lg',
    confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded',
    cancelButton: 'bg-gray-300 text-gray-800 px-4 py-2 rounded'
  }
});
```

---

## 📖 Links Úteis

- [Sonner Docs](https://sonner.emilkowal.ski/)
- [Lucide Icons](https://lucide.dev/)
- [SweetAlert2 Docs](https://sweetalert2.github.io/)

