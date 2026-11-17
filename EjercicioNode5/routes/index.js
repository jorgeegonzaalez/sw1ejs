var express = require('express');
var router = express.Router();
var elementos = require('../data/elementos');

/* GET página inicial: lista de elementos cargada desde el servidor */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Ejercicio 5', elementos: elementos });
});

/* GET los mismos elementos en JSON */
router.get('/api/elementos', function(req, res, next) {
  res.json(elementos);
});

module.exports = router;
