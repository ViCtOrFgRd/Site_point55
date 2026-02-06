const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testando API de produtos...\n');
    
    // Teste 1: Listar produtos sem filtros
    const response1 = await axios.get('http://localhost:5000/api/produtos?limite=5');
    console.log('✓ GET /api/produtos?limite=5');
    console.log('  Produtos retornados:', response1.data.count);
    console.log('  Total no banco:', response1.data.total);
    console.log('  Estrutura da resposta:', Object.keys(response1.data));
    
    if (response1.data.data && response1.data.data.length > 0) {
      const produto = response1.data.data[0];
      console.log('\n  Primeiro produto:');
      console.log('  - ID:', produto.id);
      console.log('  - Nome:', produto.nome);
      console.log('  - Preço:', produto.preco);
      console.log('  - Imagens:', produto.imagens ? produto.imagens.length : 0);
      console.log('  - Categoria:', produto.categoria_nome);
    }
    
    // Teste 2: Com paginação
    console.log('\n✓ Teste com paginação (página 2)');
    const response2 = await axios.get('http://localhost:5000/api/produtos?pagina=2&limite=10');
    console.log('  Produtos página 2:', response2.data.count);
    console.log('  Total páginas:', response2.data.totalPaginas);
    
  } catch (error) {
    console.error('✗ Erro ao testar API:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Dados:', error.response.data);
    }
  }
}

testAPI();
