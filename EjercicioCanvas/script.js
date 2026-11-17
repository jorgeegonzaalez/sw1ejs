// Ejercicio de Canvas: juego "Atrapa las estrellas"
// La animación usa requestAnimationFrame y el timestamp para calcular el tiempo
// transcurrido entre frames, así el juego va igual de rápido sea cual sea la
// tasa de refresco de la pantalla (60 Hz, 120 Hz...)

let canvas = document.getElementById('myCanvas');
let ctx = canvas.getContext('2d');

// Constantes del juego (velocidades en píxeles por segundo)
const VELOCIDAD_CESTA = 350;
const VELOCIDAD_ESTRELLA_MIN = 120;
const VELOCIDAD_ESTRELLA_MAX = 220;
const RADIO_ESTRELLA = 14;
const VIDAS_INICIALES = 3;
const PROBABILIDAD_ROJA = 0.2; // 20% de las estrellas son rojas

// Cesta del jugador
const cesta = {
  x: 0,
  y: canvas.height - 60,
  width: 80,
  height: 50
};

// Imagen de la cesta
let imagenCesta = new Image();
let imagenCargada = false;
imagenCesta.onload = function() {
  imagenCargada = true;
};
imagenCesta.src = 'cesta.svg';

// Estado del juego: 'inicio', 'jugando', 'pausa' o 'fin'
let estado = 'inicio';
let estrellas = [];
let fondo = [];
let puntos = 0;
let record = 0;
let vidas = VIDAS_INICIALES;
let tiempoHastaEstrella = 0;
let ultimoTiempo = null;

// Teclas pulsadas en cada momento
let teclas = {
  izquierda: false,
  derecha: false
};

window.addEventListener('load', init);

function init() {
  crearFondo();
  cesta.x = (canvas.width - cesta.width) / 2;

  document.addEventListener('keydown', teclaPulsada);
  document.addEventListener('keyup', teclaSoltada);
  canvas.addEventListener('click', click);

  window.requestAnimationFrame(draw);
}

// Puntos pequeños del cielo (se generan una sola vez)
function crearFondo() {
  for (let i = 0; i < 60; i++) {
    fondo.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radio: Math.random() * 1.5 + 0.5
    });
  }
}

// Devuelve un número aleatorio entre min y max
function aleatorio(min, max) {
  return Math.random() * (max - min) + min;
}

function nuevaPartida() {
  estrellas = [];
  puntos = 0;
  vidas = VIDAS_INICIALES;
  tiempoHastaEstrella = 0;
  cesta.x = (canvas.width - cesta.width) / 2;
  estado = 'jugando';
}

// ---------- Input del usuario ----------

function teclaPulsada(e) {
  if (e.code == 'ArrowLeft') {
    teclas.izquierda = true;
  } else if (e.code == 'ArrowRight') {
    teclas.derecha = true;
  } else if (e.code == 'KeyP') {
    if (estado == 'jugando') {
      estado = 'pausa';
    } else if (estado == 'pausa') {
      estado = 'jugando';
    }
  }
}

function teclaSoltada(e) {
  if (e.code == 'ArrowLeft') {
    teclas.izquierda = false;
  } else if (e.code == 'ArrowRight') {
    teclas.derecha = false;
  }
}

function click(e) {
  if (estado == 'inicio' || estado == 'fin') {
    nuevaPartida();
  }
}

// Evita que la cesta se salga del canvas
function limitarCesta() {
  if (cesta.x < 0) {
    cesta.x = 0;
  }
  if (cesta.x > canvas.width - cesta.width) {
    cesta.x = canvas.width - cesta.width;
  }
}

// ---------- Lógica del juego ----------

function crearEstrella() {
  estrellas.push({
    x: aleatorio(RADIO_ESTRELLA, canvas.width - RADIO_ESTRELLA),
    y: -RADIO_ESTRELLA,
    velocidad: aleatorio(VELOCIDAD_ESTRELLA_MIN, VELOCIDAD_ESTRELLA_MAX) + puntos * 5,
    roja: Math.random() < PROBABILIDAD_ROJA
  });
}

// Comprueba si una estrella ha entrado en la cesta
function tocaCesta(estrella) {
  return estrella.x > cesta.x &&
         estrella.x < cesta.x + cesta.width &&
         estrella.y + RADIO_ESTRELLA > cesta.y + 15 &&
         estrella.y - RADIO_ESTRELLA < cesta.y + cesta.height;
}

// dt: segundos que han pasado desde el frame anterior
function actualizar(dt) {
  // Movimiento de la cesta con el teclado
  if (teclas.izquierda) {
    cesta.x -= VELOCIDAD_CESTA * dt;
  }
  if (teclas.derecha) {
    cesta.x += VELOCIDAD_CESTA * dt;
  }
  limitarCesta();

  // Cada vez aparecen estrellas más a menudo (mínimo cada 0.4 s)
  tiempoHastaEstrella -= dt;
  if (tiempoHastaEstrella <= 0) {
    crearEstrella();
    tiempoHastaEstrella = 1.2 - puntos * 0.03;
    if (tiempoHastaEstrella < 0.4) {
      tiempoHastaEstrella = 0.4;
    }
  }

  // Recorremos al revés para poder borrar elementos del array
  for (let i = estrellas.length - 1; i >= 0; i--) {
    let estrella = estrellas[i];
    estrella.y += estrella.velocidad * dt;

    if (tocaCesta(estrella)) {
      if (estrella.roja) {
        vidas--;
      } else {
        puntos++;
      }
      estrellas.splice(i, 1);
    } else if (estrella.y - RADIO_ESTRELLA > canvas.height) {
      if (!estrella.roja) {
        vidas--;
      }
      estrellas.splice(i, 1);
    }
  }

  if (vidas <= 0) {
    vidas = 0;
    estado = 'fin';
    if (puntos > record) {
      record = puntos;
    }
  }
}

// ---------- Dibujo ----------

function dibujarFondo() {
  ctx.fillStyle = '#0b1340';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  for (let i = 0; i < fondo.length; i++) {
    ctx.beginPath();
    ctx.arc(fondo[i].x, fondo[i].y, fondo[i].radio, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Suelo
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
}

// Dibuja una estrella de 4 puntas con moveTo y lineTo
function dibujarEstrella(estrella) {
  let x = estrella.x, y = estrella.y;
  let r = RADIO_ESTRELLA, c = RADIO_ESTRELLA / 3;

  ctx.beginPath();
  ctx.moveTo(x, y - r);     // Punta de arriba
  ctx.lineTo(x + c, y - c);
  ctx.lineTo(x + r, y);     // Punta de la derecha
  ctx.lineTo(x + c, y + c);
  ctx.lineTo(x, y + r);     // Punta de abajo
  ctx.lineTo(x - c, y + c);
  ctx.lineTo(x - r, y);     // Punta de la izquierda
  ctx.lineTo(x - c, y - c);
  ctx.lineTo(x, y - r);

  if (estrella.roja) {
    ctx.fillStyle = '#e53935';
    ctx.strokeStyle = '#8e0000';
  } else {
    ctx.fillStyle = '#ffd600';
    ctx.strokeStyle = '#ff8f00';
  }
  ctx.fill();
  ctx.stroke();
}

function dibujarCesta() {
  if (imagenCargada) {
    ctx.drawImage(imagenCesta, cesta.x, cesta.y, cesta.width, cesta.height);
  } else {
    // Si la imagen aún no ha cargado dibujamos un rectángulo
    ctx.fillStyle = '#c68642';
    ctx.fillRect(cesta.x, cesta.y + 18, cesta.width, cesta.height - 18);
  }
}

function dibujarMarcador() {
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Puntos: ${puntos}`, 10, 30);
  ctx.fillText(`Récord: ${record}`, 10, 55);

  // Vidas como círculos rojos arriba a la derecha
  ctx.fillStyle = '#e53935';
  for (let i = 0; i < vidas; i++) {
    ctx.beginPath();
    ctx.arc(canvas.width - 20 - i * 25, 25, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Mensaje con un rectángulo semitransparente detrás
// x: posición horizontal del título para que quede más o menos centrado
function dibujarMensaje(titulo, x, subtitulo) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, canvas.height / 2 - 70, canvas.width, 120);

  ctx.font = '40px Arial';
  ctx.fillStyle = '#ffd600';
  ctx.fillText(titulo, x, canvas.height / 2 - 15);
  ctx.strokeStyle = '#ff8f00';
  ctx.strokeText(titulo, x, canvas.height / 2 - 15);

  ctx.font = '18px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(subtitulo, 40, canvas.height / 2 + 25);
}

function draw(timestamp) {
  // Tiempo en segundos desde el frame anterior
  if (ultimoTiempo == null) {
    ultimoTiempo = timestamp;
  }
  let dt = (timestamp - ultimoTiempo) / 1000;
  ultimoTiempo = timestamp;

  // Si la pestaña ha estado oculta el salto puede ser muy grande, lo limitamos
  if (dt > 0.1) {
    dt = 0.1;
  }

  if (estado == 'jugando') {
    actualizar(dt);
  }

  // 1. Limpiar el canvas  2. Dibujar los elementos
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarFondo();
  for (let i = 0; i < estrellas.length; i++) {
    dibujarEstrella(estrellas[i]);
  }
  dibujarCesta();
  dibujarMarcador();

  if (estado == 'inicio') {
    dibujarMensaje('Atrapa las estrellas', 60, 'Haz click en el canvas para empezar');
  } else if (estado == 'pausa') {
    dibujarMensaje('Pausa', 195, 'Pulsa P para continuar');
  } else if (estado == 'fin') {
    dibujarMensaje('Fin del juego', 125, `Puntos: ${puntos} - Haz click para volver a jugar`);
  }

  window.requestAnimationFrame(draw);
}
