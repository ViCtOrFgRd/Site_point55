# 🎨 Guia de Variações - Cores e Tamanhos

## Visão Geral

Sistema melhorado para gerenciar variações de produtos com suporte a:
- ✅ Cores simples (Preto, Branco, Azul, etc.)
- ✅ Variações de cores com gradiente (Branco/Azul, Vermelho/Amarelo)
- ✅ Tamanhos padrão (P, M, G, GG)

---

## 1️⃣ Cores Disponíveis

### Cores Básicas Suportadas

| Nome | Hex | Exemplo |
|------|-----|---------|
| **Preto** | #000000 | ⬛ |
| **Branco** | #FFFFFF | ⬜ |
| **Cinza** | #808080 | 🟫 (escuro) |
| **Cinza-claro** | #D3D3D3 | ⬜ (claro) |
| **Cinza-escuro** | #404040 | ⬛ (escuro) |
| **Azul** | #0066CC | 🔵 |
| **Azul-claro** | #87CEEB | 🔵 (claro) |
| **Azul-escuro** | #00008B | 🔵 (escuro) |
| **Vermelho** | #FF0000 | 🔴 |
| **Vermelho-escuro** | #8B0000 | 🔴 (escuro) |
| **Verde** | #008000 | 🟢 |
| **Verde-claro** | #90EE90 | 🟢 (claro) |
| **Verde-escuro** | #006400 | 🟢 (escuro) |
| **Amarelo** | #FFFF00 | 🟡 |
| **Laranja** | #FFA500 | 🟠 |
| **Rosa** | #FFC0CB | 💗 |
| **Rosa-escuro** | #DB7093 | 💗 (escuro) |
| **Roxo** | #800080 | 🟣 |
| **Marrom** | #8B4513 | 🟤 |
| **Bege** | #F5F5DC | 🟨 (claro) |
| **Ouro** | #FFD700 | ✨ |
| **Prata** | #C0C0C0 | ✨ |
| **Turquesa** | #40E0D0 | 🌊 |
| **Teal** | #008080 | 🌊 (escuro) |
| **Coral** | #FF7F50 | 🌅 |
| **Khaki** | #F0E68C | 🟨 |
| **Salmon** | #FA8072 | 🎣 |
| **Chocolate** | #D2691E | 🍫 |

---

## 2️⃣ Variações de Cores (Gradientes)

Para produtos que combinam **duas ou mais cores**, use o formato com `/`:

### Exemplos de Variações

```
Branco/Azul         → Bolinha dividida 50% branco, 50% azul
Vermelho/Amarelo    → Bolinha dividida 50% vermelho, 50% amarelo
Preto/Branco        → Bolinha dividida 50% preto, 50% branco
Verde/Amarelo       → Bolinha dividida 50% verde, 50% amarelo
```

### Como Adicionar Variações no Admin

1. **Abrir página de edição do produto**
2. **Seção "Variações"** → **"Cores Disponíveis"**
3. **Campo de entrada**: Digite a combinação com `/`
   - Exemplo: `Branco/Azul`
   - Exemplo: `Vermelho/Amarelo`
4. **Clique em "Adicionar"**
5. A cor aparecerá como uma bolinha com gradiente

### Visual no Frontend

```
Cores simples:           Variações com /
⬛ ⬜ 🔵 🔴            🟠 (branco-azul) 🟠 (vermelho-amarelo)
```

---

## 3️⃣ Tamanhos Disponíveis

Use os padrões recomendados:

```
P    → Pequeno
M    → Médio
G    → Grande
GG   → Muito Grande
Único → Tamanho único
```

Ou personalize conforme necessário:
```
XP    → Extra Pequeno
Único → Tamanho Único
Infantil → Tamanho Infantil
```

---

## 4️⃣ Fluxo Completo - Adicionar Produto com Variações

### Passo 1: Informações Básicas
- Nome: `Camiseta Listrada`
- Descrição: `Camiseta com cores combinadas`
- Categoria: Roupas

### Passo 2: Cores
```
Adicionar cores uma por uma:
1. Preto
2. Branco
3. Branco/Azul      ← Variação com gradiente
4. Vermelho/Amarelo ← Variação com gradiente
```

**Resultado visual na listagem:**
```
🔴 ⚪ 🟤 🟠
```

### Passo 3: Tamanhos
```
Adicionar tamanhos:
1. P
2. M
3. G
4. GG
```

### Passo 4: Salvar
- Clique em "Salvar Produto"
- Produto estará disponível com todas as variações

---

## 5️⃣ Visualização no Carrinho e Checkout

### Seleção de Cores
- **Simples**: Bolinhas com cores sólidas
- **Variações**: Bolinhas com gradiente diagonal

### Seleção de Tamanhos
- Botões com os tamanhos disponíveis
- Seleção com validação

### Exemplo de Produto:
```
Produto: Camiseta Listrada
├─ Cores:   ⬛ ⬜ (🔵⬜) (🔴🟡)
├─ Tamanhos: P, M, G, GG
└─ Preço: R$ 49,90
```

---

## 6️⃣ Guia de Nomes de Cores

### ✅ CORRETO - Exemplo
```
Preto
Branco
Azul
Preto/Branco
Branco/Azul
```

### ❌ INCORRETO - Evitar
```
#000000        (use "Preto" em vez disso)
rgb(0, 0, 0)   (use "Preto" em vez disso)
black          (use "Preto" em vez disso)
0000ff         (use "Azul" em vez disso)
```

---

## 7️⃣ Casos de Uso Comuns

### Camisetas/Polos
```
Cores: Preto, Branco, Azul, Vermelho, Verde
Tamanhos: P, M, G, GG, XG
```

### Bonés
```
Cores: Preto, Branco, Azul, Preto/Branco, Preto/Vermelho
Tamanhos: Único
```

### Jaquetas
```
Cores: Preto, Branco, Cinza, Azul, Preto/Azul, Cinza/Branco
Tamanhos: P, M, G, GG
```

### Tênis
```
Cores: Preto, Branco, Azul, Preto/Branco, Azul/Branco
Tamanhos: 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44
```

---

## 8️⃣ Dicas de Uso

### ✨ Boas Práticas

1. **Nomes Consistentes**
   - Use sempre a primeira letra maiúscula: `Azul` (não `azul`)
   - Separe cores com `/` para variações: `Preto/Branco`

2. **Combinações Visualmente Bonitas**
   - Preto/Branco (clássico)
   - Branco/Azul (moderno)
   - Vermelho/Amarelo (vibrante)
   - Cinza/Preto (sofisticado)

3. **Ordem de Exibição**
   - A primeira cor listada aparece como "dominante"
   - Exemplo: `Branco/Azul` mostra o branco como cor principal no gradiente

4. **Limitação de Cores**
   - Recomenda-se não exceder 5-7 cores por produto
   - Facilita a visualização e reduz confusão do cliente

---

## 9️⃣ Solução de Problemas

### Problema: Cores não aparecem com gradiente

**Solução:**
- Verifique se o nome da cor está EXATAMENTE como na tabela (maiúsculas/minúsculas)
- Use `/` sem espaços extras: `Branco/Azul` (não `Branco / Azul`)

### Problema: Cores aparecem cinzas

**Solução:**
- A cor pode não estar mapeada no sistema
- Adicione a cor à tabela em `colorMapping.ts`
- Ou use uma cor similar que exista

### Problema: Gradiente não é diagonal

**Solução:**
- Gradiente é aplicado a 135 graus (diagonal)
- Isto é intencional para melhor visualização
- Não pode ser alterado sem modificar código

---

## 🔟 Adicionando Novas Cores (Para Developers)

Se precisar adicionar novas cores, edite o arquivo `colorMapping.ts`:

```typescript
const colorMap: Record<string, string> = {
  // ...cores existentes...
  'MinhaCorNova': '#ABC123',  // Adicionar aqui
};
```

Depois será possível usar:
```
MinhaCorNova
Branco/MinhaCorNova
```

---

## Resumo Rápido

| Tipo | Exemplo | Onde Usar |
|------|---------|-----------|
| **Cor Simples** | `Azul` | Roupas, calçados, acessórios |
| **Variação 2 Cores** | `Branco/Azul` | Bolsas, camisetas listradas |
| **Variação 3+ Cores** | `Preto/Branco/Azul` | Camisetas coloridas, customizadas |
| **Tamanho** | `P`, `M`, `G` | Todos os produtos com variação |

---

**Última atualização:** 6 de fevereiro de 2026  
**Versão:** 1.0
