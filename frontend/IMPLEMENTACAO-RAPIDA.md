# ⚡ Quick Start - Próximas Mudanças

## 🚀 Para Completar a Implementação

### Passo 1: Configurar Toaster no Layout Principal
**Arquivo:** `src/app/layout.tsx`

```tsx
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

---

### Passo 2: Atualizar Arquivos Admin Restantes

#### 📄 `src/app/admin/pedidos/page.tsx`

**Substitua:**
```tsx
import { FiArrowLeft, FiPackage, FiCheckCircle, FiTruck, FiX } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';
```

**Por:**
```tsx
import { ArrowLeft, Package, CheckCircle2, Truck, X } from 'lucide-react';
import { toast } from 'sonner';
```

**Remova:**
```tsx
const { showError } = useToast();
```

**Atualize ícones:**
```tsx
// Antes → Depois
<FiArrowLeft /> → <ArrowLeft size={20} />
<FiPackage /> → <Package size={18} />
<FiCheckCircle /> → <CheckCircle2 size={18} />
<FiTruck /> → <Truck size={18} />
<FiX /> → <X size={18} />
```

**Atualize toasts:**
```tsx
// Antes → Depois
showError('mensagem') → toast.error('mensagem')
```

---

#### 📄 `src/app/admin/promocoes/page.tsx`

**Substitua:**
```tsx
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiPercent, FiCalendar, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';
```

**Por:**
```tsx
import { ArrowLeft, Plus, Edit, Trash2, Percent, Calendar, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast } from 'sonner';
```

**Ícones a mapear:**
```tsx
FiArrowLeft → ArrowLeft (size={20})
FiPlus → Plus (size={20})
FiEdit → Edit (size={18})
FiTrash2 → Trash2 (size={18})
FiPercent → Percent (size={24})
FiCalendar → Calendar (size={24})
FiToggleLeft → ToggleLeft (size={18})
FiToggleRight → ToggleRight (size={18})
FiX → X (size={18})
```

---

#### 📄 `src/app/admin/produtos/[id]/page.tsx`

**Substitua:**
```tsx
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';
```

**Por:**
```tsx
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
```

**Atualize ícones:**
```tsx
<FiArrowLeft /> → <ArrowLeft size={20} />
<FiSave /> → <Save size={20} />
```

---

#### 📄 `src/app/admin/usuarios/page.tsx`

**Substitua:**
```tsx
import { FiArrowLeft, FiUsers, FiShield, FiSearch } from 'react-icons/fi';
```

**Por:**
```tsx
import { ArrowLeft, Users, Shield, Search } from 'lucide-react';
```

**Ícones:**
```tsx
FiArrowLeft → ArrowLeft (size={20})
FiUsers → Users (size={24})
FiShield → Shield (size={24})
FiSearch → Search (size={20})
```

---

#### 📄 `src/app/admin/relatorios/page.tsx`

**Substitua:**
```tsx
import { FiArrowLeft, FiTrendingUp, FiShoppingBag, FiDollarSign, FiPackage } from 'react-icons/fi';
```

**Por:**
```tsx
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign, Package } from 'lucide-react';
```

**Ícones:**
```tsx
FiArrowLeft → ArrowLeft (size={20})
FiTrendingUp → TrendingUp (size={24})
FiShoppingBag → ShoppingBag (size={24})
FiDollarSign → DollarSign (size={24})
FiPackage → Package (size={24})
```

---

#### 📄 `src/app/perfil/page.tsx`

**Substitua:**
```tsx
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEdit2, FiSave, FiX, FiLogIn, FiPlus } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';
```

**Por:**
```tsx
import { User, Mail, Phone, MapPin, Lock, Edit2, Save, X, LogIn, Plus } from 'lucide-react';
import { toast } from 'sonner';
```

**Mapeamento:**
```tsx
FiUser → User
FiMail → Mail
FiPhone → Phone
FiMapPin → MapPin
FiLock → Lock
FiEdit2 → Edit2
FiSave → Save
FiX → X
FiLogIn → LogIn
FiPlus → Plus
```

---

### Passo 3: Atualizar Componentes Restantes

#### 📄 `src/components/SearchBar/SearchBar.tsx`

```tsx
// Antes
import { FiSearch, FiX } from 'react-icons/fi';

// Depois
import { Search, X } from 'lucide-react';

// Ícones
<FiSearch /> → <Search size={20} />
<FiX /> → <X size={18} />
```

---

#### 📄 `src/components/ReviewCard/ReviewCard.tsx`

```tsx
// Antes
import { FiThumbsUp } from 'react-icons/fi';

// Depois
import { ThumbsUp } from 'lucide-react';

// Ícone
<FiThumbsUp /> → <ThumbsUp size={18} />
```

---

#### 📄 `src/components/AddressForm/AddressForm.tsx`

```tsx
// Antes
import { FiX, FiLoader } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';

// Depois
import { X, Loader } from 'lucide-react';
import { toast } from 'sonner';

// Ícones
<FiX /> → <X size={20} />
<FiLoader /> → <Loader size={20} className="animate-spin" />
```

---

#### 📄 `src/app/promocoes/page.tsx`

```tsx
// Antes
import { FiTrendingUp, FiZap } from 'react-icons/fi';

// Depois
import { TrendingUp, Zap } from 'lucide-react';

// Ícones
<FiTrendingUp /> → <TrendingUp size={20} />
<FiZap /> → <Zap size={20} />
```

---

## 📋 Checklist de Implementação

```
Arquivos Atualizados:
✅ src/components/Toast/Toast.tsx
✅ src/components/Footer/Footer.tsx
✅ src/components/WhatsAppButton/WhatsAppButton.tsx
✅ src/app/carrinho/page.tsx
✅ src/app/admin/produtos/page.tsx
✅ src/app/admin/cupons/page.tsx

A Completar:
□ src/app/layout.tsx (adicionar Toaster)
□ src/app/admin/pedidos/page.tsx
□ src/app/admin/promocoes/page.tsx
□ src/app/admin/produtos/[id]/page.tsx
□ src/app/admin/usuarios/page.tsx
□ src/app/admin/relatorios/page.tsx
□ src/app/perfil/page.tsx
□ src/components/SearchBar/SearchBar.tsx
□ src/components/ReviewCard/ReviewCard.tsx
□ src/components/AddressForm/AddressForm.tsx
□ src/app/promocoes/page.tsx
```

---

## 🧪 Teste Rápido

Após adicionar Toaster ao layout:

```tsx
// Em qualquer página
import { toast } from 'sonner';

// Teste
toast.success('✨ Tudo funcionando!');
```

---

## 📚 Referência Rápida de Ícones

### Ícones Mais Comuns
```tsx
import {
  Plus,           // Adicionar
  Edit,           // Editar
  Trash2,         // Deletar
  Eye,            // Ver
  EyeOff,         // Ocultar
  Search,         // Pesquisa
  ChevronDown,    // Dropdown
  ArrowLeft,      // Voltar
  ArrowRight,     // Próximo
  Check,          // Confirmado
  X,              // Fechar/Cancelar
  AlertCircle,    // Alerta
  Info,           // Informação
  Package,        // Envio/Produto
  ShoppingCart,   // Carrinho
  Heart,          // Favorito
  Star,           // Avaliação
  MapPin,         // Localização
  Phone,          // Telefone
  Mail,           // Email
  User,           // Usuário
  LogOut,         // Logout
  Settings,       // Configurações
  TrendingUp,     // Tendência
  DollarSign,     // Preço
  Percent,        // Desconto
} from 'lucide-react';
```

---

## 💡 Pro Tips

### 1. Buscar Ícone Rapidamente
Vá para [lucide.dev](https://lucide.dev/) e pesquise

### 2. Tamanho Padrão
```tsx
size={20}  // Default para a maioria dos casos
```

### 3. Animação de Carregamento
```tsx
<Loader className="animate-spin" size={20} />
```

### 4. Ícone + Texto
```tsx
<Plus size={20} className="mr-2" /> Adicionar
```

---

## 🎯 Ordem Recomendada de Implementação

1. ✅ **Configurar layout.tsx** (Toaster)
2. **Admin - Pedidos**
3. **Admin - Promoções**
4. **Admin - Produtos (editar)**
5. **Admin - Usuários**
6. **Admin - Relatórios**
7. **Perfil**
8. **Componentes restantes**
9. **Testes finais**

---

## 🆘 Se der Erro

### Erro: "Cannot find module 'lucide-react'"
```bash
npm install lucide-react
```

### Erro: "Cannot find module 'sonner'"
```bash
npm install sonner
```

### Toast não aparece
Verifique se `<Toaster />` está em `layout.tsx`

### Ícone muito pequeno
Adicione `size={20}` ou maior

---

*Estimado: 30-45 minutos para completar*

Documentos de referência:
- [GUIA-ALERTAS-ICONES.md](./GUIA-ALERTAS-ICONES.md)
- [MUDANCAS-ALERTAS-ICONES.md](./MUDANCAS-ALERTAS-ICONES.md)
- [RESUMO-IMPLEMENTACAO.md](./RESUMO-IMPLEMENTACAO.md)
