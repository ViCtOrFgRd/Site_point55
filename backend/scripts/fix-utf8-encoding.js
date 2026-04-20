const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'point55',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  client_encoding: 'UTF8',
});

async function fixUTF8Encoding() {
  try {
    console.log('🔧 Iniciando correção de encoding UTF-8...\n');

    // 1. Verificar encoding do banco de dados
    console.log('1️⃣  Verificando encoding do banco de dados...');
    const dbEncoding = await pool.query(`
      SELECT datname, pg_encoding_to_char(encoding) as encoding 
      FROM pg_database 
      WHERE datname = $1
    `, [process.env.DB_NAME || 'point55']);

    if (dbEncoding.rows.length > 0) {
      console.log(`✅ Banco: ${dbEncoding.rows[0].datname}, Encoding: ${dbEncoding.rows[0].encoding}`);
    }

    // 2. Definir client_encoding para UTF-8
    console.log('\n2️⃣  Configurando client_encoding para UTF-8...');
    await pool.query('SET client_encoding = UTF8');
    console.log('✅ client_encoding definido para UTF-8');

    // 3. Recriar tipos_produto com encoding correto
    console.log('\n3️⃣  Atualizando tipos_produto com encoding correto...');
    
    // Primeiro, deletar registro existente (se necessário)
    await pool.query('TRUNCATE TABLE tipos_produto CASCADE');
    console.log('✅ Tabela tipos_produto limpa');

    // Inserir dados com UTF-8 correto
    const tiposData = [
      { nome: 'Tênis', codigo: 'tenis' },
      { nome: 'Camiseta', codigo: 'camiseta' },
      { nome: 'Calça', codigo: 'calca' },
      { nome: 'Boné', codigo: 'bone' },
      { nome: 'Perfume', codigo: 'perfume' },
      { nome: 'Acessório', codigo: 'acessorio' },
    ];

    for (const tipo of tiposData) {
      await pool.query(
        'INSERT INTO tipos_produto (nome, codigo) VALUES ($1, $2) ON CONFLICT (codigo) DO NOTHING',
        [tipo.nome, tipo.codigo]
      );
      console.log(`✅ Inserido: ${tipo.nome} (${tipo.codigo})`);
    }

    // 4. Verificar dados inseridos
    console.log('\n4️⃣  Verificando dados inseridos...');
    const tiposResult = await pool.query('SELECT id, nome, codigo FROM tipos_produto ORDER BY id');
    
    console.log('\n📋 Tipos de Produto:');
    tiposResult.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.nome} (${row.codigo})`);
    });

    // 5. Verificar length dos strings (deve ser 6 caracteres para "Acessório")
    console.log('\n5️⃣  Validando comprimento dos strings...');
    const lengthCheck = await pool.query(`
      SELECT nome, codigo, length(nome) as nome_length 
      FROM tipos_produto 
      ORDER BY id
    `);

    console.log('\n📏 Comprimento dos nomes:');
    lengthCheck.rows.forEach(row => {
      console.log(`  ${row.nome}: ${row.nome_length} caracteres`);
    });

    // 6. Adicionar variável de sessão ao database.js se não existir
    console.log('\n6️⃣  Sugestão de configuração...');
    console.log('  Para garantir UTF-8 em todas as conexões, adicione ao config/database.js:');
    console.log('  pool.query("SET client_encoding = \'UTF8\'");\n');

    console.log('✅ Correção de encoding concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir encoding:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
fixUTF8Encoding();
