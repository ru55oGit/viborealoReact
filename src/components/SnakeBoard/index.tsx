import { useRef } from "react";
import Box from "@mui/material/Box";
import {
  GRID_COLS,
  GRID_ROWS,
  LetterTile,
  SnakeSegment,
  Direction,
} from "../../utils/snakeEngine";

const ACCENT = "#e74c3c";
const HEAD_BG = "#c0392b";
const BODY_BG = "#e74c3c";
const TILE_BG = "#fdebea";
const EMPTY_BG = "#f8f8f8";
const FLASH_BG = "#2ecc71";

const SWIPE_THRESHOLD_PX = 22;

// Los ojos son chicos y van pegados a una esquina (no compiten por el
// centro de la celda, que es donde tiene que ir la letra bien grande para
// que se lea en una pantalla real). El grupo entero rota según hacia dónde
// se mueve la víbora, así se nota la orientación sin sacrificar la letra.
function eyeSx(top: string, left: string) {
  return {
    position: "absolute" as const,
    top,
    left,
    transform: "translate(-50%, -50%)",
    width: "16%",
    height: "16%",
    borderRadius: "50%",
    backgroundColor: "#fff",
    border: "1px solid rgba(0,0,0,0.35)",
  };
}

const DIRECTION_DEG: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

interface SnakeBoardProps {
  segments: SnakeSegment[];
  letterTiles: LetterTile[];
  direction: Direction; // hacia dónde mira la cabeza
  flashIndices?: Set<number>; // índices (en `segments`) que se están por borrar, para el flash de éxito
  onSwipe: (direction: Direction) => void;
  cols?: number; // grilla más chica para la demo de Home; por defecto la del juego real
  rows?: number;
}

function key(row: number, col: number): string {
  return `${row}-${col}`;
}

export default function SnakeBoard({
  segments, letterTiles, direction, flashIndices, onSwipe,
  cols = GRID_COLS, rows = GRID_ROWS,
}: SnakeBoardProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const segmentByCell = new Map<string, { letter: string; isHead: boolean; flash: boolean }>();
  segments.forEach((seg, i) => {
    segmentByCell.set(key(seg.row, seg.col), {
      letter: seg.letter,
      isHead: i === 0,
      flash: flashIndices?.has(i) ?? false,
    });
  });

  const tileByCell = new Map<string, string>();
  for (const tile of letterTiles) tileByCell.set(key(tile.row, tile.col), tile.letter);

  function handlePointerDown(e: React.PointerEvent) {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onSwipe(dx > 0 ? "right" : "left");
    } else {
      onSwipe(dy > 0 ? "down" : "up");
    }
  }

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = key(r, c);
      const seg = segmentByCell.get(k);
      const tileLetter = tileByCell.get(k);

      let backgroundColor: string = EMPTY_BG;
      let color = "#bbb";
      let letter = "";
      let borderRadius = "3px";
      const isHead = seg?.isHead ?? false;

      if (seg) {
        backgroundColor = isHead ? EMPTY_BG : seg.flash ? FLASH_BG : BODY_BG;
        color = "#fff";
        letter = seg.letter;
        borderRadius = "3px";
      } else if (tileLetter) {
        backgroundColor = TILE_BG;
        color = ACCENT;
        letter = tileLetter;
      }

      cells.push(
        <Box
          key={k}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius,
            fontWeight: 800,
            fontSize: { xs: 9, sm: 10 },
            fontFamily: "monospace",
            backgroundColor,
            color,
            border: tileLetter ? `1px solid ${ACCENT}55` : "none",
            transition: "background-color 0.12s, color 0.12s",
          }}
        >
          {isHead ? (
            <>
              <Box sx={{
                position: "absolute",
                inset: "4%",
                backgroundColor: seg?.flash ? FLASH_BG : HEAD_BG,
                // Más redondeada del lado "delantero" (derecha, orientación
                // base) que del trasero, así al rotar se nota bien el hocico.
                borderRadius: "20% 60% 60% 20%",
                transform: `rotate(${DIRECTION_DEG[direction]}deg)`,
                transition: "transform 0.15s, background-color 0.12s",
              }}>
                <Box sx={eyeSx("40%", "68%")} />
                <Box sx={eyeSx("60%", "68%")} />
              </Box>
            </>
          ) : (
            letter
          )}
        </Box>
      );
    }
  }

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: "1.5px",
        width: "100%",
        aspectRatio: `${cols} / ${rows}`,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {cells}
    </Box>
  );
}
