// Ejercicio 3: servidor que genera una contraseña con X palabras aleatorias
// Uso: http://localhost:3000/?palabras=4
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PALABRAS_POR_DEFECTO = 4;
const MAX_PALABRAS = 20; // Límite para no bloquear el event loop con peticiones enormes

let diccionario = [];

// Devuelve una palabra aleatoria del diccionario
function palabraAleatoria() {
  const indice = Math.floor(Math.random() * diccionario.length);
  return diccionario[indice];
}

// Genera la contraseña uniendo X palabras aleatorias con guiones
function generarContrasena(numPalabras) {
  const palabras = [];
  for (let i = 0; i < numPalabras; i++) {
    palabras.push(palabraAleatoria());
  }
  return palabras.join('-');
}

// Lee el parámetro "palabras" de la query y lo valida
function leerNumeroPalabras(parametros) {
  const numero = parseInt(parametros.get('palabras'));
  if (isNaN(numero) || numero < 1) {
    return PALABRAS_POR_DEFECTO;
  }
  return Math.min(numero, MAX_PALABRAS);
}

const server = http.createServer((req, res) => {
  console.log(`Nueva petición: ${req.method} ${req.url}`);

  // req.url contiene la ruta y la query, por ejemplo: /?palabras=4
  // req.url no incluye el host, así que le damos una base para poder parsearla
  const urlParseada = new URL(req.url, 'http://localhost');

  // Solo respondemos en la página principal (el navegador también pide /favicon.ico)
  if (urlParseada.pathname !== '/') {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>404 - Página no encontrada</h1>');
    return;
  }

  const numPalabras = leerNumeroPalabras(urlParseada.searchParams);
  const contrasena = generarContrasena(numPalabras);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Generador de contraseñas</title>
  </head>
  <body>
    <h1>Contraseña aleatoria</h1>
    <p>Número de palabras: ${numPalabras}</p>
    <p><strong>${contrasena}</strong></p>
    <p>Cambia el número de palabras con el parámetro de la query, por ejemplo:
      <a href="/?palabras=6">/?palabras=6</a></p>
  </body>
</html>`);
});

// Cargamos el diccionario (una palabra por línea) y después arrancamos el servidor
fs.readFile(path.join(__dirname, 'diccionario.txt'), 'utf8', (err, data) => {
  if (err) {
    console.error('No se ha podido leer el diccionario:', err);
    return;
  }
  diccionario = data.split('\n')
    .map(palabra => palabra.trim())
    .filter(palabra => palabra.length > 0);
  console.log(`Diccionario cargado con ${diccionario.length} palabras`);

  server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });
});
