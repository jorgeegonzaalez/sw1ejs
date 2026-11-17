// Ejercicio 1: servidor que muestra por consola información del sistema
// - Al arrancar: información del sistema y versión de Node.js
// - Periódicamente: uso de CPU, uso de memoria, tiempo activo del sistema y de Node.js
// - Qué se muestra y cada cuántos segundos se configura en config.json
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const RUTA_CONFIG = path.join(__dirname, 'config.json');

// Valores por defecto por si falta algún campo en config.json
const CONFIG_POR_DEFECTO = {
  intervaloSegundos: 5,
  mostrar: { cpu: true, memoria: true, tiempoSistema: true, tiempoNode: true }
};

let config = CONFIG_POR_DEFECTO;
let temporizador = null;
let ultimaInfo = ['Todavía no se ha tomado ninguna medida'];

// ---------- Utilidades de formato ----------

function formatearBytes(bytes) {
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < unidades.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${unidades[i]}`;
}

// Convierte segundos a "Xd Xh Xm Xs"
function formatearTiempo(segundosTotales) {
  segundosTotales = Math.floor(segundosTotales);
  const dias = Math.floor(segundosTotales / 86400);
  const horas = Math.floor((segundosTotales % 86400) / 3600);
  const minutos = Math.floor((segundosTotales % 3600) / 60);
  const segundos = segundosTotales % 60;
  return `${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

// ---------- Uso de CPU ----------

// os.cpus() da el tiempo acumulado (en ms) que cada núcleo ha pasado en cada modo
// desde que arrancó el equipo. Para saber el uso "actual" hay que comparar dos
// medidas: uso = 1 - (tiempo idle transcurrido / tiempo total transcurrido)
function tiemposCpu() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const modo in cpu.times) {
      total += cpu.times[modo];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

let medidaCpuAnterior = tiemposCpu();
let cpuNodeAnterior = process.cpuUsage();
let instanteAnterior = process.hrtime.bigint();

function usoCpu() {
  // CPU del sistema
  const medida = tiemposCpu();
  const idle = medida.idle - medidaCpuAnterior.idle;
  const total = medida.total - medidaCpuAnterior.total;
  const sistema = total > 0 ? (1 - idle / total) * 100 : 0;
  medidaCpuAnterior = medida;

  // CPU usada solo por este proceso de Node (process.cpuUsage da microsegundos)
  const cpuNode = process.cpuUsage(cpuNodeAnterior);
  const ahora = process.hrtime.bigint();
  const transcurridoUs = Number(ahora - instanteAnterior) / 1000;
  const node = transcurridoUs > 0
    ? ((cpuNode.user + cpuNode.system) / transcurridoUs / os.cpus().length) * 100
    : 0;
  cpuNodeAnterior = process.cpuUsage();
  instanteAnterior = ahora;

  return { sistema, node };
}

// ---------- Información ----------

function infoInicial() {
  const cpus = os.cpus();
  return [
    '=== Información del sistema ===',
    `Sistema operativo: ${os.type()} ${os.release()} (${process.platform})`,
    `Arquitectura:      ${process.arch}`,
    `Equipo:            ${os.hostname()}`,
    `CPU:               ${cpus[0] ? cpus[0].model.trim() : 'desconocida'} (${cpus.length} núcleos)`,
    `Memoria total:     ${formatearBytes(os.totalmem())}`,
    `Directorio home:   ${os.homedir()}`,
    `Versión de Node:   ${process.version}`,
    `Versión de V8:     ${process.versions.v8}`,
    `PID del proceso:   ${process.pid}`,
    '==============================='
  ].join('\n');
}

// Devuelve las líneas que se muestran periódicamente según la configuración
function infoPeriodica() {
  const lineas = [`[${new Date().toLocaleTimeString()}]`];
  const mostrar = config.mostrar;

  if (mostrar.cpu) {
    const cpu = usoCpu();
    lineas.push(`  CPU sistema: ${cpu.sistema.toFixed(1)}% | CPU Node: ${cpu.node.toFixed(1)}%`);
  }
  if (mostrar.memoria) {
    const total = os.totalmem();
    const usada = total - os.freemem();
    const memNode = process.memoryUsage();
    lineas.push(`  Memoria sistema: ${formatearBytes(usada)} / ${formatearBytes(total)} (${(usada / total * 100).toFixed(1)}%)`);
    lineas.push(`  Memoria Node: ${formatearBytes(memNode.rss)} (heap ${formatearBytes(memNode.heapUsed)})`);
  }
  if (mostrar.tiempoSistema) {
    lineas.push(`  Sistema activo: ${formatearTiempo(os.uptime())}`);
  }
  if (mostrar.tiempoNode) {
    lineas.push(`  Node ejecutándose: ${formatearTiempo(process.uptime())}`);
  }
  return lineas;
}

// ---------- Configuración ----------

function cargarConfig() {
  try {
    const leida = JSON.parse(fs.readFileSync(RUTA_CONFIG, 'utf8'));
    const intervalo = Number(leida.intervaloSegundos);
    config = {
      intervaloSegundos: intervalo > 0 ? intervalo : CONFIG_POR_DEFECTO.intervaloSegundos,
      mostrar: Object.assign({}, CONFIG_POR_DEFECTO.mostrar, leida.mostrar)
    };
  } catch (err) {
    console.error(`No se ha podido leer ${RUTA_CONFIG} (${err.message}). Se mantiene la configuración anterior.`);
  }
}

// (Re)inicia el temporizador con el intervalo configurado
function iniciarTemporizador() {
  clearInterval(temporizador);
  temporizador = setInterval(() => {
    ultimaInfo = infoPeriodica();
    console.log(ultimaInfo.join('\n'));
  }, config.intervaloSegundos * 1000);
  console.log(`Mostrando información cada ${config.intervaloSegundos} s:`,
    Object.keys(config.mostrar).filter(clave => config.mostrar[clave]).join(', ') || '(nada)');
}

// Si se modifica config.json mientras el servidor está en marcha, se recarga sin reiniciar
fs.watchFile(RUTA_CONFIG, { interval: 1000 }, () => {
  console.log('config.json ha cambiado, recargando configuración...');
  cargarConfig();
  iniciarTemporizador();
});

// ---------- Servidor ----------

// El servidor también muestra la información en el navegador (la última medida
// periódica, para no alterar el cálculo de CPU, que compara medidas consecutivas)
const server = http.createServer((req, res) => {
  if (req.url !== '/') {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('404 - Página no encontrada');
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(infoInicial() + '\n\nÚltima medida:\n' + ultimaInfo.join('\n') + '\n');
});

cargarConfig();
console.log(infoInicial());
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
  iniciarTemporizador();
});
