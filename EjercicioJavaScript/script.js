// Ejercicio 1 de JavaScript: generador de contraseñas con palabras aleatorias
// El diccionario (DICCIONARIO) está en el fichero diccionario.js

const MIN_PALABRAS = 1;
const MAX_PALABRAS = 10;
const LONGITUD_RECOMENDADA = 15; // Recomendación del NIST
const LONGITUD_MINIMA = 8;

// Devuelve una palabra aleatoria del diccionario
function palabraAleatoria() {
  let indice = Math.floor(Math.random() * DICCIONARIO.length);
  return DICCIONARIO[indice];
}

// Pone en mayúscula la primera letra de una palabra
function primeraMayuscula(palabra) {
  return palabra.charAt(0).toUpperCase() + palabra.slice(1);
}

// Genera la contraseña según las opciones elegidas
function generarContrasena(numPalabras, mayusculas, noRepetir) {
  let palabras = [];

  while (palabras.length < numPalabras) {
    let palabra = palabraAleatoria();

    // Si no se pueden repetir y ya está en la lista, se busca otra
    if (noRepetir && palabras.indexOf(palabra) != -1) {
      continue;
    }

    if (mayusculas) {
      palabra = primeraMayuscula(palabra);
    }

    palabras.push(palabra);
  }

  let contrasena = '';
  for (let i = 0; i < palabras.length; i++) {
    contrasena += palabras[i];
  }
  return contrasena;
}

// Se ejecuta al pulsar el botón
function mostrarContrasena() {
  let numPalabras = Number(document.getElementById('numPalabras').value);
  let mayusculas = document.getElementById('mayusculas').checked;
  let noRepetir = document.getElementById('noRepetir').checked;

  let resultado = document.getElementById('contrasena');
  let info = document.getElementById('info');

  // Comprobamos que el número de palabras es válido
  if (!(numPalabras >= MIN_PALABRAS && numPalabras <= MAX_PALABRAS)) {
    resultado.innerHTML = `Introduce un número entre ${MIN_PALABRAS} y ${MAX_PALABRAS}`;
    resultado.className = 'error';
    info.innerHTML = '';
    return;
  }

  let contrasena = generarContrasena(numPalabras, mayusculas, noRepetir);
  console.log(contrasena);

  resultado.innerHTML = `La contraseña generada es: <strong>${contrasena}</strong>`;
  resultado.className = '';

  // Información sobre la longitud según el NIST
  let longitud = contrasena.length;
  if (longitud < LONGITUD_MINIMA) {
    info.innerHTML = `Longitud: ${longitud} caracteres. Demasiado corta, el mínimo es ${LONGITUD_MINIMA}.`;
    info.className = 'error';
  } else if (longitud < LONGITUD_RECOMENDADA) {
    info.innerHTML = `Longitud: ${longitud} caracteres. Se recomienda un mínimo de ${LONGITUD_RECOMENDADA}.`;
    info.className = 'aviso';
  } else {
    info.innerHTML = `Longitud: ${longitud} caracteres. Cumple la recomendación del NIST.`;
    info.className = 'correcto';
  }
}

let boton = document.getElementById('boton');
boton.addEventListener('click', mostrarContrasena);
