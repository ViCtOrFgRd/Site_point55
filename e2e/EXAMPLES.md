# 📚 Exemplos de Uso - Testes E2E com IA

## 1. Executando Primeiro Teste

```bash
# Instalar dependências
cd e2e
npm install
npm run install-browsers

# Configurar ambiente
cp .env.example .env
# Editar .env e adicionar OPENAI_API_KEY

# Executar teste simples
npm test auth.spec.ts
```

## 2. Gerando Testes com IA

### 2.1. Gerar testes para todas as páginas

```bash
npm run test:ai-generate
```

Resultado:
```
🚀 Iniciando geração automática de testes...

🤖 Analisando página: /produtos
✅ 12 cenários gerados para product-listing
✅ Teste gerado: tests/generated/product-listing.spec.ts

🤖 Analisando página: /carrinho
✅ 8 cenários gerados para cart
✅ Teste gerado: tests/generated/cart.spec.ts

✅ Geração de testes concluída!
```

### 2.2. Gerar teste para componente específico

Crie um script personalizado:

```javascript
// scripts/generate-component-test.js
const { TestGeneratorAgent } = require('../ai-agent/generate-tests');
const fs = require('fs');

async function main() {
  const agent = new TestGeneratorAgent();
  
  // Lê código do componente
  const componentPath = '../frontend/src/components/ProductCard/ProductCard.tsx';
  const componentCode = fs.readFileSync(componentPath, 'utf-8');
  
  // Gera testes
  await agent.analyzeComponentAndGenerateTests(componentPath, componentCode);
}

main();
```

## 3. Analisando Falhas com IA

### 3.1. Executar testes e analisar falhas

```bash
# Executar testes (alguns podem falhar)
npm test

# Analisar falhas com IA
npm run test:ai-analyze
```

Saída:
```
🤖 Analisando falhas de testes...

❌ 3 falhas encontradas

📋 Analisando: Autenticação > deve fazer login

🔍 Causa: Timeout ao aguardar seletor 'button:has-text("Entrar")'

💡 Soluções:
   1. Aumentar timeout para 30 segundos
   2. Usar seletor mais específico [data-testid="login-button"]
   3. Aguardar página carregar completamente antes de clicar

📝 Código de exemplo:
await page.waitForLoadState('networkidle');
await page.locator('[data-testid="login-button"]').click({ timeout: 30000 });

🛡️ Prevenção: Sempre use data-testid em botões críticos

⚠️ Prioridade: CRÍTICA

✅ Relatório salvo em: test-results/failure-report.md
```

### 3.2. Ver relatório consolidado

```bash
cat test-results/failure-report.md
```

## 4. Atualização Automática de Testes

### 4.1. Atualizar testes após mudanças no código

```bash
# Fazer alterações no código
git add .

# Detectar mudanças e atualizar testes
npm run test:ai-update watch
```

Saída:
```
👁️ Monitorando mudanças no código...

📝 2 arquivos alterados:
   - frontend/src/components/ProductCard/ProductCard.tsx
   - backend/controllers/produtoController.js

🔄 Processando: frontend/src/components/ProductCard/ProductCard.tsx
🤖 Analisando página: ProductCard
✅ Teste de componente atualizado

🔄 Processando: backend/controllers/produtoController.js
✅ Teste de API atualizado

✅ Atualização de testes concluída!
```

### 4.2. Verificar cobertura de testes

```bash
npm run test:ai-update coverage
```

Saída:
```
📊 Verificando cobertura de testes...

⚠️ 5 arquivos sem testes:
   - frontend/src/components/Newsletter/Newsletter.tsx
   - frontend/src/components/Footer/Footer.tsx
   - backend/controllers/newsletterController.js
   - backend/routes/newsletter.js
   - frontend/src/utils/formatters.ts

🤖 Gerando testes para arquivos sem cobertura...

✅ Teste gerado para Newsletter.tsx
✅ Teste gerado para Footer.tsx
✅ Teste gerado para newsletterController.js
```

## 5. Casos de Uso Práticos

### 5.1. Testar novo fluxo de compra

```typescript
// tests/custom/new-checkout-flow.spec.ts
import { test, expect } from '@playwright/test';
import { AuthPage } from '../helpers/page-objects/AuthPage';
import { ProductPage } from '../helpers/page-objects/ProductPage';
import { CartPage } from '../helpers/page-objects/CartPage';
import { CheckoutPage } from '../helpers/page-objects/CheckoutPage';
import { testData } from '../helpers/test-data';

test('fluxo completo: compra com cupom @critical', async ({ page }) => {
  const auth = new AuthPage(page);
  const products = new ProductPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  // 1. Login
  await auth.navigateToLogin();
  await auth.login(testData.users.admin.email, testData.users.admin.senha);

  // 2. Buscar produto
  await products.navigateToProducts();
  await products.searchProduct('Camiseta');

  // 3. Adicionar ao carrinho
  await products.clickFirstProduct();
  await products.selectSize('M');
  await products.addToCart();

  // 4. Aplicar cupom
  await cart.navigateToCart();
  await cart.applyCoupon('DESCONTO10');
  await cart.verifyCouponApplied();

  // 5. Checkout
  await cart.proceedToCheckout();
  await checkout.fillAddress(testData.endereco.valid);
  await checkout.selectPaymentMethod('credito');
  await checkout.fillCreditCardInfo(testData.cartao.valid);
  await checkout.acceptTerms();
  await checkout.finishOrder();

  // 6. Verificar sucesso
  await checkout.verifyOrderSuccess();
  const orderNumber = await checkout.getOrderNumber();
  expect(orderNumber).toBeTruthy();
});
```

### 5.2. Testar responsividade mobile

```typescript
// tests/custom/mobile-experience.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 13 Pro'],
});

test('deve navegar pelo site em mobile @mobile', async ({ page }) => {
  await page.goto('/');

  // Menu hambúrguer
  const menuButton = page.locator('[aria-label="Menu"]');
  await menuButton.click();

  // Navegar para produtos
  await page.locator('a:has-text("Produtos")').click();

  // Filtros mobile
  const filterButton = page.locator('button:has-text("Filtros")');
  await filterButton.click();

  // Aplicar filtro
  await page.locator('label:has-text("Camisetas")').click();
  await page.locator('button:has-text("Aplicar")').click();

  // Verificar produtos filtrados
  const products = page.locator('[data-testid="product-card"]');
  expect(await products.count()).toBeGreaterThan(0);
});
```

### 5.3. Testar performance

```typescript
// tests/custom/performance.spec.ts
import { test, expect } from '@playwright/test';

test('página inicial deve carregar em menos de 3s @performance', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;

  console.log(`Tempo de carregamento: ${loadTime}ms`);
  expect(loadTime).toBeLessThan(3000);
});

test('busca deve ser rápida @performance', async ({ page }) => {
  await page.goto('/produtos');

  const startTime = Date.now();

  await page.fill('input[type="search"]', 'camiseta');
  await page.waitForLoadState('networkidle');

  const searchTime = Date.now() - startTime;

  console.log(`Tempo de busca: ${searchTime}ms`);
  expect(searchTime).toBeLessThan(2000);
});
```

### 5.4. Testar múltiplos usuários simultaneamente

```typescript
// tests/custom/concurrent-users.spec.ts
import { test, expect } from '@playwright/test';
import { AuthPage } from '../helpers/page-objects/AuthPage';

test.describe.configure({ mode: 'parallel' });

for (let i = 0; i < 5; i++) {
  test(`usuário ${i + 1} pode fazer login simultaneamente`, async ({ page }) => {
    const auth = new AuthPage(page);

    await auth.navigateToLogin();
    await auth.login(`user${i}@example.com`, 'senha123');
    await auth.verifyLoginSuccess();
  });
}
```

## 6. Debugging com IA

Quando um teste falha, use o agente de IA para diagnóstico:

```bash
# 1. Executar teste que falha
npm test checkout.spec.ts

# 2. Analisar com IA
npm run test:ai-analyze

# 3. Ver análise detalhada
cat test-results/failure-analysis/checkout_deve_completar_fluxo.json
```

Resposta da IA:
```json
{
  "causa": "Timeout ao aguardar elemento '[data-testid=\"order-summary\"]'. Possível problema: elemento não existe na página ou seletor incorreto.",
  "solucoes": [
    "Verificar se o seletor está correto no código da página",
    "Usar seletor alternativo: '.order-summary' ou 'h2:has-text(\"Resumo do Pedido\")'",
    "Aumentar timeout para 30 segundos e adicionar retry"
  ],
  "codigoExemplo": "await expect(page.locator('.order-summary, [data-testid=\"order-summary\"]')).toBeVisible({ timeout: 30000 });",
  "prevencao": "Sempre use múltiplos seletores como fallback e verifique manualmente se o elemento existe na página",
  "prioridade": "alta"
}
```

## 7. Integração com CI/CD

### 7.1. GitHub Actions

Já configurado em `.github/workflows/e2e-tests.yml`

### 7.2. Executar localmente como CI

```bash
# Usar Docker Compose
docker-compose -f docker-compose.test.yml up

# Ou simular ambiente CI
CI=true npm test
```

## 8. Relatórios

### 8.1. Ver relatório HTML

```bash
npm run report
```

Abre navegador com:
- ✅ Testes que passaram
- ❌ Testes que falharam
- 📸 Screenshots
- 🎥 Vídeos
- 📊 Estatísticas

### 8.2. Gerar relatório customizado

```javascript
// scripts/custom-report.js
const fs = require('fs');

const results = JSON.parse(
  fs.readFileSync('test-results/results.json', 'utf-8')
);

console.log('📊 Relatório de Testes\n');
console.log(`Total: ${results.stats.tests}`);
console.log(`✅ Passou: ${results.stats.passed}`);
console.log(`❌ Falhou: ${results.stats.failed}`);
console.log(`⏭️ Pulou: ${results.stats.skipped}`);
console.log(`⏱️ Duração: ${results.stats.duration}ms`);
```

## 9. Boas Práticas

### Use dados dinâmicos

```typescript
import { generateRandomEmail } from '../helpers/test-data';

test('cadastrar novo usuário', async ({ page }) => {
  const email = generateRandomEmail();
  // Garante que email é único em cada execução
});
```

### Limpe estado entre testes

```typescript
test.beforeEach(async ({ page }) => {
  // Limpa localStorage
  await page.evaluate(() => localStorage.clear());
  
  // Limpa cookies
  await page.context().clearCookies();
});
```

### Use fixtures

```typescript
// tests/fixtures/authenticated.ts
import { test as base } from '@playwright/test';
import { AuthPage } from '../helpers/page-objects/AuthPage';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const auth = new AuthPage(page);
    await auth.navigateToLogin();
    await auth.login('user@example.com', 'senha');
    await use(page);
  },
});

// Usar em testes
test('acessar perfil', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/perfil');
  // Já está autenticado!
});
```

## 10. Recursos Avançados

### Visual Regression Testing

```typescript
test('página não deve ter mudanças visuais', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});
```

### API Testing integrado

```typescript
test('API deve retornar produtos', async ({ request }) => {
  const response = await request.get('http://localhost:5000/api/produtos');
  expect(response.ok()).toBeTruthy();
  
  const produtos = await response.json();
  expect(produtos.length).toBeGreaterThan(0);
});
```

### Network interception

```typescript
test('simular erro de rede', async ({ page }) => {
  // Intercepta requisição
  await page.route('**/api/produtos', route => {
    route.abort();
  });

  await page.goto('/produtos');
  
  // Verifica mensagem de erro
  await expect(page.locator('.error-message')).toBeVisible();
});
```

Esses são os principais exemplos de uso! 🚀
