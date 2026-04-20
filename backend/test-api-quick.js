require('dotenv').config();
const http = require('http');

const BASE = {
  hostname: 'localhost',
  port: 5000,
};

const USUARIO_EMAIL = process.env.TEST_USER_EMAIL || 'user@example.com';
const USUARIO_SENHA = process.env.TEST_USER_PASSWORD || 'password123';

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
  console.log('🧪 Teste rapido carrinho/checkout (login + totais)\n');

  console.log('🔐 Fazendo login...');
  const loginResponse = await requestJson('POST', '/api/auth/login', {
    email: USUARIO_EMAIL,
    senha: USUARIO_SENHA,
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

  const produto = produtos[0];
  console.log(`✅ Produto selecionado: ${produto.id} - ${produto.nome}`);

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

  console.log('\n🧾 Buscando carrinho...');
  const carrinhoResponse = await requestJson('GET', '/api/carrinho', null, token);

  if (!carrinhoResponse.json?.success) {
    console.log('❌ Falha ao obter carrinho:', carrinhoResponse.json);
    return;
  }

  const carrinho = carrinhoResponse.json.data;
  const carrinhoItens = carrinho?.itens || [];
  const carrinhoSubtotal = carrinho?.subtotal || 0;

  console.log('✅ Carrinho ok');
  console.log('Itens:', carrinhoItens.length);
  console.log('Subtotal:', carrinhoSubtotal);

  if (!carrinhoItens.length) {
    console.log('❌ Carrinho vazio apos adicionar item');
    return;
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
  console.log('✅ Pedido criado');
  console.log('Subtotal:', pedido.subtotal);
  console.log('Desconto:', pedido.desconto);
  console.log('Frete:', pedido.frete);
  console.log('Total:', pedido.total);
};

main().catch((error) => {
  console.error('❌ Erro inesperado:', error.message);
});
