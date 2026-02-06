#!/usr/bin/env node

/**
 * 🔐 Script para Criar Usuário de Teste para os Testes de Desconto
 * 
 * Cria um usuário admin com credenciais padrão para facilitar os testes
 * Email: admin@test.com
 * Senha: Senha123!
 */

const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function criarUsuarioTeste() {
  try {
    console.log('\n🔐 CRIAR USUÁRIO DE TESTE\n');
    console.log('═'.repeat(60));

    const email = 'admin@test.com';
    const nome = 'Admin Teste';
    const senhaRaw = 'Senha123!';

    // Verificar se usuário já existe
    console.log('\n1️⃣ Verificando se usuário já existe...');
    const checkResult = await pool.query(
      'SELECT id, email FROM usuarios WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      console.log(`   ⚠️  Usuário já existe com email: ${email}`);
      console.log(`   ID: ${checkResult.rows[0].id}`);
      console.log('\n✅ Pronto para usar nos testes!');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${senhaRaw}`);
      await pool.end();
      return;
    }

    // Hash da senha
    console.log('\n2️⃣ Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(senhaRaw, 10);
    console.log('   ✅ Hash gerado');

    // Criar usuário
    console.log('\n3️⃣ Criando usuário no banco de dados...');
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, is_admin, data_criacao)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, nome, email, is_admin`,
      [nome, email, hashedPassword, true]
    );

    const novoUsuario = result.rows[0];
    console.log('   ✅ Usuário criado com sucesso!');

    // Exibir resultado
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 USUÁRIO CRIADO:\n');
    console.log(`   ID: ${novoUsuario.id}`);
    console.log(`   Nome: ${novoUsuario.nome}`);
    console.log(`   Email: ${novoUsuario.email}`);
    console.log(`   Admin: ${novoUsuario.is_admin ? '✅ Sim' : '❌ Não'}`);

    console.log('\n🔑 CREDENCIAIS PARA TESTES:\n');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${senhaRaw}`);

    console.log('\n💡 PRÓXIMOS PASSOS:\n');
    console.log('   1. Execute o teste com:');
    console.log('      node test-desconto-percentual.js');
    console.log('\n   2. OU defina a variável de ambiente TEST_TOKEN');
    console.log('      com um token JWT válido\n');

    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:', error.message);
    console.error('\n💡 Certifique-se de que:');
    console.error('   1. O banco de dados está rodando');
    console.error('   2. A tabela "usuarios" existe');
    console.error('   3. Você tem permissão de escrita no banco\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
criarUsuarioTeste();
