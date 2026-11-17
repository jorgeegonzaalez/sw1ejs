var express = require('express');
var router = express.Router();

/* GET página del chat: solo para usuarios que han iniciado sesión */
router.get('/', function(req, res, next) {
  if (!res.locals.usuario) {
    return res.redirect('/login');
  }
  res.render('chat', { title: 'Chat' });
});

module.exports = router;
