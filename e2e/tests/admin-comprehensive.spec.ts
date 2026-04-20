import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'victorfiigueiredo@gmail.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'victor123';

test.describe('Análise Completa da Área Administrativa', () => {
  let adminToken: string;

  test.beforeEach(async ({ page }) => {
    // Login como admin antes de cada teste
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento e salvar token
    await page.waitForTimeout(2000);
  });

  test('✅ Dashboard Admin (/admin)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Painel Administrativo');
    
    // Verificar data-testid principal
    const dashboard = page.locator('[data-testid="admin-dashboard"]');
    await expect(dashboard).toBeVisible();
    
    // Verificar se há 6 cards (Produtos, Pedidos, Avaliações, Cupons, Usuários, Relatórios)
    const cards = page.locator('[data-testid="metric-card"]');
    const count = await cards.count();
    expect(count).toBe(6);
    
    // Verificar textos dos cards
    await expect(page.locator('text=Produtos')).toBeVisible();
    await expect(page.locator('text=Pedidos')).toBeVisible();
    await expect(page.locator('text=Avaliações')).toBeVisible();
    await expect(page.locator('text=Cupons')).toBeVisible();
    await expect(page.locator('text=Usuários')).toBeVisible();
    await expect(page.locator('text=Relatórios')).toBeVisible();
    
    // Verificar se não há erros no console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (consoleErrors.length > 0) {
      console.log('⚠️ Erros no console:', consoleErrors);
    }
  });

  test('✅ Listagem de Produtos (/admin/produtos)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/produtos');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/produtos$/);
    
    // Verificar elementos principais
    await expect(page.locator('h1')).toContainText('Gerenciar Produtos');
    
    // Verificar botão "Novo Produto"
    const novoProdutoBtn = page.locator('text=Novo Produto');
    await expect(novoProdutoBtn).toBeVisible();
    
    // Verificar campo de busca
    const buscaInput = page.locator('input[placeholder*="Buscar"]');
    await expect(buscaInput).toBeVisible();
    
    // Verificar filtro de categoria
    const categoriaSelect = page.locator('select');
    await expect(categoriaSelect).toBeVisible();
    
    // Verificar data-testid
    const produtosTable = page.locator('[data-testid="produtos-table"]');
    await expect(produtosTable).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Criar Novo Produto (/admin/produtos/novo)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/produtos/novo');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/produtos\/novo$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Novo Produto');
    
    // Verificar campos do formulário
    await expect(page.locator('input[name="nome"]')).toBeVisible();
    await expect(page.locator('textarea[name="descricao"]')).toBeVisible();
    await expect(page.locator('input[name="preco"]')).toBeVisible();
    await expect(page.locator('input[name="preco_promocional"]')).toBeVisible();
    await expect(page.locator('input[name="estoque"]')).toBeVisible();
    await expect(page.locator('select[name="categoria_id"]')).toBeVisible();
    await expect(page.locator('select[name="marca"]')).toBeVisible();
    
    // Verificar data-testid
    const form = page.locator('[data-testid="produto-form"]');
    await expect(form).toBeVisible();
    
    // Verificar botões
    await expect(page.locator('button[type="submit"]')).toContainText('Criar Produto');
    await expect(page.locator('text=Cancelar')).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Gerenciar Pedidos (/admin/pedidos)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/pedidos');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/pedidos$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gerenciar Pedidos');
    
    // Verificar data-testid
    const pedidosTable = page.locator('[data-testid="pedidos-table"]');
    await expect(pedidosTable).toBeVisible();
    
    // Verificar filtros de status
    const statusFilter = page.locator('select');
    await expect(statusFilter).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Gerenciar Cupons (/admin/cupons)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/cupons');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/cupons$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gerenciar Cupons');
    
    // Verificar data-testid
    const cuponsTable = page.locator('[data-testid="cupons-table"]');
    await expect(cuponsTable).toBeVisible();
    
    // Verificar botão "Novo Cupom"
    const novoCupomBtn = page.locator('text=Novo Cupom');
    await expect(novoCupomBtn).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Gerenciar Avaliações (/admin/avaliacoes)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/avaliacoes');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/avaliacoes$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gerenciar Avaliações');
    
    // Verificar data-testid
    const avaliacoesTable = page.locator('[data-testid="avaliacoes-table"]');
    await expect(avaliacoesTable).toBeVisible();
    
    // Verificar filtros
    const statusFilter = page.locator('select');
    await expect(statusFilter).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Gerenciar Categorias (/admin/categorias) - NOVA', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/categorias');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/categorias$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gerenciar Categorias');
    
    // Verificar data-testid
    const categoriasTable = page.locator('[data-testid="categorias-table"]');
    await expect(categoriasTable).toBeVisible();
    
    // Verificar botão "Nova Categoria"
    const novaCategoriaBtn = page.locator('text=Nova Categoria');
    await expect(novaCategoriaBtn).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Gerenciar Usuários (/admin/usuarios) - NOVA', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/usuarios');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/usuarios$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gerenciar Usuários');
    
    // Verificar data-testid
    const usuariosTable = page.locator('[data-testid="usuarios-table"]');
    await expect(usuariosTable).toBeVisible();
    
    // Verificar campo de busca
    const buscaInput = page.locator('input[placeholder*="Buscar"]');
    await expect(buscaInput).toBeVisible();
    
    await page.waitForTimeout(1000);
  });

  test('✅ Relatórios (/admin/relatorios) - NOVA', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/relatorios');
    
    // Verificar se a página carregou
    await expect(page).toHaveURL(/.*admin\/relatorios$/);
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Relatórios');
    
    // Verificar data-testid
    const relatoriosContainer = page.locator('[data-testid="relatorios-container"]');
    await expect(relatoriosContainer).toBeVisible();
    
    // Verificar cards de métricas
    const metricsCards = page.locator('[data-testid="metric-card"]');
    const count = await metricsCards.count();
    expect(count).toBeGreaterThan(0);
    
    await page.waitForTimeout(1000);
  });

  test('🔍 Verificar Rotas do Backend', async ({ request }) => {
    const baseURL = 'http://localhost:5000';
    
    // Fazer login e obter token
    const loginRes = await request.post(`${baseURL}/api/usuarios/login`, {
      data: {
        email: ADMIN_EMAIL,
        senha: ADMIN_PASSWORD
      }
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // Testar rotas do backend
    const routes = [
      { path: '/api/produtos', method: 'GET' },
      { path: '/api/produtos/categorias', method: 'GET' },
      { path: '/api/pedidos', method: 'GET' },
      { path: '/api/cupons', method: 'GET' },
      { path: '/api/avaliacoes', method: 'GET' },
      { path: '/api/usuarios', method: 'GET' },
    ];
    
    const results: any[] = [];
    
    for (const route of routes) {
      try {
        const res = await request.get(`${baseURL}${route.path}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        results.push({
          path: route.path,
          status: res.status(),
          success: res.status() === 200 || res.status() === 201
        });
      } catch (error) {
        results.push({
          path: route.path,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Log results
    console.log('\n📊 Resultados das Rotas do Backend:');
    results.forEach(result => {
      const emoji = result.success ? '✅' : '❌';
      console.log(`${emoji} ${result.path} - Status: ${result.status}`);
      if (result.error) {
        console.log(`   Erro: ${result.error}`);
      }
    });
    
    // Verificar se pelo menos 80% das rotas funcionam
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / results.length) * 100;
    
    console.log(`\n📈 Taxa de Sucesso: ${successRate.toFixed(1)}%`);
    expect(successRate).toBeGreaterThan(80);
  });

  test('🔍 Verificar Console Errors em Todas as Páginas', async ({ page }) => {
    const pages = [
      { url: 'http://localhost:3000/admin', name: 'Dashboard' },
      { url: 'http://localhost:3000/admin/produtos', name: 'Produtos' },
      { url: 'http://localhost:3000/admin/produtos/novo', name: 'Novo Produto' },
      { url: 'http://localhost:3000/admin/pedidos', name: 'Pedidos' },
      { url: 'http://localhost:3000/admin/cupons', name: 'Cupons' },
      { url: 'http://localhost:3000/admin/avaliacoes', name: 'Avaliações' },
      { url: 'http://localhost:3000/admin/categorias', name: 'Categorias' },
      { url: 'http://localhost:3000/admin/usuarios', name: 'Usuários' },
      { url: 'http://localhost:3000/admin/relatorios', name: 'Relatórios' },
    ];
    
    const errorsByPage: Record<string, string[]> = {};
    
    for (const pageInfo of pages) {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      page.on('pageerror', error => {
        consoleErrors.push(error.message);
      });
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        errorsByPage[pageInfo.name] = consoleErrors;
      }
    }
    
    // Log results
    console.log('\n🔍 Análise de Erros no Console:');
    
    if (Object.keys(errorsByPage).length === 0) {
      console.log('✅ Nenhum erro encontrado em nenhuma página!');
    } else {
      Object.entries(errorsByPage).forEach(([pageName, errors]) => {
        console.log(`\n❌ ${pageName}:`);
        errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      });
    }
  });
});
