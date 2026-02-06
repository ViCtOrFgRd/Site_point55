const http = require('http');

// Teste de registro
const registroData = JSON.stringify({
  nome: 'Teste Usuario',
  email: `teste_${Date.now()}@example.com`,
  cpf: '12345678901',
  telefone: '11999999999',
  senha: 'Teste123!'
});

const registroOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/registro',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registroData.length
  }
};

console.log('🧪 Testando API de Registro...\n');

const req = http.request(registroOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Response:', data);
    
    try {
      const json = JSON.parse(data);
      console.log('\n✅ Parsed JSON:', JSON.stringify(json, null, 2));
      
      if (json.success && json.data && json.data.token) {
        console.log('\n✅ Registro bem-sucedido!');
        console.log('Token:', json.data.token.substring(0, 20) + '...');
        console.log('Usuário:', json.data.usuario.nome, '-', json.data.usuario.email);
      } else {
        console.log('\n❌ Resposta inesperada');
      }
    } catch (e) {
      console.log('\n❌ Erro ao parsear JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error);
});

req.write(registroData);
req.end();
