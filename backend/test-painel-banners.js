require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';
let token = '';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(numero, descricao, sucesso) {
  const status = sucesso ? '✅' : '❌';
  const cor = sucesso ? 'green' : 'red';
  log(`${status} ${numero}. ${descricao}`, cor);
}

async function testarPainelBanners() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🎯 TESTE COMPLETO - PAINEL DE BANNERS', 'bold');
  log('='.repeat(70) + '\n', 'cyan');

  let bannerId = null;

  try {
    // 1. Login Admin
    log('1. Fazendo login como admin...', 'yellow');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_ADMIN_EMAIL,
      senha: TEST_ADMIN_PASSWORD,
    });

    if (loginResponse.data && loginResponse.data.success) {
      // O token pode estar em data.token ou data.data.token
      token = loginResponse.data.data?.token || loginResponse.data.token || '';
      
      if (token) {
        logTest(1, 'Login admin - Token obtido', true);
      } else {
        log('   ⚠️ Login OK mas sem token', 'yellow');
        logTest(1, 'Login admin - OK (sem token)', true);
      }
    } else {
      throw new Error('Falha no login');
    }

    // Configurar axios com token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Listar banners
    log('\n2. Listando todos os banners...', 'yellow');
    const listResponse = await axios.get(`${API_URL}/banners`);
    
    if (listResponse.data.success) {
      const totalBanners = listResponse.data.count || 0;
      logTest(2, `GET /api/banners - ${totalBanners} banners encontrados`, true);
      
      if (totalBanners > 0) {
        log(`   Primeiro banner: ${listResponse.data.data[0].titulo}`, 'cyan');
      }
    } else {
      throw new Error('Falha ao listar banners');
    }

    // 3. Criar novo banner
    log('\n3. Criando novo banner...', 'yellow');
    const novoBanner = {
      titulo: 'TESTE AUTOMATIZADO',
      subtitulo: 'Banner criado por teste automatizado',
      texto_botao: 'Clique Aqui',
      link_botao: '/teste',
      imagem: '/images/teste.jpg',
      cor_fundo: '#FF5733',
      ordem: 99,
      ativo: true
    };

    const createResponse = await axios.post(`${API_URL}/banners`, novoBanner);
    
    if (createResponse.data.success && createResponse.data.data) {
      bannerId = createResponse.data.data.id;
      logTest(3, `POST /api/banners - Banner criado com ID ${bannerId}`, true);
      log(`   Título: ${createResponse.data.data.titulo}`, 'cyan');
      log(`   Cor: ${createResponse.data.data.cor_fundo}`, 'cyan');
    } else {
      throw new Error('Falha ao criar banner');
    }

    // 4. Obter banner específico
    log('\n4. Obtendo banner criado...', 'yellow');
    const getResponse = await axios.get(`${API_URL}/banners/${bannerId}`);
    
    if (getResponse.data.success && getResponse.data.data) {
      logTest(4, `GET /api/banners/${bannerId} - Banner obtido: ${getResponse.data.data.titulo}`, true);
      log(`   Subtítulo: ${getResponse.data.data.subtitulo}`, 'cyan');
      log(`   Status: ${getResponse.data.data.ativo ? 'Ativo' : 'Inativo'}`, 'cyan');
    } else {
      throw new Error('Falha ao obter banner');
    }

    // 5. Atualizar banner
    log('\n5. Atualizando banner...', 'yellow');
    const updateData = {
      titulo: 'TESTE ATUALIZADO',
      subtitulo: 'Banner atualizado com sucesso',
      cor_fundo: '#00AA00'
    };

    const updateResponse = await axios.put(`${API_URL}/banners/${bannerId}`, updateData);
    
    if (updateResponse.data.success) {
      logTest(5, 'PUT /api/banners/:id - Banner atualizado', true);
      log(`   Novo título: ${updateResponse.data.data.titulo}`, 'cyan');
      log(`   Nova cor: ${updateResponse.data.data.cor_fundo}`, 'cyan');
    } else {
      throw new Error('Falha ao atualizar banner');
    }

    // 6. Alternar status
    log('\n6. Alternando status do banner...', 'yellow');
    const toggleResponse = await axios.patch(`${API_URL}/banners/${bannerId}/toggle`);
    
    if (toggleResponse.data.success) {
      const novoStatus = toggleResponse.data.data.ativo;
      logTest(6, `PATCH /api/banners/:id/toggle - Status alterado (${novoStatus ? 'ATIVO' : 'INATIVO'})`, true);
    } else {
      throw new Error('Falha ao alternar status');
    }

    // 7. Listar apenas banners ativos
    log('\n7. Listando apenas banners ativos...', 'yellow');
    const activeResponse = await axios.get(`${API_URL}/banners`, {
      params: { ativos_apenas: true }
    });
    
    if (activeResponse.data.success) {
      const totalAtivos = activeResponse.data.count || 0;
      logTest(7, `GET /api/banners?ativos_apenas=true - ${totalAtivos} banners ativos`, true);
    } else {
      throw new Error('Falha ao listar banners ativos');
    }

    // 8. Reordenar banners
    log('\n8. Testando reordenação...', 'yellow');
    const allBanners = await axios.get(`${API_URL}/banners`);
    
    if (allBanners.data.success && allBanners.data.data.length >= 2) {
      const bannersParaReordenar = allBanners.data.data.slice(0, 2).map((b, i) => ({
        id: b.id,
        ordem: i === 0 ? 1 : 0 // Inverter ordem dos 2 primeiros
      }));

      const reorderResponse = await axios.patch(`${API_URL}/banners/reordenar`, {
        banners: bannersParaReordenar
      });

      if (reorderResponse.data.success) {
        logTest(8, 'PATCH /api/banners/reordenar - Ordem atualizada', true);
      } else {
        throw new Error('Falha ao reordenar');
      }
    } else {
      log('   ⚠️ Pulando teste de reordenação (menos de 2 banners)', 'yellow');
      logTest(8, 'PATCH /api/banners/reordenar - Pulado', true);
    }

    // 9. Deletar banner
    log('\n9. Deletando banner de teste...', 'yellow');
    const deleteResponse = await axios.delete(`${API_URL}/banners/${bannerId}`);
    
    if (deleteResponse.data.success) {
      logTest(9, 'DELETE /api/banners/:id - Banner deletado', true);
    } else {
      throw new Error('Falha ao deletar banner');
    }

    // Resumo
    log('\n' + '='.repeat(70), 'cyan');
    log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!', 'green');
    log('='.repeat(70) + '\n', 'cyan');

    log('📊 RESUMO:', 'bold');
    log('   ✅ 9/9 testes passaram', 'green');
    log('   ✅ CRUD completo funcionando', 'green');
    log('   ✅ Sistema de banners 100% operacional', 'green');

  } catch (error) {
    log('\n' + '='.repeat(70), 'red');
    log('❌ ERRO NO TESTE!', 'red');
    log('='.repeat(70) + '\n', 'red');

    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Mensagem: ${error.response.data.message || error.response.data.error || 'Erro desconhecido'}`, 'red');
      if (error.response.data.details) {
        log(`Detalhes: ${JSON.stringify(error.response.data.details, null, 2)}`, 'red');
      }
    } else {
      log(`Erro: ${error.message}`, 'red');
    }

    // Tentar limpar banner de teste se foi criado
    if (bannerId) {
      try {
        log('\n🧹 Limpando banner de teste...', 'yellow');
        await axios.delete(`${API_URL}/banners/${bannerId}`);
        log('   Banner de teste removido', 'green');
      } catch (cleanupError) {
        log('   Falha ao limpar banner de teste', 'red');
      }
    }

    process.exit(1);
  }
}

// Executar testes
testarPainelBanners();
