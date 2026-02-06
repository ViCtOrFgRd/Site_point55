const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'point55',
  password: '140119',
  port: 5432,
});

(async () => {
  try {
    console.log('🔍 Buscando usuários administradores...\n');
    
    const result = await pool.query(
      'SELECT id, nome, email, is_admin, data_cadastro FROM usuarios WHERE is_admin = true ORDER BY id'
    );
    
    if (result.rows.length === 0) {
      console.log('❌ NENHUM USUÁRIO ADMIN ENCONTRADO!\n');
      console.log('📝 Para criar um admin, você precisa:');
      console.log('   1. Registrar um usuário normal pelo site');
      console.log('   2. Atualizar o campo is_admin para true no banco\n');
      console.log('💡 Comando SQL:');
      console.log('   UPDATE usuarios SET is_admin = true WHERE email = \'seu@email.com\';\n');
    } else {
      console.log(`✅ ${result.rows.length} usuário(s) admin encontrado(s):\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Nome: ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Admin: ${user.is_admin ? '✅ Sim' : '❌ Não'}`);
        console.log(`   Criado em: ${new Date(user.data_cadastro).toLocaleString('pt-BR')}`);
        console.log('');
      });
      
      console.log('\n📌 Para acessar a área admin:');
      console.log('   1. Acesse: http://localhost:3000');
      console.log('   2. Faça login com um dos emails acima');
      console.log('   3. Clique no ícone ⚙️ (engrenagem) no Header');
      console.log('   4. Ou acesse diretamente: http://localhost:3000/admin\n');
    }
  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error.message);
  } finally {
    await pool.end();
  }
})();
