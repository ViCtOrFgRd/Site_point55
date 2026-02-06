import { test, expect } from '@playwright/test';
import { testData } from './helpers/test-data';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Upload de Imagens - Testes Simplificados', () => {
  let testImagePath: string;

  test.beforeAll(async () => {
    // Criar uma imagem de teste simples (PNG 1x1 pixel)
    const testFixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(testFixturesDir)) {
      fs.mkdirSync(testFixturesDir, { recursive: true });
    }
    
    testImagePath = path.join(testFixturesDir, 'test-image.png');
    
    // Criar uma imagem PNG simples
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
      0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
  });

  test('deve fazer login como admin e acessar formulário de produto', async ({ page }) => {
    test.setTimeout(60000);
    
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"], input[type="email"]', testData.users.admin.email);
    await page.fill('input[name="password"], input[type="password"]', testData.users.admin.senha);
    
    await page.click('button:has-text("Entrar"), button:has-text("Login")');
    await page.waitForTimeout(3000);
    
    // Navegar para novo produto
    await page.goto('/admin/produtos/novo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Verificar se a página carregou
    const pageContent = await page.content();
    console.log('URL atual:', page.url());
    console.log('Tem input nome?', pageContent.includes('name="nome"'));
    console.log('Tem input radio?', pageContent.includes('type="radio"'));
    
    // Tirar screenshot
    await page.screenshot({ path: 'test-debug-form.png', fullPage: true });
    
    // Tentar encontrar os elementos
    const nomeInput = page.locator('input[name="nome"]');
    if (await nomeInput.count() > 0) {
      console.log('✓ Campo nome encontrado');
      
      // Procurar radio buttons
      const radios = page.locator('input[type="radio"]');
      const radioCount = await radios.count();
      console.log(`Encontrados ${radioCount} radio buttons`);
      
      if (radioCount > 0) {
        for (let i = 0; i < radioCount; i++) {
          const value = await radios.nth(i).getAttribute('value');
          console.log(`Radio ${i}: value="${value}"`);
        }
      }
    } else {
      console.log('✗ Campo nome NÃO encontrado - página não carregou corretamente');
    }
  });

  test('deve testar endpoint de upload diretamente', async ({ request }) => {
    // Primeiro fazer login para pegar o token
    const loginResponse = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: testData.users.admin.email,
        senha: testData.users.admin.senha
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeDefined();
    
    const token = loginData.token;
    
    // Fazer upload de imagem
    const imageBuffer = fs.readFileSync(testImagePath);
    
    const uploadResponse = await request.post('http://localhost:5000/api/produtos/upload-imagem', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      multipart: {
        imagem: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer
        }
      }
    });
    
    console.log('Upload status:', uploadResponse.status());
    const uploadData = await uploadResponse.json();
    console.log('Upload response:', JSON.stringify(uploadData, null, 2));
    
    expect(uploadResponse.ok()).toBeTruthy();
    expect(uploadData.success).toBe(true);
    expect(uploadData.data.url).toContain('/image/');
    
    // Verificar se o arquivo foi criado
    const filename = uploadData.data.filename;
    const imagePath = path.join(__dirname, '../../../image', filename);
    const imageExists = fs.existsSync(imagePath);
    
    console.log(`Arquivo criado: ${imageExists ? 'SIM' : 'NÃO'}`);
    console.log(`Caminho: ${imagePath}`);
    
    expect(imageExists).toBe(true);
  });

  test.afterAll(async () => {
    // Limpar arquivo de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });
});
