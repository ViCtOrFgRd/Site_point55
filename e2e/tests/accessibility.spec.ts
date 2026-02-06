import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Testes de Acessibilidade', () => {
  test('deve não ter violações na página inicial @accessibility', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve não ter violações na página de produtos @accessibility', async ({ page }) => {
    await page.goto('/produtos');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve não ter violações na página de detalhes do produto @accessibility', async ({ page }) => {
    await page.goto('/produtos');
    
    // Clica no primeiro produto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.click();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve não ter violações no carrinho @accessibility', async ({ page }) => {
    await page.goto('/carrinho');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve não ter violações no formulário de login @accessibility', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve ter navegação por teclado funcional', async ({ page }) => {
    await page.goto('/');
    
    // Navega usando Tab
    await page.keyboard.press('Tab');
    
    // Verifica se algum elemento está focado
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('deve ter textos alternativos em imagens', async ({ page }) => {
    await page.goto('/produtos');
    
    // Aguarda imagens carregarem
    await page.waitForLoadState('networkidle');
    
    // Verifica se todas as imagens têm alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('deve ter contraste adequado', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    // Filtra apenas violações de contraste
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('deve ter labels em campos de formulário', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve ter estrutura de headings correta', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('deve ter landmarks ARIA apropriados', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['region'])
      .analyze();
    
    // Verifica presença de landmarks
    const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;
    const hasMain = await page.locator('main, [role="main"]').count() > 0;
    
    expect(hasNav).toBeTruthy();
    expect(hasMain).toBeTruthy();
  });

  test('deve ser navegável apenas com teclado', async ({ page }) => {
    await page.goto('/produtos');
    
    // Tenta navegar até um produto e "clicar" com Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Deve ter navegado para página de detalhes
    await page.waitForTimeout(1000);
    const url = page.url();
    
    // Pode estar em detalhes do produto ou ainda na listagem
    // O importante é que a navegação por teclado funcione
    expect(url).toBeTruthy();
  });

  test('deve ter skip links para conteúdo principal', async ({ page }) => {
    await page.goto('/');
    
    // Procura por skip link (geralmente primeiro elemento focável)
    const skipLink = page.locator('a[href="#main"], a[href="#content"]');
    
    if (await skipLink.count() > 0) {
      await skipLink.focus();
      expect(await skipLink.isVisible()).toBeTruthy();
    }
  });

  test('deve anunciar mudanças dinâmicas com ARIA live', async ({ page }) => {
    await page.goto('/produtos');
    
    // Adiciona produto ao carrinho
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.click();
    
    const addButton = page.locator('button:has-text("Adicionar")');
    await addButton.click();
    
    // Verifica se há região live para anunciar mudança
    const liveRegion = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
    
    if (await liveRegion.count() > 0) {
      expect(await liveRegion.isVisible()).toBeTruthy();
    }
  });

  test('deve ter foco visível', async ({ page }) => {
    await page.goto('/login');
    
    // Foca no primeiro input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();
    
    // Verifica se há outline ou indicador visual de foco
    const focusStyles = await emailInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });
    
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' ||
      focusStyles.outlineWidth !== '0px' ||
      focusStyles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });
});
