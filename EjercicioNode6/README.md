# Ejercicio 6 – Chat con Socket.IO y login de Express

Integra el ejemplo de chat de **Socket.IO** con el ejemplo de **login de
Express** (se parte del proyecto del Ejercicio 5, creado con
`express-generator`).

Funcionalidades:

- Solo los usuarios que han iniciado sesión tienen acceso al chat.
- Aparece el nombre del usuario en cada mensaje.
- Histórico de los últimos mensajes enviados (50 por conversación).

Extras:

- **Chats privados** entre usuarios.
- **Chat siempre disponible**, independiente de la página: en todas las
  páginas aparece una ventana flotante en la esquina, y además hay una página
  dedicada en `/chat`.

## Requisitos

- **Node.js** y **npm**. Comprobar con `node -v`.
- **Puerto 3000 libre**. Si está ocupado se puede usar otro con la variable de
  entorno `PORT`.

## Cómo ejecutarlo

Desde la carpeta `EjercicioNode6`:

```bash
npm install   # Instala express, socket.io... (la carpeta node_modules no se incluye)
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

### Probar con varios usuarios

La sesión se guarda en una cookie, así que todas las pestañas de un mismo
navegador comparten usuario. Para chatear entre dos usuarios hay que usar dos
navegadores distintos, o una ventana normal y otra de incógnito.

## Usuarios de prueba

| Usuario | Contraseña |
|---------|------------|
| admin   | admin      |
| jorge   | 1234       |
| maria   | 1234       |

## Rutas

| Método | Ruta             | Descripción                                          |
|--------|------------------|------------------------------------------------------|
| GET    | `/`              | Página inicial (con el chat flotante si hay sesión)  |
| GET    | `/api/elementos` | Elementos de la página inicial en JSON               |
| GET    | `/login`         | Formulario de login                                  |
| POST   | `/login`         | Comprueba usuario y contraseña                       |
| POST   | `/logout`        | Cierra la sesión y desconecta del chat               |
| GET    | `/chat`          | Página del chat (redirige a `/login` si no hay sesión) |

## Eventos de Socket.IO

| Evento       | Sentido            | Datos                                      |
|--------------|--------------------|--------------------------------------------|
| `bienvenida` | servidor → cliente | `{ usuario, general: [...], privados: { otroUsuario: [...] } }` |
| `usuarios`   | servidor → todos   | `[{ usuario, conectado }]`                 |
| `mensaje`    | cliente → servidor | `texto`                                    |
| `mensaje`    | servidor → todos   | `{ de, texto, fecha }`                     |
| `privado`    | cliente → servidor | `{ para, texto }`                          |
| `privado`    | servidor → emisor y destinatario | `{ de, para, texto, fecha }` |

## Estructura

```
EjercicioNode6/
├── app.js                  Express (igual que el Ejercicio 5 + ruta /chat)
├── bin/www                 Crea el servidor HTTP y le conecta Socket.IO
├── config.js               Secreto de la cookie y límites del chat
├── socket.js               Toda la lógica del chat en el servidor
├── data/usuarios.js        Usuarios de prueba
├── routes/chat.js          Página /chat (solo con sesión)
├── routes/logout.js        Cierra sesión y desconecta los sockets del usuario
├── views/partials/chat.ejs Ventana del chat (modo flotante o página)
└── public/javascripts/chat.js  Cliente del chat
```

## Funcionamiento

### Integración de Socket.IO con Express

En `bin/www` se crea el servidor HTTP con la app de Express y se le pasa a
`new Server(httpServer)` de Socket.IO (como en el ejemplo de clase), así los
dos comparten puerto. Socket.IO sirve automáticamente el cliente en
`/socket.io/socket.io.js`. La instancia `io` se guarda con `app.set('io', io)`
para usarla desde las rutas.

### Solo usuarios con sesión

- El login es el del Ejercicio 5: guarda el nombre del usuario en una cookie
  **firmada**.
- La conexión de Socket.IO empieza con una petición HTTP que lleva las cookies
  del navegador. Con `io.engine.use(cookieParser(secreto))` se aplica a esas
  peticiones el mismo middleware que usa Express, y en `io.use(...)` se
  comprueba la cookie: si no existe, no es de un usuario válido o ha sido
  manipulada (la firma no coincide), la conexión se rechaza con
  `No autorizado`. El secreto está en `config.js` para que Express y
  Socket.IO usen el mismo.
- La página `/chat` redirige a `/login` sin sesión, y la ventana flotante
  solo se incluye en las vistas si hay usuario.
- Al cerrar sesión se desconectan todos los sockets del usuario
  (`disconnectSockets`), incluidas otras pestañas abiertas.

### Nombre del usuario en cada mensaje

El cliente solo envía el texto. El servidor añade el nombre a partir de la
cookie (`socket.data.usuario`), así nadie puede enviar mensajes en nombre de
otro.

### Histórico

El servidor guarda en memoria los últimos 50 mensajes del chat general y de
cada conversación privada. Al conectarse, el cliente recibe el evento
`bienvenida` con todo su histórico (el general y solo los privados en los que
participa). Al reiniciar el servidor el histórico se pierde.

### Chats privados

Cada socket entra al conectarse en una *room* propia del usuario
(`usuario:jorge`). Un mensaje privado se emite a la room del emisor y a la
del destinatario (`io.to(a).to(b).emit(...)`), así lo reciben todas las
pestañas de ambos y nadie más. Se puede escribir a usuarios desconectados:
verán el mensaje en el histórico cuando entren. La lista lateral marca en
verde quién está conectado y muestra un contador de mensajes no leídos.

### Chat disponible en todas las páginas

La ventana del chat es un *partial* (`views/partials/chat.ejs`) que se
incluye en todas las vistas cuando hay sesión. En modo flotante se puede
plegar y desplegar. Al cambiar de página la conexión se rehace y el servidor
vuelve a mandar el histórico, y en `sessionStorage` se recuerda si la ventana
estaba abierta y qué conversación estaba seleccionada, así que el chat
"sigue" al usuario mientras navega.

### Seguridad

- Los mensajes se pintan con `textContent`, nunca con `innerHTML`, para que
  no se pueda inyectar HTML ni scripts.
- El servidor valida lo que recibe: el texto tiene que ser un string no vacío
  (máximo 500 caracteres) y el destinatario de un privado tiene que existir.
- Como en el Ejercicio 5, los usuarios están en memoria y las contraseñas en
  texto plano por simplicidad.
