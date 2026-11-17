var express = require('express');
var router = express.Router();

/* POST cerrar sesión */
router.post('/', function(req, res, next) {
  res.clearCookie('usuario');
  res.redirect('/');
});

module.exports = router;
