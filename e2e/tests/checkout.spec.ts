import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/page-objects/AuthPage';
import { ProductPage } from './helpers/page-objects/ProductPage';
import { CartPage } from './helpers/page-objects/CartPage';
import { CheckoutPage } from './helpers/page-objects/CheckoutPage';
import { testData } from './helpers/test-data';

test.describe('Fluxo Completo de Compra', () => {
  let authPage: AuthPage;
  let productPage: ProductPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    
    // Login antes de cada teste
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, testData.users.admin.senha);
    await authPage.verifyLoginSuccess();
  });

  test('deve completar fluxo de compra com cartão de crédito @smoke @critical', async ({ page }) => {
    // 1. Adicionar produto ao carrinho
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // 2. Ir para carrinho
    await cartPage.navigateToCart();
    await cartPage.verifyCartHasItems(1);
    
    // 3. Prosseguir para checkout
    await cartPage.proceedToCheckout();
    
    // 4. Preencher endereço
    await checkoutPage.fillAddress(testData.endereco.valid);
    
    // 5. Selecionar método de pagamento
    await checkoutPage.selectPaymentMethod('credito');
    
    // 6. Preencher dados do cartão
    await checkoutPage.fillCreditCardInfo(testData.cartao.valid);
    
    // 7. Aceitar termos
    await checkoutPage.acceptTerms();
    
    // 8. Finalizar pedido
    await checkoutPage.finishOrder();
    
    // 9. Verificar sucesso
    await checkoutPage.verifyOrderSuccess();
  });

  test('deve completar fluxo de compra com PIX @critical', async ({ page }) => {
    // Adicionar produto
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // Ir para checkout
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    // Preencher dados
    await checkoutPage.fillAddress(testData.endereco.valid);
    await checkoutPage.selectPaymentMethod('pix');
    await checkoutPage.acceptTerms();
    
    // Finalizar
    await checkoutPage.finishOrder();
    
    // Verificar QR Code do PIX
    await checkoutPage.verifyPixQRCode();
  });

  test('deve completar fluxo de compra com Boleto', async ({ page }) => {
    // Adicionar produto
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // Checkout
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    await checkoutPage.fillAddress(testData.endereco.valid);
    await checkoutPage.selectPaymentMethod('boleto');
    await checkoutPage.acceptTerms();
    
    await checkoutPage.finishOrder();
    
    // Verificar link do boleto
    await checkoutPage.verifyBoletoLink();
  });

  test('deve aplicar cupom de desconto durante checkout', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // Aplicar cupom no carrinho
    await cartPage.navigateToCart();
    await cartPage.applyCoupon(testData.cupom.valid);
    await cartPage.verifyCouponApplied();
    
    // Continuar para checkout
    await cartPage.proceedToCheckout();
    
    // Verificar que desconto está aplicado
    const summary = await checkoutPage.page.locator('[data-testid="order-summary"], .order-summary').textContent();
    expect(summary?.toLowerCase()).toContain('desconto');
  });

  test('deve comprar múltiplos produtos', async ({ page }) => {
    // Adiciona primeiro produto
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // Adiciona segundo produto
    await productPage.navigateToProducts();
    
    const products = page.locator('[data-testid="product-card"], .product-card');
    if (await products.count() > 1) {
      await products.nth(1).click();
      
      if (await sizeSelector.isVisible()) {
        await productPage.selectSize('G');
      }
      
      await productPage.addToCart();
    }
    
    // Finalizar compra
    await cartPage.navigateToCart();
    await cartPage.verifyCartHasItems(2);
    await cartPage.proceedToCheckout();
    
    await checkoutPage.fillAddress(testData.endereco.valid);
    await checkoutPage.selectPaymentMethod('credito');
    await checkoutPage.fillCreditCardInfo(testData.cartao.valid);
    await checkoutPage.acceptTerms();
    await checkoutPage.finishOrder();
    
    await checkoutPage.verifyOrderSuccess();
  });

  test('deve validar campos obrigatórios no checkout', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    // Tenta finalizar sem preencher nada
    await checkoutPage.finishOrder();
    
    // Deve haver erros de validação
    const errors = page.locator('.error, .invalid-feedback, [role="alert"]');
    expect(await errors.count()).toBeGreaterThan(0);
  });

  test('deve calcular frete corretamente', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    // Preenche CEP
    await checkoutPage.fillAddress(testData.endereco.valid);
    
    // Aguarda cálculo de frete
    await page.waitForTimeout(2000);
    
    // Verifica se valor do frete aparece
    const shipping = page.locator('[data-testid="shipping"], .shipping, .frete');
    if (await shipping.isVisible()) {
      const shippingText = await shipping.textContent();
      expect(shippingText).toBeTruthy();
    }
  });

  test('deve salvar pedido no histórico', async ({ page }) => {
    // Completa uma compra
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    await checkoutPage.fillAddress(testData.endereco.valid);
    await checkoutPage.selectPaymentMethod('credito');
    await checkoutPage.fillCreditCardInfo(testData.cartao.valid);
    await checkoutPage.acceptTerms();
    await checkoutPage.finishOrder();
    
    await checkoutPage.verifyOrderSuccess();
    
    // Obtém número do pedido
    const orderNumber = await checkoutPage.getOrderNumber();
    
    // Navega para histórico de pedidos
    await page.goto('/pedidos');
    
    // Verifica se pedido aparece na lista
    if (orderNumber) {
      const orderInList = page.locator(`[data-testid="order-${orderNumber}"], .order-item`).filter({ hasText: orderNumber });
      await expect(orderInList).toBeVisible({ timeout: 5000 });
    }
  });

  test('deve usar botão "Comprar Agora" e ir direto para checkout', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.buyNow();
    
    // Deve estar no carrinho
    await cartPage.verifyCartHasItems(1);
    
    // Prosseguir para checkout
    await cartPage.proceedToCheckout();
    
    // Verificar que está na página de checkout
    const url = page.url();
    expect(url).toMatch(/\/(checkout|pagamento)/);
  });
});
