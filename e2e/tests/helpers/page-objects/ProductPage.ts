import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  // Locators
  private readonly searchInput = 'input[type="search"], input[placeholder*="Buscar"]';
  private readonly searchButton = 'button:has-text("Buscar")';
  private readonly productCard = '.product-card, [data-testid="product-card"]';
  private readonly addToCartButton = 'button:has-text("Adicionar ao Carrinho")';
  private readonly buyNowButton = 'button:has-text("Comprar Agora")';
  private readonly colorSelector = '[data-testid="color-selector"] button, .color-selector button';
  private readonly sizeSelector = '[data-testid="size-selector"] button, .size-selector button';
  private readonly quantityInput = 'input[type="number"], input[name="quantidade"]';
  private readonly priceElement = '[data-testid="product-price"], .product-price';
  private readonly categoryFilter = '[data-testid="category-filter"], .category-filter';
  private readonly priceRangeFilter = '[data-testid="price-range"], .price-range';

  constructor(page: Page) {
    super(page);
  }

  async navigateToProducts() {
    await this.navigate('/produtos');
  }

  async navigateToProductDetail(productId: number) {
    await this.navigate(`/produtos/${productId}`);
  }

  async searchProduct(searchTerm: string) {
    await this.fillInput(this.searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForNavigation();
  }

  async filterByCategory(category: string) {
    const categoryOption = this.page.locator(this.categoryFilter).getByText(category);
    await categoryOption.click();
    await this.waitForPageLoad();
  }

  async filterByPriceRange(min: number, max: number) {
    const minInput = this.page.locator(`${this.priceRangeFilter} input[name="min"]`);
    const maxInput = this.page.locator(`${this.priceRangeFilter} input[name="max"]`);
    
    await minInput.fill(min.toString());
    await maxInput.fill(max.toString());
    
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async clickFirstProduct() {
    const firstProduct = this.page.locator(this.productCard).first();
    await firstProduct.click();
    await this.waitForNavigation();
  }

  async selectColor(colorName: string) {
    const colorButton = this.page.locator(this.colorSelector).filter({ hasText: colorName });
    await colorButton.click();
  }

  async selectSize(size: string) {
    const sizeButton = this.page.locator(this.sizeSelector).filter({ hasText: size });
    await sizeButton.click();
  }

  async setQuantity(quantity: number) {
    await this.fillInput(this.quantityInput, quantity.toString());
  }

  async addToCart() {
    await this.clickElement(this.addToCartButton);
    await this.verifyToast('Produto adicionado ao carrinho');
  }

  async buyNow() {
    await this.clickElement(this.buyNowButton);
    await this.waitForNavigation();
    // Deve redirecionar para carrinho
    const url = await this.getCurrentUrl();
    expect(url).toContain('/carrinho');
  }

  async verifyProductDetails() {
    // Verifica elementos essenciais da página de detalhes
    await expect(this.page.locator('h1')).toBeVisible();
    await expect(this.page.locator(this.priceElement)).toBeVisible();
    await expect(this.page.locator(this.addToCartButton)).toBeVisible();
  }

  async verifyProductPrice(expectedPrice: string) {
    const price = this.page.locator(this.priceElement).first();
    await expect(price).toContainText(expectedPrice);
  }

  async verifyProductCount(minCount: number = 1) {
    const products = this.page.locator(this.productCard);
    const count = await products.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  async scrollToLoadMore() {
    // Scroll para carregar mais produtos (infinite scroll)
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(2000);
  }

  async addReview(rating: number, comment: string) {
    const ratingStars = this.page.locator('[data-testid="rating-stars"] button, .rating-stars button');
    await ratingStars.nth(rating - 1).click();
    
    const commentTextarea = this.page.locator('textarea[name="comentario"], textarea[placeholder*="comentário"]');
    await commentTextarea.fill(comment);
    
    const submitButton = this.page.locator('button:has-text("Enviar avaliação"), button:has-text("Enviar")');
    await submitButton.click();
    
    await this.verifyToast('Avaliação enviada com sucesso');
  }
}
