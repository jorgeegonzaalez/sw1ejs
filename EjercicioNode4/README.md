# Ejercicio 4 – Web scraping

Servidor Node.js que descarga periódicamente la portada de
[Hacker News](https://news.ycombinator.com/) y extrae sus noticias.

## Requisitos

- **Node.js 20.18.1 o superior** (lo exige `cheerio`). Comprobar con `node -v`.
- **npm** (viene con Node.js).
- **Conexión a Internet**: el servidor descarga la web de Hacker News. Sin
  conexión arranca igualmente, pero muestra un error en la consola y la página
  indica que todavía no hay datos.
- **Puerto 3000 libre**. Si está ocupado se puede usar otro con la variable de
  entorno `PORT`.

## Cómo ejecutarlo

Desde la carpeta `EjercicioNode4`:

```bash
npm install   # Instala cheerio (la carpeta node_modules no se incluye)
npm start
```

Abrir <http://localhost:3000/> (o `/api` para ver el historial en JSON).

Para usar otro puerto:

```bash
# Git Bash / Linux / macOS
PORT=8080 npm start
```

```powershell
# PowerShell
$env:PORT = 8080; npm start
```

Para pararlo: `Ctrl + C` en la terminal.

## Funcionamiento

- **Descarga periódica**: al arrancar y después cada 10 minutos se descarga el
  HTML con el módulo `https` (con una cabecera `User-Agent` propia). El
  intervalo es amplio para no hacer muchas peticiones en poco tiempo.
- **Procesado con cheerio**: se recorren las filas `tr.athing` de la portada y
  se extrae la posición, el título, el enlace y los puntos (que están en
  `#score_<id>` en la fila siguiente).
- **Evolución de los datos**: se guardan las últimas 50 descargas en memoria y
  la página muestra cuántos puntos ha ganado cada noticia desde la descarga
  anterior (o "nueva" si acaba de aparecer en portada). Como la columna
  "Evolución" compara con la descarga anterior, hay que dejar el servidor
  encendido al menos 10 minutos para ver cambios. El historial se pierde al
  parar el servidor.
- Se ha elegido Hacker News porque es HTML estático: no necesita JavaScript
  para visualizarse, así que basta con descargar el HTML.
