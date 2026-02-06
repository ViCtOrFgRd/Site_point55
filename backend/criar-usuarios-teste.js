/**
 * Script para criar usuários de teste no banco
 */

const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function criarUsuariosTeste() {
  try {
    console.log('🔧 Criando usuários de teste...\n');

    // Senha hash para 'senha123'
    const senhaHash = await bcrypt.hash('senha123', 10);
    const senhaHashAdmin = await bcrypt.hash('admin123', 10);

    // 1. Criar usuário admin
    try {
      const adminResult = await pool.query(
        `INSERT INTO usuarios (nome, email, senha_hash, is_admin, ativo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE 
         SET senha_hash = $3, is_admin = $4
         RETURNING id, nome, email, is_admin`,
        ['Admin Point55', 'admin@point55.com', senhaHashAdmin, true, true]
      );
      console.log('✅ Admin criado/atualizado:', adminResult.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar admin:', error.message);
    }

    // 2. Criar usuário teste normal
    try {
      const userResult = await pool.query(
        `INSERT INTO usuarios (nome, email, senha_hash, is_admin, ativo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE 
         SET senha_hash = $3
         RETURNING id, nome, email, is_admin`,
        ['Usuário Teste', 'teste@point55.com', senhaHash, false, true]
      );
      console.log('✅ Usuário teste criado/atualizado:', userResult.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar usuário teste:', error.message);
    }

    console.log('\n✅ Usuários de teste criados com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('━'.repeat(50));
    console.log('🔐 Admin:');
    console.log('   Email: admin@point55.com');
    console.log('   Senha: admin123');
    console.log('');
    console.log('👤 Usuário:');
    console.log('   Email: teste@point55.com');
    console.log('   Senha: senha123');
    console.log('━'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

criarUsuariosTeste();
