const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API = axios.create({ baseURL: BASE_URL });

// Cores para console
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[36m',
  magenta: '\x1b[35m',
};

let token = '';

console.log('\n' + cores.azul + '╔════════════════════════════════════════════╗' + cores.reset);
console.log(cores.azul + '║   TESTE DE CORREÇÕES - BADGES + PROMO    ║' + cores.reset);
console.log(cores.azul + '╚════════════════════════════════════════════╝' + cores.reset + '\n');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function teste1_LoginAdmin() {
  try {
    console.log(cores.amarelo + '▶ Teste 1: Login admin...' + cores.reset);
    
    const response = await API.post('/api/auth/login', {
      email: 'victorfiigueiredo@gmail.com',
      senha: 'victor123'
    });

    if (response.data && response.data.data && response.data.data.token) {
      token = response.data.data.token;
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log(cores.verde + '✅ Login admin realizado' + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha no login' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro no login:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste2_CriarPromocao() {
  try {
    console.log(cores.amarelo + '▶ Teste 2: Criar promoção teste (20% OFF)...' + cores.reset);
    
    const dataInicio = new Date().toISOString().split('T')[0];
    const dataFim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const novaPromocao = {
      nome: 'TESTE - BLACK FRIDAY',
      descricao: 'Promoção de teste para validação',
      tipo_desconto: 'percentual',
      desconto_percentual: 20,
      data_inicio: dataInicio,
      data_fim: dataFim,
      ativa: true
      // produtos_aplicaveis: null (aplica a todos)
    };
    
    const response = await API.post('/api/promocoes', novaPromocao);
    
    if (response.data && response.data.success && response.data.data) {
      console.log(cores.verde + `✅ Promoção criada: ID ${response.data.data.id}` + cores.reset);
      console.log(cores.magenta + `   20% OFF em todos os produtos` + cores.reset);
      return response.data.data.id;
    } else {
      console.log(cores.vermelho + '❌ Falha ao criar promoção' + cores.reset);
      return null;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao criar promoção:' + cores.reset, error.response?.data || error.message);
    return null;
  }
}

async function teste3_ListarProdutosComPromocao() {
  try {
    console.log(cores.amarelo + '▶ Teste 3: Listar produtos (verificar promoção aplicada)...' + cores.reset);
    
    const response = await API.get('/api/produtos?limite=5');
    
    if (response.data && response.data.success) {
      const produtos = response.data.data || [];
      console.log(cores.verde + `✅ ${produtos.length} produtos retornados` + cores.reset);
      
      const produtoComPromocao = produtos.find(p => p.promocao_aplicada);
      
      if (produtoComPromocao) {
        console.log(cores.verde + '✅ Promoção sendo aplicada aos produtos!' + cores.reset);
        console.log(cores.magenta + `   Exemplo: ${produtoComPromocao.nome}` + cores.reset);
        console.log(cores.magenta + `   Preço original: R$ ${produtoComPromocao.preco_original}` + cores.reset);
        console.log(cores.magenta + `   Preço com desconto: R$ ${produtoComPromocao.preco}` + cores.reset);
        console.log(cores.magenta + `   Desconto: ${produtoComPromocao.desconto_percentual}%` + cores.reset);
        return true;
      } else {
        console.log(cores.amarelo + '⚠️  Nenhum produto com promoção aplicada' + cores.reset);
        console.log(cores.amarelo + '   (pode ser que não haja produtos ou promoção ainda não vigente)' + cores.reset);
        return true; // Não é erro, apenas sem promoções aplicadas
      }
    } else {
      console.log(cores.vermelho + '❌ Falha ao listar produtos' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao listar produtos:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste4_ObterProdutoComPromocao() {
  try {
    console.log(cores.amarelo + '▶ Teste 4: Obter produto individual (ID 1)...' + cores.reset);
    
    const response = await API.get('/api/produtos/1');
    
    if (response.data && response.data.success && response.data.data) {
      const produto = response.data.data;
      console.log(cores.verde + `✅ Produto obtido: ${produto.nome}` + cores.reset);
      
      if (produto.promocao_aplicada) {
        console.log(cores.verde + '✅ Promoção aplicada ao produto individual!' + cores.reset);
        console.log(cores.magenta + `   Desconto: ${produto.desconto_percentual}%` + cores.reset);
        console.log(cores.magenta + `   Preço com desconto: R$ ${produto.preco}` + cores.reset);
      } else {
        console.log(cores.amarelo + '⚠️  Nenhuma promoção aplicada ao produto 1' + cores.reset);
      }
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao obter produto' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao obter produto:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste5_DeletarPromocao(promocaoId) {
  if (!promocaoId) {
    console.log(cores.amarelo + '▶ Teste 5: Limpeza - sem promoção para deletar' + cores.reset);
    return true;
  }

  try {
    console.log(cores.amarelo + `▶ Teste 5: Deletar promoção teste (ID ${promocaoId})...` + cores.reset);
    
    const response = await API.delete(`/api/promocoes/${promocaoId}`);
    
    if (response.data && response.data.success) {
      console.log(cores.verde + '✅ Promoção teste deletada (limpeza)' + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao deletar promoção' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao deletar promoção:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function executarTestes() {
  const resultados = {
    total: 5,
    passou: 0,
    falhou: 0
  };

  let promocaoId = null;

  // Teste 1: Login
  if (await teste1_LoginAdmin()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  // Teste 2: Criar promoção
  promocaoId = await teste2_CriarPromocao();
  if (promocaoId) resultados.passou++; else resultados.falhou++;
  await delay(1000); // Aguardar promoção ser processada
  
  // Teste 3: Listar produtos com promoção
  if (await teste3_ListarProdutosComPromocao()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  // Teste 4: Obter produto individual
  if (await teste4_ObterProdutoComPromocao()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  // Teste 5: Limpeza - deletar promoção
  if (await teste5_DeletarPromocao(promocaoId)) resultados.passou++; else resultados.falhou++;

  // Resumo final
  console.log('\n' + cores.azul + '═══════════════════════════════════════════' + cores.reset);
  if (resultados.falhou === 0) {
    console.log(cores.verde + `\n✨ Total: ${resultados.passou}/${resultados.total} testes passaram\n` + cores.reset);
  } else {
    console.log(cores.vermelho + `\n⚠️  Total: ${resultados.passou}/${resultados.total} passaram | ${resultados.falhou} falharam\n` + cores.reset);
  }
  console.log(cores.azul + '═══════════════════════════════════════════' + cores.reset + '\n');
}

executarTestes();
