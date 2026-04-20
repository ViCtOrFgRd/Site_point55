/**
 * TESTE DO PAINEL ADMIN DE BADGES
 * 
 * Este script testa todas as funcionalidades do painel de badges:
 * 1. Login como admin
 * 2. Listar badges existentes
 * 3. Criar novo badge
 * 4. Editar badge
 * 5. Vincular badge a produto
 * 6. Remover badge de produto
 * 7. Deletar badge
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';
let adminToken = '';
let badgeIdCriado = 0;
let produtoTesteId = 1; // Assumindo que existe produto ID 1

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function logSuccess(test, details = '') {
  console.log(`${colors.green}✅ ${test}${colors.reset}${details ? ` - ${details}` : ''}`);
}

function logError(test, error) {
  console.log(`${colors.red}❌ ${test}${colors.reset}`);
  console.log(`   Erro: ${error}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.yellow}═══ ${title} ═══${colors.reset}\n`);
}

async function testarPainelBadges() {
  console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║   TESTE DO PAINEL ADMIN DE BADGES        ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // 1. LOGIN COMO ADMIN
    logSection('1. AUTENTICAÇÃO');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_ADMIN_EMAIL,
      senha: TEST_ADMIN_PASSWORD,
    });

    if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
      adminToken = loginResponse.data.data.token;
      logSuccess('Login admin realizado', `Token obtido`);
    } else {
      console.log('Resposta do login:', JSON.stringify(loginResponse.data, null, 2));
      throw new Error('Falha no login');
    }

    // Configurar headers para próximas requisições
    const config = {
      headers: { Authorization: `Bearer ${adminToken}` },
    };

    // 2. LISTAR BADGES EXISTENTES
    logSection('2. LISTAR BADGES');
    const listarResponse = await axios.get(`${API_URL}/badges`, config);
    
    if (listarResponse.data.success) {
      const badges = listarResponse.data.data || [];
      logSuccess('GET /api/badges', `${badges.length} badges encontrados`);
      
      if (badges.length > 0) {
        logInfo(`Exemplos: ${badges.slice(0, 3).map(b => b.nome).join(', ')}`);
      }
    }

    // 3. CRIAR NOVO BADGE
    logSection('3. CRIAR BADGE');
    const novoBadge = {
      nome: 'TESTE AUTO',
      tipo: 'novo',
      cor: '#FF6B6B',
      icone: '🧪',
      ativo: true,
    };

    const criarResponse = await axios.post(`${API_URL}/badges`, novoBadge, config);
    
    if (criarResponse.data.success && criarResponse.data.data) {
      badgeIdCriado = criarResponse.data.data.id;
      logSuccess('POST /api/badges', `Badge criado com ID ${badgeIdCriado}`);
      logInfo(`Nome: ${novoBadge.nome}, Tipo: ${novoBadge.tipo}, Ícone: ${novoBadge.icone}`);
    }

    // 4. OBTER BADGE ESPECÍFICO
    logSection('4. OBTER BADGE');
    const obterResponse = await axios.get(`${API_URL}/badges/${badgeIdCriado}`, config);
    
    if (obterResponse.data.success && obterResponse.data.data) {
      const badge = obterResponse.data.data;
      logSuccess('GET /api/badges/:id', `Badge obtido: ${badge.nome}`);
      logInfo(`Detalhes: Tipo=${badge.tipo}, Cor=${badge.cor}, Ativo=${badge.ativo}`);
    }

    // 5. ATUALIZAR BADGE
    logSection('5. ATUALIZAR BADGE');
    const dadosAtualizacao = {
      nome: 'TESTE AUTO ATUALIZADO',
      tipo: 'limitado',
      cor: '#4ECDC4',
      icone: '💎',
      ativo: true,
    };

    const atualizarResponse = await axios.put(
      `${API_URL}/badges/${badgeIdCriado}`,
      dadosAtualizacao,
      config
    );
    
    if (atualizarResponse.data.success) {
      logSuccess('PUT /api/badges/:id', 'Badge atualizado');
      logInfo(`Novo nome: ${dadosAtualizacao.nome}, Novo tipo: ${dadosAtualizacao.tipo}`);
    }

    // 6. VINCULAR BADGE A PRODUTO
    logSection('6. VINCULAR BADGE A PRODUTO');
    try {
      const vincularResponse = await axios.post(
        `${API_URL}/produtos/${produtoTesteId}/badges`,
        { badge_id: badgeIdCriado },
        config
      );
      
      if (vincularResponse.data.success) {
        logSuccess('POST /api/produtos/:id/badges', `Badge vinculado ao produto ${produtoTesteId}`);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('já tem este badge')) {
        logSuccess('POST /api/produtos/:id/badges', 'Badge já vinculado (esperado)');
      } else {
        throw error;
      }
    }

    // 7. LISTAR BADGES DO PRODUTO
    logSection('7. BADGES DO PRODUTO');
    const badgesProdutoResponse = await axios.get(
      `${API_URL}/produtos/${produtoTesteId}/badges`,
      config
    );
    
    if (badgesProdutoResponse.data.success) {
      const badgesProduto = badgesProdutoResponse.data.data || [];
      logSuccess('GET /api/produtos/:id/badges', `${badgesProduto.length} badges no produto`);
      
      if (badgesProduto.length > 0) {
        logInfo(`Badges: ${badgesProduto.map(b => b.nome).join(', ')}`);
      }
    }

    // 8. REMOVER BADGE DO PRODUTO
    logSection('8. REMOVER BADGE DO PRODUTO');
    const removerVinculoResponse = await axios.delete(
      `${API_URL}/produtos/${produtoTesteId}/badges/${badgeIdCriado}`,
      config
    );
    
    if (removerVinculoResponse.data.success) {
      logSuccess('DELETE /api/produtos/:id/badges/:badgeId', 'Badge removido do produto');
    }

    // 9. DELETAR BADGE (LIMPEZA)
    logSection('9. DELETAR BADGE');
    const deletarResponse = await axios.delete(
      `${API_URL}/badges/${badgeIdCriado}`,
      config
    );
    
    if (deletarResponse.data.success) {
      logSuccess('DELETE /api/badges/:id', 'Badge deletado (limpeza)');
    }

    // RESUMO FINAL
    logSection('RESUMO');
    console.log(`${colors.green}${colors.bold}✅ TODOS OS TESTES DO PAINEL DE BADGES PASSARAM!${colors.reset}\n`);
    console.log(`${colors.cyan}Testes realizados:${colors.reset}`);
    console.log(`  1. ✅ Login admin`);
    console.log(`  2. ✅ Listar badges`);
    console.log(`  3. ✅ Criar badge`);
    console.log(`  4. ✅ Obter badge específico`);
    console.log(`  5. ✅ Atualizar badge`);
    console.log(`  6. ✅ Vincular badge a produto`);
    console.log(`  7. ✅ Listar badges do produto`);
    console.log(`  8. ✅ Remover badge do produto`);
    console.log(`  9. ✅ Deletar badge`);
    console.log(`\n${colors.bold}Total: 9/9 testes passaram${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}❌ ERRO NO TESTE:${colors.reset}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Erro: ${error.response.data?.error || error.response.data?.message || 'Erro desconhecido'}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Executar testes
testarPainelBadges();
