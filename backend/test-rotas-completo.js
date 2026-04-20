/**
 * TESTE COMPLETO DE TODAS AS ROTAS DA API POINT55
 * 
 * Este script testa TODAS as rotas do backend, uma por uma
 * 
 * Para executar: node test-rotas-completo.js
 */

require('dotenv').config();
const axios = require('axios');

// Configuração
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'user@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';
const TEST_USER_NEW_PASSWORD = process.env.TEST_USER_NEW_PASSWORD || 'newpassword123';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';
let adminToken = '';
let userToken = '';
let testUserId = null;
let testProdutoId = null;
let testCategoriaId = null;
let testEnderecoId = null;
let testPedidoId = null;
let testAvaliacaoId = null;
let testCupomId = null;

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(route, method, message) {
  log(`✅ ${method.padEnd(6)} ${route.padEnd(40)} - ${message}`, 'green');
}

function logError(route, method, message) {
  log(`❌ ${method.padEnd(6)} ${route.padEnd(40)} - ${message}`, 'red');
}

function logInfo(message) {
  log(`\n${'='.repeat(80)}`, 'blue');
  log(`📋 ${message}`, 'blue');
  log('='.repeat(80), 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// ==================== TESTES ====================

async function testHealthChecks() {
  logInfo('TESTANDO HEALTH CHECKS');

  try {
    // 1. GET /
    const root = await axios.get('http://localhost:5000');
    logSuccess('/', 'GET', root.data.message);
  } catch (error) {
    logError('/', 'GET', error.message);
  }

  try {
    // 2. GET /health
    const health = await axios.get('http://localhost:5000/health');
    logSuccess('/health', 'GET', `Uptime: ${health.data.uptime.toFixed(2)}s`);
  } catch (error) {
    logError('/health', 'GET', error.message);
  }

  try {
    // 3. GET /health/database
    const dbHealth = await axios.get('http://localhost:5000/health/database');
    logSuccess('/health/database', 'GET', `Database: ${dbHealth.data.database}`);
  } catch (error) {
    logError('/health/database', 'GET', error.message);
  }
}

async function testAuthRoutes() {
  logInfo('TESTANDO ROTAS DE AUTENTICAÇÃO (/api/auth)');

  try {
    // 1. POST /api/auth/registro - Criar usuário teste
    const uniqueEmail = `teste_${Date.now()}@point55.com`;
    const registro = await axios.post(`${API_URL}/auth/registro`, {
      nome: 'Usuário Teste',
      email: uniqueEmail,
      senha: TEST_USER_PASSWORD,
      telefone: '11999999999',
    });
    userToken = registro.data.data.token;
    testUserId = registro.data.data.usuario.id;
    logSuccess('/api/auth/registro', 'POST', `Usuário criado - ID: ${testUserId}`);
  } catch (error) {
    logError('/api/auth/registro', 'POST', error.response?.data?.error || error.message);
  }

  try {
    // 2. POST /api/auth/login - Login usuário
    const loginUser = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      senha: TEST_USER_PASSWORD,
    });
    logSuccess('/api/auth/login', 'POST', `Login usuário - Token gerado`);
  } catch (error) {
    logError('/api/auth/login', 'POST', error.response?.data?.error || error.message);
  }

  try {
    // 3. POST /api/auth/login - Login admin
    const loginAdmin = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_ADMIN_EMAIL,
      senha: TEST_ADMIN_PASSWORD,
    });
    adminToken = loginAdmin.data.data.token;
    logSuccess('/api/auth/login (admin)', 'POST', `Login admin - Token gerado`);
  } catch (error) {
    logError('/api/auth/login (admin)', 'POST', error.response?.data?.error || error.message);
  }

  try {
    // 4. GET /api/auth/perfil - Obter perfil
    const perfil = await axios.get(`${API_URL}/auth/perfil`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logSuccess('/api/auth/perfil', 'GET', `Perfil: ${perfil.data.data.nome}`);
  } catch (error) {
    logError('/api/auth/perfil', 'GET', error.response?.data?.error || error.message);
  }

  try {
    // 5. PUT /api/auth/perfil - Atualizar perfil
    const updatePerfil = await axios.put(
      `${API_URL}/auth/perfil`,
      { telefone: '11988888888' },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    logSuccess('/api/auth/perfil', 'PUT', `Perfil atualizado`);
  } catch (error) {
    logError('/api/auth/perfil', 'PUT', error.response?.data?.error || error.message);
  }

  try {
    // 6. PUT /api/auth/senha - Alterar senha
    const updateSenha = await axios.put(
      `${API_URL}/auth/senha`,
      { senhaAtual: TEST_USER_PASSWORD, novaSenha: TEST_USER_NEW_PASSWORD },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    logSuccess('/api/auth/senha', 'PUT', `Senha alterada`);
  } catch (error) {
    logError('/api/auth/senha', 'PUT', error.response?.data?.error || error.message);
  }
}

async function testCategoriaRoutes() {
  logInfo('TESTANDO ROTAS DE CATEGORIAS (/api/categorias)');

  try {
    // 1. GET /api/categorias - Listar categorias
    const categorias = await axios.get(`${API_URL}/categorias`);
    testCategoriaId = categorias.data.data[0]?.id;
    logSuccess('/api/categorias', 'GET', `${categorias.data.count} categorias encontradas`);
  } catch (error) {
    logError('/api/categorias', 'GET', error.response?.data?.error || error.message);
  }

  if (testCategoriaId) {
    try {
      // 2. GET /api/categorias/:id - Obter categoria
      const categoria = await axios.get(`${API_URL}/categorias/${testCategoriaId}`);
      logSuccess(`/api/categorias/${testCategoriaId}`, 'GET', `Categoria: ${categoria.data.data.nome}`);
    } catch (error) {
      logError(`/api/categorias/:id`, 'GET', error.response?.data?.error || error.message);
    }

    try {
      // 3. GET /api/categorias/:id/produtos - Produtos por categoria
      const produtos = await axios.get(`${API_URL}/categorias/${testCategoriaId}/produtos`);
      logSuccess(`/api/categorias/${testCategoriaId}/produtos`, 'GET', `${produtos.data.count} produtos`);
    } catch (error) {
      logError('/api/categorias/:id/produtos', 'GET', error.response?.data?.error || error.message);
    }
  }

  try {
    // 4. POST /api/categorias - Criar categoria (admin)
    const novaCategoria = await axios.post(
      `${API_URL}/categorias`,
      {
        nome: 'Categoria Teste',
        slug: 'categoria-teste',
        descricao: 'Descrição teste',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const novaCategoriaId = novaCategoria.data.data.id;
    logSuccess('/api/categorias', 'POST', `Categoria criada - ID: ${novaCategoriaId}`);

    // 5. PUT /api/categorias/:id - Atualizar categoria (admin)
    await axios.put(
      `${API_URL}/categorias/${novaCategoriaId}`,
      { descricao: 'Descrição atualizada' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess(`/api/categorias/${novaCategoriaId}`, 'PUT', `Categoria atualizada`);

    // 6. DELETE /api/categorias/:id - Deletar categoria (admin)
    await axios.delete(`${API_URL}/categorias/${novaCategoriaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess(`/api/categorias/${novaCategoriaId}`, 'DELETE', `Categoria deletada`);
  } catch (error) {
    logError('/api/categorias (CRUD)', 'POST/PUT/DELETE', error.response?.data?.error || error.message);
  }
}

async function testProdutoRoutes() {
  logInfo('TESTANDO ROTAS DE PRODUTOS (/api/produtos)');

  try {
    // 1. GET /api/produtos - Listar produtos
    const produtos = await axios.get(`${API_URL}/produtos`);
    testProdutoId = produtos.data.data[0]?.id;
    logSuccess('/api/produtos', 'GET', `${produtos.data.count} produtos encontrados`);
  } catch (error) {
    logError('/api/produtos', 'GET', error.response?.data?.error || error.message);
  }

  try {
    // 2. GET /api/produtos (com filtros)
    const produtosFiltrados = await axios.get(`${API_URL}/produtos?busca=camiseta&precoMin=10&precoMax=200`);
    logSuccess('/api/produtos (filtros)', 'GET', `${produtosFiltrados.data.count} produtos filtrados`);
  } catch (error) {
    logError('/api/produtos (filtros)', 'GET', error.response?.data?.error || error.message);
  }

  try {
    // 3. GET /api/produtos/promocoes - Produtos em promoção
    const promocoes = await axios.get(`${API_URL}/produtos/promocoes`);
    logSuccess('/api/produtos/promocoes', 'GET', `${promocoes.data.count} produtos em promoção`);
  } catch (error) {
    logError('/api/produtos/promocoes', 'GET', error.response?.data?.error || error.message);
  }

  try {
    // 4. GET /api/produtos/destaques - Produtos em destaque
    const destaques = await axios.get(`${API_URL}/produtos/destaques`);
    logSuccess('/api/produtos/destaques', 'GET', `${destaques.data.count} produtos em destaque`);
  } catch (error) {
    logError('/api/produtos/destaques', 'GET', error.response?.data?.error || error.message);
  }

  if (testProdutoId) {
    try {
      // 5. GET /api/produtos/:id - Obter produto
      const produto = await axios.get(`${API_URL}/produtos/${testProdutoId}`);
      logSuccess(`/api/produtos/${testProdutoId}`, 'GET', `Produto: ${produto.data.data.nome}`);
    } catch (error) {
      logError('/api/produtos/:id', 'GET', error.response?.data?.error || error.message);
    }
  }

  try {
    // 6. POST /api/produtos - Criar produto (admin)
    const novoProduto = await axios.post(
      `${API_URL}/produtos`,
      {
        nome: 'Produto Teste',
        descricao: 'Descrição teste',
        preco: 99.99,
        estoque: 50,
        categoria_id: testCategoriaId || 1,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const novoProdutoId = novoProduto.data.data.id;
    logSuccess('/api/produtos', 'POST', `Produto criado - ID: ${novoProdutoId}`);

    // 7. PUT /api/produtos/:id - Atualizar produto (admin)
    await axios.put(
      `${API_URL}/produtos/${novoProdutoId}`,
      { preco: 89.99 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess(`/api/produtos/${novoProdutoId}`, 'PUT', `Produto atualizado`);

    // 8. PATCH /api/produtos/:id/estoque - Atualizar estoque (admin)
    await axios.patch(
      `${API_URL}/produtos/${novoProdutoId}/estoque`,
      { quantidade: 100 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess(`/api/produtos/${novoProdutoId}/estoque`, 'PATCH', `Estoque atualizado`);

    // 9. DELETE /api/produtos/:id - Deletar produto (admin)
    await axios.delete(`${API_URL}/produtos/${novoProdutoId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess(`/api/produtos/${novoProdutoId}`, 'DELETE', `Produto deletado`);
  } catch (error) {
    logError('/api/produtos (CRUD)', 'POST/PUT/PATCH/DELETE', error.response?.data?.error || error.message);
  }
}

async function testEnderecoRoutes() {
  logInfo('TESTANDO ROTAS DE ENDEREÇOS (/api/enderecos)');

  try {
    // 1. POST /api/enderecos - Adicionar endereço
    const novoEndereco = await axios.post(
      `${API_URL}/enderecos`,
      {
        cep: '01001000',
        rua: 'Praça da Sé',
        numero: '123',
        bairro: 'Sé',
        cidade: 'São Paulo',
        estado: 'SP',
        is_principal: true,
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    testEnderecoId = novoEndereco.data.data.id;
    logSuccess('/api/enderecos', 'POST', `Endereço criado - ID: ${testEnderecoId}`);
  } catch (error) {
    logError('/api/enderecos', 'POST', error.response?.data?.error || error.message);
  }

  try {
    // 2. GET /api/enderecos - Listar endereços
    const enderecos = await axios.get(`${API_URL}/enderecos`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logSuccess('/api/enderecos', 'GET', `${enderecos.data.count} endereços encontrados`);
  } catch (error) {
    logError('/api/enderecos', 'GET', error.response?.data?.error || error.message);
  }

  if (testEnderecoId) {
    try {
      // 3. GET /api/enderecos/:id - Obter endereço
      const endereco = await axios.get(`${API_URL}/enderecos/${testEnderecoId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      logSuccess(`/api/enderecos/${testEnderecoId}`, 'GET', `Endereço encontrado`);
    } catch (error) {
      logError('/api/enderecos/:id', 'GET', error.response?.data?.error || error.message);
    }

    try {
      // 4. PUT /api/enderecos/:id - Atualizar endereço
      await axios.put(
        `${API_URL}/enderecos/${testEnderecoId}`,
        { numero: '456' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      logSuccess(`/api/enderecos/${testEnderecoId}`, 'PUT', `Endereço atualizado`);
    } catch (error) {
      logError('/api/enderecos/:id', 'PUT', error.response?.data?.error || error.message);
    }

    try {
      // 5. PATCH /api/enderecos/:id/principal - Tornar principal
      await axios.patch(
        `${API_URL}/enderecos/${testEnderecoId}/principal`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      logSuccess(`/api/enderecos/${testEnderecoId}/principal`, 'PATCH', `Endereço marcado como principal`);
    } catch (error) {
      logError('/api/enderecos/:id/principal', 'PATCH', error.response?.data?.error || error.message);
    }

    try {
      // 6. DELETE /api/enderecos/:id - Deletar endereço
      await axios.delete(`${API_URL}/enderecos/${testEnderecoId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      logSuccess(`/api/enderecos/${testEnderecoId}`, 'DELETE', `Endereço deletado`);
    } catch (error) {
      logError('/api/enderecos/:id', 'DELETE', error.response?.data?.error || error.message);
    }
  }
}

async function testPedidoRoutes() {
  logInfo('TESTANDO ROTAS DE PEDIDOS (/api/pedidos)');

  // Criar endereço para o pedido
  let enderecoParaPedido = null;
  try {
    const endereco = await axios.post(
      `${API_URL}/enderecos`,
      {
        cep: '01001000',
        rua: 'Praça da Sé',
        numero: '123',
        bairro: 'Sé',
        cidade: 'São Paulo',
        estado: 'SP',
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    enderecoParaPedido = endereco.data.data.id;
  } catch (error) {
    logWarning('Não foi possível criar endereço para teste de pedido');
  }

  if (testProdutoId && enderecoParaPedido) {
    try {
      // 1. POST /api/pedidos - Criar pedido
      const novoPedido = await axios.post(
        `${API_URL}/pedidos`,
        {
          itens: [
            {
              produto_id: testProdutoId,
              quantidade: 2,
              tamanho: 'M',
              cor: 'Azul',
            },
          ],
          endereco_entrega_id: enderecoParaPedido,
          forma_pagamento: 'pix',
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      testPedidoId = novoPedido.data.data.id;
      logSuccess('/api/pedidos', 'POST', `Pedido criado - ID: ${testPedidoId}`);
    } catch (error) {
      logError('/api/pedidos', 'POST', error.response?.data?.error || error.message);
    }
  }

  try {
    // 2. GET /api/pedidos - Listar pedidos
    const pedidos = await axios.get(`${API_URL}/pedidos`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    logSuccess('/api/pedidos', 'GET', `${pedidos.data.count} pedidos encontrados`);
  } catch (error) {
    logError('/api/pedidos', 'GET', error.response?.data?.error || error.message);
  }

  if (testPedidoId) {
    try {
      // 3. GET /api/pedidos/:id - Obter pedido
      const pedido = await axios.get(`${API_URL}/pedidos/${testPedidoId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      logSuccess(`/api/pedidos/${testPedidoId}`, 'GET', `Pedido encontrado - Total: R$ ${pedido.data.data.total}`);
    } catch (error) {
      logError('/api/pedidos/:id', 'GET', error.response?.data?.error || error.message);
    }

    try {
      // 4. GET /api/pedidos/:id/rastreamento - Obter rastreamento
      const rastreamento = await axios.get(`${API_URL}/pedidos/${testPedidoId}/rastreamento`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      logSuccess(`/api/pedidos/${testPedidoId}/rastreamento`, 'GET', `Rastreamento obtido`);
    } catch (error) {
      logError('/api/pedidos/:id/rastreamento', 'GET', error.response?.data?.error || error.message);
    }

    try {
      // 5. PUT /api/pedidos/:id/status - Atualizar status (admin)
      await axios.put(
        `${API_URL}/pedidos/${testPedidoId}/status`,
        { status: 'pago', observacao: 'Pagamento confirmado' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess(`/api/pedidos/${testPedidoId}/status`, 'PUT', `Status atualizado para 'pago'`);
    } catch (error) {
      logError('/api/pedidos/:id/status', 'PUT', error.response?.data?.error || error.message);
    }

    try {
      // 6. POST /api/pedidos/:id/cancelar - Cancelar pedido (ANTES de enviar)
      await axios.post(
        `${API_URL}/pedidos/${testPedidoId}/cancelar`,
        { motivo: 'Teste de cancelamento' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      logSuccess(`/api/pedidos/${testPedidoId}/cancelar`, 'POST', `Pedido cancelado`);
    } catch (error) {
      logError('/api/pedidos/:id/cancelar', 'POST', error.response?.data?.error || error.message);
    }

    // Criar um novo pedido para testar rastreio (pois o anterior foi cancelado)
    let testPedidoRastreioId = null;
    let testEnderecoRastreioId = null;
    try {
      // Criar novo endereço temporário
      const novoEndereco = await axios.post(
        `${API_URL}/enderecos`,
        {
          cep: '12345-678',
          logradouro: 'Rua Teste Rastreio',
          numero: '999',
          bairro: 'Bairro Teste',
          cidade: 'Cidade Teste',
          estado: 'SP',
          complemento: 'Para teste de rastreio',
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      testEnderecoRastreioId = novoEndereco.data.data.id;

      // Criar novo pedido
      const novoPedido = await axios.post(
        `${API_URL}/pedidos`,
        {
          itens: [{ produto_id: testProdutoId, quantidade: 1 }],
          endereco_entrega_id: testEnderecoRastreioId,
          forma_pagamento: 'pix',
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      testPedidoRastreioId = novoPedido.data.data.id;
    } catch (error) {
      // Pedido de teste falhou
    }

    if (testPedidoRastreioId) {
      try {
        // 7. PUT /api/pedidos/:id/rastreio - Adicionar rastreio (admin)
        await axios.put(
          `${API_URL}/pedidos/${testPedidoRastreioId}/rastreio`,
          { codigo_rastreio: 'BR123456789BR', url_rastreamento: 'https://rastreio.com' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        logSuccess(`/api/pedidos/${testPedidoRastreioId}/rastreio`, 'PUT', `Código de rastreio adicionado`);
      } catch (error) {
        logError('/api/pedidos/:id/rastreio', 'PUT', error.response?.data?.error || error.message);
      }
    }
  }
}

async function testAvaliacaoRoutes() {
  logInfo('TESTANDO ROTAS DE AVALIAÇÕES E COMENTÁRIOS (/api)');

  if (testProdutoId) {
    try {
      // 1. POST /api/produtos/:id/avaliacoes - Criar avaliação
      const novaAvaliacao = await axios.post(
        `${API_URL}/produtos/${testProdutoId}/avaliacoes`,
        { nota: 5 },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      testAvaliacaoId = novaAvaliacao.data.data.id;
      logSuccess(`/api/produtos/${testProdutoId}/avaliacoes`, 'POST', `Avaliação criada - Nota: 5`);
    } catch (error) {
      logError('/api/produtos/:id/avaliacoes', 'POST', error.response?.data?.error || error.message);
    }

    try {
      // 2. GET /api/produtos/:id/avaliacoes - Listar avaliações
      const avaliacoes = await axios.get(`${API_URL}/produtos/${testProdutoId}/avaliacoes`);
      logSuccess(`/api/produtos/${testProdutoId}/avaliacoes`, 'GET', `${avaliacoes.data.count} avaliações`);
    } catch (error) {
      logError('/api/produtos/:id/avaliacoes', 'GET', error.response?.data?.error || error.message);
    }

    try {
      // 3. POST /api/produtos/:id/comentarios - Adicionar comentário
      const novoComentario = await axios.post(
        `${API_URL}/produtos/${testProdutoId}/comentarios`,
        { texto: 'Produto excelente! Recomendo.' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      logSuccess(`/api/produtos/${testProdutoId}/comentarios`, 'POST', `Comentário adicionado`);
    } catch (error) {
      logError('/api/produtos/:id/comentarios', 'POST', error.response?.data?.error || error.message);
    }

    try {
      // 4. GET /api/produtos/:id/comentarios - Listar comentários
      const comentarios = await axios.get(`${API_URL}/produtos/${testProdutoId}/comentarios`);
      logSuccess(`/api/produtos/${testProdutoId}/comentarios`, 'GET', `${comentarios.data.count} comentários`);
    } catch (error) {
      logError('/api/produtos/:id/comentarios', 'GET', error.response?.data?.error || error.message);
    }

    if (testAvaliacaoId) {
      try {
        // 5. PUT /api/avaliacoes/:id - Atualizar avaliação
        await axios.put(
          `${API_URL}/avaliacoes/${testAvaliacaoId}`,
          { nota: 4 },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        logSuccess(`/api/avaliacoes/${testAvaliacaoId}`, 'PUT', `Avaliação atualizada - Nova nota: 4`);
      } catch (error) {
        logError('/api/avaliacoes/:id', 'PUT', error.response?.data?.error || error.message);
      }

      try {
        // 6. DELETE /api/avaliacoes/:id - Deletar avaliação
        await axios.delete(`${API_URL}/avaliacoes/${testAvaliacaoId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        logSuccess(`/api/avaliacoes/${testAvaliacaoId}`, 'DELETE', `Avaliação deletada`);
      } catch (error) {
        logError('/api/avaliacoes/:id', 'DELETE', error.response?.data?.error || error.message);
      }
    }
  }
}

async function testCupomRoutes() {
  logInfo('TESTANDO ROTAS DE CUPONS (/api/cupons)');

  try {
    // 1. POST /api/cupons - Criar cupom (admin)
    const novoCupom = await axios.post(
      `${API_URL}/cupons`,
      {
        codigo: `TESTE${Date.now()}`,
        descricao: 'Cupom de teste',
        tipo_desconto: 'percentual',
        valor_desconto: 10,
        valor_minimo: 50,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    testCupomId = novoCupom.data.data.id;
    const codigoCupom = novoCupom.data.data.codigo;
    logSuccess('/api/cupons', 'POST', `Cupom criado - Código: ${codigoCupom}`);

    // 2. POST /api/cupons/validar - Validar cupom
    const validacao = await axios.post(`${API_URL}/cupons/validar`, { codigo: codigoCupom });
    logSuccess('/api/cupons/validar', 'POST', `Cupom válido - Desconto: ${validacao.data.data.valor_desconto}%`);
  } catch (error) {
    logError('/api/cupons (criar/validar)', 'POST', error.response?.data?.error || error.message);
  }

  try {
    // 3. GET /api/cupons - Listar cupons (admin)
    const cupons = await axios.get(`${API_URL}/cupons`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('/api/cupons', 'GET', `${cupons.data.count} cupons encontrados`);
  } catch (error) {
    logError('/api/cupons', 'GET', error.response?.data?.error || error.message);
  }

  if (testCupomId) {
    try {
      // 4. PUT /api/cupons/:id - Atualizar cupom (admin)
      await axios.put(
        `${API_URL}/cupons/${testCupomId}`,
        { valor_desconto: 15 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess(`/api/cupons/${testCupomId}`, 'PUT', `Cupom atualizado - Novo desconto: 15%`);
    } catch (error) {
      logError('/api/cupons/:id', 'PUT', error.response?.data?.error || error.message);
    }

    try {
      // 5. DELETE /api/cupons/:id - Deletar cupom (admin)
      await axios.delete(`${API_URL}/cupons/${testCupomId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      logSuccess(`/api/cupons/${testCupomId}`, 'DELETE', `Cupom deletado`);
    } catch (error) {
      logError('/api/cupons/:id', 'DELETE', error.response?.data?.error || error.message);
    }
  }
}

async function testNewsletterRoutes() {
  logInfo('TESTANDO ROTAS DE NEWSLETTER (/api/newsletter)');

  const emailTeste = `teste_${Date.now()}@newsletter.com`;

  try {
    // 1. POST /api/newsletter - Inscrever
    await axios.post(`${API_URL}/newsletter`, { email: emailTeste });
    logSuccess('/api/newsletter', 'POST', `Email inscrito: ${emailTeste}`);
  } catch (error) {
    logError('/api/newsletter', 'POST', error.response?.data?.error || error.message);
  }

  try {
    // 2. GET /api/newsletter - Listar inscritos (admin)
    const inscritos = await axios.get(`${API_URL}/newsletter`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('/api/newsletter', 'GET', `${inscritos.data.count} inscritos`);
  } catch (error) {
    logError('/api/newsletter', 'GET', error.response?.data?.error || error.message);
  }

  try {
    // 3. POST /api/newsletter/cancelar - Cancelar inscrição
    await axios.post(`${API_URL}/newsletter/cancelar`, { email: emailTeste });
    logSuccess('/api/newsletter/cancelar', 'POST', `Inscrição cancelada: ${emailTeste}`);
  } catch (error) {
    logError('/api/newsletter/cancelar', 'POST', error.response?.data?.error || error.message);
  }
}

async function testUsuarioRoutes() {
  logInfo('TESTANDO ROTAS DE USUÁRIOS (/api/usuarios) - ADMIN ONLY');

  try {
    // 1. GET /api/usuarios - Listar usuários (admin)
    const usuarios = await axios.get(`${API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSuccess('/api/usuarios', 'GET', `${usuarios.data.data.length} usuários listados`);
  } catch (error) {
    logError('/api/usuarios', 'GET', error.response?.data?.error || error.message);
  }

  if (testUserId) {
    try {
      // 2. GET /api/usuarios/:id - Obter usuário (admin)
      const usuario = await axios.get(`${API_URL}/usuarios/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      logSuccess(`/api/usuarios/${testUserId}`, 'GET', `Usuário: ${usuario.data.data.nome}`);
    } catch (error) {
      logError('/api/usuarios/:id', 'GET', error.response?.data?.error || error.message);
    }

    try {
      // 3. PATCH /api/usuarios/:id/admin - Alternar admin (admin)
      const toggleAdmin = await axios.patch(
        `${API_URL}/usuarios/${testUserId}/admin`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess(`/api/usuarios/${testUserId}/admin`, 'PATCH', `Status admin alterado`);
    } catch (error) {
      logError('/api/usuarios/:id/admin', 'PATCH', error.response?.data?.error || error.message);
    }
  }
}

// ==================== EXECUTAR TODOS OS TESTES ====================

async function runAllTests() {
  log('\n' + '═'.repeat(80), 'blue');
  log('🧪 INICIANDO TESTES COMPLETOS DA API POINT55', 'blue');
  log('═'.repeat(80) + '\n', 'blue');

  const startTime = Date.now();

  await testHealthChecks();
  await testAuthRoutes();
  await testCategoriaRoutes();
  await testProdutoRoutes();
  await testEnderecoRoutes();
  await testPedidoRoutes();
  await testAvaliacaoRoutes();
  await testCupomRoutes();
  await testNewsletterRoutes();
  await testUsuarioRoutes();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n' + '═'.repeat(80), 'blue');
  log(`✅ TESTES CONCLUÍDOS EM ${duration}s`, 'green');
  log('═'.repeat(80) + '\n', 'blue');
}

// Executar
runAllTests().catch((error) => {
  log('\n❌ ERRO FATAL NOS TESTES:', 'red');
  console.error(error);
  process.exit(1);
});
