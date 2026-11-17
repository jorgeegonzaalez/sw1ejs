// Ejercicio 4: web scraping
// Servidor que descarga periódicamente la portada de Hacker News,
// extrae las noticias (posición, título, enlace y puntos) y muestra
// cómo evolucionan sus puntos entre descargas.
// Uso: node index.js  ->  http://localhost:3000/
const http = require('http');
const https = require('https');
const cheerio = require('cheerio');

const PORT = process.env.PORT || 3000;
const URL_WEB = 'https://news.ycombinator.com/';
const INTERVALO_MS = 10 * 60 * 1000; // Cada 10 minutos, para no hacer muchas peticiones
const MAX_DESCARGAS = 50; // Descargas que guardamos en memoria

// Historial de descargas: [{ fecha, noticias: [{ id, posicion, titulo, enlace, puntos }] }]
const historial = [];

// Descarga el HTML de una URL y devuelve una promesa con el texto
function descargarHTML(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'EjercicioNode4/1.0 (practica de Sistemas Web I)' }
    };
    https.get(url, options, res => {
      if (res.statusCode !== 200) {
        res.resume(); // Descartamos el cuerpo para liberar la conexión
        reject(new Error(`Código de estado ${res.statusCode}`));
        return;
      }
      res.setEncoding('utf8');
      let html = '';
      res.on('data', d => {
        html += d;
      });
      res.on('end', () => resolve(html));
    }).on('error', reject);
  });
}

// Procesa el HTML con cheerio para extraer las noticias de la portada
function extraerNoticias(html) {
  const $ = cheerio.load(html);
  const noticias = [];

  // Cada noticia es una fila <tr class="athing"> y sus puntos están en la fila siguiente
  $('tr.athing').each((i, fila) => {
    const id = $(fila).attr('id');
    const enlace = $(fila).find('.titleline > a').first();
    const textoPuntos = $(`#score_${id}`).text(); // Por ejemplo: "123 points"

    noticias.push({
      id,
      posicion: parseInt($(fila).find('.rank').text()),
      titulo: enlace.text(),
      enlace: enlace.attr('href'),
      puntos: parseInt(textoPuntos) || 0 // Las ofertas de empleo no tienen puntos
    });
  });

  return noticias;
}

// Descarga, procesa y guarda el resultado en el historial
async function scrapear() {
  try {
    const html = await descargarHTML(URL_WEB);
    const noticias = extraerNoticias(html);
    historial.push({ fecha: new Date(), noticias });
    if (historial.length > MAX_DESCARGAS) {
      historial.shift();
    }
    console.log(`[${new Date().toLocaleString()}] Descargadas ${noticias.length} noticias`);
  } catch (err) {
    console.error('Error al descargar la web:', err.message);
  }
}

// Evita que el texto extraído rompa nuestro HTML
function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Compara con la descarga anterior para ver cuántos puntos ha ganado cada noticia
function generarFilas(actual, anterior) {
  return actual.noticias.map(noticia => {
    let evolucion = 'nueva';
    if (anterior) {
      const previa = anterior.noticias.find(n => n.id === noticia.id);
      if (previa) {
        const diferencia = noticia.puntos - previa.puntos;
        evolucion = diferencia >= 0 ? `+${diferencia}` : `${diferencia}`;
      }
    }
    return `<tr>
        <td>${noticia.posicion}</td>
        <td><a href="${escaparHTML(noticia.enlace)}">${escaparHTML(noticia.titulo)}</a></td>
        <td>${noticia.puntos}</td>
        <td>${evolucion}</td>
      </tr>`;
  }).join('\n');
}

function generarPagina() {
  const actual = historial[historial.length - 1];
  if (!actual) {
    return '<p>Todavía no se ha descargado ninguna página, recarga en unos segundos.</p>';
  }
  const anterior = historial[historial.length - 2];

  return `<p>Última descarga: ${actual.fecha.toLocaleString()} (${historial.length} descargas guardadas).
      Se descarga de nuevo cada ${INTERVALO_MS / 60000} minutos.</p>
    <table border="1">
      <tr><th>#</th><th>Título</th><th>Puntos</th><th>Evolución</th></tr>
      ${generarFilas(actual, anterior)}
    </table>
    <p>Los datos también están disponibles en JSON: <a href="/api">/api</a></p>`;
}

const server = http.createServer((req, res) => {
  console.log(`Nueva petición: ${req.method} ${req.url}`);

  if (req.url === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Scraper de Hacker News</title>
  </head>
  <body>
    <h1>Portada de Hacker News</h1>
    ${generarPagina()}
  </body>
</html>`);
  } else if (req.url === '/api') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(historial));
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>404 - Página no encontrada</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
  // Primera descarga al arrancar y después de forma periódica
  scrapear();
  setInterval(scrapear, INTERVALO_MS);
});
