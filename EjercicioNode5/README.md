# Ejercicio 5 – Express

Proyecto creado con `express-generator` (plantillas EJS) que tiene:

- Una **página inicial** con una lista de elementos que se cargan desde el
  servidor y un botón para iniciar sesión.
- Una **página de login**.

Proyecto generado con:

```bash
npx express-generator -v ejs EjercicioNode5
```

## Requisitos

- **Node.js** y **npm**. Comprobar con `node -v`.
- **Puerto 3000 libre**. Si está ocupado se puede usar otro con la variable de
  entorno `PORT`.

## Cómo ejecutarlo

Desde la carpeta `EjercicioNode5`:

```bash
npm install   # La carpeta node_modules no se incluye
npm start
```

Abrir <http://localhost:3000/>.

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

## Usuarios de prueba

| Usuario | Contraseña |
|---------|------------|
| admin   | admin      |
| jorge   | 1234       |

## Rutas

| Método | Ruta             | Descripción                                          |
|--------|------------------|------------------------------------------------------|
| GET    | `/`              | Página inicial con la lista de elementos             |
| GET    | `/api/elementos` | Los mismos elementos en JSON                         |
| GET    | `/login`         | Formulario de login                                  |
| POST   | `/login`         | Comprueba usuario y contraseña                       |
| POST   | `/logout`        | Cierra la sesión                                     |

## Funcionamiento

- **Lista de elementos**: el array está en `data/elementos.js`. La ruta `/`
  (`routes/index.js`) se lo pasa a la plantilla `views/index.ejs`, que lo
  recorre con `<% elementos.forEach(...) %>` para generar la lista en el
  servidor.
- **Login**: `routes/login.js` muestra el formulario (`views/login.ejs`) y, al
  enviarlo, compara los datos con los usuarios de `data/usuarios.js`. Si son
  incorrectos vuelve a mostrar el formulario con un mensaje de error (código
  401); si son correctos guarda el nombre en una cookie **firmada** (con
  `cookie-parser`, que ya incluye el generador) y redirige a la página inicial.
- **Middleware** (en `app.js`): en cada petición lee la cookie y deja el
  usuario en `res.locals.usuario`, así está disponible en todas las vistas. La
  cabecera (`views/partials/cabecera.ejs`) muestra "Iniciar sesión" o el
  nombre del usuario con el botón "Cerrar sesión".
- Los usuarios están en memoria y las contraseñas en texto plano por
  simplicidad; en una aplicación real irían en una base de datos y cifradas.
