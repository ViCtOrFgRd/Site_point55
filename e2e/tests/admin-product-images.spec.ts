import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/page-objects/AuthPage';
import { testData } from './helpers/test-data';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Upload de Imagens de Produtos (Admin)', () => {
  let authPage: AuthPage;
  let testImagePath: string;

  test.beforeAll(async () => {
    // Criar uma imagem de teste simples (PNG 1x1 pixel)
    const testFixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(testFixturesDir)) {
      fs.mkdirSync(testFixturesDir, { recursive: true });
    }
    
    testImagePath = path.join(testFixturesDir, 'test-image.png');
    
    // Criar uma imagem PNG simples (1x1 pixel vermelho)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // Width: 1, Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Bit depth: 8, Color type: 2 (RGB)
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
      0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
      0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
  });

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Login como admin
    await authPage.navigateToLogin();
    await authPage.login(testData.users.admin.email, testData.users.admin.senha);
    
    // Aguardar login e redirecionamento
    await page.waitForTimeout(2000);
    
    // Verificar se tem token (login bem-sucedido)
    const hasToken = await page.evaluate(() => !!localStorage.getItem('token'));
    expect(hasToken).toBeTruthy();
  });

  test('deve exibir opções de URL e Upload de imagem @critical', async ({ page }) => {
    // Navegar para criação de novo produto
    await page.goto('/admin/produtos/novo');
    
    // Aguardar página carregar completamente
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Aguardar formulário de produto carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    
    // Scroll até a seção de imagens
    await page.evaluate(() => {
      const imagensSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Imagens'));
      if (imagensSection) imagensSection.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(500);
    
    // Verificar que existem as duas opções
    const urlRadio = page.locator('input[type="radio"][value="url"]');
    const uploadRadio = page.locator('input[type="radio"][value="upload"]');
    
    await expect(urlRadio).toBeVisible({ timeout: 5000 });
    await expect(uploadRadio).toBeVisible({ timeout: 5000 });
    
    // URL deve estar selecionado por padrão
    await expect(urlRadio).toBeChecked();
  });

  test('deve adicionar imagem via URL', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.waitForLoadState('networkidle');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Garantir que URL está selecionado
    const urlRadio = page.locator('input[type="radio"][value="url"]');
    await urlRadio.click();
    
    // Preencher URL de uma imagem de teste
    const urlInput = page.locator('input[type="url"][placeholder*="URL"]');
    const testImageUrl = 'https://via.placeholder.com/300x300.png?text=Produto+Teste';
    await urlInput.fill(testImageUrl);
    
    // Clicar em adicionar
    const addButton = page.locator('button:has-text("Adicionar")').first();
    await addButton.click();
    
    // Verificar que a imagem foi adicionada
    const imagePreview = page.locator('.imagePreview img', { hasText: '' }).first();
    await expect(imagePreview).toBeVisible({ timeout: 5000 });
    await expect(imagePreview).toHaveAttribute('src', testImageUrl);
  });

  test('deve fazer upload de imagem do computador @critical', async ({ page }) => {
    test.setTimeout(60000); // Aumentar timeout para 60s
    
    await page.goto('/admin/produtos/novo');
    await page.waitForLoadState('networkidle');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Selecionar opção de upload
    const uploadRadio = page.locator('input[type="radio"][value="upload"]');
    await uploadRadio.click();
    
    // Verificar que o campo de upload está visível
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // Fazer upload da imagem
    await fileInput.setInputFiles(testImagePath);
    
    // Aguardar o upload completar e a imagem aparecer
    await page.waitForTimeout(2000); // Aguardar processamento
    
    // Verificar mensagem de sucesso (toast)
    const successMessage = page.locator('text=/enviada com sucesso|upload.*sucesso/i');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Verificar que a imagem foi adicionada na lista
    const imagePreview = page.locator('.imagePreview img').first();
    await expect(imagePreview).toBeVisible({ timeout: 5000 });
    
    // Verificar que a URL da imagem contém /image/
    const imgSrc = await imagePreview.getAttribute('src');
    expect(imgSrc).toContain('/image/');
  });

  test('deve remover imagem adicionada', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.waitForLoadState('networkidle');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Adicionar uma imagem via URL primeiro
    const urlInput = page.locator('input[type="url"][placeholder*="URL"]');
    await urlInput.fill('https://via.placeholder.com/200');
    
    const addButton = page.locator('button:has-text("Adicionar")').first();
    await addButton.click();
    
    // Aguardar imagem aparecer
    await page.waitForTimeout(500);
    
    // Contar imagens antes
    const imagesBefore = await page.locator('.imagePreview').count();
    expect(imagesBefore).toBeGreaterThan(0);
    
    // Clicar no botão de remover
    const removeButton = page.locator('.imagePreview button').first();
    await removeButton.click();
    
    // Verificar que a imagem foi removida
    await page.waitForTimeout(500);
    const imagesAfter = await page.locator('.imagePreview').count();
    expect(imagesAfter).toBe(imagesBefore - 1);
  });

  test('deve validar tipo de arquivo no upload', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('/admin/produtos/novo');
    await page.waitForLoadState('networkidle');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Selecionar opção de upload
    const uploadRadio = page.locator('input[type="radio"][value="upload"]');
    await uploadRadio.click();
    
    // Criar um arquivo de texto para testar validação
    const testFixturesDir = path.join(__dirname, 'fixtures');
    const txtPath = path.join(testFixturesDir, 'test-file.txt');
    fs.writeFileSync(txtPath, 'Este é um arquivo de texto, não uma imagem');
    
    // Tentar fazer upload de arquivo não-imagem
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(txtPath);
    
    // Aguardar mensagem de erro
    await page.waitForTimeout(2000);
    
    // Verificar mensagem de erro
    const errorMessage = page.locator('text=/tipo.*não suportado|arquivo.*inválido/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Limpar arquivo de teste
    fs.unlinkSync(txtPath);
  });

  test('deve salvar produto com imagem enviada', async ({ page }) => {
    test.setTimeout(90000); // Aumentar timeout para 90s
    
    await page.goto('/admin/produtos/novo');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 10000 });
    
    // Preencher dados básicos do produto
    await page.fill('input[name="nome"]', `Produto com Imagem - ${Date.now()}`);
    await page.fill('textarea[name="descricao"]', 'Produto criado para testar upload de imagem');
    await page.fill('input[name="preco"]', '149.90');
    await page.fill('input[name="estoque"]', '5');
    
    // Selecionar categoria
    const categorySelect = page.locator('select[name="categoria_id"]');
    await categorySelect.selectOption({ index: 1 });
    
    // Fazer upload de imagem
    await page.waitForTimeout(500);
    const uploadRadio = page.locator('input[type="radio"][value="upload"]');
    await uploadRadio.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Aguardar upload completar
    await page.waitForTimeout(3000);
    
    // Verificar que imagem foi adicionada
    const imagePreview = page.locator('.imagePreview img').first();
    await expect(imagePreview).toBeVisible({ timeout: 5000 });
    
    // Salvar produto
    const saveButton = page.locator('button[type="submit"]:has-text("Criar")');
    await saveButton.click();
    
    // Aguardar redirecionamento ou mensagem de sucesso
    await page.waitForURL('**/admin/produtos', { timeout: 15000 }).catch(async () => {
      // Se não redirecionou, verificar se há mensagem de sucesso
      const successMsg = page.locator('text=/criado com sucesso|produto.*salvo/i');
      await expect(successMsg).toBeVisible({ timeout: 5000 });
    });
  });

  test('deve alternar entre URL e Upload sem perder imagens', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.waitForLoadState('networkidle');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Adicionar imagem via URL
    const urlInput = page.locator('input[type="url"][placeholder*="URL"]');
    await urlInput.fill('https://via.placeholder.com/150');
    
    const addButton = page.locator('button:has-text("Adicionar")').first();
    await addButton.click();
    
    await page.waitForTimeout(500);
    
    // Alternar para Upload
    const uploadRadio = page.locator('input[type="radio"][value="upload"]');
    await uploadRadio.click();
    
    // Verificar que a imagem adicionada ainda está lá
    const imagePreview = page.locator('.imagePreview img').first();
    await expect(imagePreview).toBeVisible();
    
    // Voltar para URL
    const urlRadio = page.locator('input[type="radio"][value="url"]');
    await urlRadio.click();
    
    // Verificar que a imagem ainda está lá
    await expect(imagePreview).toBeVisible();
  });

  test('deve exibir preview das imagens adicionadas', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.waitForLoadState('networkidle');
    
    // Aguardar formulário carregar
    await page.waitForSelector('input[name="nome"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Adicionar múltiplas imagens via URL
    const urls = [
      'https://via.placeholder.com/200/FF0000',
      'https://via.placeholder.com/200/00FF00',
      'https://via.placeholder.com/200/0000FF'
    ];
    
    const urlInput = page.locator('input[type="url"][placeholder*="URL"]');
    const addButton = page.locator('button:has-text("Adicionar")').first();
    
    for (const url of urls) {
      await urlInput.fill(url);
      await addButton.click();
      await page.waitForTimeout(300);
    }
    
    // Verificar que todas as imagens estão visíveis
    const previews = page.locator('.imagePreview');
    await expect(previews).toHaveCount(urls.length);
    
    // Verificar que cada preview tem o botão de remover
    const removeButtons = page.locator('.imagePreview button');
    await expect(removeButtons).toHaveCount(urls.length);
  });

  test.afterAll(async () => {
    // Limpar arquivo de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });
});
