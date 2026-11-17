var express = require('express');
var router = express.Router();
var usuarios = require('../data/usuarios');

/* GET página de login */
router.get('/', function(req, res, next) {
  // Si ya ha iniciado sesión no tiene sentido volver a mostrar el formulario
  if (res.locals.usuario) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Iniciar sesión', error: null, usuarioIntroducido: '' });
});

/* POST comprobar credenciales */
router.post('/', function(req, res, next) {
  var usuario = (req.body.usuario || '').trim();
  var password = req.body.password || '';

  var encontrado = usuarios.find(function(u) {
    return u.usuario === usuario && u.password === password;
  });

  if (!encontrado) {
    return res.status(401).render('login', {
      title: 'Iniciar sesión',
      error: 'Usuario o contraseña incorrectos',
      usuarioIntroducido: usuario
    });
  }

  // Cookie firmada: el cliente no puede modificarla sin que lo detectemos
  res.cookie('usuario', encontrado.usuario, { signed: true, httpOnly: true });
  res.redirect('/');
});

module.exports = router;
