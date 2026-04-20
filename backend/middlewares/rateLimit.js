const rateLimit = require('express-rate-limit');

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const windowMs = toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const loginMax = toInt(process.env.RATE_LIMIT_LOGIN_MAX, 10);
const recoveryMax = toInt(process.env.RATE_LIMIT_RECOVERY_MAX, 5);

const createLimiter = ({ max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: message,
    },
  });

const loginLimiter = createLimiter({
  max: loginMax,
  message: 'Muitas tentativas de login. Tente novamente mais tarde.',
});

const recoveryLimiter = createLimiter({
  max: recoveryMax,
  message: 'Muitas solicitacoes de recuperacao. Tente novamente mais tarde.',
});

module.exports = {
  loginLimiter,
  recoveryLimiter,
};
