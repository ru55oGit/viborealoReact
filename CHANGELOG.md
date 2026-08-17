# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]
### Added
- Home: reemplazar la preview estática por una demo animada (componente `SnakeDemo`) donde la cabeza se mueve sola, come S-O-L, gira y detecta la palabra, en loop — reusa el mismo `SnakeBoard` del juego real

### Changed
- Game over: mover los botones "Jugar de nuevo"/"Volver al inicio" debajo del box de palabras encontradas, y sacar el título "Palabras formadas" afuera del box gris (mismo estilo que Letris)
- Letras (ES): subir la proporción de vocales a 3 por cada consonante (antes ~0.8x) para que sea mucho más viable armar palabras
- Letras: el tablero ya no queda desbalanceado por mala suerte del sorteo — arranca alternando vocal/consonante y, después de comer, la letra que repone es siempre de la categoría opuesta a la comida
- Letras: subir el máximo de letras en tablero de 6 a 15 (quedaban pocas para elegir), sigue mitad vocales mitad consonantes
- Controles: si ya vas para un lado y apretás esa misma dirección de nuevo (tecla, botón o swipe), avanza un casillero de una en vez de esperar al próximo tick — insistir en la tecla ahora sirve para llegar más rápido a la letra que se busca
- Home: el bloque de "Jugar" (demo + botón) usa el mismo box cuadrado 1:1 que Letris, así que queda con la misma altura. `SnakeBoard` ahora acepta `cols`/`rows` opcionales para poder mostrar una grilla más chica (8x7) en la demo, sin tocar el tablero real (12x16) del juego
- Traspasar paredes: la cabeza ya no muere contra el borde, aparece por el lado opuesto (misma fila/columna). Ya solo se pierde por chocar contra el propio cuerpo. Cada cruce agrega una ficha de letra extra al tablero, como premio

### Fixed
- Game over: el botón "Jugar de nuevo" se veía en blanco un instante al cargar la pantalla (el `variant="contained"` de MUI pintaba el fondo con el rojo del tema antes de que el `sx` lo pisara a blanco)

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
