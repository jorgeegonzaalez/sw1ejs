# Ejercicio Tampermonkey: YouTube sin Shorts + control de velocidad

**Web elegida:** YouTube

- **Lo que se elimina:** los Shorts (menú lateral, filas de inicio y búsquedas,
  pestaña de los canales). Si abres un enlace `/shorts/ID`, te lleva al
  reproductor normal (`/watch?v=ID`).
- **Lo que se añade:** un control `[ − ] 1.5x [ + ]` en la barra del reproductor
  para ir de x0.25 a x4 (YouTube solo deja llegar a x2). Recuerda la velocidad
  elegida entre vídeos y muestra el tiempo que falta de verdad según la
  velocidad. Si haces clic en el número, vuelve a x1.

## Cómo probarlo

1. Instalar la extensión Tampermonkey en el navegador.
2. Tampermonkey > *Crear un nuevo script*.
3. Borrar el contenido de ejemplo y pegar el de `youtube-mejorado.user.js`.
4. *File > Save*.
5. Abrir o recargar https://www.youtube.com. En la consola aparece
   `[YouTube mejorado] ¡Funciona!`.
