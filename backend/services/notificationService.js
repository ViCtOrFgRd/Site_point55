const { pool } = require('../config/database');
const { getSocketIo } = require('./socket');

const toJsonParam = (payload) => {
  if (!payload) return null;
  return JSON.stringify(payload);
};

const emitNotification = (room, notification) => {
  const io = getSocketIo();
  if (!io) return;
  io.to(room).emit('notification:new', notification);
};

const createNotification = async ({
  recipientType,
  recipientId,
  tipoEvento,
  titulo,
  mensagem,
  payload,
}) => {
  const result = await pool.query(
    `INSERT INTO notificacoes (recipient_type, recipient_id, tipo_evento, titulo, mensagem, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [
      recipientType,
      recipientId || null,
      tipoEvento,
      titulo,
      mensagem,
      toJsonParam(payload),
    ]
  );

  return result.rows[0];
};

const notifyUser = async (userId, data) => {
  const notification = await createNotification({
    recipientType: 'user',
    recipientId: userId,
    ...data,
  });

  emitNotification(`user:${userId}`, notification);
  return notification;
};

const notifyAdmins = async (data) => {
  const result = await pool.query(
    `INSERT INTO notificacoes (recipient_type, recipient_id, tipo_evento, titulo, mensagem, payload)
     SELECT 'admin', u.id, $1, $2, $3, $4::jsonb
     FROM usuarios u
     WHERE u.is_admin = true AND u.ativo = true
     RETURNING *`,
    [
      data.tipoEvento,
      data.titulo,
      data.mensagem,
      toJsonParam(data.payload),
    ]
  );

  if (result.rows.length > 0) {
    emitNotification('admin', {
      ...result.rows[0],
      admin_broadcast: true,
    });
  }

  return result.rows;
};

const notifyAllUsersPromotion = async (data) => {
  const notification = await createNotification({
    recipientType: 'all_users',
    recipientId: null,
    ...data,
  });

  emitNotification('users', notification);
  return notification;
};

module.exports = {
  notifyUser,
  notifyAdmins,
  notifyAllUsersPromotion,
};
