# Ejercicios de Sistemas Web I

Ejercicios prácticos de la asignatura **Sistemas Web I**: desde HTML y CSS
hasta servidores con Node.js, Express y Socket.IO.

## Índice

### Front-end

| Carpeta | Tema | Descripción |
|---------|------|-------------|
| [`Ejercicio 1`](Ejercicio%201/) | HTML + CSS | Primera página web: presentación, aficiones, tabla de horarios, explicación de qué es HTML y formulario de contacto. |
| [`Ejercicio 2`](Ejercicio%202/) | Bootstrap 5 | Página personal responsive con navbar plegable, componentes de Bootstrap, proyectos, avisos, horario y contacto. |
| [`EjercicioJavaScript`](EjercicioJavaScript/) | JavaScript | Generador de contraseñas a partir de palabras aleatorias de un diccionario (opciones de mayúsculas y no repetir palabras). |
| [`EjercicioCanvas`](EjercicioCanvas/) | Canvas | Juego "Atrapa las estrellas" animado con `requestAnimationFrame`, con vidas, puntuación y récord. |
| [`EjercicioTampermonkey`](EjercicioTampermonkey/) | Userscripts | Script de Tampermonkey para YouTube: elimina los Shorts y añade un control de velocidad de x0.25 a x4. |

### Node.js

| Carpeta | Tema | Descripción |
|---------|------|-------------|
| [`EjercicioNode1`](EjercicioNode1/) | Módulos `os` / `process` | Servidor que muestra periódicamente uso de CPU, memoria y tiempos de actividad, configurable desde `config.json`. |
| [`EjercicioNode2`](EjercicioNode2/) | JSON | Diseño de un mensaje JSON con la cartelera de un cine. |
| [`EjercicioNode3`](EjercicioNode3/) | Servidor HTTP | Servidor que genera una contraseña con X palabras aleatorias (`/?palabras=4`). |
| [`EjercicioNode4`](EjercicioNode4/) | Web scraping | Descarga periódica de la portada de Hacker News y extracción de noticias con `cheerio`. |
| [`EjercicioNode5`](EjercicioNode5/) | Express + EJS | Proyecto con `express-generator`: lista de elementos y login con cookie firmada. |
| [`EjercicioNode6`](EjercicioNode6/) | Socket.IO | Chat integrado con el login de Express: solo usuarios con sesión, histórico, chats privados y ventana flotante en todas las páginas. |

Casi todas las carpetas tienen su propio `README.md` o `LEEME.md` con más
detalles sobre el funcionamiento.

## Cómo ejecutar los ejercicios

### Front-end

Basta con abrir el `index.html` (o `ejercicio.html` en el Ejercicio 1) en el
navegador. El Ejercicio 2 carga Bootstrap desde un CDN, así que necesita
conexión a Internet.

Para el ejercicio de Tampermonkey, ver las instrucciones en su
[`LEEME.md`](EjercicioTampermonkey/LEEME.md).

### Node.js

Requisitos:

- **Node.js** y **npm** (`node -v` para comprobarlo). El Ejercicio 4 necesita
  Node.js 20.18.1 o superior.
- **Puerto 3000 libre** (se puede cambiar con la variable de entorno `PORT`).

Desde la carpeta del ejercicio:

```bash
npm install   # Solo en los ejercicios 4, 5 y 6 (tienen dependencias)
npm start
```

Y abrir <http://localhost:3000/>. Para pararlo: `Ctrl + C`.

Para usar otro puerto:

```bash
# Git Bash / Linux / macOS
PORT=8080 npm start
```

```powershell
# PowerShell
$env:PORT = 8080; npm start
```

El Ejercicio 2 de Node no es un servidor: solo contiene el fichero
`cartelera.json`.

## Tecnologías

HTML5, CSS3, Bootstrap 5, JavaScript, Canvas API, Tampermonkey, Node.js,
Express, EJS, cheerio y Socket.IO.

## Autor

Jorge González Fernández
