// Chat con Socket.IO integrado con el login de Express
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const config = require('./config');
const usuarios = require('./data/usuarios');

// Histórico en memoria (se pierde al reiniciar el servidor)
const historicoGeneral = [];   // Mensajes del chat general
const historicoPrivado = {};   // { 'ana|jorge': [mensajes] } un array por pareja de usuarios

// Cuántas conexiones tiene abiertas cada usuario (puede tener varias pestañas)
const conexiones = {};

// Cada usuario entra en su propia room para poder enviarle mensajes privados
// a todas sus pestañas a la vez
function roomDe(usuario) {
  return 'usuario:' + usuario;
}

// Clave de la conversación privada entre dos usuarios (la misma en ambos sentidos)
function clavePrivada(a, b) {
  return [a, b].sort().join('|');
}

// Añade un mensaje a un histórico y descarta los más antiguos
function guardar(historico, mensaje) {
  historico.push(mensaje);
  if (historico.length > config.MAX_HISTORICO) {
    historico.shift();
  }
}

// Valida el texto recibido del cliente: string, sin espacios sobrantes y no demasiado largo
function limpiarTexto(texto) {
  if (typeof texto !== 'string') return '';
  return texto.trim().slice(0, config.MAX_LONGITUD);
}

// Lista de todos los usuarios registrados indicando si están conectados
function listaUsuarios() {
  return usuarios.map(function(u) {
    return { usuario: u.usuario, conectado: (conexiones[u.usuario] || 0) > 0 };
  });
}

// Históricos privados en los que participa un usuario: { otroUsuario: [mensajes] }
function privadosDe(usuario) {
  const resultado = {};
  for (const clave in historicoPrivado) {
    const [a, b] = clave.split('|');
    if (a === usuario) resultado[b] = historicoPrivado[clave];
    else if (b === usuario) resultado[a] = historicoPrivado[clave];
  }
  return resultado;
}

function crearSocket(httpServer) {
  const io = new Server(httpServer);

  // Las peticiones de Socket.IO llevan las cookies del navegador. Con cookie-parser
  // (el mismo middleware que usa Express) leemos la cookie firmada del usuario
  io.engine.use(cookieParser(config.COOKIE_SECRET));

  // Middleware de Socket.IO: solo se aceptan conexiones de usuarios que han
  // iniciado sesión. Si la cookie no existe o ha sido modificada se rechaza
  io.use(function(socket, next) {
    const usuario = socket.request.signedCookies && socket.request.signedCookies.usuario;
    const existe = usuarios.some(function(u) { return u.usuario === usuario; });
    if (!usuario || !existe) {
      return next(new Error('No autorizado'));
    }
    // El nombre lo pone el servidor: el cliente no puede hacerse pasar por otro
    socket.data.usuario = usuario;
    next();
  });

  io.on('connection', function(socket) {
    const usuario = socket.data.usuario;
    console.log(`${usuario} se ha conectado al chat`);

    socket.join(roomDe(usuario));
    conexiones[usuario] = (conexiones[usuario] || 0) + 1;

    // Al conectarse recibe el histórico y la lista de usuarios
    socket.emit('bienvenida', {
      usuario: usuario,
      general: historicoGeneral,
      privados: privadosDe(usuario)
    });
    io.emit('usuarios', listaUsuarios());

    // Mensaje al chat general: se envía a todos (incluido el que lo envía)
    socket.on('mensaje', function(texto) {
      texto = limpiarTexto(texto);
      if (!texto) return;
      const mensaje = { de: usuario, texto: texto, fecha: Date.now() };
      guardar(historicoGeneral, mensaje);
      io.emit('mensaje', mensaje);
    });

    // Mensaje privado: solo lo reciben el emisor y el destinatario (todas sus pestañas).
    // Se puede escribir a usuarios desconectados: lo verán en el histórico al entrar
    socket.on('privado', function(datos) {
      const para = datos && datos.para;
      const texto = limpiarTexto(datos && datos.texto);
      const existe = usuarios.some(function(u) { return u.usuario === para; });
      if (!texto || !existe || para === usuario) return;

      const mensaje = { de: usuario, para: para, texto: texto, fecha: Date.now() };
      const clave = clavePrivada(usuario, para);
      historicoPrivado[clave] = historicoPrivado[clave] || [];
      guardar(historicoPrivado[clave], mensaje);
      io.to(roomDe(usuario)).to(roomDe(para)).emit('privado', mensaje);
    });

    socket.on('disconnect', function() {
      console.log(`${usuario} se ha desconectado del chat`);
      conexiones[usuario]--;
      io.emit('usuarios', listaUsuarios());
    });
  });

  return io;
}

// Desconecta todas las pestañas de un usuario (se usa al cerrar sesión)
function desconectarUsuario(io, usuario) {
  io.in(roomDe(usuario)).disconnectSockets(true);
}

module.exports = { crearSocket, desconectarUsuario };
