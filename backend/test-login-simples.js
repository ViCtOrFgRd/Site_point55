require('dotenv').config();
const axios = require('axios');

console.log('🔍 Testando login simples\n');

// Testar com credenciais diretas
async function testarLogin(email, senha) {
  try {
    console.log(`Tentando login com: ${email}`);
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      senha: senha,  // API usa "senha", não "password"
    });
    console.log('✅ Sucesso:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    return false;
  }
}

async function testarTodas() {
  console.log('Teste 1: victorfiigueiredo@gmail.com');
  await testarLogin('victorfiigueiredo@gmail.com', 'victor123');
  
  console.log('\nTeste 2: queren@gmail.com');
  await testarLogin('queren@gmail.com', 'victor123');
  
  console.log('\nTeste 3: do .env');
  await testarLogin(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
  
  console.log('\n🔧 Valores do .env:');
  console.log('TEST_USER_EMAIL:', process.env.TEST_USER_EMAIL);
  console.log('TEST_USER_PASSWORD:', process.env.TEST_USER_PASSWORD);
}

testarTodas();
