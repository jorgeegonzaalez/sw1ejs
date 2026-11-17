var express = require('express');
var router = express.Router();
var socket = require('../socket');

/* POST cerrar sesión */
router.post('/', function(req, res, next) {
  // Además de borrar la cookie, cerramos las conexiones del chat que tenga abiertas
  // (por ejemplo en otras pestañas) para que no pueda seguir usándolo
  if (res.locals.usuario) {
    socket.desconectarUsuario(req.app.get('io'), res.locals.usuario);
  }
  res.clearCookie('usuario');
  res.redirect('/');
});

module.exports = router;
