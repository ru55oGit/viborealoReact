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

interface SnakeBoardProps {
  segments: SnakeSegment[];
  letterTiles: LetterTile[];
  flashIndices?: Set<number>; // índices (en `segments`) que se están por borrar, para el flash de éxito
  onSwipe: (direction: Direction) => void;
}

function key(row: number, col: number): string {
  return `${row}-${col}`;
}

export default function SnakeBoard({ segments, letterTiles, flashIndices, onSwipe }: SnakeBoardProps) {
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
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const k = key(r, c);
      const seg = segmentByCell.get(k);
      const tileLetter = tileByCell.get(k);

      let backgroundColor: string = EMPTY_BG;
      let color = "#bbb";
      let letter = "";
      let borderRadius = "3px";

      if (seg) {
        backgroundColor = seg.flash ? FLASH_BG : seg.isHead ? HEAD_BG : BODY_BG;
        color = "#fff";
        letter = seg.letter;
        borderRadius = seg.isHead ? "6px" : "3px";
      } else if (tileLetter) {
        backgroundColor = TILE_BG;
        color = ACCENT;
        letter = tileLetter;
      }

      cells.push(
        <Box
          key={k}
          sx={{
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
          {letter}
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
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        gap: "1.5px",
        width: "100%",
        aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {cells}
    </Box>
  );
}
