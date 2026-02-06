const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

let tokens = {
  admin: null,
  user: null,
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (rota, metodo, detalhes = '') => {
  log(`✅ ${metodo.padEnd(6)} ${rota.padEnd(50)} ${detalhes}`, 'green');
};

const logError = (rota, metodo, erro) => {
  log(`❌ ${metodo.padEnd(6)} ${rota.padEnd(50)} ERRO: ${erro}`, 'red');
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

// Função para fazer login
async function fazerLogin() {
  try {
    logInfo('Fazendo login como admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@point55.com',
      senha: 'admin123',
    });
    
    tokens.admin = response.data.data.token;
    logSuccess('/api/auth/login', 'POST', 'Login admin realizado');
    
    return true;
  } catch (error) {
    logError('/api/auth/login', 'POST', error.response?.data?.error || error.message);
    return false;
  }
}

// Testar Badges
async function testarBadges() {
  log('\n═══════════════════════════════════════════════════════════════', 'blue');
  log('🏷️  TESTANDO BADGES', 'yellow');
  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  let badgeId = null;

  try {
    // 1. Listar badges
    const badges = await axios.get(`${API_URL}/badges`);
    logSuccess('/api/badges', 'GET', `${badges.data.count} badges encontrados`);

    // 2. Criar badge
    const novoBadge = await axios.post(
      `${API_URL}/badges`,
      {
        nome: 'Super Oferta',
        tipo: 'limitado',
        cor: '#FF0000',
        icone: '🔥',
      },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    badgeId = novoBadge.data.data.id;
    logSuccess('/api/badges', 'POST', `Badge criado com ID ${badgeId}`);

    // 3. Obter badge específico
    const badge = await axios.get(`${API_URL}/badges/${badgeId}`);
    logSuccess(`/api/badges/${badgeId}`, 'GET', `Badge: ${badge.data.data.nome}`);

    // 4. Atualizar badge
    const badgeAtualizado = await axios.put(
      `${API_URL}/badges/${badgeId}`,
      { nome: 'Super Oferta Atualizada' },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess(`/api/badges/${badgeId}`, 'PUT', 'Badge atualizado');

    // 5. Adicionar badge ao produto 1
    await axios.post(
      `${API_URL}/produtos/1/badges`,
      { badge_id: badgeId },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess('/api/produtos/1/badges', 'POST', 'Badge adicionado ao produto');

    // 6. Listar badges do produto
    const badgesProduto = await axios.get(`${API_URL}/produtos/1/badges`);
    logSuccess('/api/produtos/1/badges', 'GET', `${badgesProduto.data.count} badges no produto`);

    // 7. Remover badge do produto
    await axios.delete(
      `${API_URL}/produtos/1/badges/${badgeId}`,
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess(`/api/produtos/1/badges/${badgeId}`, 'DELETE', 'Badge removido do produto');

    // 8. Deletar badge
    await axios.delete(`${API_URL}/badges/${badgeId}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    logSuccess(`/api/badges/${badgeId}`, 'DELETE', 'Badge deletado');

  } catch (error) {
    logError('Badges', 'TESTE', error.response?.data?.error || error.message);
  }
}

// Testar Promoções
async function testarPromocoes() {
  log('\n═══════════════════════════════════════════════════════════════', 'blue');
  log('🎉 TESTANDO PROMOÇÕES', 'yellow');
  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  let promocaoId = null;

  try {
    // 1. Listar promoções
    const promocoes = await axios.get(`${API_URL}/promocoes`);
    logSuccess('/api/promocoes', 'GET', `${promocoes.data.count} promoções encontradas`);

    // 2. Criar promoção
    const dataInicio = new Date();
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + 30);

    const novaPromocao = await axios.post(
      `${API_URL}/promocoes`,
      {
        nome: 'Black Friday',
        descricao: 'Descontos especiais de até 50%',
        tipo_desconto: 'percentual',
        desconto_percentual: 50,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        produtos_aplicaveis: [1, 2, 3],
        ativa: true,
      },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    promocaoId = novaPromocao.data.data.id;
    logSuccess('/api/promocoes', 'POST', `Promoção criada com ID ${promocaoId}`);

    // 3. Obter promoção específica
    const promocao = await axios.get(`${API_URL}/promocoes/${promocaoId}`);
    logSuccess(`/api/promocoes/${promocaoId}`, 'GET', `Promoção: ${promocao.data.data.nome}`);

    // 4. Listar promoções vigentes
    const vigentes = await axios.get(`${API_URL}/promocoes/vigentes`);
    logSuccess('/api/promocoes/vigentes', 'GET', `${vigentes.data.count} promoções vigentes`);

    // 5. Verificar promoções aplicáveis ao produto
    const aplicaveis = await axios.get(`${API_URL}/promocoes/produtos/1`);
    logSuccess('/api/promocoes/produtos/1', 'GET', `${aplicaveis.data.count} promoções aplicáveis`);

    // 6. Atualizar promoção
    await axios.put(
      `${API_URL}/promocoes/${promocaoId}`,
      { desconto_percentual: 60 },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess(`/api/promocoes/${promocaoId}`, 'PUT', 'Promoção atualizada');

    // 7. Toggle promoção (ativar/desativar)
    await axios.patch(
      `${API_URL}/promocoes/${promocaoId}/ativar`,
      {},
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess(`/api/promocoes/${promocaoId}/ativar`, 'PATCH', 'Promoção desativada');

    // 8. Deletar promoção
    await axios.delete(`${API_URL}/promocoes/${promocaoId}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    logSuccess(`/api/promocoes/${promocaoId}`, 'DELETE', 'Promoção deletada');

  } catch (error) {
    logError('Promoções', 'TESTE', error.response?.data?.error || error.message);
  }
}

// Testar Carrinho
async function testarCarrinho() {
  log('\n═══════════════════════════════════════════════════════════════', 'blue');
  log('🛒 TESTANDO CARRINHO', 'yellow');
  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  let itemId = null;

  try {
    // 1. Obter carrinho vazio
    const carrinhoVazio = await axios.get(`${API_URL}/carrinho`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    logSuccess('/api/carrinho', 'GET', `Carrinho com ${carrinhoVazio.data.count} itens`);

    // 2. Adicionar item ao carrinho
    const novoItem = await axios.post(
      `${API_URL}/carrinho`,
      {
        produto_id: 1,
        quantidade: 1,
        tamanho: 'M',
        cor: 'Azul',
      },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    itemId = novoItem.data.data.id;
    logSuccess('/api/carrinho', 'POST', `Item adicionado com ID ${itemId}`);

    // 3. Adicionar outro item
    await axios.post(
      `${API_URL}/carrinho`,
      {
        produto_id: 2,
        quantidade: 1,
        tamanho: 'G',
      },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess('/api/carrinho', 'POST', 'Segundo item adicionado');

    // 4. Obter carrinho com itens
    const carrinhoComItens = await axios.get(`${API_URL}/carrinho`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    logSuccess('/api/carrinho', 'GET', `Carrinho com ${carrinhoComItens.data.count} itens, subtotal: R$ ${carrinhoComItens.data.data.subtotal}`);

    // 5. Atualizar quantidade
    await axios.put(
      `${API_URL}/carrinho/${itemId}`,
      { quantidade: 1 },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess(`/api/carrinho/${itemId}`, 'PUT', 'Quantidade mantida em 1');

    // 6. Remover item
    await axios.delete(`${API_URL}/carrinho/${itemId}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    logSuccess(`/api/carrinho/${itemId}`, 'DELETE', 'Item removido');

    // 7. Sincronizar carrinho
    const sincronizado = await axios.post(
      `${API_URL}/carrinho/sincronizar`,
      {
        itens: [
          { produto_id: 1, quantidade: 1, tamanho: 'P' },
          { produto_id: 3, quantidade: 2, cor: 'Preto' },
        ],
      },
      {
        headers: { Authorization: `Bearer ${tokens.admin}` },
      }
    );
    logSuccess('/api/carrinho/sincronizar', 'POST', `${sincronizado.data.count} itens sincronizados`);

    // 8. Limpar carrinho
    await axios.delete(`${API_URL}/carrinho`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    logSuccess('/api/carrinho', 'DELETE', 'Carrinho limpo');

  } catch (error) {
    logError('Carrinho', 'TESTE', error.response?.data?.error || error.message);
  }
}

// Executar todos os testes
async function executarTestes() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'blue');
  log('║          TESTE DAS NOVAS FUNCIONALIDADES - API              ║', 'yellow');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'blue');

  const loginOk = await fazerLogin();
  
  if (!loginOk) {
    log('\n❌ Não foi possível fazer login. Verifique se há um usuário admin cadastrado.', 'red');
    return;
  }

  await testarBadges();
  await testarPromocoes();
  await testarCarrinho();

  log('\n╔═══════════════════════════════════════════════════════════════╗', 'blue');
  log('║                    TESTES CONCLUÍDOS                        ║', 'green');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'blue');
}

// Executar
executarTestes().catch((error) => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});
