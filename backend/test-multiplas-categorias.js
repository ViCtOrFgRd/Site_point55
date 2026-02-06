const axios = require('axios');

async function testarMultiplasCategorias() {
  try {
    console.log('🧪 TESTE: Múltiplas Categorias por Produto\n');

    // Passo 0: Fazer login
    console.log('0️⃣ Fazendo login como admin...');
    const loginResp = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@point55.com',
      senha: 'admin123'
    });
    const token = loginResp.data.data.token;
    console.log('✅ Login realizado com sucesso!\n');

    // Passo 1: Buscar categorias
    console.log('1️⃣ Buscando categorias disponíveis...');
    const categoriasResp = await axios.get('http://localhost:5000/api/categorias');
    const categorias = categoriasResp.data.data || [];
    
    if (categorias.length < 2) {
      console.log('❌ Precisa de pelo menos 2 categorias para testar');
      return;
    }
    
    const cat1 = categorias[0];
    const cat2 = categorias[1];
    const cat3 = categorias[2] || categorias[0];
    
    console.log(`✅ Categorias encontradas:`);
    console.log(`   1. ${cat1.nome} (ID: ${cat1.id})`);
    console.log(`   2. ${cat2.nome} (ID: ${cat2.id})`);
    console.log(`   3. ${cat3.nome} (ID: ${cat3.id})\n`);

    // Passo 2: Criar produto com múltiplas categorias
    console.log('2️⃣ Criando produto com MÚLTIPLAS categorias...');
    
    const novoProduto = {
      nome: 'Relógio Unissex Teste ' + new Date().getTime(),
      descricao: 'Um relógio que funciona tanto para homens quanto mulheres',
      preco: 149.99,
      categoria_ids: [cat1.id, cat2.id, cat3.id],
      estoque: 15,
      imagens: [],
      cores_disponiveis: ['Preto', 'Prata'],
      tamanhos_disponiveis: []
    };

    console.log('📤 Dados enviados:');
    console.log(`   Nome: ${novoProduto.nome}`);
    console.log(`   Categorias: [${novoProduto.categoria_ids.join(', ')}]`);

    const criarResp = await axios.post(
      'http://localhost:5000/api/produtos',
      novoProduto,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (criarResp.status !== 201) {
      console.log(`❌ Erro ${criarResp.status}`);
      console.log('   Resposta:', criarResp.data);
      return;
    }

    const produtoId = criarResp.data.data.id;
    console.log(`✅ Produto criado! ID: ${produtoId}\n`);

    // Passo 3: Buscar produto e verificar categorias
    console.log('3️⃣ Buscando produto para verificar categorias...');
    const produtoResp = await axios.get(`http://localhost:5000/api/produtos/${produtoId}`);
    const produto = produtoResp.data.data;

    console.log('✅ Categorias do produto:');
    if (produto.categoria_nomes && produto.categoria_nomes.length > 0) {
      produto.categoria_nomes.forEach((nome, idx) => {
        console.log(`   - ${nome} (ID: ${produto.categoria_ids[idx]})`);
      });
    } else {
      console.log('   ⚠️  Nenhuma categoria encontrada');
    }

    // Passo 4: Teste de filtro por categoria
    console.log('\n4️⃣ Testando filtro por categoria...');
    const filtroResp = await axios.get(`http://localhost:5000/api/produtos?categoria=${cat1.id}`);
    console.log(`✅ Produtos na categoria "${cat1.nome}": ${filtroResp.data.count}`);

    console.log('\n✨ Teste concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response?.data) {
      console.error('   Dados:', error.response.data);
    }
  }
}

testarMultiplasCategorias();
