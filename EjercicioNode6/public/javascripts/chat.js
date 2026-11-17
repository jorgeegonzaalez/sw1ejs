// Cliente del chat (se usa tanto en la ventana flotante como en la página /chat)
(function() {
  const GENERAL = '';  // Identificador de la conversación general (las privadas usan el nombre del usuario)

  const contenedor = document.getElementById('chat');
  const modo = contenedor.dataset.modo;
  const estado = document.getElementById('chat-estado');
  const lista = document.getElementById('chat-lista');
  const titulo = document.getElementById('chat-conversacion');
  const listaMensajes = document.getElementById('chat-mensajes');
  const formulario = document.getElementById('chat-formulario');
  const input = document.getElementById('chat-texto');
  const botonEnviar = formulario.querySelector('button');
  const botonPlegar = document.getElementById('chat-plegar');
  const contadorTotal = document.getElementById('chat-no-leidos');

  let yo = null;
  let usuarios = [];
  // Mensajes de cada conversación: { '': [general], 'maria': [privados con maria] }
  const conversaciones = { [GENERAL]: [] };
  const noLeidos = {};

  // sessionStorage: al cambiar de página se recuerda la conversación abierta y si
  // la ventana flotante estaba desplegada, así el chat "sigue" al usuario
  let actual = sessionStorage.getItem('chat-actual') || GENERAL;
  let abierto = modo === 'pagina' || sessionStorage.getItem('chat-abierto') === 'si';

  const socket = io();

  // ---------- Pintar ----------

  function hora(fecha) {
    return new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Siempre textContent (nunca innerHTML) para que un mensaje no pueda inyectar HTML
  function crearMensaje(mensaje) {
    const li = document.createElement('li');
    li.className = 'chat-mensaje' + (mensaje.de === yo ? ' propio' : '');
    const autor = document.createElement('strong');
    autor.textContent = mensaje.de;
    const fecha = document.createElement('time');
    fecha.textContent = hora(mensaje.fecha);
    const texto = document.createElement('p');
    texto.textContent = mensaje.texto;
    li.append(autor, ' ', fecha, texto);
    return li;
  }

  function pintarMensajes() {
    listaMensajes.replaceChildren(...(conversaciones[actual] || []).map(crearMensaje));
    if ((conversaciones[actual] || []).length === 0) {
      const vacio = document.createElement('li');
      vacio.className = 'chat-vacio';
      vacio.textContent = 'Todavía no hay mensajes';
      listaMensajes.append(vacio);
    }
    listaMensajes.scrollTop = listaMensajes.scrollHeight;
  }

  function crearBotonConversacion(id, nombre, conectado) {
    const li = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'chat-conversacion-boton' + (id === actual ? ' activa' : '');
    if (id !== GENERAL) {
      const punto = document.createElement('span');
      punto.className = 'punto' + (conectado ? ' conectado' : '');
      punto.title = conectado ? 'Conectado' : 'Desconectado';
      boton.append(punto);
    }
    boton.append(nombre);
    if (noLeidos[id]) {
      const contador = document.createElement('span');
      contador.className = 'contador';
      contador.textContent = noLeidos[id];
      boton.append(contador);
    }
    boton.addEventListener('click', function() { cambiarConversacion(id); });
    li.append(boton);
    return li;
  }

  function pintarLista() {
    const elementos = [crearBotonConversacion(GENERAL, 'General', true)];
    usuarios
      .filter(function(u) { return u.usuario !== yo; })
      .forEach(function(u) { elementos.push(crearBotonConversacion(u.usuario, u.usuario, u.conectado)); });
    lista.replaceChildren(...elementos);

    const total = Object.values(noLeidos).reduce(function(a, b) { return a + b; }, 0);
    contadorTotal.textContent = total;
    contadorTotal.hidden = total === 0;
  }

  function pintarTodo() {
    titulo.textContent = actual === GENERAL ? 'General' : 'Privado con ' + actual;
    pintarLista();
    pintarMensajes();
  }

  // ---------- Acciones ----------

  function cambiarConversacion(id) {
    actual = id;
    sessionStorage.setItem('chat-actual', id);
    delete noLeidos[id];
    pintarTodo();
    input.focus();
  }

  function aplicarPlegado() {
    if (!botonPlegar) return;
    contenedor.classList.toggle('abierto', abierto);
    botonPlegar.textContent = abierto ? 'Cerrar' : 'Abrir';
    botonPlegar.setAttribute('aria-expanded', abierto);
    if (abierto) {
      delete noLeidos[actual];
      pintarLista();
      listaMensajes.scrollTop = listaMensajes.scrollHeight;
    }
  }

  if (botonPlegar) {
    botonPlegar.addEventListener('click', function() {
      abierto = !abierto;
      sessionStorage.setItem('chat-abierto', abierto ? 'si' : 'no');
      aplicarPlegado();
    });
  }

  formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    if (actual === GENERAL) {
      socket.emit('mensaje', texto);
    } else {
      socket.emit('privado', { para: actual, texto: texto });
    }
    input.value = '';
    input.focus();
  });

  // Añade un mensaje recibido a su conversación y lo pinta o cuenta como no leído
  function recibir(id, mensaje) {
    conversaciones[id] = conversaciones[id] || [];
    conversaciones[id].push(mensaje);
    const visible = id === actual && abierto;
    if (!visible && mensaje.de !== yo) {
      noLeidos[id] = (noLeidos[id] || 0) + 1;
    }
    if (id === actual) pintarMensajes();
    pintarLista();
  }

  function habilitar(activo, texto) {
    estado.textContent = texto;
    contenedor.classList.toggle('desconectado', !activo);
    input.disabled = !activo;
    botonEnviar.disabled = !activo;
  }

  // ---------- Eventos de Socket.IO ----------

  socket.on('connect', function() {
    habilitar(true, 'Conectado');
  });

  // Al conectarse (y al reconectarse) el servidor manda el histórico completo
  socket.on('bienvenida', function(datos) {
    yo = datos.usuario;
    for (const id in conversaciones) delete conversaciones[id];
    conversaciones[GENERAL] = datos.general.slice();
    for (const otro in datos.privados) {
      conversaciones[otro] = datos.privados[otro].slice();
    }
    pintarTodo();
  });

  socket.on('usuarios', function(lista) {
    usuarios = lista;
    // Si la conversación guardada es de un usuario que ya no existe, volvemos a General
    if (actual !== GENERAL && !usuarios.some(function(u) { return u.usuario === actual; })) {
      actual = GENERAL;
    }
    pintarTodo();
  });

  socket.on('mensaje', function(mensaje) {
    recibir(GENERAL, mensaje);
  });

  socket.on('privado', function(mensaje) {
    // La conversación es la del "otro": si lo he enviado yo, el destinatario
    recibir(mensaje.de === yo ? mensaje.para : mensaje.de, mensaje);
  });

  socket.on('connect_error', function(error) {
    if (error.message === 'No autorizado') {
      habilitar(false, 'Inicia sesión para usar el chat');
      socket.disconnect();  // No tiene sentido seguir reintentando
    } else {
      habilitar(false, 'Reconectando...');
    }
  });

  socket.on('disconnect', function(motivo) {
    if (motivo === 'io server disconnect') {
      // Lo ha desconectado el servidor: se ha cerrado la sesión (por ejemplo en otra pestaña)
      habilitar(false, 'Sesión cerrada');
    } else {
      habilitar(false, 'Reconectando...');
    }
  });

  aplicarPlegado();
  pintarTodo();
})();
