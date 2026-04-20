# 🧪 GUIA DE VALIDAÇÃO CONTÍNUA - FRETE COM EMBALAGEM

**Objetivo:** Procedimentos para validar e monitorar a integridade da integração.

---

## ✅ TESTE RÁPIDO (5 minutos)

Para validar rapidamente que tudo está funcionando:

```bash
# 1. Navegar para o diretório backend
cd backend

# 2. Executar suite de testes
node test-integracao-frete-embalagem.js

# 3. Esperado: 4/4 testes PASSING
```

**O que validar:**
- ✅ Teste 1: Valor deve ser 17.97 (SEDEX)
- ✅ Teste 2: Valor deve ser 0 (frete_gratis)
- ✅ Teste 3: Valor deve ser 14.09 (SEDEX)
- ✅ Teste 4: Valor deve ser 0 (frete_gratis)

---

## 🔍 VALIDAÇÃO DE BANCO DE DADOS (10 minutos)

Verificar se as configurações estão corretas:

### 1. Verificar Config Fallback
```sql
SELECT id, tamanho, caixa_id, capacidade_media, peso_medio_item, ativo 
FROM config_fallback_frete 
ORDER BY tamanho DESC;
```

**Esperado:**
- 3 registros: P, M, G
- Todos com `ativo = true`
- `caixa_id`: 1 (P), 4 (M), 7 (G)

### 2. Verificar Caixas Catalogo
```sql
SELECT id, nome, altura, largura, comprimento, peso_caixa, ativo 
FROM caixas_catalogo 
WHERE ativo = true
ORDER BY id;
```

**Esperado:**
- Mínimo 9 caixas (P1-P3, M1-M3, G1-G3)
- Todas com dimensões > 0
- Todas com `ativo = true`

### 3. Verificar Config por Tipo
```sql
SELECT tipo_produto_id, COUNT(*) as quantidade
FROM config_embalagem_tipo
WHERE ativo = true
GROUP BY tipo_produto_id;
```

**Esperado:**
- Cada tipo tem 3 configurações (P, M, G)
- Mínimo 2 tipos configurados

### 4. Verificar Produtos com Tipo
```sql
SELECT COUNT(*) as produtos_com_tipo 
FROM produtos 
WHERE tipo_produto_id IS NOT NULL AND ativo = true;
```

**Esperado:**
- Mínimo alguns produtos com tipo configurado

---

## 🐛 DIAGNÓSTICO DE ERROS

### Erro: "Config vazia para tipo X"
```
Causa: Query SELECT retornou 0 ou 1 registros
Solução:
1. Verificar config_embalagem_tipo tem 3 registros para tipo X
2. Verificar caixas_catalogo tem IDs referenciados ativos
3. Recarregar seed data se necessário
```

### Erro: "Nenhuma configuração de fallback encontrada"
```
Causa: config_fallback_frete vazia ou com ativo=false
Solução:
1. Executar: SELECT * FROM config_fallback_frete;
2. Verificar se tem 3 registros
3. Recarregar seed data se necessário
```

### Erro: "Erro ao calcular frete no SuperFrete"
```
Causa: Múltiplas possibilidades
Verificar:
1. Logs do servidor (console.error)
2. Resposta da API Superfrete
3. Formato de payload enviado
4. Validação de CEP
```

---

## 📊 MONITORAMENTO EM PRODUÇÃO

### Logs a Acompanhar

Quando houver requisição de cálculo de frete com itens, verificar console:

```javascript
// Início do processamento
📊 calcularVolumesFrete iniciado com itens: [...]

// Agrupamento por tipo
📦 Grupos criados: { tipo1: {...}, tipo2: {...} }

// Obtenção de configuração
🔍 obterConfigEmbalagem chamado com tipoProdutoId: 1
   Configuração tipo-específica encontrada: 3 registros
   ✅ Config específica retornada para tipo 1

// Cálculo de volumes
   Processando grupo tipo=1, quantidade=5
   ✅ 2 volumes calculados para tipo 1

// Consolidação
📦 Total de volumes antes consolidação: 3
✅ 2 volumes após consolidação
```

### Sinais de Alerta

- ⚠️ `Configuração tipo-específica encontrada: 1 registros` → Faltan registros
- ⚠️ `Usando configuração fallback...` → Nenhum tipo foi usado
- ❌ `Erro ao calcular volumes automaticamente` → Exceção na embalagemService
- ❌ `ERRO NA FUNÇÃO calcularFrete` → Erro geral no controller

---

## 🔄 FLUXO DE VALIDAÇÃO PARA NOVAS FEATURES

Quando adicionar novos tipos de produtos:

### 1. Criar Tipo de Produto
```sql
INSERT INTO tipos_produto (nome, descricao, ativo)
VALUES ('Novo Tipo', 'Descrição', true);
-- Anotação: novo tipo_id = X
```

### 2. Configurar Embalagem para Tipo
```sql
INSERT INTO config_embalagem_tipo (tipo_produto_id, caixa_id, tamanho, capacidade, peso_medio_item, ativo)
VALUES 
  (X, 1, 'P', 3, 0.100, true),
  (X, 4, 'M', 6, 0.150, true),
  (X, 7, 'G', 12, 0.200, true);
```

### 3. Adicionar Produtos com Novo Tipo
```sql
UPDATE produtos 
SET tipo_produto_id = X 
WHERE id IN (produto1_id, produto2_id);
```

### 4. Testar Manualmente
```javascript
const itens = [
  { produto_id: produto1_id, quantidade: 5, tipo_produto_id: X }
];

// Chamar API de frete com estes itens
POST /api/superfrete/calcular
{
  cep_destino: "01310100",
  subtotal: 100,
  itens: itens
}
```

### 5. Validar Resultado
- ✅ Deve calcular volumes usando nova config
- ✅ Deve retornar cotações válidas
- ✅ Deve estar visível nos logs

---

## 📈 TESTES DE REGRESSÃO

Executar regularmente para garantir não houver breaking changes:

### Teste 1: Legacy Still Works
```bash
# Enviar frete SEM itens array (usar dimensões manuais)
POST /api/superfrete/calcular
{
  cep_destino: "01310100",
  peso: 1.5,
  altura: 15,
  largura: 20,
  comprimento: 25
}

# Esperado: Deve funcionar como antes
```

### Teste 2: Compatibilidade com Tipos Existentes
```bash
# Testar cada tipo_produto_id existente
POST /api/superfrete/calcular
{
  cep_destino: "01310100",
  subtotal: 100,
  itens: [
    { produto_id: 1, quantidade: 3, tipo_produto_id: 1 }
  ]
}

# Esperado: Retornar frete sem erros
```

### Teste 3: Fallback Sem Tipo
```bash
# Usar produto sem tipo_produto_id
POST /api/superfrete/calcular
{
  cep_destino: "01310100",
  subtotal: 100,
  itens: [
    { produto_id: 999, quantidade: 5, tipo_produto_id: null }
  ]
}

# Esperado: Usar config_fallback_frete, retornar frete válido
```

### Teste 4: Frete Gratis Threshold
```bash
# Subtotal >= 200
POST /api/superfrete/calcular
{
  cep_destino: "01310100",
  subtotal: 250,
  itens: [...]
}

# Esperado: Retornar servico: "frete_gratis"
```

---

## 🛠️ MANUTENÇÃO DO SISTEMA

### Ao Recarregar Seed Data

Se precisar recarregar tudo do zero:

```sql
-- 1. Limpar tabelas
DELETE FROM config_embalagem_tipo;
DELETE FROM config_fallback_frete;
DELETE FROM tipos_produto;
DELETE FROM caixas_catalogo;

-- 2. Recarregar do arquivo de seed
-- Executar arquivo: backend/seeds/NOME_SEED.sql
-- ou
-- Node: node scripts/seed-database.js
```

### Ao Atualizar Dimensões de Caixa

```sql
UPDATE caixas_catalogo 
SET altura = 12, largura = 16, comprimento = 21
WHERE id = 1;

-- Validar: Testar cálculo de frete deve usar novas dimensões
```

### Ao Alterar Capacidade de Embalagem

```sql
UPDATE config_fallback_frete 
SET capacidade_media = 5
WHERE tamanho = 'M';

UPDATE config_embalagem_tipo 
SET capacidade = 5
WHERE tamanho = 'M';

-- Validar: Testes de volume devem resultar em diferente quantidade de caixas
```

---

## 📋 CHECKLIST PRE-DEPLOY

Antes de fazer deploy:

- [ ] Executar `test-integracao-frete-embalagem.js` → Todos 4 passando
- [ ] Verificar logs para "ERRO NA FUNÇÃO calcularFrete"
- [ ] Validar configuração de fallback no banco
- [ ] Testar com tipo_produto_id = null
- [ ] Testar com frete gratis (subtotal >= 200)
- [ ] Validar resposta da API Superfrete
- [ ] Verificar compatibilidade com cliente antigo

---

## 🎯 MATRIZ DE VALIDAÇÃO

| Cenário | Entrada | Esperado | Como Validar |
|---------|---------|----------|--------------|
| Método Antigo | peso, altura, largura, comprimento | Frete válido | Teste 1 deveria retornar 17.97 |
| Com Tipo | itens com tipo_produto_id = 1,2 | Volumes calculados | Teste 2 deveria retornar 0 (frete gratis) |
| Sem Tipo | itens com tipo_produto_id = null | Fallback usado | Teste 3 deveria retornar 14.09 |
| Frete Gratis | subtotal >= 200 | servico = frete_gratis | Teste 4 deveria retornar 0 |

---

**Última Atualização:** 2024
**Responsável:** DevOps
**Frequência de Validação:** Diária (automatizada) / Semanal (manual)

