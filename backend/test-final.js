#!/usr/bin/env node

const axios = require('axios');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function testarAtualizacao() {
  try {
    console.log(`${colors.blue}🧪 Teste Final de Atualização de Produto${colors.reset}\n`);

    // Passo 1: Buscar um produto
    console.log(`${colors.blue}1️⃣ Buscando um produto...${colors.reset}`);
    const produtosResp = await axios.get('http://localhost:5000/api/produtos?limite=1');
    
    if (!produtosResp.data.data || produtosResp.data.data.length === 0) {
      console.log(`${colors.red}❌ Nenhum produto encontrado${colors.reset}`);
      return;
    }

    const produto = produtosResp.data.data[0];
    console.log(`${colors.green}✅ Produto encontrado: ${produto.nome} (ID: ${produto.id})${colors.reset}\n`);

    // Passo 2: Atualizar com token simulado (Este falhará, mas mostrará o erro real)
    console.log(`${colors.blue}2️⃣ Tentando atualizar produto...${colors.reset}`);
    
    const dadosAtualizar = {
      nome: 'Produto Atualizado - ' + new Date().toLocaleTimeString(),
      preco: 89.99,
      preco_original: 100.00,
      desconto_percentual: 10.01,
    };

    console.log(`${colors.yellow}📤 Dados a enviar:${colors.reset}`);
    console.log(JSON.stringify(dadosAtualizar, null, 2));
    console.log();

    try {
      const response = await axios.put(
        `http://localhost:5000/api/produtos/${produto.id}`,
        dadosAtualizar,
        {
          headers: {
            'Authorization': 'Bearer token-fake',
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log(`${colors.green}✅ Sucesso!${colors.reset}`);
        console.log(`${colors.green}Produto atualizado:${colors.reset}`);
        console.log(JSON.stringify(response.data.data, null, 2));
      } else if (response.status === 401) {
        console.log(`${colors.yellow}⚠️ Erro de autenticação (esperado sem token real)${colors.reset}`);
        console.log(`Status: ${response.status}`);
        console.log(`Erro: ${response.data.error}`);
      } else {
        console.log(`${colors.red}❌ Erro ${response.status}:${colors.reset}`);
        console.log(JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.log(`${colors.red}❌ Erro na requisição:${colors.reset}`);
      console.log(error.message);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Erro geral:${colors.reset}`, error.message);
  }
}

testarAtualizacao();
