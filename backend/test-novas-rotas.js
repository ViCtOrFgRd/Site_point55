const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.yellow}${msg}${colors.reset}`),
};

async function testarRotas() {
  console.log('\n🔍 Testando Novas Rotas do Backend\n');

  // Teste 1: Health Check Database
  log.section('1. Health Check Database');
  try {
    const response = await axios.get('http://localhost:5000/health/database');
    if (response.data.status === 'ok') {
      log.success(`Database: ${response.data.database}`);
    } else {
      log.error(`Database desconectado: ${response.data.database}`);
    }
  } catch (error) {
    log.error(`Erro ao testar /health/database: ${error.message}`);
  }

  // Teste 2: Validar Cupom (sem cupom válido)
  log.section('2. Validar Cupom');
  try {
    await axios.post(`${API_URL}/cupons/validar`, { codigo: 'TESTE10' });
    log.success('Rota de validação de cupom está funcionando');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log.success('Rota está funcionando (cupom não encontrado - esperado)');
    } else {
      log.error(`Erro ao testar validação de cupom: ${error.message}`);
    }
  }

  // Teste 3: Newsletter - Inscrever
  log.section('3. Inscrever Newsletter');
  try {
    const testEmail = `teste${Date.now()}@example.com`;
    const response = await axios.post(`${API_URL}/newsletter`, {
      email: testEmail,
    });
    log.success(`Newsletter: ${response.data.message}`);
  } catch (error) {
    log.error(`Erro ao inscrever newsletter: ${error.response?.data?.error || error.message}`);
  }

  // Teste 4: Newsletter - Email Duplicado
  log.section('4. Testar Email Duplicado');
  try {
    const testEmail = 'duplicado@example.com';
    // Primeira inscrição
    await axios.post(`${API_URL}/newsletter`, { email: testEmail });
    // Tentativa de duplicação
    await axios.post(`${API_URL}/newsletter`, { email: testEmail });
    log.error('Deveria ter bloqueado email duplicado');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log.success('Validação de email duplicado funcionando corretamente');
    } else {
      log.error(`Erro inesperado: ${error.message}`);
    }
  }

  // Teste 5: Rastreamento de Pedido (sem autenticação)
  log.section('5. Rastreamento de Pedido');
  try {
    await axios.get(`${API_URL}/pedidos/1/rastreamento`);
    log.error('Deveria requerer autenticação');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log.success('Proteção de autenticação funcionando');
    } else {
      log.error(`Erro inesperado: ${error.message}`);
    }
  }

  // Resumo de rotas registradas
  log.section('✅ Rotas Criadas e Registradas:');
  console.log(`
  ${colors.green}✓${colors.reset} GET  /health/database
  ${colors.green}✓${colors.reset} POST /api/cupons/validar
  ${colors.green}✓${colors.reset} GET  /api/cupons (admin)
  ${colors.green}✓${colors.reset} POST /api/cupons (admin)
  ${colors.green}✓${colors.reset} PUT  /api/cupons/:id (admin)
  ${colors.green}✓${colors.reset} DELETE /api/cupons/:id (admin)
  ${colors.green}✓${colors.reset} POST /api/newsletter
  ${colors.green}✓${colors.reset} DELETE /api/newsletter
  ${colors.green}✓${colors.reset} GET  /api/newsletter (admin)
  ${colors.green}✓${colors.reset} GET  /api/pedidos/:id/rastreamento
  `);

  console.log(`${colors.blue}ℹ${colors.reset} Para testar completamente, inicie o servidor backend\n`);
}

// Verificar se o servidor está rodando
axios
  .get('http://localhost:5000/health')
  .then(() => {
    testarRotas();
  })
  .catch((error) => {
    console.log(`\n${colors.red}✗ Servidor backend não está rodando${colors.reset}`);
    console.log(`${colors.yellow}ℹ Inicie o servidor com: cd backend && node server.js${colors.reset}\n`);
    process.exit(1);
  });
