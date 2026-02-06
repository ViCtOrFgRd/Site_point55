const axios = require('axios');

// Teste de atualização com dados do frontend
async function testarComDadosReais() {
  try {
    console.log('🧪 Teste de Atualização com Dados do Frontend\n');

    // Simular os dados que vêm do frontend
    const dadosFrontend = {
      nome: 'Produto Teste',
      descricao: 'Descrição teste',
      preco: 89.99,
      preco_original: 100,
      desconto_percentual: 10.01,
      categoria_id: '1',
      estoque: 10,
      imagens: [],
      cores_disponiveis: [],
      tamanhos_disponiveis: [],
      ativo: true
    };

    console.log('📤 Dados a enviar:');
    console.log(JSON.stringify(dadosFrontend, null, 2));

    // Fazer requisição
    const response = await axios.put(
      'http://localhost:5000/api/produtos/914',
      dadosFrontend,
      {
        headers: {
          'Authorization': 'Bearer seu-token-aqui',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Sucesso!');
    console.log('Resposta:', response.data);

  } catch (error) {
    console.log('\n❌ Erro:');
    console.log('Status:', error.response?.status);
    console.log('Mensagem:', error.response?.data?.error);
    if (error.response?.data?.details) {
      console.log('Detalhes:', error.response.data.details);
    }
  }
}

testarComDadosReais();
