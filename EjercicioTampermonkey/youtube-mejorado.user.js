// ==UserScript==
// @name         YouTube sin Shorts + control de velocidad
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Elimina los Shorts de YouTube y añade un control de velocidad (hasta x4) con el tiempo restante real
// @author       Jorge González Fernández
// @match        https://www.youtube.com/*
// @icon         https://www.youtube.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

/*
 * Ejercicio Tampermonkey (diapositiva 176) - Web elegida: YouTube
 *
 * ¿QUÉ ELIMINA?
 *   Los Shorts. Son vídeos cortos que YouTube mete por todas partes (inicio,
 *   búsquedas, menú lateral, canales...) y hacen perder mucho tiempo.
 *   - Se ocultan con CSS: la entrada "Shorts" del menú lateral, las filas de
 *     Shorts de la página de inicio y de las búsquedas, y la pestaña "Shorts"
 *     de los canales.
 *   - Si se abre un enlace a un Short (youtube.com/shorts/ID) se redirige a la
 *     página normal del vídeo (youtube.com/watch?v=ID), que tiene barra de
 *     progreso, controles y no te pasa al siguiente Short sin parar.
 *
 * ¿QUÉ AÑADE?
 *   Un control de velocidad en la barra del reproductor:  [ − ] 1.5x [ + ]
 *   - YouTube solo deja llegar a x2; con este control se puede ir de x0.25 a
 *     x4 en pasos de 0.25.
 *   - Haciendo clic en la velocidad se vuelve a x1.
 *   - Recuerda la última velocidad elegida (GM_setValue) y la aplica a todos
 *     los vídeos que se abran, incluso después de cerrar el navegador.
 *   - Muestra el tiempo que falta REALMENTE para acabar el vídeo teniendo en
 *     cuenta la velocidad (un vídeo de 20 min a x2 dura 10 min).
 *
 * Nota: YouTube es una SPA (Single Page Application), al cambiar de vídeo no se
 * recarga la página, por eso el script comprueba cada segundo si el control
 * sigue en el reproductor y escucha el evento "yt-navigate-finish" de YouTube.
 * Además YouTube usa Trusted Types y no deja usar innerHTML, así que todos los
 * elementos se crean con createElement y textContent.
 */

(function() {
  'use strict';

  console.log('[YouTube mejorado] ¡Funciona!');

  // ---------------------------------------------------------------------------
  // 1. ELIMINAR LOS SHORTS
  // ---------------------------------------------------------------------------

  // Si entramos directamente en un Short, redirigimos al reproductor normal
  function redirigirShort() {
    const coincidencia = location.pathname.match(/^\/shorts\/([\w-]+)/);
    if (coincidencia) {
      location.replace('/watch?v=' + coincidencia[1]);
    }
  }
  redirigirShort();

  // Al navegar dentro de YouTube (sin recargar) también comprobamos la URL
  document.addEventListener('yt-navigate-finish', redirigirShort);

  // Ocultamos con CSS todos los sitios donde aparecen Shorts.
  // Se usa :has() para ocultar el contenedor entero que contiene un enlace a /shorts/
  GM_addStyle(`
    /* Menú lateral (abierto y minimizado) */
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-guide-entry-renderer:has(a[href^="/shorts"]),
    ytd-mini-guide-entry-renderer[aria-label="Shorts"],

    /* Filas de Shorts en la página de inicio y en suscripciones */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    ytd-rich-section-renderer:has(ytm-shorts-lockup-view-model),
    ytd-rich-item-renderer:has(a[href^="/shorts/"]),

    /* Filas de Shorts y Shorts sueltos en las búsquedas y en la columna lateral */
    ytd-reel-shelf-renderer,
    grid-shelf-view-model:has(a[href^="/shorts/"]),
    ytd-video-renderer:has(a[href^="/shorts/"]),
    ytd-compact-video-renderer:has(a[href^="/shorts/"]),
    yt-lockup-view-model:has(a[href^="/shorts/"]),

    /* Pestaña "Shorts" de los canales */
    yt-tab-shape[tab-title="Shorts"] {
      display: none !important;
    }

    /* Estilos del control de velocidad que añadimos al reproductor */
    #ytm-velocidad {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 100%;
      margin-right: 8px;
      font-family: Roboto, Arial, sans-serif;
      font-size: 13px;
      color: #fff;
      vertical-align: top;
    }
    #ytm-velocidad button {
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 16px;
      line-height: 24px;
      cursor: pointer;
    }
    #ytm-velocidad button:hover {
      background: rgba(255, 255, 255, 0.35);
    }
    #ytm-velocidad .ytm-valor {
      min-width: 44px;
      text-align: center;
      font-weight: bold;
      cursor: pointer;
    }
    #ytm-velocidad .ytm-restante {
      margin-left: 6px;
      opacity: 0.8;
      white-space: nowrap;
    }
  `);

  // ---------------------------------------------------------------------------
  // 2. AÑADIR CONTROL DE VELOCIDAD + TIEMPO RESTANTE
  // ---------------------------------------------------------------------------

  const VELOCIDAD_MIN = 0.25;
  const VELOCIDAD_MAX = 4;
  const PASO = 0.25;

  // Última velocidad elegida (se guarda en el almacenamiento de Tampermonkey)
  let velocidadGuardada = GM_getValue('velocidad', 1);

  // Referencias a los elementos del panel
  let etiquetaVelocidad = null;
  let etiquetaRestante = null;

  function obtenerVideo() {
    return document.querySelector('video.html5-main-video');
  }

  // Convierte segundos a formato h:mm:ss o m:ss
  function formatearTiempo(segundos) {
    segundos = Math.max(0, Math.round(segundos));
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    const ss = String(s).padStart(2, '0');
    if (h > 0) {
      return h + ':' + String(m).padStart(2, '0') + ':' + ss;
    }
    return m + ':' + ss;
  }

  // Cambia la velocidad del vídeo y la guarda para los siguientes vídeos
  function cambiarVelocidad(nueva) {
    const video = obtenerVideo();
    if (!video) return;
    nueva = Math.min(VELOCIDAD_MAX, Math.max(VELOCIDAD_MIN, nueva));
    video.playbackRate = nueva;
    velocidadGuardada = nueva;
    GM_setValue('velocidad', nueva);
    actualizarPanel();
  }

  // Refresca el texto de la velocidad y del tiempo restante
  function actualizarPanel() {
    const video = obtenerVideo();
    if (!video || !etiquetaVelocidad) return;

    etiquetaVelocidad.textContent = video.playbackRate + 'x';

    if (isFinite(video.duration) && video.duration > 0) {
      const restante = (video.duration - video.currentTime) / video.playbackRate;
      etiquetaRestante.textContent = 'Quedan ' + formatearTiempo(restante);
    } else {
      // Directos o vídeo aún sin cargar
      etiquetaRestante.textContent = '';
    }
  }

  // Crea un botón del panel (sin innerHTML por los Trusted Types de YouTube)
  function crearBoton(texto, titulo, alPulsar) {
    const boton = document.createElement('button');
    boton.textContent = texto;
    boton.title = titulo;
    boton.addEventListener('click', function(evento) {
      // Evitamos que el clic llegue al reproductor (pausaría el vídeo)
      evento.stopPropagation();
      alPulsar();
    });
    return boton;
  }

  // Crea el panel dentro de la barra de controles del reproductor
  function crearPanel(contenedor) {
    const panel = document.createElement('div');
    panel.id = 'ytm-velocidad';

    const botonMenos = crearBoton('−', 'Reducir velocidad', function() {
      cambiarVelocidad(obtenerVideo().playbackRate - PASO);
    });

    etiquetaVelocidad = document.createElement('span');
    etiquetaVelocidad.className = 'ytm-valor';
    etiquetaVelocidad.title = 'Clic para volver a velocidad normal';
    etiquetaVelocidad.addEventListener('click', function(evento) {
      evento.stopPropagation();
      cambiarVelocidad(1);
    });

    const botonMas = crearBoton('+', 'Aumentar velocidad', function() {
      cambiarVelocidad(obtenerVideo().playbackRate + PASO);
    });

    etiquetaRestante = document.createElement('span');
    etiquetaRestante.className = 'ytm-restante';

    panel.append(botonMenos, etiquetaVelocidad, botonMas, etiquetaRestante);
    contenedor.prepend(panel);
  }

  // Añade los eventos al <video> una sola vez
  function prepararVideo(video) {
    if (video.dataset.ytmPreparado) return;
    video.dataset.ytmPreparado = 'si';

    video.addEventListener('timeupdate', actualizarPanel);
    video.addEventListener('ratechange', actualizarPanel);

    // Al cargar un vídeo nuevo YouTube pone su velocidad por defecto,
    // así que esperamos un poco y aplicamos la que tenemos guardada
    video.addEventListener('loadeddata', function() {
      setTimeout(function() {
        video.playbackRate = velocidadGuardada;
      }, 300);
    });
    video.playbackRate = velocidadGuardada;
  }

  // Comprueba que el panel está en el reproductor y lo crea si falta
  function asegurarPanel() {
    const controles = document.querySelector('#movie_player .ytp-right-controls');
    const video = obtenerVideo();
    if (!controles || !video) return;

    prepararVideo(video);

    if (!document.getElementById('ytm-velocidad')) {
      crearPanel(controles);
      actualizarPanel();
    }
  }

  // YouTube no recarga la página al cambiar de vídeo, así que lo comprobamos
  // al terminar cada navegación y, por si acaso, cada segundo
  document.addEventListener('yt-navigate-finish', asegurarPanel);
  setInterval(asegurarPanel, 1000);
})();
