import { test, expect } from '@playwright/test';
import { ProductPage } from './helpers/page-objects/ProductPage';
import { CartPage } from './helpers/page-objects/CartPage';
import { testData } from './helpers/test-data';

test.describe('Carrinho de Compras', () => {
  let productPage: ProductPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
    
    // Adiciona produto ao carrinho para testes
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    // Seleciona tamanho se necessário
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
  });

  test('deve exibir produto adicionado no carrinho @smoke @critical', async () => {
    await cartPage.navigateToCart();
    await cartPage.verifyCartHasItems(1);
  });

  test('deve remover produto do carrinho', async () => {
    await cartPage.navigateToCart();
    
    const firstItem = await cartPage.page.locator('[data-testid="cart-item"], .cart-item').first().textContent();
    const productName = firstItem?.split('\n')[0] || 'Produto';
    
    await cartPage.removeItem(productName);
    
    // Verifica se carrinho ficou vazio ou tem menos itens
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBe(0);
  });

  test('deve aumentar quantidade do produto', async ({ page }) => {
    await cartPage.navigateToCart();
    
    const firstItem = await page.locator('[data-testid="cart-item"], .cart-item').first().textContent();
    const productName = firstItem?.split('\n')[0] || 'Produto';
    
    await cartPage.increaseQuantity(productName);
    
    const quantityInput = page.locator('input[type="number"]').first();
    const newQuantity = await quantityInput.inputValue();
    expect(parseInt(newQuantity)).toBeGreaterThan(1);
  });

  test('deve diminuir quantidade do produto', async ({ page }) => {
    await cartPage.navigateToCart();
    
    // Primeiro aumenta para depois diminuir
    const firstItem = await page.locator('[data-testid="cart-item"], .cart-item').first().textContent();
    const productName = firstItem?.split('\n')[0] || 'Produto';
    
    await cartPage.increaseQuantity(productName);
    await cartPage.increaseQuantity(productName);
    
    const quantityBefore = await page.locator('input[type="number"]').first().inputValue();
    
    await cartPage.decreaseQuantity(productName);
    
    const quantityAfter = await page.locator('input[type="number"]').first().inputValue();
    expect(parseInt(quantityAfter)).toBeLessThan(parseInt(quantityBefore));
  });

  test('deve atualizar quantidade manualmente', async ({ page }) => {
    await cartPage.navigateToCart();
    
    const firstItem = await page.locator('[data-testid="cart-item"], .cart-item').first().textContent();
    const productName = firstItem?.split('\n')[0] || 'Produto';
    
    await cartPage.updateQuantity(productName, 5);
    
    const quantityInput = page.locator('input[type="number"]').first();
    expect(await quantityInput.inputValue()).toBe('5');
  });

  test('deve aplicar cupom de desconto válido @critical', async () => {
    await cartPage.navigateToCart();
    
    const totalBefore = await cartPage.getTotal();
    
    await cartPage.applyCoupon(testData.cupom.valid);
    await cartPage.verifyCouponApplied();
    
    const totalAfter = await cartPage.getTotal();
    
    // Total deve ser menor após aplicar cupom
    const before = parseFloat(totalBefore.replace(',', '.'));
    const after = parseFloat(totalAfter.replace(',', '.'));
    expect(after).toBeLessThan(before);
  });

  test('deve exibir erro com cupom inválido', async () => {
    await cartPage.navigateToCart();
    
    await cartPage.applyCoupon(testData.cupom.invalid);
    await cartPage.verifyCouponError();
  });

  test('deve exibir erro com cupom expirado', async () => {
    await cartPage.navigateToCart();
    
    await cartPage.applyCoupon(testData.cupom.expired);
    await cartPage.verifyCouponError();
  });

  test('deve calcular subtotal corretamente', async ({ page }) => {
    await cartPage.navigateToCart();
    
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeTruthy();
    
    // Verifica se é um número válido
    const subtotalNumber = parseFloat(subtotal.replace(',', '.'));
    expect(subtotalNumber).toBeGreaterThan(0);
  });

  test('deve calcular total corretamente', async () => {
    await cartPage.navigateToCart();
    
    const total = await cartPage.getTotal();
    expect(total).toBeTruthy();
    
    const totalNumber = parseFloat(total.replace(',', '.'));
    expect(totalNumber).toBeGreaterThan(0);
  });

  test('deve prosseguir para checkout @critical', async () => {
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    const url = cartPage.page.url();
    expect(url).toMatch(/\/(checkout|pagamento|login)/);
  });

  test('deve exibir carrinho vazio após remover todos itens', async ({ page }) => {
    await cartPage.navigateToCart();
    
    const itemCount = await cartPage.getCartItemCount();
    
    // Remove todos os itens
    for (let i = 0; i < itemCount; i++) {
      const firstItem = await page.locator('[data-testid="cart-item"], .cart-item').first().textContent();
      const productName = firstItem?.split('\n')[0] || 'Produto';
      await cartPage.removeItem(productName);
    }
    
    await cartPage.verifyCartIsEmpty();
  });

  test('deve persistir carrinho após recarregar página', async ({ page }) => {
    await cartPage.navigateToCart();
    
    const itemCountBefore = await cartPage.getCartItemCount();
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const itemCountAfter = await cartPage.getCartItemCount();
    expect(itemCountAfter).toBe(itemCountBefore);
  });

  test('deve respeitar limite de estoque', async ({ page }) => {
    await cartPage.navigateToCart();
    
    const firstItem = await page.locator('[data-testid="cart-item"], .cart-item').first().textContent();
    const productName = firstItem?.split('\n')[0] || 'Produto';
    
    // Tenta adicionar quantidade muito alta
    await cartPage.updateQuantity(productName, 9999);
    
    // Deve exibir mensagem de erro ou limitar à quantidade disponível
    const error = page.locator('.error, .alert-danger');
    const isErrorVisible = await error.isVisible();
    
    if (!isErrorVisible) {
      // Se não mostrou erro, deve ter limitado a quantidade
      const quantityInput = page.locator('input[type="number"]').first();
      const quantity = parseInt(await quantityInput.inputValue());
      expect(quantity).toBeLessThan(9999);
    }
  });

  test('deve exibir contador de itens no ícone do carrinho', async ({ page }) => {
    await page.goto('/');
    
    const cartBadge = page.locator('[data-testid="cart-badge"], .cart-badge, .cart-count');
    
    if (await cartBadge.isVisible()) {
      const count = await cartBadge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThan(0);
    }
  });
});
