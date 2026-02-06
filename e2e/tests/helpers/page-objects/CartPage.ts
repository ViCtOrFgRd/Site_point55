import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  // Locators
  private readonly cartItem = '[data-testid="cart-item"], .cart-item';
  private readonly removeButton = 'button:has-text("Remover")';
  private readonly quantityInput = 'input[type="number"]';
  private readonly increaseButton = 'button[aria-label*="Aumentar"], button:has-text("+")';
  private readonly decreaseButton = 'button[aria-label*="Diminuir"], button:has-text("-")';
  private readonly subtotalElement = '[data-testid="subtotal"], .subtotal';
  private readonly totalElement = '[data-testid="total"], .total';
  private readonly couponInput = 'input[name="cupom"], input[placeholder*="cupom"]';
  private readonly applyCouponButton = 'button:has-text("Aplicar"), button:has-text("Aplicar cupom")';
  private readonly checkoutButton = 'button:has-text("Finalizar compra"), button:has-text("Ir para pagamento")';
  private readonly emptyCartMessage = 'p:has-text("carrinho vazio"), .empty-cart';

  constructor(page: Page) {
    super(page);
  }

  async navigateToCart() {
    await this.navigate('/carrinho');
  }

  async verifyCartIsEmpty() {
    await expect(this.page.locator(this.emptyCartMessage)).toBeVisible();
  }

  async verifyCartHasItems(minItems: number = 1) {
    const items = this.page.locator(this.cartItem);
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(minItems);
  }

  async removeItem(productName: string) {
    const item = this.page.locator(this.cartItem).filter({ hasText: productName });
    const removeBtn = item.locator(this.removeButton);
    await removeBtn.click();
    
    // Aguarda confirmação se houver
    const confirmBtn = this.page.locator('button:has-text("Confirmar"), button:has-text("Sim")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    await this.page.waitForTimeout(1000);
  }

  async updateQuantity(productName: string, quantity: number) {
    const item = this.page.locator(this.cartItem).filter({ hasText: productName });
    const input = item.locator(this.quantityInput);
    await input.fill(quantity.toString());
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async increaseQuantity(productName: string) {
    const item = this.page.locator(this.cartItem).filter({ hasText: productName });
    const increaseBtn = item.locator(this.increaseButton);
    await increaseBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async decreaseQuantity(productName: string) {
    const item = this.page.locator(this.cartItem).filter({ hasText: productName });
    const decreaseBtn = item.locator(this.decreaseButton);
    await decreaseBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async applyCoupon(couponCode: string) {
    await this.fillInput(this.couponInput, couponCode);
    await this.clickElement(this.applyCouponButton);
    await this.page.waitForTimeout(1000);
  }

  async verifyCouponApplied(discountAmount?: string) {
    await this.verifyToast('Cupom aplicado com sucesso');
    
    if (discountAmount) {
      const discount = this.page.locator('[data-testid="discount"], .discount');
      await expect(discount).toContainText(discountAmount);
    }
  }

  async verifyCouponError(message?: string) {
    if (message) {
      await this.verifyErrorMessage(message);
    } else {
      const error = this.page.locator('.error, .alert-danger');
      await expect(error).toBeVisible();
    }
  }

  async getSubtotal(): Promise<string> {
    const subtotal = await this.getText(this.subtotalElement);
    return subtotal.replace(/[^\d,]/g, '');
  }

  async getTotal(): Promise<string> {
    const total = await this.getText(this.totalElement);
    return total.replace(/[^\d,]/g, '');
  }

  async proceedToCheckout() {
    await this.clickElement(this.checkoutButton);
    await this.waitForNavigation();
    
    // Verifica se foi para página de checkout
    const url = await this.getCurrentUrl();
    expect(url).toMatch(/\/(checkout|pagamento)/);
  }

  async verifyProductInCart(productName: string) {
    const item = this.page.locator(this.cartItem).filter({ hasText: productName });
    await expect(item).toBeVisible();
  }

  async getCartItemCount(): Promise<number> {
    const items = this.page.locator(this.cartItem);
    return await items.count();
  }
}
