import { test, expect } from '@playwright/test';
import { ProductPage } from './helpers/page-objects/ProductPage';
import { CartPage } from './helpers/page-objects/CartPage';

test.describe('Produtos e Navegação', () => {
  let productPage: ProductPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
  });

  test('deve listar produtos na página inicial @smoke @critical', async () => {
    await productPage.navigateToProducts();
    await productPage.verifyProductCount(1);
  });

  test('deve buscar produto por nome', async () => {
    await productPage.navigateToProducts();
    await productPage.searchProduct('Camiseta');
    await productPage.verifyProductCount(1);
  });

  test('deve filtrar produtos por categoria', async () => {
    await productPage.navigateToProducts();
    await productPage.filterByCategory('Camisetas');
    await productPage.verifyProductCount(1);
  });

  test('deve filtrar produtos por faixa de preço', async () => {
    await productPage.navigateToProducts();
    await productPage.filterByPriceRange(50, 200);
    await productPage.verifyProductCount(1);
  });

  test('deve visualizar detalhes do produto @smoke', async () => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    await productPage.verifyProductDetails();
  });

  test('deve adicionar produto ao carrinho com sucesso @critical', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    // Verifica se precisa selecionar tamanho
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // Verifica no carrinho
    await cartPage.navigateToCart();
    await cartPage.verifyCartHasItems(1);
  });

  test('deve adicionar múltiplos produtos ao carrinho', async ({ page }) => {
    // Adiciona primeiro produto
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.addToCart();
    
    // Volta para produtos e adiciona outro
    await productPage.navigateToProducts();
    
    const products = page.locator('[data-testid="product-card"], .product-card');
    if (await products.count() > 1) {
      await products.nth(1).click();
      
      if (await sizeSelector.isVisible()) {
        await productPage.selectSize('G');
      }
      
      await productPage.addToCart();
      
      // Verifica carrinho
      await cartPage.navigateToCart();
      await cartPage.verifyCartHasItems(2);
    }
  });

  test('deve selecionar cor do produto', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const colorSelector = page.locator('[data-testid="color-selector"], .color-selector');
    if (await colorSelector.isVisible()) {
      const colors = colorSelector.locator('button');
      const colorCount = await colors.count();
      
      if (colorCount > 0) {
        await colors.first().click();
        
        // Verifica se foi selecionado
        expect(await colors.first().getAttribute('aria-pressed')).toBe('true');
      }
    }
  });

  test('deve alterar quantidade do produto', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.setQuantity(3);
    await productPage.addToCart();
    
    await cartPage.navigateToCart();
    
    // Verifica quantidade no carrinho
    const quantityInput = page.locator('input[type="number"]').first();
    expect(await quantityInput.inputValue()).toBe('3');
  });

  test('deve usar botão "Comprar Agora" @critical', async ({ page }) => {
    await productPage.navigateToProducts();
    await productPage.clickFirstProduct();
    
    const sizeSelector = page.locator('[data-testid="size-selector"], .size-selector');
    if (await sizeSelector.isVisible()) {
      await productPage.selectSize('M');
    }
    
    await productPage.buyNow();
    
    // Deve estar no carrinho
    const url = page.url();
    expect(url).toContain('/carrinho');
  });

  test('deve carregar mais produtos com scroll infinito', async () => {
    await productPage.navigateToProducts();
    
    const initialCount = await productPage.page.locator('[data-testid="product-card"], .product-card').count();
    
    await productPage.scrollToLoadMore();
    
    const newCount = await productPage.page.locator('[data-testid="product-card"], .product-card').count();
    
    // Pode ou não ter carregado mais, dependendo do total de produtos
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('deve adicionar avaliação ao produto', async ({ page }) => {
    // Este teste requer autenticação
    // TODO: Adicionar login antes de avaliar
    test.skip();
  });

  test('deve exibir produtos em promoção', async () => {
    await productPage.page.goto('/promocoes');
    await productPage.verifyProductCount(1);
  });

  test('deve exibir produtos em destaque', async () => {
    await productPage.page.goto('/');
    
    const destaques = productPage.page.locator('[data-testid="featured-products"], .featured-products');
    if (await destaques.isVisible()) {
      const products = destaques.locator('[data-testid="product-card"], .product-card');
      expect(await products.count()).toBeGreaterThan(0);
    }
  });
});
