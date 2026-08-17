import { SupportedLanguage } from "../i18n/translations";
import { isValidWord } from "../data/dictionaries";

export const GRID_COLS = 12;
export const GRID_ROWS = 16;
export const MAX_LETTERS_ON_BOARD = 15;
export const BASE_TICK_MS = 650;
export const MIN_TICK_MS = 325;
const MAX_PATH_LENGTH = 2000; // más que de sobra: el largo máximo real está acotado por GRID_COLS*GRID_ROWS

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
    // Proporción a propósito: 3 vocales por cada consonante (suma vocales
    // 90, suma consonantes 30), para que sea mucho más viable armar
    // palabras. Entre las consonantes, S/T/C/B/V/R siguen reforzadas, y
    // H/X/Y/Z/K/W/Q (las menos frecuentes en español) quedan al piso: 3
    // del resto de las consonantes por cada 1 de este grupo.
    A: 22, E: 25, O: 18, I: 14, U: 11,
    S: 3, T: 2, C: 2, B: 2, V: 2, R: 2, N: 1, D: 1, L: 1, M: 1,
    P: 1, G: 1, F: 1, J: 1, H: 1, X: 1, Y: 1, Z: 1, K: 1, W: 1, Q: 1,
  },
  en: {
    E: 13, T: 9, A: 8, O: 8, I: 7, N: 7, S: 6, H: 6, R: 6, D: 4,
    L: 4, U: 3, C: 3, M: 2, W: 2, F: 2, G: 2, Y: 2, P: 2, B: 2,
    V: 1, K: 1, J: 1, X: 1, Q: 1, Z: 1,
  },
  pt: {
    A: 13, E: 12, O: 10, S: 8, R: 6, I: 6, N: 5, D: 5, M: 5, U: 4,
    T: 4, C: 4, L: 3, P: 3, V: 2, G: 2, H: 1, Q: 1, B: 1, F: 1,
    Z: 1, J: 1, X: 1, Y: 1, K: 1, W: 1,
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
function replenishLetters(state: SnakeGameState, lang: SupportedLanguage, startCategory: LetterCategory): LetterTile[] {
  const occupied = new Set<string>();
  for (const seg of currentSegments(state)) occupied.add(posKey(seg));
  const tiles = [...state.letterTiles];
  for (const t of tiles) occupied.add(posKey(t));

  let category = startCategory;
  while (tiles.length < MAX_LETTERS_ON_BOARD) {
    const tile = spawnLetterTile(lang, occupied, category);
    if (!tile) break;
    tiles.push(tile);
    occupied.add(posKey(tile));
    category = oppositeCategory(category);
  }
  return tiles;
}

export function createInitialState(lang: SupportedLanguage): SnakeGameState {
  const startRow = Math.floor(GRID_ROWS / 2);
  const startCol = Math.floor(GRID_COLS / 2);
  const direction: Direction = "right";

  // Arranca solo con la cabeza (sin letras todavía): la primera letra que
  // comas aparece de una en la posición 1, sin ningún paso oculto.
  const path: GridPos[] = [{ row: startRow, col: startCol }];
  const letters: string[] = [];

  let state: SnakeGameState = { path, letters, letterTiles: [], direction };
  state = { ...state, letterTiles: replenishLetters(state, lang, "vowel") };
  return state;
}

export function tickIntervalMs(length: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - length * 4);
}

export type StepResult =
  | { status: "moved" | "ate"; state: SnakeGameState }
  | { status: "gameover" };

export function stepSnake(state: SnakeGameState, direction: Direction, lang: SupportedLanguage): StepResult {
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
    nextState = { ...nextState, letterTiles: replenishLetters(nextState, lang, oppositeCategory(eatenCategory)) };
  }

  if (wrapped) {
    // Premio por cruzar: una ficha extra en el tablero, además de las que
    // ya haya (no reemplaza el reparto normal de arriba). Se sortea de la
    // categoría menos representada en el tablero actual — si no, al no
    // pasar ninguna categoría (pool sin filtrar), salía casi siempre vocal,
    // porque el pool general está pesado 3 a 1 a favor de las vocales.
    const occupied = new Set<string>();
    for (const seg of currentSegments(nextState)) occupied.add(posKey(seg));
    for (const t of nextState.letterTiles) occupied.add(posKey(t));
    const vowelCount = nextState.letterTiles.filter((t) => categoryOf(t.letter) === "vowel").length;
    const bonusCategory: LetterCategory = vowelCount * 2 > nextState.letterTiles.length ? "consonant" : "vowel";
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
// hay varias del mismo largo máximo, gana la que aparece primero.
export function detectWordInBody(letters: string[], lang: SupportedLanguage): WordMatch | null {
  const chrono = [...letters].reverse().join("");

  for (let length = chrono.length; length >= 3; length--) {
    for (let start = 0; start + length <= chrono.length; start++) {
      const candidate = chrono.slice(start, start + length);
      if (isValidWord(candidate, lang)) {
        const startIndex = letters.length - start - length;
        return { word: candidate, startIndex, length };
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
