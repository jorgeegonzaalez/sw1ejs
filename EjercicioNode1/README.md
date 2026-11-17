# Ejercicio 1 – Información del sistema

Servidor Node.js que:

- Al arrancar muestra por consola información del sistema y la versión de
  Node.js.
- De forma periódica muestra por consola:
  - Uso de CPU (de todo el sistema y del propio proceso de Node).
  - Uso de memoria (del sistema y del proceso de Node).
  - Tiempo que el sistema lleva activo.
  - Tiempo que lleva ejecutándose Node.js.
- Qué información se muestra y cada cuántos segundos se configura en
  `config.json`.

No usa paquetes externos, solo los módulos `os`, `process`, `fs` y `http`.

## Requisitos

- **Node.js** y **npm**. Comprobar con `node -v`.
- **Puerto 3000 libre**. Si está ocupado se puede usar otro con la variable de
  entorno `PORT`.

## Cómo ejecutarlo

Desde la carpeta `EjercicioNode1`:

```bash
npm start
```

No hace falta `npm install` porque no tiene dependencias.

La información aparece en la consola. También se puede ver en el navegador en
<http://localhost:3000/> (información del sistema y última medida).

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

## Configuración (`config.json`)

```json
{
  "intervaloSegundos": 5,
  "mostrar": {
    "cpu": true,
    "memoria": true,
    "tiempoSistema": true,
    "tiempoNode": true
  }
}
```

| Campo                   | Descripción                                        |
|-------------------------|----------------------------------------------------|
| `intervaloSegundos`     | Cada cuántos segundos se muestra la información    |
| `mostrar.cpu`           | Uso de CPU                                         |
| `mostrar.memoria`       | Uso de memoria                                     |
| `mostrar.tiempoSistema` | Tiempo que el sistema lleva activo                 |
| `mostrar.tiempoNode`    | Tiempo que lleva ejecutándose Node.js              |

Si se modifica el fichero con el servidor en marcha, la configuración se
recarga sola (con `fs.watchFile`) sin reiniciar. Si falta algún campo se usa
su valor por defecto, y si el JSON no es válido se mantiene la configuración
anterior.

## Ejemplo de salida

```
=== Información del sistema ===
Sistema operativo: Windows_NT 10.0.26300 (win32)
Arquitectura:      x64
CPU:               AMD Ryzen 7 7840HS w/ Radeon 780M Graphics (16 núcleos)
Memoria total:     31.29 GB
Versión de Node:   v24.15.0
...
Server running at port 3000
Mostrando información cada 5 s: cpu, memoria, tiempoSistema, tiempoNode
[14:05:03]
  CPU sistema: 7.5% | CPU Node: 0.1%
  Memoria sistema: 16.75 GB / 31.29 GB (53.5%)
  Memoria Node: 42.26 MB (heap 5.04 MB)
  Sistema activo: 2d 9h 17m 8s
  Node ejecutándose: 0d 0h 0m 5s
```

## Funcionamiento

- **Información inicial**: `os.type()`, `os.release()`, `os.hostname()`,
  `os.cpus()`, `os.totalmem()`, `process.version`, `process.arch`...
- **Uso de CPU**: `os.cpus()` devuelve el tiempo acumulado que cada núcleo ha
  pasado en cada modo (user, sys, idle...) desde que arrancó el equipo, así
  que el uso se calcula comparando dos medidas consecutivas:
  `uso = 1 - idle transcurrido / total transcurrido`. El uso del proceso de
  Node se calcula igual con `process.cpuUsage()`.
- **Memoria**: `os.totalmem()` y `os.freemem()` para el sistema y
  `process.memoryUsage()` para Node.
- **Tiempos**: `os.uptime()` (sistema) y `process.uptime()` (Node), en
  segundos, formateados como `Xd Xh Xm Xs`.
- **Periodicidad**: `setInterval` con el intervalo de `config.json`. Al
  recargar la configuración se cancela con `clearInterval` y se vuelve a crear.
