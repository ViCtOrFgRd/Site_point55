# Backend - Configuração de Frete Implementada

## Resumo da Implementação

Foi implementado um sistema completo de configuração de frete baseado em tipos de produto e caixas padronizadas P/M/G.

---

## Estrutura de Banco de Dados

### Tabelas Criadas

#### `caixas_catalogo`
Catálogo de caixas disponíveis (P/M/G) com medidas padronizadas.

**Campos:**
- `id` - ID único
- `codigo` - Código alfanumérico único (ex: P1, M2, G3)
- `nome` - Nome descritivo
- `tamanho` - P, M ou G
- `altura`, `largura`, `comprimento` - Dimensões em cm
- `peso_caixa` - Peso da caixa vazia em kg
- `ativo` - Se está disponível para uso
- `created_at`, `updated_at` - Timestamps

**Seed inicial:** 9 caixas (3P, 3M, 3G)

#### `config_fallback_frete`
Configuração padrão para tipos sem regras específicas.

**Campos:**
- `id` - ID único
- `tamanho` - P, M ou G (único)
- `caixa_id` - Referência para caixas_catalogo
- `capacidade_media` - Quantidade média de itens
- `peso_medio_item` - Peso médio por item em kg
- `updated_at` - Timestamp

**Seed inicial:** 3 configurações (P: 1 item, M: 3 itens, G: 6 itens)

#### `tipos_produto`
Tipos de produto (tênis, camiseta, perfume, etc).

**Campos:**
- `id` - ID único
- `nome` - Nome do tipo
- `codigo` - Código único
- `ativo` - Se está ativo
- `created_at`, `updated_at` - Timestamps

**Seed inicial:** 6 tipos (tenis, camiseta, calca, bone, perfume, acessorio)

#### `config_embalagem_tipo`
Configuração de embalagem por tipo de produto (3 linhas P/M/G por tipo).

**Campos:**
- `id` - ID único
- `tipo_produto_id` - Referência para tipos_produto
- `tamanho` - P, M ou G
- `caixa_id` - Referência para caixas_catalogo
- `capacidade` - Quantidade de itens
- `peso_medio_item` - Peso médio por item em kg
- `observacoes` - Observações internas
- `updated_at` - Timestamp
- **Constraint:** Único por (tipo_produto_id, tamanho)

#### Alteração em `produtos`
- `tipo_produto_id` - Referência para tipos_produto (nullable)

---

## APIs Implementadas

### 1. Caixas do Catálogo

**Base URL:** `/api/admin/caixas-catalogo`

#### `GET /` - Listar caixas
**Query params:**
- `tamanho` - Filtrar por P/M/G
- `ativo` - true/false

**Response:**
```json
{
  "success": true,
  "count": 9,
  "data": [...]
}
```

#### `GET /:id` - Obter caixa específica

#### `GET /:id/uso` - Verificar uso da caixa
Retorna onde a caixa está sendo usada (fallback ou tipos).

#### `POST /` - Criar caixa
**Body:**
```json
{
  "codigo": "P4",
  "nome": "Pequena 4",
  "tamanho": "P",
  "altura": 15,
  "largura": 20,
  "comprimento": 25,
  "peso_caixa": 0.2
}
```

#### `PUT /:id` - Atualizar caixa
**Body:** Campos opcionais (nome, altura, largura, comprimento, peso_caixa, ativo)

#### `PATCH /:id/desativar` - Desativar caixa
Bloqueia se estiver em uso.

---

### 2. Configuração Fallback

**Base URL:** `/api/admin/config-frete`

#### `GET /fallback` - Obter config fallback
**Response:**
```json
{
  "success": true,
  "data": {
    "P": {
      "tamanho": "P",
      "caixa_id": 1,
      "capacidade_media": 1,
      "peso_medio_item": 0.5,
      "caixa": {
        "codigo": "P1",
        "nome": "Pequena 1",
        "altura": 10,
        "largura": 15,
        "comprimento": 20,
        "peso_caixa": 0.1
      }
    },
    "M": {...},
    "G": {...}
  }
}
```

#### `PUT /fallback` - Atualizar config fallback
**Body:**
```json
{
  "P": {
    "caixa_id": 1,
    "capacidade_media": 1,
    "peso_medio_item": 0.5
  },
  "M": {
    "caixa_id": 4,
    "capacidade_media": 3,
    "peso_medio_item": 0.5
  },
  "G": {
    "caixa_id": 7,
    "capacidade_media": 6,
    "peso_medio_item": 0.5
  }
}
```

---

### 3. Tipos de Produto

**Base URL:** `/api/admin/tipos-produto`

#### `GET /` - Listar tipos
**Query params:**
- `ativo` - true/false

#### `GET /:id` - Obter tipo específico

#### `POST /` - Criar tipo
**Body:**
```json
{
  "nome": "Chapéu",
  "codigo": "chapeu"
}
```

#### `PUT /:id` - Atualizar tipo
**Body:** Campos opcionais (nome, ativo)

---

### 4. Configuração de Embalagem por Tipo

**Base URL:** `/api/admin/tipos-produto/:id/embalagem`

#### `GET /:id/embalagem` - Obter config de embalagem
**Response:**
```json
{
  "success": true,
  "data": {
    "tipo": {
      "id": 1,
      "nome": "Tênis",
      "codigo": "tenis"
    },
    "embalagens": {
      "P": {
        "tamanho": "P",
        "caixa_id": 2,
        "capacidade": 1,
        "peso_medio_item": 0.9,
        "observacoes": null,
        "caixa": {...}
      },
      "M": {...},
      "G": {...}
    }
  }
}
```

#### `PUT /:id/embalagem` - Atualizar config de embalagem
**Body:**
```json
{
  "P": {
    "caixa_id": 2,
    "capacidade": 1,
    "peso_medio_item": 0.9,
    "observacoes": "Caixa para 1 tênis"
  },
  "M": {
    "caixa_id": 4,
    "capacidade": 2,
    "peso_medio_item": 0.9,
    "observacoes": null
  },
  "G": {
    "caixa_id": 7,
    "capacidade": 4,
    "peso_medio_item": 0.9,
    "observacoes": null
  }
}
```

**Validações:**
- Capacidades P, M, G devem ser diferentes
- Caixas devem estar ativas
- Todos os campos obrigatórios devem estar presentes

#### `POST /:id/embalagem/duplicar` - Duplicar config de outro tipo
**Body:**
```json
{
  "tipo_origem_id": 1
}
```

Copia a configuração de embalagem do tipo origem para o tipo destino.

---

## Serviço de Empacotamento

**Arquivo:** `backend/services/embalagemService.js`

### Funções Principais

#### `calcularVolumes(quantidade, configP, configM, configG)`
Calcula volumes necessários para uma quantidade de itens usando configs P/M/G.

**Algoritmo:**
1. Ordena caixas por capacidade (maior → menor)
2. Usa a maior caixa que cabe exatamente
3. Se sobrar, completa com a menor caixa (P)
4. Consolida volumes iguais

**Retorno:**
```javascript
[
  {
    caixa_id: 7,
    tamanho: 'G',
    quantidade_caixas: 2,
    capacidade: 4,
    peso_unitario: 4.2,
    peso_total: 8.4,
    dimensoes: {
      altura: 35,
      largura: 40,
      comprimento: 45,
      peso: 4.2
    }
  }
]
```

#### `obterConfigEmbalagem(tipoProdutoId)`
Obtém config de embalagem para um tipo. Se não existir, retorna fallback.

#### `calcularVolumesFrete(itens)`
Calcula volumes de frete para itens de um pedido.

**Parâmetro:**
```javascript
[
  { produto_id: 1, quantidade: 4, tipo_produto_id: 1 },
  { produto_id: 2, quantidade: 2, tipo_produto_id: 2 }
]
```

**Processo:**
1. Agrupa itens por tipo
2. Calcula volumes para cada grupo
3. Consolida volumes iguais

#### `formatarParaServicoFrete(volumes)`
Formata volumes para envio ao serviço de frete (Superfrete, Correios, etc).

**Retorno:**
```javascript
[
  {
    height: 35,
    width: 40,
    length: 45,
    weight: 4.2
  },
  {
    height: 35,
    width: 40,
    length: 45,
    weight: 4.2
  }
]
```

---

## Exemplo de Uso no Checkout

```javascript
const embalagemService = require('./services/embalagemService');

// Itens do carrinho
const itens = [
  { produto_id: 1, quantidade: 4, tipo_produto_id: 1 }, // 4 tênis
  { produto_id: 2, quantidade: 3, tipo_produto_id: 2 }  // 3 camisetas
];

// Calcular volumes
const volumes = await embalagemService.calcularVolumesFrete(itens);

// Formatar para serviço de frete
const volumesFormatados = embalagemService.formatarParaServicoFrete(volumes);

// Enviar para API de frete (Superfrete, etc)
const frete = await superfreteService.calcularFrete({
  cep_destino: '12345-678',
  volumes: volumesFormatados
});
```

---

## Autenticação

Todas as rotas admin requerem:
1. **Autenticação:** Header `Authorization: Bearer <token>`
2. **Permissão:** Usuário deve ser admin

---

## Migration

**Arquivo:** `backend/migrations/008-add-config-frete.sql`

Para aplicar:
```bash
# Via psql
psql -U postgres -d nome_do_banco -f backend/migrations/008-add-config-frete.sql

# Ou via node
node backend/scripts/run-migration.js 008-add-config-frete.sql
```

---

## Próximos Passos

1. ✅ Criar tabelas
2. ✅ Implementar endpoints das caixas
3. ✅ Implementar endpoints config fallback
4. ✅ Implementar endpoints config por tipo
5. ✅ Implementar algoritmo de empacotamento
6. ⏳ Criar tela admin - catálogo de caixas
7. ⏳ Criar tela admin - config fallback
8. ⏳ Criar tela admin - config por tipo
9. ⏳ Integrar com cálculo de frete no checkout

---

## Arquivos Criados/Modificados

### Criados:
- `backend/migrations/008-add-config-frete.sql`
- `backend/controllers/caixaController.js`
- `backend/controllers/configFreteController.js`
- `backend/controllers/tipoProdutoController.js`
- `backend/routes/caixas.js`
- `backend/routes/configFrete.js`
- `backend/routes/tiposProduto.js`
- `backend/services/embalagemService.js`

### Modificados:
- `backend/server.js` - Adicionadas rotas para caixas, config frete e tipos produto
