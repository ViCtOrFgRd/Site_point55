const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const authenticate = (req, res, next) => {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido',
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido',
      });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido',
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido ou expirado',
        });
      }

      // Adicionar dados do usuário ao request
      req.usuario = decoded;
      next();
    });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar autenticação',
    });
  }
};

// Middleware opcional - não falha se não houver token
const authenticateOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return next();
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.usuario = decoded;
      }
      next();
    });
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
};
