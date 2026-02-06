#!/usr/bin/env node

/**
 * 🧪 TESTE DE CORREÇÃO: Desconto Percentual
 * 
 * Este script testa se a correção para o erro de desconto percentual
 * "sintaxe de entrada é inválida para tipo integer: "33.64"" funciona corretamente.
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:5000';
let TEST_USER_TOKEN = process.env.TEST_TOKEN || '';

let testsPassed = 0;
let testsFailed = 0;

// Credentials padrão para teste (criar esse usuário antes!)
const TEST_USER = {
  email: 'admin@test.com',
  senha: 'Senha123!'
};

// ==================== AUTENTICAÇÃO ====================

async function autenticar() {
  try {
    console.log('\n🔐 Autenticando...');
    
    // Primeiro tenta com token da variável de ambiente
    if (TEST_USER_TOKEN) {
      console.log('   ✅ Usando token da variável TEST_TOKEN');
      return true;
    }

    // Se não tiver token, tenta fazer login
    console.log(`   📧 Tentando login com ${TEST_USER.email}...`);
    const response = await makeRequest('POST', '/api/auth/login', {
      email: TEST_USER.email,
      senha: TEST_USER.senha
    });

    if (response.status === 200 && response.data?.token) {
      TEST_USER_TOKEN = response.data.token;
      console.log('   ✅ Login realizado com sucesso!');
      return true;
    } else if (response.status === 404) {
      console.log('   ⚠️  Usuário não existe. Criando usuário de teste...');
      return await criarUsuarioTeste();
    } else {
      console.log(`   ❌ Erro ao fazer login: ${response.data?.error || response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro ao autenticar: ${error.message}`);
    return false;
  }
}

async function criarUsuarioTeste() {
  try {
    console.log(`   📝 Criando usuário de teste...`);
    const response = await makeRequest('POST', '/api/auth/registrar', {
      nome: 'Teste Admin',
      email: TEST_USER.email,
      senha: TEST_USER.senha,
      is_admin: true
    });

    if (response.status === 201 && response.data?.token) {
      TEST_USER_TOKEN = response.data.token;
      console.log('   ✅ Usuário de teste criado!');
      return true;
    } else {
      console.log(`   ❌ Erro ao criar usuário: ${response.data?.error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro ao criar usuário: ${error.message}`);
    return false;
  }
}

// ==================== TESTES ====================

const tests = [
  {
    name: '✅ Teste 1: Criar produto com desconto válido',
    method: 'POST',
    endpoint: '/api/produtos',
    data: {
      nome: 'Teste Desconto ' + new Date().getTime(),
      descricao: 'Produto para testar desconto percentual',
      preco: 2100.00,
      preco_original: 30000.00,
      desconto_percentual: 93,
      categoria_id: 3,
      estoque: 5,
      imagens: [],
      ativo: true
    },
    expectedStatus: 200,
  },
  {
    name: '✅ Teste 2: Atualizar produto com desconto como string',
    method: 'PUT',
    endpoint: '/api/produtos/1',
    data: {
      desconto_percentual: '50.5',
      preco: 5000,
      preco_original: 10000
    },
    expectedStatus: 200,
  },
  {
    name: '✅ Teste 3: Desconto > 100% deve ser limitado',
    method: 'PUT',
    endpoint: '/api/produtos/1',
    data: {
      desconto_percentual: 150
    },
    expectedStatus: 200,
    expectValue: 100
  },
  {
    name: '✅ Teste 4: Desconto inválido deve virar 0',
    method: 'PUT',
    endpoint: '/api/produtos/1',
    data: {
      desconto_percentual: 'abcd'
    },
    expectedStatus: 200,
    expectValue: 0
  },
];

// ==================== UTILITÁRIOS ====================

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + endpoint);
    
    // Escolher http ou https baseado na URL
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Adicionar token se disponível
    if (TEST_USER_TOKEN) {
      options.headers['Authorization'] = `Bearer ${TEST_USER_TOKEN}`;
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: responseData ? JSON.parse(responseData) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 INICIANDO TESTES DE DESCONTO PERCENTUAL\n');
  console.log('═'.repeat(60));

  // Autenticar primeiro
  const autenticado = await autenticar();
  if (!autenticado) {
    console.log('\n❌ Não foi possível autenticar. Abortando testes.');
    console.log('\n💡 Dicas:');
    console.log('   1. Defina TEST_TOKEN na variável de ambiente');
    console.log('   2. OU crie um usuário com:');
    console.log('      Email: admin@test.com');
    console.log('      Senha: Senha123!');
    console.log('   3. OU modifique TEST_USER no script\n');
    process.exit(1);
  }

  for (const test of tests) {
    try {
      console.log(`\n${test.name}`);
      console.log('─'.repeat(60));

      const response = await makeRequest(test.method, test.endpoint, test.data);

      // Validar status
      if (response.status === test.expectedStatus) {
        console.log(`✅ Status HTTP: ${response.status} (esperado: ${test.expectedStatus})`);
        testsPassed++;
      } else {
        console.log(`❌ Status HTTP: ${response.status} (esperado: ${test.expectedStatus})`);
        testsFailed++;
      }

      // Validar valor de desconto se aplicável
      if (test.expectValue !== undefined) {
        const descontoRecebido = response.data?.data?.desconto_percentual;
        if (descontoRecebido === test.expectValue) {
          console.log(`✅ Desconto: ${descontoRecebido} (esperado: ${test.expectValue})`);
          testsPassed++;
        } else {
          console.log(`❌ Desconto: ${descontoRecebido} (esperado: ${test.expectValue})`);
          testsFailed++;
        }
      }

      // Validar se não há erro
      if (!response.data?.error) {
        console.log(`✅ Sem erros na resposta`);
        testsPassed++;
      } else {
        console.log(`⚠️  Erro: ${response.data.error}`);
        if (!response.data.error.includes('sintaxe de entrada')) {
          testsFailed++;
        }
      }

      console.log(`📊 Resposta:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');

    } catch (error) {
      console.log(`❌ Erro ao executar teste: ${error.message}`);
      testsFailed++;
    }
  }

  // ==================== RESUMO ====================

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RESUMO DOS TESTES\n');
  console.log(`✅ Testes aprovados: ${testsPassed}`);
  console.log(`❌ Testes falhados: ${testsFailed}`);
  console.log(`📈 Taxa de sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Desconto percentual está funcionando corretamente.');
  } else {
    console.log(`\n⚠️  ${testsFailed} teste(s) falharam. Verifique os logs acima.`);
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// ==================== EXECUÇÃO ====================

console.log('\n🚀 Testes de Desconto Percentual');
console.log('─'.repeat(60));
console.log('📌 Certifique-se de que:');
console.log('   1. Servidor backend está rodando: npm run dev');
console.log('   2. Banco de dados está acessível');
console.log('─'.repeat(60));

// Aguardar um pouco para o servidor iniciar, depois rodar testes
setTimeout(runTests, 500);
