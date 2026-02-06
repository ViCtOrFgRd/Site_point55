# 🔧 Guia Prático - Agentes de IA Corrigidos

## 📋 Checklist de Validação

### Antes de Usar

- [ ] Arquivo `.env` configurado com `OPENAI_API_KEY`
- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Git inicializado no projeto
- [ ] Pasta `tests/generated/` criada

### Validar Configuração

```bash
# Verificar se OPENAI_API_KEY está configurada
echo $OPENAI_API_KEY

# Ou no Windows PowerShell:
$env:OPENAI_API_KEY

# Testar importação de módulos
npm ls openai fs-extra dotenv
```

---

## 🚀 Exemplos de Uso

### 1. Gerar Testes Automaticamente

```bash
# Gera testes para todas as páginas principais
npm run test:ai-generate

# Saída esperada:
# 🚀 Iniciando geração automática de testes...
# 🤖 Analisando página: /produtos
# ✅ 14 cenários gerados para product-listing
# ✅ Teste gerado: tests/generated/product-listing.spec.ts (2450 bytes)
# ✅ Geração de testes concluída!
```

### 2. Monitorar Mudanças de Código

```bash
# Atualiza testes quando você modifica componentes
npm run test:ai-update watch

# Monitorará arquivos em:
# - frontend/src/components/
# - frontend/src/app/
# - backend/controllers/
# - backend/routes/
```

### 3. Verificar Cobertura de Testes

```bash
# Identifica arquivos sem testes e gera automaticamente
npm run test:ai-update coverage

# Saída esperada:
# 📊 Verificando cobertura de testes...
# ⚠️ 5 arquivos sem testes:
#    - frontend/src/components/NewComponent.tsx
#    - backend/controllers/newController.ts
# 🤖 Gerando testes para arquivos sem cobertura...
```

### 4. Analisar Falhas de Teste

```bash
# Análisa testes que falharam e sugere correções
npm run test:ai-analyze

# Saída esperada:
# 🤖 Analisando falhas de testes...
# ❌ 3 falhas encontradas
# 
# 📋 Analisando: Login > deve fazer login com credenciais inválidas
# 🔍 Causa: Elemento não encontrado após timeout
# 💡 Soluções:
#    1. Aumentar timeout do teste
#    2. Revisar seletor CSS
#    3. Adicionar wait implícito
```

---

## 🔍 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"

**Problema:**
```
Error: OPENAI_API_KEY não configurada no arquivo .env
```

**Solução:**
```bash
# 1. Criar arquivo .env
echo "OPENAI_API_KEY=sk-..." > .env

# 2. Ou copiar do exemplo
cp .env.example .env

# 3. Editar e adicionar sua chave
# Abrir .env e preencher OPENAI_API_KEY=sua_chave_aqui
```

---

### Erro: "Resposta da API em formato inválido"

**Problema:**
```
❌ Erro ao parsear resposta JSON: {...}
Error: Resposta da API em formato inválido
```

**Solução:**
```bash
# 1. Verificar quota da OpenAI
# Ir em: https://platform.openai.com/account/billing/overview

# 2. Verificar se chave está ativa
# Ir em: https://platform.openai.com/api/keys

# 3. Tentar novamente mais tarde (rate limiting)
# Aguarde alguns minutos e execute novamente

# 4. Usar modelo mais barato se necessário
OPENAI_MODEL=gpt-3.5-turbo npm run test:ai-generate
```

---

### Erro: "Arquivo de resultados não encontrado"

**Problema:**
```
⚠️ Arquivo de resultados não encontrado: path/to/results.json
```

**Solução:**
```bash
# 1. Executar testes primeiro para gerar results.json
npm run test

# 2. Ou criar estrutura de pastas
mkdir -p test-results

# 3. Então executar análise
npm run test:ai-analyze
```

---

### Erro: "Não foi possível extrair rota"

**Problema:**
```
⚠️ Não foi possível extrair rota de: path/to/file.tsx
```

**Solução:**
Arquivo está em estrutura não reconhecida. Suporte para:
- ✅ `frontend/src/app/[rota]/page.tsx` → `/[rota]`
- ✅ `frontend/src/pages/[rota].tsx` → `/[rota]`
- ❌ Outros padrões precisam de extensão

---

## 📊 Exemplos de Saída

### Teste Gerado com Sucesso

```typescript
// tests/generated/product-listing.spec.ts

import { test, expect } from '@playwright/test';
import { ProductPage } from '../helpers/page-objects/ProductPage';

test.describe('Listagem de Produtos', () => {
  let page: ProductPage;

  test.beforeEach(async ({ page: browserPage }) => {
    page = new ProductPage(browserPage);
    await page.goto('/produtos');
  });

  test('deve exibir lista de produtos', async () => {
    const productCount = await page.getProductCount();
    expect(productCount).toBeGreaterThan(0);
  });

  test('deve filtrar por categoria', async () => {
    await page.filterByCategory('Eletrônicos');
    const products = await page.getDisplayedProducts();
    expect(products.length).toBeGreaterThan(0);
  });

  // ... mais testes
});
```

### Análise de Falha

```json
{
  "causa": "Elemento não encontrado: O seletor CSS não corresponde a nenhum elemento na página",
  "solucoes": [
    "Aumentar timeout do wait até 10 segundos",
    "Revisar seletor para `.btn-login:visible`",
    "Adicionar retry com wait condicional"
  ],
  "codigoExemplo": "await page.click('.btn-login', { timeout: 10000 });",
  "prevencao": "Usar page objects com seletores testados",
  "prioridade": "crítica"
}
```

---

## 📈 Métricas e Monitoramento

### Verificar Progresso

```bash
# Total de testes gerados
find tests/generated -name "*.spec.ts" -exec wc -l {} + | tail -1

# Testes por página
ls -la tests/generated/*.spec.ts

# Últimas 5 testes gerados
ls -lt tests/generated/*.spec.ts | head -5
```

### Rodar Testes Gerados

```bash
# Todos os testes
npm run test

# Apenas testes gerados
npm run test -- tests/generated

# Com modo UI
npm run test:ui

# Específico
npm run test -- product-listing.spec.ts
```

---

## 🎯 Best Practices

### 1. Revisar Testes Gerados
```bash
# Sempre revisar antes de usar em CI/CD
code tests/generated/
# Verificar:
# - Seletores CSS corretos
# - Dados de teste válidos
# - Asserções apropriadas
```

### 2. Customizar Conforme Necessário
```typescript
// Agora que foi gerado, você pode:
// - Adicionar dados de teste específicos
// - Melhorar seletores
// - Adicionar mais assertions
// - Integrar com sua lógica
```

### 3. Usar em Pipeline CI/CD
```yaml
# .github/workflows/test.yml
- name: Generate E2E Tests
  run: npm run test:ai-generate

- name: Run E2E Tests
  run: npm run test

- name: Upload Report
  uses: actions/upload-artifact@v2
```

---

## 💡 Dicas Úteis

### Economizar em Custos de API

```bash
# Use modelo mais barato para desenvolvimento
OPENAI_MODEL=gpt-3.5-turbo npm run test:ai-generate

# Gere uma vez e customize manualmente
npm run test:ai-generate
# Edite tests/generated/ conforme necessário
```

### Debugar Erros da IA

```bash
# Adicionar logs detalhados
DEBUG=true npm run test:ai-generate

# Verificar resposta bruta da API
# Edite o arquivo e adicione:
console.log('Raw API response:', content);
```

---

## ✅ Checklist Pós-Execução

- [ ] Testes foram gerados
- [ ] Nenhum arquivo de teste vazio
- [ ] Seletores CSS estão corretos
- [ ] Testes rodam sem erro
- [ ] Taxa de sucesso > 90%
- [ ] Logs não contêm erros críticos
- [ ] Resultados foram salvos em test-results/

