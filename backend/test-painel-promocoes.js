require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API = axios.create({ baseURL: BASE_URL });
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';

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
let promocaoIdTeste = null;

console.log('\n' + cores.azul + '╔════════════════════════════════════════════╗' + cores.reset);
console.log(cores.azul + '║   TESTE DO PAINEL ADMIN DE PROMOÇÕES     ║' + cores.reset);
console.log(cores.azul + '╚════════════════════════════════════════════╝' + cores.reset + '\n');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function teste1_LoginAdmin() {
  try {
    console.log(cores.amarelo + '▶ Teste 1: Login admin...' + cores.reset);
    
    const response = await API.post('/api/auth/login', {
      email: TEST_ADMIN_EMAIL,
      senha: TEST_ADMIN_PASSWORD,
    });

    if (response.data && response.data.data && response.data.data.token) {
      token = response.data.data.token;
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log(cores.verde + '✅ Login admin realizado - Token obtido' + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha no login: estrutura de resposta inesperada' + cores.reset);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro no login:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste2_ListarPromocoes() {
  try {
    console.log(cores.amarelo + '▶ Teste 2: GET /api/promocoes...' + cores.reset);
    
    const response = await API.get('/api/promocoes');
    
    if (response.data && response.data.success) {
      const promocoes = response.data.data || [];
      console.log(cores.verde + `✅ GET /api/promocoes - ${promocoes.length} promoções encontradas` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao listar promoções' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao listar promoções:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste3_CriarPromocao() {
  try {
    console.log(cores.amarelo + '▶ Teste 3: POST /api/promocoes (criar)...' + cores.reset);
    
    const dataInicio = new Date().toISOString().split('T')[0]; // Hoje
    const dataFim = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +7 dias
    
    const novaPromocao = {
      nome: 'TESTE AUTOMATIZADO',
      descricao: 'Promoção criada pelo script de teste',
      tipo_desconto: 'percentual',
      desconto_percentual: 15,
      data_inicio: dataInicio,
      data_fim: dataFim,
      ativa: true
    };
    
    const response = await API.post('/api/promocoes', novaPromocao);
    
    if (response.data && response.data.success && response.data.data) {
      promocaoIdTeste = response.data.data.id;
      console.log(cores.verde + `✅ POST /api/promocoes - Promoção criada com ID ${promocaoIdTeste}` + cores.reset);
      console.log(cores.magenta + `   Nome: ${response.data.data.nome}` + cores.reset);
      console.log(cores.magenta + `   Desconto: ${response.data.data.desconto_percentual}%` + cores.reset);
      console.log(cores.magenta + `   Período: ${response.data.data.data_inicio.split('T')[0]} até ${response.data.data.data_fim.split('T')[0]}` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao criar promoção' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao criar promoção:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste4_ObterPromocao() {
  try {
    console.log(cores.amarelo + `▶ Teste 4: GET /api/promocoes/${promocaoIdTeste}...` + cores.reset);
    
    const response = await API.get(`/api/promocoes/${promocaoIdTeste}`);
    
    if (response.data && response.data.success && response.data.data) {
      console.log(cores.verde + `✅ GET /api/promocoes/:id - Promoção obtida: ${response.data.data.nome}` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao obter promoção' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao obter promoção:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste5_AtualizarPromocao() {
  try {
    console.log(cores.amarelo + `▶ Teste 5: PUT /api/promocoes/${promocaoIdTeste}...` + cores.reset);
    
    const dadosAtualizados = {
      nome: 'TESTE AUTO ATUALIZADO',
      descricao: 'Promoção atualizada pelo script',
      tipo_desconto: 'percentual',
      desconto_percentual: 25,
      ativa: true
    };
    
    const response = await API.put(`/api/promocoes/${promocaoIdTeste}`, dadosAtualizados);
    
    if (response.data && response.data.success) {
      console.log(cores.verde + '✅ PUT /api/promocoes/:id - Promoção atualizada' + cores.reset);
      console.log(cores.magenta + `   Novo nome: TESTE AUTO ATUALIZADO` + cores.reset);
      console.log(cores.magenta + `   Novo desconto: 25%` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao atualizar promoção' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao atualizar promoção:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste6_TogglePromocao() {
  try {
    console.log(cores.amarelo + `▶ Teste 6: PATCH /api/promocoes/${promocaoIdTeste}/ativar...` + cores.reset);
    
    const response = await API.patch(`/api/promocoes/${promocaoIdTeste}/ativar`);
    
    if (response.data && response.data.success) {
      console.log(cores.verde + '✅ PATCH /api/promocoes/:id/ativar - Status alterado' + cores.reset);
      console.log(cores.magenta + `   Agora está: ${response.data.data.ativa ? 'ATIVA' : 'INATIVA'}` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao alternar status' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao alternar status:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste7_PromocoesAtivas() {
  try {
    console.log(cores.amarelo + '▶ Teste 7: GET /api/promocoes/vigentes...' + cores.reset);
    
    const response = await API.get('/api/promocoes/vigentes');
    
    if (response.data && response.data.success) {
      const promocoes = response.data.data || [];
      console.log(cores.verde + `✅ GET /api/promocoes/vigentes - ${promocoes.length} promoções vigentes` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao listar promoções vigentes' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao listar promoções vigentes:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste8_AplicavelAoProduto() {
  try {
    console.log(cores.amarelo + '▶ Teste 8: GET /api/promocoes/produtos/1...' + cores.reset);
    
    const response = await API.get('/api/promocoes/produtos/1');
    
    if (response.data && response.data.success) {
      const promocoes = response.data.data || [];
      console.log(cores.verde + `✅ GET /api/promocoes/produtos/:id - ${promocoes.length} promoções aplicáveis ao produto 1` + cores.reset);
      return true;
    } else {
      console.log(cores.vermelho + '❌ Falha ao verificar aplicabilidade' + cores.reset);
      return false;
    }
  } catch (error) {
    console.log(cores.vermelho + '❌ Erro ao verificar aplicabilidade:' + cores.reset, error.response?.data || error.message);
    return false;
  }
}

async function teste9_DeletarPromocao() {
  try {
    console.log(cores.amarelo + `▶ Teste 9: DELETE /api/promocoes/${promocaoIdTeste}...` + cores.reset);
    
    const response = await API.delete(`/api/promocoes/${promocaoIdTeste}`);
    
    if (response.data && response.data.success) {
      console.log(cores.verde + '✅ DELETE /api/promocoes/:id - Promoção deletada' + cores.reset);
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
    total: 9,
    passou: 0,
    falhou: 0
  };

  // Executar testes sequencialmente
  if (await teste1_LoginAdmin()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste2_ListarPromocoes()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste3_CriarPromocao()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste4_ObterPromocao()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste5_AtualizarPromocao()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste6_TogglePromocao()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste7_PromocoesAtivas()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste8_AplicavelAoProduto()) resultados.passou++; else resultados.falhou++;
  await delay(500);
  
  if (await teste9_DeletarPromocao()) resultados.passou++; else resultados.falhou++;

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
