const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { enviarEmailRecuperacaoSenha, enviarEmailBoasVindas } = require('../services/emailService');

// Gerar token JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      is_admin: usuario.is_admin,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const isCpfValido = (cpfDigits) => {
  if (!cpfDigits || cpfDigits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfDigits)) return false;

  const calcDigito = (base, fatorInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
      soma += parseInt(base[i], 10) * (fatorInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const baseNove = cpfDigits.slice(0, 9);
  const digito1 = calcDigito(baseNove, 10);
  const baseDez = cpfDigits.slice(0, 10);
  const digito2 = calcDigito(baseDez, 11);

  return digito1 === parseInt(cpfDigits[9], 10) && digito2 === parseInt(cpfDigits[10], 10);
};

// POST /api/auth/registro - Registrar novo usuário
const registrar = async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf, data_nascimento } = req.body;
    const cpfNormalizado = typeof cpf === 'string' ? cpf.replace(/\D/g, '') : '';
    const telefoneNormalizado = typeof telefone === 'string' ? telefone.replace(/\D/g, '') : '';
    const dataNascimentoValida = Boolean(data_nascimento) && !Number.isNaN(Date.parse(data_nascimento));
    const cpfFormatoValido = typeof cpf === 'string' && /^[0-9.\-\s]+$/.test(cpf);
    const telefoneFormatoValido = typeof telefone === 'string' && /^[0-9+()\-\s]+$/.test(telefone);

    // Validação básica
    if (!nome || !email || !senha || !telefone || !cpf || !data_nascimento) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email, senha, telefone, CPF e data de nascimento são obrigatórios',
      });
    }

    if (cpfNormalizado.length !== 11 || !isCpfValido(cpfNormalizado)) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido',
      });
    }

    if (!cpfFormatoValido) {
      return res.status(400).json({
        success: false,
        error: 'CPF contém caracteres inválidos',
      });
    }

    if (telefoneNormalizado.length < 10 || telefoneNormalizado.length > 11) {
      return res.status(400).json({
        success: false,
        error: 'Telefone inválido',
      });
    }

    if (!telefoneFormatoValido) {
      return res.status(400).json({
        success: false,
        error: 'Telefone contém caracteres inválidos',
      });
    }

    if (!dataNascimentoValida) {
      return res.status(400).json({
        success: false,
        error: 'Data de nascimento inválida',
      });
    }

    // Verificar se email já existe
    const emailExiste = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExiste.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado',
      });
    }

    // Verificar se CPF já existe (se fornecido)
    if (cpfNormalizado) {
      const cpfExiste = await pool.query(
        'SELECT id FROM usuarios WHERE cpf = $1',
        [cpfNormalizado]
      );

      if (cpfExiste.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'CPF já cadastrado',
        });
      }
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Criar usuário
    const result = await pool.query(
      `INSERT INTO usuarios 
       (nome, email, senha_hash, telefone, cpf, data_nascimento, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, nome, email, telefone, cpf, data_cadastro, is_admin`,
      [nome, email, senhaHash, telefone, cpfNormalizado, data_nascimento]
    );

    const usuario = result.rows[0];

    // Gerar token
    const token = gerarToken(usuario);

    try {
      await enviarEmailBoasVindas(usuario.email, usuario.nome);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          is_admin: usuario.is_admin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar usuário',
    });
  }
};

// POST /api/auth/login - Login de usuário
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
      });
    }

    const usuario = result.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
      });
    }

    // Gerar token
    const token = gerarToken(usuario);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          is_admin: usuario.is_admin,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login',
    });
  }
};

// GET /api/auth/perfil - Obter perfil do usuário autenticado
const obterPerfil = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const result = await pool.query(
      `SELECT id, nome, email, telefone, cpf, data_nascimento, data_cadastro, is_admin
       FROM usuarios
       WHERE id = $1 AND ativo = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Buscar endereços do usuário
    const enderecosResult = await pool.query(
      `SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY is_principal DESC, data_criacao DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        enderecos: enderecosResult.rows,
      },
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar perfil',
    });
  }
};

// PUT /api/auth/perfil - Atualizar perfil
const atualizarPerfil = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { nome, telefone, data_nascimento } = req.body;

    const result = await pool.query(
      `UPDATE usuarios
       SET nome = COALESCE($1, nome),
           telefone = COALESCE($2, telefone),
           data_nascimento = COALESCE($3, data_nascimento)
       WHERE id = $4 AND ativo = true
       RETURNING id, nome, email, telefone, cpf, data_nascimento, is_admin`,
      [nome, telefone, data_nascimento, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar perfil',
    });
  }
};

// PUT /api/auth/senha - Alterar senha
const alterarSenha = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { senhaAtual, senhaNova, novaSenha } = req.body;
    const newPassword = senhaNova || novaSenha;

    if (!senhaAtual || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual e nova senha são obrigatórias',
      });
    }

    // Buscar usuário com senha atual
    const result = await pool.query(
      'SELECT senha_hash FROM usuarios WHERE id = $1 AND ativo = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, result.rows[0].senha_hash);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta',
      });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(newPassword, salt);

    // Atualizar senha
    await pool.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE id = $2',
      [novaSenhaHash, userId]
    );

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar senha',
    });
  }
};

// POST /api/auth/recuperar-senha - Solicitar recuperação de senha
const solicitarRecuperacaoSenha = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório',
      });
    }

    // Verificar se usuário existe
    const result = await pool.query(
      'SELECT id, nome, email FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    // Sempre retornar sucesso por segurança (não revelar se email existe)
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Se o email existir, um link de recuperação será enviado',
      });
    }

    const usuario = result.rows[0];

    // Gerar token de recuperação
    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await pool.query(
      `INSERT INTO tokens_recuperacao_senha (usuario_id, token, expira_em)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id) 
       DO UPDATE SET token = $2, expira_em = $3, criado_em = NOW()`,
      [usuario.id, token, expiracao]
    );

    // Enviar email
    try {
      await enviarEmailRecuperacaoSenha(usuario.email, token);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Não retornar erro ao usuário por segurança
    }

    res.json({
      success: true,
      message: 'Se o email existir, um link de recuperação será enviado',
    });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação',
    });
  }
};

// POST /api/auth/redefinir-senha - Redefinir senha com token
const redefinirSenha = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({
        success: false,
        error: 'Token e nova senha são obrigatórios',
      });
    }

    // Verificar token
    const result = await pool.query(
      `SELECT usuario_id FROM tokens_recuperacao_senha
       WHERE token = $1 AND expira_em > NOW() AND usado = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou expirado',
      });
    }

    const usuarioId = result.rows[0].usuario_id;

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    // Atualizar senha
    await pool.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE id = $2',
      [novaSenhaHash, usuarioId]
    );

    // Marcar token como usado
    await pool.query(
      'UPDATE tokens_recuperacao_senha SET usado = true WHERE token = $1',
      [token]
    );

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao redefinir senha',
    });
  }
};

module.exports = {
  registrar,
  login,
  obterPerfil,
  atualizarPerfil,
  alterarSenha,
  solicitarRecuperacaoSenha,
  redefinirSenha,
};
