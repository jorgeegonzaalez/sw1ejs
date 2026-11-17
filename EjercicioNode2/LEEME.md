# Ejercicio 2 – Mensaje JSON de la cartelera

El mensaje está en `cartelera.json`.

## Decisiones de diseño

- **Un único elemento raíz** (un objeto) que contiene el array `peliculas`.
  Se usa un objeto en vez de un array directamente para poder añadir más
  campos al mensaje en el futuro sin romper la API.
- **Sin información duplicada**: en el texto original el título de cada
  película se repite en cada frase; en el JSON aparece una sola vez y todo lo
  demás (director, actores y sesiones) cuelga de ella.
- **Sesiones agrupadas por sala**: cada sala aparece una única vez por
  película y dentro tiene un array con sus `horarios`. Así una sala con varias
  horas no repite el número de sala.
- **Arrays para las colecciones** (`actoresPrincipales`, `sesiones`,
  `horarios`), ya que son listas ordenadas de valores.
- **La sala es un número** (`17`) y no un texto (`"Sala 17"`): la palabra
  "Sala" ya la indica la clave.
- **Las horas son strings** (`"17:00"`) porque JSON no tiene un tipo para
  horas y `17:00` no es un número válido.
- **Claves en lower camel case** y entre comillas dobles, siguiendo la guía de
  estilo de JSON. Sin trailing commas.

## Comprobar que es un JSON válido

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('cartelera.json', 'utf8')))"
```
