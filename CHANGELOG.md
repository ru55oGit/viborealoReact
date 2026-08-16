# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]
### Added
- Home: reemplazar la preview estática por una demo animada (componente `SnakeDemo`) donde la cabeza se mueve sola, come S-O-L, gira y detecta la palabra, en loop — reusa el mismo `SnakeBoard` del juego real

### Changed
- Game over: mover los botones "Jugar de nuevo"/"Volver al inicio" debajo del box de palabras encontradas, y sacar el título "Palabras formadas" afuera del box gris (mismo estilo que Letris)
- Letras (ES): subir la proporción de vocales a 3 por cada consonante (antes ~0.8x) para que sea mucho más viable armar palabras

### Added
- Viborealo: primera versión. Viborita clásica (tablero 12x16) donde en vez de puntitos se comen letras que van apareciendo random (ponderadas por frecuencia para que sea viable formar palabras); cada letra comida se suma al cuerpo, en el orden en que se comió
- Botón "Detectar palabra": busca la substring válida más larga (según el mismo diccionario de Letris) en el cuerpo, la elimina (el cuerpo se achica y se reconecta solo) y suma puntos. Si hay varias posibles, gana la más larga
- Controles: botonera tipo D-pad, swipe sobre el tablero, y flechas del teclado en desktop. El botón que revertiría la dirección actual (posición actual + su opuesto = choque instantáneo) queda deshabilitado
- Pierde si choca contra el borde del tablero o contra su propio cuerpo
- Reutilizado de Letris: validador de diccionario (ES/EN/PT + nombres y palabras extra), Layout, selector de idioma, sistema de récord (mejor puntaje, más palabras en una partida, palabra más larga histórica)
- Home con botón de volver al hub "Dejá de Boludear" cuando se llega con `?from=boludeando`

### Pending
- Todavía no tiene dominio propio ni cuenta de AdSense: falta agregar el script de AdSense, `ads.txt` y `sitemap.xml` cuando el juego esté listo para producción
- No se testeó el estado inicial de git ni se pusheó a GitHub (repo local únicamente por ahora)
