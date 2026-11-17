// Configuración compartida entre Express (app.js) y Socket.IO (socket.js)
module.exports = {
  // Secreto con el que se firma la cookie del usuario. Express lo usa para crearla
  // y Socket.IO para comprobarla al conectarse, así que tiene que ser el mismo
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'secreto-ejercicio6',
  // Número de mensajes que se guardan en el histórico (de cada conversación)
  MAX_HISTORICO: 50,
  // Longitud máxima de un mensaje
  MAX_LONGITUD: 500
};
