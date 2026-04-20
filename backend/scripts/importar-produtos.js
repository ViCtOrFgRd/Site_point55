const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Função para processar o CSV
function processarCSV(csvPath) {
  const conteudo = fs.readFileSync(csvPath, 'latin1'); // Usando latin1 para suportar caracteres especiais
  const linhas = conteudo.split('\n');
  
  const produtos = [];
  
  // Pula as primeiras linhas (cabeçalho)
  for (let i = 3; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    
    const partes = linha.split(';');
    if (partes.length < 4) continue;
    
    const codigo = partes[0].trim();
    const nomeProduto = partes[1].trim();
    const quantidade = parseInt(partes[2].trim());
    const valor = parseFloat(partes[3].trim());
    
    // Ignora produtos com quantidade 0 ou negativa
    if (quantidade <= 0) {
      console.log(`Ignorando produto ${codigo} - ${nomeProduto} (quantidade: ${quantidade})`);
      continue;
    }
    
    produtos.push({
      codigo,
      nome: nomeProduto,
      quantidade,
      valor
    });
  }
  
  return produtos;
}

// Função para extrair informações do nome do produto
function extrairInfoProduto(nome) {
  // Extrai marca (primeira palavra)
  const palavras = nome.split(' ');
  const marca = palavras[0];
  
  // Extrai tamanho (números no final ou letras P, M, G, GG)
  const tamanhoMatch = nome.match(/(\d+|P|M|G|GG|XG)$/i);
  const tamanho = tamanhoMatch ? tamanhoMatch[1] : null;
  
  // Extrai cores (padrão: palavra \ palavra)
  const coresMatch = nome.match(/([A-ZÀ-Ú\s]+)\s*\\\s*([A-ZÀ-Ú\s]+)/i);
  let cor1 = null, cor2 = null;
  if (coresMatch) {
    cor1 = coresMatch[1].trim();
    cor2 = coresMatch[2].trim();
  }
  
  // Nome base do produto (remove tamanho e cores)
  let nomeBase = nome;
  if (tamanho) {
    nomeBase = nomeBase.replace(new RegExp(`\\s*${tamanho}$`, 'i'), '');
  }
  if (coresMatch) {
    nomeBase = nomeBase.replace(/\s*[A-ZÀ-Ú\s]+\s*\\\s*[A-ZÀ-Ú\s]+\s*\d*$/i, '');
  }
  
  return {
    marca,
    nomeBase: nomeBase.trim(),
    tamanho,
    cor1,
    cor2,
    cores: cor1 && cor2 ? [cor1, cor2] : (cor1 ? [cor1] : [])
  };
}

// Função para determinar categoria baseada no nome
function determinarCategoria(nome) {
  const nomeUpper = nome.toUpperCase();
  
  if (nomeUpper.includes('TÊNIS') || nomeUpper.includes('TENIS') || 
      nomeUpper.includes('ADIZERO') || nomeUpper.includes('FORUM') || 
      nomeUpper.includes('GOOD SPORT') || nomeUpper.includes('CAMPUS')) {
    return 'tenis';
  } else if (nomeUpper.includes('CAMISA') || nomeUpper.includes('CAMISETA')) {
    return 'camisas';
  } else if (nomeUpper.includes('BONÉ') || nomeUpper.includes('BONE')) {
    return 'acessorios';
  } else if (nomeUpper.includes('CALÇA') || nomeUpper.includes('CALCA') || 
             nomeUpper.includes('BERMUDA') || nomeUpper.includes('SHORT')) {
    return 'calcas';
  }
  
  return 'outros';
}

// Função principal de importação
async function importarProdutos() {
  const csvPath = path.join(__dirname, '../../Produtos/Cadastro de produtos.csv');
  
  console.log('Iniciando importação de produtos...\n');
  
  // Processa o CSV
  const produtosCSV = processarCSV(csvPath);
  console.log(`Total de produtos válidos encontrados: ${produtosCSV.length}\n`);
  
  // Agrupa produtos por nome base (variações de cor/tamanho)
  const produtosAgrupados = {};
  
  for (const produto of produtosCSV) {
    const info = extrairInfoProduto(produto.nome);
    const chave = info.nomeBase;
    
    if (!produtosAgrupados[chave]) {
      produtosAgrupados[chave] = {
        codigo: produto.codigo,
        nomeBase: info.nomeBase,
        marca: info.marca,
        preco: produto.valor,
        estoque: 0,
        cores: new Set(),
        tamanhos: new Set(),
        variacoes: []
      };
    }
    
    produtosAgrupados[chave].estoque += produto.quantidade;
    
    if (info.cor1) produtosAgrupados[chave].cores.add(info.cor1);
    if (info.cor2) produtosAgrupados[chave].cores.add(info.cor2);
    if (info.tamanho) produtosAgrupados[chave].tamanhos.add(info.tamanho);
    
    produtosAgrupados[chave].variacoes.push({
      codigo: produto.codigo,
      tamanho: info.tamanho,
      cores: info.cores,
      quantidade: produto.quantidade
    });
  }
  
  console.log(`Total de produtos únicos (agrupados): ${Object.keys(produtosAgrupados).length}\n`);
  
  // Busca ou cria categorias
  const categorias = {
    'tenis': null,
    'camisas': null,
    'acessorios': null,
    'calcas': null,
    'outros': null
  };
  
  for (const slugCategoria of Object.keys(categorias)) {
    try {
      let result = await pool.query(
        'SELECT id FROM categorias WHERE slug = $1',
        [slugCategoria]
      );
      
      if (result.rows.length === 0) {
        // Cria a categoria se não existir
        const nomeCategoria = slugCategoria.charAt(0).toUpperCase() + slugCategoria.slice(1);
        result = await pool.query(
          'INSERT INTO categorias (nome, slug, ativa) VALUES ($1, $2, TRUE) RETURNING id',
          [nomeCategoria, slugCategoria]
        );
        console.log(`Categoria criada: ${nomeCategoria}`);
      }
      
      categorias[slugCategoria] = result.rows[0].id;
    } catch (error) {
      console.error(`Erro ao processar categoria ${slugCategoria}:`, error.message);
    }
  }
  
  console.log('\n');
  
  // Insere produtos no banco de dados
  let inseridos = 0;
  let erros = 0;
  
  for (const [nomeBase, produto] of Object.entries(produtosAgrupados)) {
    try {
      const categoria = determinarCategoria(nomeBase);
      const categoriaId = categorias[categoria];
      
      const cores = Array.from(produto.cores);
      const tamanhos = Array.from(produto.tamanhos);
      
      // Gera descrição automática
      const descricao = `${produto.marca} ${nomeBase}. Disponível nas cores: ${cores.join(', ')}. Tamanhos disponíveis: ${tamanhos.join(', ')}.`;
      
      await pool.query(
        `INSERT INTO produtos 
         (nome, descricao, preco, categoria_id, estoque, cores_disponiveis, tamanhos_disponiveis, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [
          nomeBase,
          descricao,
          produto.preco,
          categoriaId,
          produto.estoque,
          cores,
          tamanhos
        ]
      );
      
      inseridos++;
      console.log(`✓ Produto inserido: ${nomeBase} (${produto.estoque} unidades)`);
      
    } catch (error) {
      erros++;
      console.error(`✗ Erro ao inserir produto ${nomeBase}:`, error.message);
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Importação concluída!`);
  console.log(`Produtos inseridos: ${inseridos}`);
  console.log(`Erros: ${erros}`);
  console.log(`========================================\n`);
  
  await pool.end();
}

// Executa a importação
importarProdutos().catch(error => {
  console.error('Erro fatal na importação:', error);
  process.exit(1);
});
