import { SupportedLanguage } from "../i18n/translations";
import { isValidWord } from "../data/dictionaries";

export const GRID_COLS = 12;
export const GRID_ROWS = 16;
export const BASE_MAX_LETTERS_ON_BOARD = 15;
export const BASE_TICK_MS = 650;
export const MIN_TICK_MS = 325;
const MAX_PATH_LENGTH = 2000; // más que de sobra: el largo máximo real está acotado por GRID_COLS*GRID_ROWS

// Niveles: cada WORDS_PER_LEVEL palabras encontradas (constante, a
// diferencia de Letris donde el objetivo por nivel va creciendo) se sube
// de nivel. La dificultad no pasa por la velocidad acá, sino por el tope
// de letras en tablero, que sube LETTERS_STEP_PER_LEVEL cada vez: nivel 1
// arranca en 15, nivel 2 en 20, nivel 3 en 25, etc.
export const WORDS_PER_LEVEL = 5;
export const LETTERS_STEP_PER_LEVEL = 5;

export function levelFromWordsFound(wordsFound: number): number {
  return Math.floor(wordsFound / WORDS_PER_LEVEL) + 1;
}

export function wordsIntoCurrentLevel(wordsFound: number): number {
  return wordsFound % WORDS_PER_LEVEL;
}

export function maxLettersForLevel(level: number): number {
  return BASE_MAX_LETTERS_ON_BOARD + (level - 1) * LETTERS_STEP_PER_LEVEL;
}

export type Direction = "up" | "down" | "left" | "right";

export interface GridPos {
  row: number;
  col: number;
}

export interface LetterTile extends GridPos {
  letter: string;
}

export interface SnakeSegment extends GridPos {
  letter: string;
}

// Path de posiciones de la cabeza, más reciente primero (path[0] = cabeza
// actual). Crece un paso por tick SIEMPRE (coma o no coma). La cabeza
// (path[0]) nunca tiene letra propia: es solo la "nariz" que se mueve. Las
// letras reales arrancan en path[1] — letters[0] es la más reciente comida,
// visible al toque en esa posición, sin ningún paso oculto de por medio.
// El cuerpo visible siempre sale de `path.slice(1, letters.length + 1)`, así
// que al sacar letras del medio (por una palabra detectada) la cola se
// "reconecta" sola: no hace falta recalcular posiciones a mano.
export interface SnakeGameState {
  path: GridPos[];
  letters: string[]; // letters[0] = letra en la primera posición detrás de la cabeza
  letterTiles: LetterTile[];
  direction: Direction;
}

const DIRECTION_DELTA: Record<Direction, GridPos> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

export function isOpposite(a: Direction, b: Direction): boolean {
  const da = DIRECTION_DELTA[a];
  const db = DIRECTION_DELTA[b];
  return da.row === -db.row && da.col === -db.col;
}

// Frecuencia aproximada de letras por idioma: si las 26 letras aparecieran
// parejo, formar una palabra real sería rarísimo. Ponderamos para que las
// letras comunes (vocales, S/R/N/T...) salgan mucho más seguido.
const LETTER_WEIGHTS: Record<SupportedLanguage, Record<string, number>> = {
  es: {
    // Proporción a propósito: bastantes más vocales que consonantes (suma
    // vocales 90, consonantes 32), para que sea viable armar palabras.
    // Entre las consonantes, S/T/C/B/V/R/N/D/L/M son las "comunes" (L/M/N/D
    // quedaron mal en un ajuste anterior, que las había dejado tan raras
    // como H/X/Y/Z/K/W/Q — reportado por el usuario). Ese grupo (las
    // realmente poco frecuentes en español) queda al piso del pool.
    A: 22, E: 25, O: 18, I: 14, U: 11,
    S: 3, T: 2, C: 2, B: 2, V: 2, R: 2, N: 2, D: 2, L: 2, M: 2,
    P: 1, G: 1, F: 1, J: 1, H: 1, X: 1, Y: 1, Z: 1, K: 1, W: 1, Q: 1,
  },
  en: {
    // Mismo criterio que en `es`: vocales bien reforzadas, y entre las
    // consonantes, T/N/S/H/R son las más comunes; J/K/Q/V/X/Z (las clásicas
    // "letras raras" de Scrabble en inglés) quedan al piso del pool.
    A: 19, E: 30, I: 16, O: 18, U: 7,
    T: 3, N: 3, S: 3, H: 3, R: 3, D: 2, L: 2, C: 1, M: 1, W: 1,
    F: 1, G: 1, Y: 1, P: 1, B: 1, J: 1, K: 1, Q: 1, V: 1, X: 1, Z: 1,
  },
  pt: {
    // Mismo criterio: vocales reforzadas 3 a 1 sobre consonantes; entre las
    // consonantes, S/R/D/M/N/T/C son las más comunes; J/K/W/X/Y/Z (K/W/Y
    // casi no existen en portugués salvo préstamos/nombres) al piso.
    A: 27, E: 23, I: 11, O: 20, U: 9,
    S: 3, R: 3, D: 2, M: 2, N: 2, T: 2, C: 2, L: 1, P: 1, V: 1,
    G: 1, H: 1, Q: 1, B: 1, F: 1, J: 1, K: 1, W: 1, X: 1, Y: 1, Z: 1,
  },
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
export type LetterCategory = "vowel" | "consonant";

export function categoryOf(letter: string): LetterCategory {
  return VOWELS.has(letter) ? "vowel" : "consonant";
}

function oppositeCategory(category: LetterCategory): LetterCategory {
  return category === "vowel" ? "consonant" : "vowel";
}

const weightedAlphabetCache: Partial<Record<string, string[]>> = {};

// `category` filtra el pool a solo vocales o solo consonantes: así el
// llamador puede forzar el balance (ver `replenishLetters`) sin tocar los
// pesos relativos dentro de cada categoría.
function weightedAlphabet(lang: SupportedLanguage, category?: LetterCategory): string[] {
  const cacheKey = `${lang}:${category ?? "all"}`;
  const cached = weightedAlphabetCache[cacheKey];
  if (cached) return cached;
  const pool: string[] = [];
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS[lang])) {
    if (category && categoryOf(letter) !== category) continue;
    for (let i = 0; i < weight; i++) pool.push(letter);
  }
  weightedAlphabetCache[cacheKey] = pool;
  return pool;
}

export function randomLetter(lang: SupportedLanguage, category?: LetterCategory): string {
  const pool = weightedAlphabet(lang, category);
  return pool[Math.floor(Math.random() * pool.length)];
}

function posKey(pos: GridPos): string {
  return `${pos.row}-${pos.col}`;
}

// Si la cabeza se sale del tablero, aparece del otro lado (misma fila o
// columna): no hay muerte por pared, solo por choque contra el propio
// cuerpo. El resto del cuerpo va a ir "reapareciendo" del otro lado solo,
// letra por letra, a medida que pasan los ticks — es una consecuencia
// natural de cómo `path` guarda el historial de posiciones, no hace falta
// lógica extra para ese efecto.
function wrapPos(pos: GridPos): { pos: GridPos; wrapped: boolean } {
  let { row, col } = pos;
  let wrapped = false;
  if (col < 0) { col = GRID_COLS - 1; wrapped = true; }
  else if (col >= GRID_COLS) { col = 0; wrapped = true; }
  if (row < 0) { row = GRID_ROWS - 1; wrapped = true; }
  else if (row >= GRID_ROWS) { row = 0; wrapped = true; }
  return { pos: { row, col }, wrapped };
}

export function currentSegments(state: SnakeGameState): SnakeSegment[] {
  const head: SnakeSegment = { ...state.path[0], letter: "" };
  const body = state.letters.map((letter, i) => ({ ...state.path[i + 1], letter }));
  return [head, ...body];
}

function spawnLetterTile(lang: SupportedLanguage, occupied: Set<string>, category?: LetterCategory): LetterTile | null {
  const freeCells: GridPos[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const pos = { row: r, col: c };
      if (!occupied.has(posKey(pos))) freeCells.push(pos);
    }
  }
  if (freeCells.length === 0) return null;
  const pos = freeCells[Math.floor(Math.random() * freeCells.length)];
  return { ...pos, letter: randomLetter(lang, category) };
}

// `startCategory` fuerza la categoría (vocal/consonante) de la primera
// letra que se agrega, y de ahí en más alterna: así el tablero nunca queda
// empachado de puras vocales (o puras consonantes) por mala suerte del
// pool ponderado. Al arrancar la partida alterna las 6 letras iniciales;
// al reponer una sola letra (después de comer), la fuerza opuesta a la
// que se acaba de comer.
function replenishLetters(
  state: SnakeGameState, lang: SupportedLanguage, startCategory: LetterCategory, maxLetters: number,
): LetterTile[] {
  const occupied = new Set<string>();
  for (const seg of currentSegments(state)) occupied.add(posKey(seg));
  const tiles = [...state.letterTiles];
  for (const t of tiles) occupied.add(posKey(t));

  let category = startCategory;
  while (tiles.length < maxLetters) {
    const tile = spawnLetterTile(lang, occupied, category);
    if (!tile) break;
    tiles.push(tile);
    occupied.add(posKey(tile));
    category = oppositeCategory(category);
  }
  return tiles;
}

// Categoría (vocal/consonante) menos representada en el tablero actual —
// para reponer de a una sin desbalancear (mismo criterio que ya usa el
// premio de traspasar la pared).
function leastRepresentedCategory(tiles: LetterTile[]): LetterCategory {
  const vowelCount = tiles.filter((t) => categoryOf(t.letter) === "vowel").length;
  return vowelCount * 2 > tiles.length ? "consonant" : "vowel";
}

// Al subir de nivel, sube el tope de letras en tablero: repone de una para
// que el jugador vea el tablero más lleno apenas termina el cartel de
// "subiste de nivel", en vez de ir goteando de a una en las próximas comidas.
export function growLetterPool(state: SnakeGameState, lang: SupportedLanguage, maxLetters: number): SnakeGameState {
  const startCategory = leastRepresentedCategory(state.letterTiles);
  return { ...state, letterTiles: replenishLetters(state, lang, startCategory, maxLetters) };
}

export function createInitialState(lang: SupportedLanguage, maxLetters: number = BASE_MAX_LETTERS_ON_BOARD): SnakeGameState {
  const startRow = Math.floor(GRID_ROWS / 2);
  const startCol = Math.floor(GRID_COLS / 2);
  const direction: Direction = "right";

  // Arranca solo con la cabeza (sin letras todavía): la primera letra que
  // comas aparece de una en la posición 1, sin ningún paso oculto.
  const path: GridPos[] = [{ row: startRow, col: startCol }];
  const letters: string[] = [];

  let state: SnakeGameState = { path, letters, letterTiles: [], direction };
  state = { ...state, letterTiles: replenishLetters(state, lang, "vowel", maxLetters) };
  return state;
}

export function tickIntervalMs(length: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - length * 4);
}

export type StepResult =
  | { status: "moved" | "ate"; state: SnakeGameState }
  | { status: "gameover" };

export function stepSnake(
  state: SnakeGameState, direction: Direction, lang: SupportedLanguage, maxLetters: number,
): StepResult {
  const segments = currentSegments(state);
  const head = segments[0];
  const delta = DIRECTION_DELTA[direction];
  const rawHeadPos: GridPos = { row: head.row + delta.row, col: head.col + delta.col };
  const { pos: newHeadPos, wrapped } = wrapPos(rawHeadPos);

  const eatenIndex = state.letterTiles.findIndex((t) => t.row === newHeadPos.row && t.col === newHeadPos.col);
  const isEating = eatenIndex !== -1;

  // Si no come, la cola libera su celda este mismo tick, así que pisarla no
  // cuenta como choque (igual que en el Snake clásico).
  const bodyToCheck = isEating ? segments : segments.slice(0, -1);
  const collides = bodyToCheck.some((s) => s.row === newHeadPos.row && s.col === newHeadPos.col);
  if (collides) return { status: "gameover" };

  const newPath = [newHeadPos, ...state.path].slice(0, MAX_PATH_LENGTH);
  const newLetters = isEating ? [state.letterTiles[eatenIndex].letter, ...state.letters] : state.letters;
  const remainingTiles = isEating
    ? state.letterTiles.filter((_, i) => i !== eatenIndex)
    : state.letterTiles;

  let nextState: SnakeGameState = { path: newPath, letters: newLetters, letterTiles: remainingTiles, direction };
  if (isEating) {
    // La letra que repone al toque es de la categoría opuesta a la que se
    // acaba de comer, para que el tablero no se desbalancee.
    const eatenCategory = categoryOf(state.letterTiles[eatenIndex].letter);
    nextState = {
      ...nextState,
      letterTiles: replenishLetters(nextState, lang, oppositeCategory(eatenCategory), maxLetters),
    };
  }

  if (wrapped) {
    // Premio por cruzar: una ficha extra en el tablero, además de las que
    // ya haya (no reemplaza el reparto normal de arriba, ni cuenta contra
    // el tope del nivel). Se sortea de la categoría menos representada en
    // el tablero actual — si no, al no pasar ninguna categoría (pool sin
    // filtrar), salía casi siempre vocal, porque el pool general está
    // pesado 3 a 1 a favor de las vocales.
    const occupied = new Set<string>();
    for (const seg of currentSegments(nextState)) occupied.add(posKey(seg));
    for (const t of nextState.letterTiles) occupied.add(posKey(t));
    const bonusCategory = leastRepresentedCategory(nextState.letterTiles);
    const bonusTile = spawnLetterTile(lang, occupied, bonusCategory);
    if (bonusTile) {
      nextState = { ...nextState, letterTiles: [...nextState.letterTiles, bonusTile] };
    }
  }

  return { status: isEating ? "ate" : "moved", state: nextState };
}

export interface WordMatch {
  word: string;
  startIndex: number; // índice en `letters` (orden cabeza->cola)
  length: number;
}

// Recorre el cuerpo en orden cronológico (cola->cabeza, o sea el orden en que
// se fueron comiendo las letras) y busca la substring válida más larga. Si
// no hay nada de un largo dado, prueba leyendo ese mismo tramo al revés
// (cabeza->cola) — el jugador arma la palabra mirando el cuerpo tal como
// se ve en pantalla, no necesariamente en el orden en que la comió. Entre
// dos matches del mismo largo, gana el de la lectura cronológica.
export function detectWordInBody(letters: string[], lang: SupportedLanguage): WordMatch | null {
  const chrono = [...letters].reverse().join(""); // viejo -> nuevo
  const reverseChrono = letters.join(""); // nuevo -> viejo (letters[0] ya es el más reciente)

  for (let length = chrono.length; length >= 3; length--) {
    for (let start = 0; start + length <= chrono.length; start++) {
      const candidate = chrono.slice(start, start + length);
      if (isValidWord(candidate, lang)) {
        const startIndex = letters.length - start - length;
        return { word: candidate, startIndex, length };
      }
    }
    for (let start = 0; start + length <= reverseChrono.length; start++) {
      const candidate = reverseChrono.slice(start, start + length);
      if (isValidWord(candidate, lang)) {
        return { word: candidate, startIndex: start, length };
      }
    }
  }
  return null;
}

export function pointsForWord(word: string): number {
  const lengthBonus = Math.max(0, word.length - 4);
  return 10 + lengthBonus;
}

export function removeWordFromState(state: SnakeGameState, match: WordMatch): SnakeGameState {
  // Llegar a largo 0 acá es válido (la cabeza nunca depende de tener letras):
  // significa que la palabra detectada usaba todo el cuerpo, "cuerpo limpio".
  const letters = [
    ...state.letters.slice(0, match.startIndex),
    ...state.letters.slice(match.startIndex + match.length),
  ];
  return { ...state, letters };
}
