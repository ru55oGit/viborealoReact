import { SnakeGameState, Direction } from "./snakeEngine";
import { FoundWordEntry } from "../components/FoundWordsList";

const STORAGE_KEY = "viborealo_inprogress_v1";

export interface InProgressGame {
  gameState: SnakeGameState;
  direction: Direction;
  // Solo se guarda en "playing"/"paused" — "levelup" y "gameover" nunca se
  // persisten, así que al restaurar nunca se cae en esas dos fases (ver
  // comentario en game.tsx sobre por qué siempre se restaura en pausa).
  phase: "playing" | "paused";
  score: number;
  foundWords: FoundWordEntry[];
  gameStartedAt: number;
}

// Mata la pestaña en segundo plano (sobre todo en mobile, con poca memoria)
// y al volver la recarga de cero: como el estado vivía solo en React,
// se perdía toda la partida en curso. Esto guarda una foto después de cada
// cambio relevante y la restaura al cargar, para que eso deje de pasar.
export function saveInProgressGame(game: InProgressGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
}

function isValid(value: unknown): value is InProgressGame {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<InProgressGame>;
  return (
    Array.isArray(v.gameState?.path) &&
    Array.isArray(v.gameState?.letters) &&
    Array.isArray(v.gameState?.letterTiles) &&
    typeof v.score === "number" &&
    Array.isArray(v.foundWords) &&
    (v.phase === "playing" || v.phase === "paused")
  );
}

export function loadInProgressGame(): InProgressGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearInProgressGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
