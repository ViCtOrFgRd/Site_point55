require('dotenv').config();

const http = require('http');

const BASE = {
  hostname: 'localhost',
  port: 5000,
};

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'user@example.com';
const TEST_SENHA = process.env.TEST_USER_PASSWORD || 'password123';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const TEST_SERVICE = process.env.SUPERFRETE_TEST_SERVICE || '1';

const requestJson = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options = {
      ...BASE,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : null;
        } catch (e) {
          return reject(new Error(`Erro ao parsear JSON (${path}): ${e.message}`));
        }

        resolve({ status: res.statusCode, json });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });

const main = async () => {
  console.log('🧪 Teste SuperFrete sandbox (cotacao -> etiqueta -> checkout -> info -> print -> cancel)\n');

  if (!process.env.SUPERFRETE_TOKEN) {
    console.log('⚠️ SUPERFRETE_TOKEN nao definido. Configure antes de rodar.');
    return;
  }

  console.log('🔐 Fazendo login...');
  const loginResponse = await requestJson('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    senha: TEST_SENHA,
  });

  if (!loginResponse.json || !loginResponse.json.success) {
    console.log('❌ Login falhou:', loginResponse.json);
    return;
  }

  const token = loginResponse.json.data?.token;
  if (!token) {
    console.log('❌ Token nao encontrado no login');
    return;
  }

  console.log('✅ Login ok');

  const isAdmin = Boolean(loginResponse.json?.data?.user?.is_admin);

  console.log('\n📦 Buscando produto...');
  const produtosResponse = await requestJson(
    'GET',
    '/api/produtos?limite=1&pagina=1',
    null,
    token
  );

  const produtos = produtosResponse.json?.data || [];
  if (!produtos.length) {
    console.log('❌ Nenhum produto encontrado para teste');
    return;
  }

  const produto = produtos.find((item) => Number(item.estoque) > 0) || produtos[0];
  if (Number(produto.estoque) <= 0) {
    console.log(`❌ Nenhum produto com estoque disponivel. Primeiro produto: ${produto.id} - ${produto.nome} (estoque ${produto.estoque})`);
    return;
  }

  console.log(`✅ Produto selecionado: ${produto.id} - ${produto.nome} (estoque ${produto.estoque})`);

  console.log('\n🧹 Limpando carrinho...');
  const limparResponse = await requestJson('DELETE', '/api/carrinho', null, token);
  if (!limparResponse.json?.success) {
    console.log('❌ Falha ao limpar carrinho:', limparResponse.json);
    return;
  }
  console.log('✅ Carrinho limpo');

  console.log('\n🛒 Adicionando ao carrinho...');
  const addResponse = await requestJson(
    'POST',
    '/api/carrinho',
    { produto_id: produto.id, quantidade: 1 },
    token
  );

  if (!addResponse.json?.success) {
    console.log('❌ Falha ao adicionar ao carrinho:', addResponse.json);
    return;
  }

  console.log('✅ Item adicionado');

  console.log('\n🔎 Verificando estoque atual do produto...');
  const produtoAtualResponse = await requestJson('GET', `/api/produtos/${produto.id}`, null, token);
  const produtoAtual = produtoAtualResponse.json?.data || produtoAtualResponse.json;
  const estoqueAtual = Number(produtoAtual?.estoque);
  if (!Number.isNaN(estoqueAtual)) {
    console.log(`Estoque atual: ${estoqueAtual}`);
  }

  console.log('\n🏠 Verificando endereco...');
  const enderecosResponse = await requestJson('GET', '/api/enderecos', null, token);
  if (!enderecosResponse.json?.success) {
    console.log('❌ Falha ao listar enderecos:', enderecosResponse.json);
    return;
  }

  let enderecoId = enderecosResponse.json.data?.[0]?.id;

  if (!enderecoId) {
    console.log('➕ Criando endereco de teste...');
    const novoEnderecoResponse = await requestJson(
      'POST',
      '/api/enderecos',
      {
        cep: '01001-000',
        rua: 'Rua Teste',
        numero: '123',
        complemento: 'Apto 1',
        bairro: 'Centro',
        cidade: 'Sao Paulo',
        estado: 'SP',
        is_principal: true,
      },
      token
    );

    if (!novoEnderecoResponse.json?.success) {
      console.log('❌ Falha ao criar endereco:', novoEnderecoResponse.json);
      return;
    }

    enderecoId = novoEnderecoResponse.json.data?.id;
  }

  if (!enderecoId) {
    console.log('❌ Endereco nao encontrado ou criado');
    return;
  }

  console.log(`✅ Endereco ok: ${enderecoId}`);

  console.log('\n🧾 Criando pedido...');
  if (!Number.isNaN(estoqueAtual) && estoqueAtual <= 0) {
    if (isAdmin) {
      console.log('⚠️ Estoque zerado. Atualizando estoque como admin...');
      const estoqueResponse = await requestJson(
        'PATCH',
        `/api/produtos/${produto.id}/estoque`,
        { estoque: 10 },
        token
      );

      if (!estoqueResponse.json?.success) {
        console.log('❌ Falha ao atualizar estoque:', estoqueResponse.json);
        return;
      }

      console.log('✅ Estoque atualizado para 10');
    } else if (TEST_ADMIN_EMAIL && TEST_ADMIN_PASSWORD) {
      console.log('⚠️ Estoque zerado. Fazendo login como admin...');
      const adminLogin = await requestJson('POST', '/api/auth/login', {
        email: TEST_ADMIN_EMAIL,
        senha: TEST_ADMIN_PASSWORD,
      });

      const adminToken = adminLogin.json?.data?.token;
      if (!adminToken) {
        console.log('❌ Falha no login admin:', adminLogin.json);
        return;
      }

      const estoqueResponse = await requestJson(
        'PATCH',
        `/api/produtos/${produto.id}/estoque`,
        { estoque: 10 },
        adminToken
      );

      if (!estoqueResponse.json?.success) {
        console.log('❌ Falha ao atualizar estoque (admin):', estoqueResponse.json);
        return;
      }

      console.log('✅ Estoque atualizado para 10 (admin)');
    } else {
      console.log('❌ Estoque zerado. Configure TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD para ajustar automaticamente.');
      return;
    }
  }
  const carrinhoResponse = await requestJson('GET', '/api/carrinho', null, token);
  const carrinhoItens = carrinhoResponse.json?.data?.itens || [];

  if (!carrinhoItens.length) {
    console.log('❌ Carrinho vazio apos adicionar item');
    return;
  }

  if (carrinhoItens.length > 1) {
    console.log('⚠️ Carrinho possui mais de um item. Itens:', carrinhoItens.map((item) => item.produto_id || item.produto?.id));
  }

  const itensPedido = carrinhoItens.map((item) => ({
    produto_id: item.produto_id || item.produto?.id,
    quantidade: item.quantidade,
    tamanho: item.tamanho,
    cor: item.cor,
  }));

  const pedidoResponse = await requestJson(
    'POST',
    '/api/pedidos',
    {
      itens: itensPedido,
      endereco_entrega_id: enderecoId,
      forma_pagamento: 'pix',
    },
    token
  );

  if (!pedidoResponse.json?.success) {
    console.log('❌ Falha ao criar pedido:', pedidoResponse.json);
    return;
  }

  const pedido = pedidoResponse.json.data;
  console.log(`✅ Pedido criado: #${pedido.id}`);

  console.log('\n🚚 Cotacao de frete...');
  const freteResponse = await requestJson(
    'POST',
    '/api/superfrete/calcular',
    {
      cep_destino: pedido.cep || '01001-000',
      subtotal: pedido.subtotal,
    },
    token
  );

  console.log('Cotacao:', freteResponse.json?.success ? 'OK' : 'Falha');
  if (!freteResponse.json?.success) {
    console.log('Detalhes cotacao:', freteResponse.json);
  }

  console.log('\n📦 Informacoes dos pacotes...');
  const pacotesResponse = await requestJson('GET', '/api/superfrete/pacotes', null, token);
  console.log('Pacotes:', pacotesResponse.json?.success ? 'OK' : 'Falha');
  if (!pacotesResponse.json?.success) {
    console.log('Detalhes pacotes:', pacotesResponse.json);
  }

  console.log('\n🏷️ Criando etiqueta...');
  const etiquetaResponse = await requestJson(
    'POST',
    `/api/pedidos/${pedido.id}/etiqueta`,
    { service: TEST_SERVICE },
    token
  );

  if (!etiquetaResponse.json?.success) {
    console.log('❌ Falha ao criar etiqueta:', etiquetaResponse.json);
    return;
  }

  console.log('✅ Etiqueta criada');

  console.log('\n💳 Finalizando etiqueta...');
  const checkoutResponse = await requestJson(
    'POST',
    `/api/pedidos/${pedido.id}/etiqueta/pagar`,
    {},
    token
  );
  console.log('Checkout:', checkoutResponse.json?.success ? 'OK' : 'Falha');
  if (!checkoutResponse.json?.success) {
    console.log('Detalhes checkout:', checkoutResponse.json);
  }

  console.log('\n🔎 Informacoes da etiqueta...');
  const infoResponse = await requestJson(
    'GET',
    `/api/pedidos/${pedido.id}/etiqueta`,
    null,
    token
  );
  console.log('Info:', infoResponse.json?.success ? 'OK' : 'Falha');
  if (!infoResponse.json?.success) {
    console.log('Detalhes info:', infoResponse.json);
  }

  console.log('\n🖨️ Link de impressao...');
  const printResponse = await requestJson(
    'POST',
    `/api/pedidos/${pedido.id}/etiqueta/print`,
    {},
    token
  );
  console.log('Print:', printResponse.json?.success ? 'OK' : 'Falha');
  if (!printResponse.json?.success) {
    console.log('Detalhes print:', printResponse.json);
  }

  console.log('\n🛑 Cancelando etiqueta...');
  const cancelResponse = await requestJson(
    'POST',
    `/api/pedidos/${pedido.id}/etiqueta/cancelar`,
    { motivo: 'Teste sandbox' },
    token
  );
  console.log('Cancel:', cancelResponse.json?.success ? 'OK' : 'Falha');
  if (!cancelResponse.json?.success) {
    console.log('Detalhes cancel:', cancelResponse.json);
  }
};

main().catch((error) => {
  console.error('❌ Erro inesperado:', error.message);
});
