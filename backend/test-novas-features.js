const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

console.log('\n' + colors.cyan + '🧪 Teste de Novas Funcionalidades Backend' + colors.reset);
console.log('='.repeat(60) + '\n');

let token = '';
let userId = 0;

// Função auxiliar para fazer requisições
async function testar(descricao, metodo, url, data = null, headers = {}) {
  try {
    const config = {
      method: metodo,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(colors.green + `✅ ${descricao}` + colors.reset);
    console.log('   Status:', response.status);
    if (response.data) {
      console.log('   Resposta:', JSON.stringify(response.data, null, 2).substring(0, 200));
    }
    console.log('');
    return response.data;
  } catch (error) {
    console.log(colors.red + `❌ ${descricao}` + colors.reset);
    console.log('   Erro:', error.response?.data || error.message);
    console.log('');
    return null;
  }
}

async function executarTestes() {
  // 1. Testar Recuperação de Senha
  console.log(colors.yellow + '📧 Testes de Recuperação de Senha' + colors.reset);
  console.log('-'.repeat(60) + '\n');

  await testar(
    '1.1 - Solicitar recuperação para email existente',
    'POST',
    '/auth/recuperar-senha',
    { email: 'teste@gmail.com' }
  );

  await testar(
    '1.2 - Solicitar recuperação para email inexistente',
    'POST',
    '/auth/recuperar-senha',
    { email: 'naoexiste@gmail.com' }
  );

  await testar(
    '1.3 - Solicitar sem email',
    'POST',
    '/auth/recuperar-senha',
    {}
  );

  // 2. Login para obter token
  console.log(colors.yellow + '🔐 Login para Testes de Favoritos' + colors.reset);
  console.log('-'.repeat(60) + '\n');

  const loginData = await testar(
    '2.1 - Login com usuário teste',
    'POST',
    '/auth/login',
    {
      email: 'teste@gmail.com',
      senha: '123456'
    }
  );

  if (loginData && loginData.data && loginData.data.token) {
    token = loginData.data.token;
    userId = loginData.data.usuario.id;
    console.log(colors.cyan + '   Token obtido com sucesso!' + colors.reset + '\n');
  } else {
    console.log(colors.red + '   ⚠️  Não foi possível obter token. Criando usuário...' + colors.reset + '\n');
    
    const registerData = await testar(
      '2.2 - Criar usuário teste',
      'POST',
      '/auth/registro',
      {
        nome: 'Usuário Teste',
        email: 'teste@gmail.com',
        senha: '123456'
      }
    );

    if (registerData && registerData.data && registerData.data.token) {
      token = registerData.data.token;
      userId = registerData.data.usuario.id;
      console.log(colors.cyan + '   Token obtido após registro!' + colors.reset + '\n');
    } else {
      // Tentar fazer login novamente após criar o usuário
      console.log(colors.yellow + '   Tentando fazer login novamente...' + colors.reset + '\n');
      const loginRetry = await testar(
        '2.3 - Login após registro',
        'POST',
        '/auth/login',
        {
          email: 'teste@gmail.com',
          senha: '123456'
        }
      );

      if (loginRetry && loginRetry.data && loginRetry.data.token) {
        token = loginRetry.data.token;
        userId = loginRetry.data.usuario.id;
        console.log(colors.cyan + '   Token obtido no login retry!' + colors.reset + '\n');
      }
    }
  }

  if (!token) {
    console.log(colors.red + '❌ Não foi possível obter token de autenticação' + colors.reset);
    console.log(colors.yellow + '   Verifique se o backend está rodando e se as credenciais estão corretas' + colors.reset + '\n');
    return;
  }

  // 3. Testar Favoritos
  console.log(colors.yellow + '❤️  Testes de Favoritos' + colors.reset);
  console.log('-'.repeat(60) + '\n');

  await testar(
    '3.1 - Listar favoritos (vazio)',
    'GET',
    '/favoritos',
    null,
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.2 - Adicionar produto aos favoritos (ID 1)',
    'POST',
    '/favoritos',
    { produtoId: 1 },
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.3 - Adicionar outro produto (ID 2)',
    'POST',
    '/favoritos',
    { produtoId: 2 },
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.4 - Tentar adicionar produto duplicado',
    'POST',
    '/favoritos',
    { produtoId: 1 },
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.5 - Listar favoritos (com produtos)',
    'GET',
    '/favoritos',
    null,
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.6 - Verificar se produto está nos favoritos',
    'GET',
    '/favoritos/verificar/1',
    null,
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.7 - Remover produto dos favoritos',
    'DELETE',
    '/favoritos/1',
    null,
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.8 - Listar favoritos após remoção',
    'GET',
    '/favoritos',
    null,
    { Authorization: `Bearer ${token}` }
  );

  await testar(
    '3.9 - Tentar adicionar produto inexistente',
    'POST',
    '/favoritos',
    { produtoId: 99999 },
    { Authorization: `Bearer ${token}` }
  );

  // 4. Testar sem autenticação
  console.log(colors.yellow + '🔒 Testes de Segurança' + colors.reset);
  console.log('-'.repeat(60) + '\n');

  await testar(
    '4.1 - Tentar listar favoritos sem token',
    'GET',
    '/favoritos'
  );

  await testar(
    '4.2 - Tentar adicionar favorito sem token',
    'POST',
    '/favoritos',
    { produtoId: 1 }
  );

  console.log(colors.cyan + '\n' + '='.repeat(60));
  console.log('🎉 Testes concluídos!');
  console.log('='.repeat(60) + '\n' + colors.reset);
}

// Executar testes
executarTestes().catch(console.error);
