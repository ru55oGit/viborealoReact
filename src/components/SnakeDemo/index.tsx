import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SnakeBoard from "../SnakeBoard";
import { GridPos, LetterTile, SnakeGameState, currentSegments, pointsForWord } from "../../utils/snakeEngine";
import { useLanguage } from "../../i18n/LanguageContext";

// Demo animada para la Home: la cabeza se mueve sola, come letras y arma
// una palabra real, para mostrar la mecánica sin depender del motor
// random del juego real (acá todo está guionado a mano).
const DEMO_WORD = "SOL";
const HEAD_ROW = 7;
const START_COL = 2;
const DECOY_TILE: LetterTile = { row: HEAD_ROW, col: START_COL + 7, letter: "A" };
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
  const { t } = useLanguage();
  const [state, setState] = useState<SnakeGameState>(initialState);
  const [flashIndices, setFlashIndices] = useState<Set<number> | null>(null);
  const [score, setScore] = useState(0);
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
      setScore(0);

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
        setScore(pointsForWord(DEMO_WORD));
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
    <Box sx={{ width: "100%", pointerEvents: "none" }}>
      <Box sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "12px", px: 1.5, py: 1, mb: 1,
      }}>
        <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>
          {t.scoreLabel}: {score}
        </Typography>
      </Box>
      <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 1 }}>
        <SnakeBoard
          segments={segments}
          letterTiles={state.letterTiles}
          direction={state.direction}
          flashIndices={flashIndices ?? undefined}
          onSwipe={() => {}}
        />
      </Box>
    </Box>
  );
}
