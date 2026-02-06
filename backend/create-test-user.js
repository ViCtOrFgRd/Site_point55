const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createTestUser() {
  try {
    const email = 'teste@example.com';
    const senha = 'Teste123!';
    const senhaHash = await bcrypt.hash(senha, 10);
    
    console.log('🧪 Criando usuário de teste...');
    console.log('Email:', email);
    console.log('Senha:', senha);
    
    // Deletar usuário existente se houver
    await pool.query('DELETE FROM usuarios WHERE email = $1', [email]);
    
    // Criar novo usuário
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, cpf, telefone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, cpf, telefone, is_admin`,
      ['Teste Usuario', email, senhaHash, '11111111111', '11111111111']
    );
    
    console.log('\n✅ Usuário criado com sucesso!');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
