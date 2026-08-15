import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Layout from "../components/Layout";
import SnakeBoard from "../components/SnakeBoard";
import FoundWordsList, { FoundWordEntry } from "../components/FoundWordsList";
import { useLanguage } from "../i18n/LanguageContext";
import { recordLastPlayed } from "../utils/lastPlayedState";
import { maybeSaveRecord } from "../utils/viborealoRecordState";
import {
  SnakeGameState,
  Direction,
  createInitialState,
  currentSegments,
  stepSnake,
  tickIntervalMs,
  detectWordInBody,
  pointsForWord,
  removeWordFromState,
  isOpposite,
} from "../utils/snakeEngine";

const ACCENT = "#e74c3c";
const FEEDBACK_DURATION_MS = 1300;
const CLEAR_DELAY_MS = 260;

type Phase = "playing" | "gameover";

export default function Game() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();

  const [gameState, setGameState] = useState<SnakeGameState>(() => createInitialState(currentLanguage));
  const [direction, setDirection] = useState<Direction>("right");
  const [phase, setPhase] = useState<Phase>("playing");
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<FoundWordEntry[]>([]);
  const [flashIndices, setFlashIndices] = useState<Set<number> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const pendingDirectionRef = useRef<Direction>("right");
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRecordRef = useRef(false);
  const langRef = useRef(currentLanguage);
  langRef.current = currentLanguage;

  useEffect(() => {
    recordLastPlayed();
  }, []);

  // Loop principal: avanza un paso cada tick, a una velocidad que aumenta
  // levemente con el largo de la víbora.
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      setGameState((prev) => {
        const dir = pendingDirectionRef.current;
        setDirection(dir);
        const result = stepSnake(prev, dir, langRef.current);
        if (result.status === "gameover") {
          setPhase("gameover");
          return prev;
        }
        return result.state;
      });
    }, tickIntervalMs(gameState.letters.length));
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gameState.letters.length]);

  useEffect(() => {
    if (phase === "gameover" && !savedRecordRef.current) {
      savedRecordRef.current = true;
      maybeSaveRecord(currentLanguage, score, foundWords.map((f) => f.word));
    }
  }, [phase, currentLanguage, score, foundWords]);

  function handleDirectionInput(dir: Direction) {
    if (phase !== "playing") return;
    if (isOpposite(dir, direction)) return;
    pendingDirectionRef.current = dir;
  }

  function scheduleErrorClear() {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(""), FEEDBACK_DURATION_MS);
  }

  function handleDetectWord() {
    if (phase !== "playing" || flashIndices) return;
    const match = detectWordInBody(gameState.letters, currentLanguage);
    if (!match) {
      setErrorMsg(t.errorNoWordFound);
      scheduleErrorClear();
      return;
    }

    const indices = new Set<number>();
    for (let i = match.startIndex; i < match.startIndex + match.length; i++) indices.add(i);
    setFlashIndices(indices);

    const points = pointsForWord(match.word);
    setScore((s) => s + points);
    setFoundWords((prev) => [...prev, { word: match.word, points }]);

    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = setTimeout(() => {
      setGameState((prev) => removeWordFromState(prev, match));
      setFlashIndices(null);
    }, CLEAR_DELAY_MS);
  }

  function restartGame() {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    savedRecordRef.current = false;
    pendingDirectionRef.current = "right";
    setDirection("right");
    setScore(0);
    setFoundWords([]);
    setFlashIndices(null);
    setErrorMsg("");
    setPhase("playing");
    setGameState(createInitialState(currentLanguage));
  }

  // Teclado físico (desktop) además de botonera y swipe.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp") handleDirectionInput("up");
      else if (e.key === "ArrowDown") handleDirectionInput("down");
      else if (e.key === "ArrowLeft") handleDirectionInput("left");
      else if (e.key === "ArrowRight") handleDirectionInput("right");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, phase]);

  const segments = currentSegments(gameState);

  if (phase === "gameover") {
    return (
      <Layout onBack={() => navigate("/")}>
        <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Button onClick={restartGame} variant="contained" size="large" sx={{
            backgroundColor: "#fff", color: ACCENT, fontWeight: 800, fontSize: 18,
            py: 1.6, borderRadius: 999, textTransform: "none",
            boxShadow: "0 0 0 4px rgba(255,255,255,0.35), 0 10px 24px rgba(0,0,0,0.4)",
          }}>
            {t.playAgainButton}
          </Button>
          <Button onClick={() => navigate("/")} sx={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
            {t.backToHomeButton}
          </Button>

          <Box sx={{ borderRadius: "16px", backgroundColor: "#f3f3f3", p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 52 }}>🐍</Typography>
            <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 26, color: "#222", textAlign: "center" }}>
              {t.gameOverTitle}
            </Typography>
            <Typography sx={{ color: "#666", fontSize: 16 }}>{t.gameOverBody(score)}</Typography>
          </Box>

          <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <FoundWordsList title={t.wordsListTitle} emptyLabel={t.wordsListEmpty} words={foundWords} />
          </Box>
        </Box>
      </Layout>
    );
  }

  const upDisabled = isOpposite("up", direction);
  const downDisabled = isOpposite("down", direction);
  const leftDisabled = isOpposite("left", direction);
  const rightDisabled = isOpposite("right", direction);

  return (
    <Layout onBack={() => navigate("/")}>
      <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "16px", px: 2, py: 1.25, mb: 2,
        }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
            {t.scoreLabel}: {score}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13 }}>
            {t.lengthLabel}: {gameState.letters.length}
          </Typography>
        </Box>

        <Box sx={{ position: "relative", borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff", p: 1, mb: 1 }}>
          <SnakeBoard
            segments={segments}
            letterTiles={gameState.letterTiles}
            flashIndices={flashIndices ?? undefined}
            onSwipe={handleDirectionInput}
          />

          {errorMsg && (
            <Box sx={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
              <Typography sx={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.7)", px: 1.5, py: 0.5, borderRadius: 999, fontSize: 12, fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }}>
                {errorMsg}
              </Typography>
            </Box>
          )}
        </Box>

        <Button
          onClick={handleDetectWord}
          startIcon={<SearchRoundedIcon />}
          sx={{
            backgroundColor: "#fff", color: ACCENT, fontWeight: 800,
            borderRadius: 999, py: 1.1, fontSize: 15, textTransform: "none", mb: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            "&:hover": { backgroundColor: "#f3f3f3" },
          }}
        >
          {t.detectWordButton}
        </Button>

        <Box sx={{ display: "flex", width: "100%", gap: "2px", mb: 2 }}>
          <Button disabled={leftDisabled} onClick={() => handleDirectionInput("left")} sx={dpadButtonSx}>
            <ArrowBackRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
          <Button disabled={upDisabled} onClick={() => handleDirectionInput("up")} sx={dpadButtonSx}>
            <ArrowUpwardRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
          <Button disabled={downDisabled} onClick={() => handleDirectionInput("down")} sx={dpadButtonSx}>
            <ArrowDownwardRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
          <Button disabled={rightDisabled} onClick={() => handleDirectionInput("right")} sx={dpadButtonSx}>
            <ArrowForwardRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
        </Box>

        <FoundWordsList
          title={t.wordsListTitle}
          emptyLabel={t.wordsListEmpty}
          words={foundWords}
          scoreLabel={t.scoreLabel}
          score={score}
        />
      </Box>
    </Layout>
  );
}

const dpadButtonSx = {
  flex: 1,
  aspectRatio: "1 / 1",
  minWidth: 0,
  padding: 0,
  borderRadius: "12px",
  backgroundColor: "#fff",
  color: ACCENT,
  "&:hover": { backgroundColor: "#f3f3f3" },
  "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.35)", color: "rgba(231,76,60,0.35)" },
};
