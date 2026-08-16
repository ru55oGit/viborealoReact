import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import SnakeBoard from "../SnakeBoard";
import { GridPos, LetterTile, SnakeGameState, currentSegments } from "../../utils/snakeEngine";

// Demo animada para la Home: la cabeza se mueve sola, come letras y arma
// una palabra real, para mostrar la mecánica sin depender del motor
// random del juego real (acá todo está guionado a mano). Usa una grilla
// propia, más chica que la del juego real (12x16), para que el bloque de
// Home quede con la misma altura que el de Letris (grilla cuadrada 1:1).
const DEMO_COLS = 8;
const DEMO_ROWS = 7;
// La secuencia guionada come S-O-L en orden, formando "SOL".
const HEAD_ROW = 3;
const START_COL = 1;
const DECOY_TILE: LetterTile = { row: HEAD_ROW, col: 6, letter: "A" };
const EAT_COLS = [START_COL + 1, START_COL + 2, START_COL + 3]; // S, O, L

const START_PAUSE_MS = 600;
const MOVE_STEP_MS = 450;
const TURN_STEP_MS = 450;
const PRE_DETECT_PAUSE_MS = 600;
const FLASH_MS = 600;
const POST_CLEAR_PAUSE_MS = 900;
const RESET_PAUSE_MS = 800;

function initialTiles(): LetterTile[] {
  return [
    { row: HEAD_ROW, col: EAT_COLS[0], letter: "S" },
    { row: HEAD_ROW, col: EAT_COLS[1], letter: "O" },
    { row: HEAD_ROW, col: EAT_COLS[2], letter: "L" },
    { ...DECOY_TILE },
  ];
}

function initialState(): SnakeGameState {
  const head: GridPos = { row: HEAD_ROW, col: START_COL };
  return { path: [head], letters: [], letterTiles: initialTiles(), direction: "right" };
}

export default function SnakeDemo() {
  const [state, setState] = useState<SnakeGameState>(initialState);
  const [flashIndices, setFlashIndices] = useState<Set<number> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function schedule(fn: () => void, delay: number) {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    }

    function runCycle() {
      let cur = initialState();
      setState(cur);
      setFlashIndices(null);

      let delay = START_PAUSE_MS;

      for (const col of EAT_COLS) {
        schedule(() => {
          const letter = cur.letterTiles.find((tile) => tile.col === col)!.letter;
          cur = {
            ...cur,
            path: [{ row: HEAD_ROW, col }, ...cur.path],
            letters: [letter, ...cur.letters],
            letterTiles: cur.letterTiles.filter((tile) => tile.col !== col),
            direction: "right",
          };
          setState(cur);
        }, delay);
        delay += MOVE_STEP_MS;
      }

      // Dobla hacia abajo: muestra que la cabeza gira y el cuerpo la sigue.
      schedule(() => {
        cur = { ...cur, path: [{ row: HEAD_ROW + 1, col: EAT_COLS[2] }, ...cur.path], direction: "down" };
        setState(cur);
      }, delay);
      delay += TURN_STEP_MS + PRE_DETECT_PAUSE_MS;

      schedule(() => {
        setFlashIndices(new Set([1, 2, 3]));
      }, delay);
      delay += FLASH_MS;

      schedule(() => {
        cur = { ...cur, letters: [] };
        setState(cur);
        setFlashIndices(null);
      }, delay);
      delay += POST_CLEAR_PAUSE_MS + RESET_PAUSE_MS;

      schedule(runCycle, delay);
    }

    runCycle();

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const segments = currentSegments(state);

  return (
    <Box sx={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <SnakeBoard
        cols={DEMO_COLS}
        rows={DEMO_ROWS}
        segments={segments}
        letterTiles={state.letterTiles}
        direction={state.direction}
        flashIndices={flashIndices ?? undefined}
        onSwipe={() => {}}
      />
    </Box>
  );
}
