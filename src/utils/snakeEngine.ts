import { SupportedLanguage } from "../i18n/translations";
import { isValidWord } from "../data/dictionaries";

export const GRID_COLS = 12;
export const GRID_ROWS = 16;
export const MAX_LETTERS_ON_BOARD = 6;
export const INITIAL_SNAKE_LENGTH = 3;
export const BASE_TICK_MS = 260;
export const MIN_TICK_MS = 130;
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
// actual). Crece un paso por tick SIEMPRE (coma o no coma). El cuerpo
// visible es siempre `path.slice(0, letters.length)`, así que al sacar
// letras del medio (por una palabra detectada) la cola se "reconecta" sola:
// no hace falta recalcular posiciones a mano, el slice ya da un camino
// contiguo válido.
export interface SnakeGameState {
  path: GridPos[];
  letters: string[]; // letters[0] = letra en la cabeza (la comida más reciente)
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
    A: 12, E: 14, O: 9, S: 8, R: 7, N: 7, I: 6, D: 5, L: 5, C: 5,
    T: 5, U: 4, M: 3, P: 3, B: 2, G: 1, V: 1, Y: 1, Q: 1, H: 1,
    F: 1, Z: 1, J: 1, X: 1, K: 1, W: 1,
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

const weightedAlphabetCache: Partial<Record<SupportedLanguage, string[]>> = {};

function weightedAlphabet(lang: SupportedLanguage): string[] {
  const cached = weightedAlphabetCache[lang];
  if (cached) return cached;
  const pool: string[] = [];
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS[lang])) {
    for (let i = 0; i < weight; i++) pool.push(letter);
  }
  weightedAlphabetCache[lang] = pool;
  return pool;
}

export function randomLetter(lang: SupportedLanguage): string {
  const pool = weightedAlphabet(lang);
  return pool[Math.floor(Math.random() * pool.length)];
}

function posKey(pos: GridPos): string {
  return `${pos.row}-${pos.col}`;
}

export function isWithinBounds(pos: GridPos): boolean {
  return pos.row >= 0 && pos.row < GRID_ROWS && pos.col >= 0 && pos.col < GRID_COLS;
}

export function currentSegments(state: SnakeGameState): SnakeSegment[] {
  return state.letters.map((letter, i) => ({ ...state.path[i], letter }));
}

function spawnLetterTile(lang: SupportedLanguage, occupied: Set<string>): LetterTile | null {
  const freeCells: GridPos[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const pos = { row: r, col: c };
      if (!occupied.has(posKey(pos))) freeCells.push(pos);
    }
  }
  if (freeCells.length === 0) return null;
  const pos = freeCells[Math.floor(Math.random() * freeCells.length)];
  return { ...pos, letter: randomLetter(lang) };
}

function replenishLetters(state: SnakeGameState, lang: SupportedLanguage): LetterTile[] {
  const occupied = new Set<string>();
  for (const seg of currentSegments(state)) occupied.add(posKey(seg));
  const tiles = [...state.letterTiles];
  for (const t of tiles) occupied.add(posKey(t));

  while (tiles.length < MAX_LETTERS_ON_BOARD) {
    const tile = spawnLetterTile(lang, occupied);
    if (!tile) break;
    tiles.push(tile);
    occupied.add(posKey(tile));
  }
  return tiles;
}

export function createInitialState(lang: SupportedLanguage): SnakeGameState {
  const startRow = Math.floor(GRID_ROWS / 2);
  const startCol = Math.floor(GRID_COLS / 2);
  const direction: Direction = "right";

  // El path arranca con INITIAL_SNAKE_LENGTH posiciones hacia atrás de la
  // dirección inicial, como si la víbora ya viniera caminando.
  const path: GridPos[] = Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, i) => ({
    row: startRow,
    col: startCol - i,
  }));
  const letters = Array.from({ length: INITIAL_SNAKE_LENGTH }, () => randomLetter(lang));

  let state: SnakeGameState = { path, letters, letterTiles: [], direction };
  state = { ...state, letterTiles: replenishLetters(state, lang) };
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
  const newHeadPos: GridPos = { row: head.row + delta.row, col: head.col + delta.col };

  if (!isWithinBounds(newHeadPos)) return { status: "gameover" };

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
    nextState = { ...nextState, letterTiles: replenishLetters(nextState, lang) };
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
  const letters = [
    ...state.letters.slice(0, match.startIndex),
    ...state.letters.slice(match.startIndex + match.length),
  ];
  return { ...state, letters };
}
