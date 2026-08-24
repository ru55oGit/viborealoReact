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
import HowToPlayCollapse from "../components/HowToPlayCollapse";
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
  levelFromWordsFound,
  wordsIntoCurrentLevel,
  maxLettersForLevel,
  growLetterPool,
  WORDS_PER_LEVEL,
} from "../utils/snakeEngine";

const ACCENT = "#e74c3c";
const FEEDBACK_DURATION_MS = 1300;
const CLEAR_DELAY_MS = 260;
const LEVEL_UP_POPUP_MS = 1800;

type Phase = "playing" | "levelup" | "gameover";

export default function Game() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();

  const [gameState, setGameState] = useState<SnakeGameState>(() => createInitialState(currentLanguage, maxLettersForLevel(1)));
  const [direction, setDirection] = useState<Direction>("right");
  const [phase, setPhase] = useState<Phase>("playing");
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<FoundWordEntry[]>([]);
  const [flashIndices, setFlashIndices] = useState<Set<number> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [levelUpNumber, setLevelUpNumber] = useState<number | null>(null);

  const level = levelFromWordsFound(foundWords.length);
  const wordsInLevel = wordsIntoCurrentLevel(foundWords.length);
  const maxLetters = maxLettersForLevel(level);

  const pendingDirectionRef = useRef<Direction>("right");
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRecordRef = useRef(false);
  const langRef = useRef(currentLanguage);
  langRef.current = currentLanguage;
  // Igual que langRef: el loop del tick lee esto por ref para no depender
  // de que el closure del efecto esté fresco (mismo motivo que gameStateRef
  // más abajo — maxLetters cambia con el nivel, que a su vez depende de
  // foundWords, algo que ese efecto no tiene en sus deps).
  const maxLettersRef = useRef(maxLetters);
  maxLettersRef.current = maxLetters;

  // Referencia siempre actualizada al estado del juego, para leerla desde
  // el loop del tick sin pasar por la forma funcional de setGameState. Esa
  // forma (prev => ...) se invoca dos veces por render en StrictMode, y acá
  // stepSnake no es pura (sortea letras nuevas) ni inocua (tenía setState
  // anidados adentro) — invocarla dos veces duplicaba pasos y producía
  // "comidas fantasma" (una letra distinta a la que realmente se tocó).
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    recordLastPlayed();
  }, []);

  // Loop principal: avanza un paso cada tick, a una velocidad que aumenta
  // levemente con el largo de la víbora.
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      const dir = pendingDirectionRef.current;
      const result = stepSnake(gameStateRef.current, dir, langRef.current, maxLettersRef.current);
      if (result.status === "gameover") {
        setPhase("gameover");
        return;
      }
      setDirection(dir);
      gameStateRef.current = result.state;
      setGameState(result.state);
    }, tickIntervalMs(gameState.letters.length));
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gameState.letters.length]);

  useEffect(() => {
    if (phase === "gameover" && !savedRecordRef.current) {
      savedRecordRef.current = true;
      maybeSaveRecord(currentLanguage, score, foundWords.map((f) => f.word), level);
    }
  }, [phase, currentLanguage, score, foundWords, level]);

  function handleDirectionInput(dir: Direction) {
    if (phase !== "playing") return;
    // Validar contra la dirección ya en cola (no la ya aplicada): si el
    // jugador manda dos direcciones seguidas antes del próximo tick, la
    // segunda tiene que chequear reversa contra la primera, no contra la
    // vieja dirección todavía visible en pantalla.
    if (isOpposite(dir, pendingDirectionRef.current)) return;

    // Si ya estaba yendo para ese lado y vuelve a apretar la misma
    // dirección, avanza un casillero de una: esperar al próximo tick se
    // siente lento cuando el jugador ya sabe a qué letra apunta, así que
    // insistir en la tecla es la forma de moverse más rápido a destino.
    const alreadyMoving = dir === pendingDirectionRef.current;
    pendingDirectionRef.current = dir;
    if (!alreadyMoving) return;

    const result = stepSnake(gameStateRef.current, dir, langRef.current, maxLettersRef.current);
    if (result.status === "gameover") {
      setPhase("gameover");
      return;
    }
    setDirection(dir);
    gameStateRef.current = result.state;
    setGameState(result.state);
  }

  function scheduleErrorClear() {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(""), FEEDBACK_DURATION_MS);
  }

  function handleDetectWord() {
    if (phase !== "playing" || flashIndices) return;
    // Leer de gameStateRef (no del gameState del closure): esta función se
    // llama también desde el listener de teclado, cuyo closure puede
    // quedar viejo por varios ticks (ver comentario en el efecto de
    // teclado más abajo). Si leyera gameState acá, podía evaluar la
    // palabra contra un cuerpo desactualizado — de ahí el bug real donde
    // "no encontraba" una palabra ya formada, o el borrado posterior caía
    // en índices corridos y se llevaba puesta una letra que no era.
    const match = detectWordInBody(gameStateRef.current.letters, currentLanguage);
    if (!match) {
      setErrorMsg(t.errorNoWordFound);
      scheduleErrorClear();
      return;
    }

    // flashIndices marca posiciones en `segments` (índice 0 = cabeza, sin
    // letra), así que van corridas +1 respecto a los índices de `letters`
    // que devuelve el match.
    const indices = new Set<number>();
    for (let i = match.startIndex; i < match.startIndex + match.length; i++) indices.add(i + 1);
    setFlashIndices(indices);

    const points = pointsForWord(match.word);
    setScore((s) => s + points);
    setFoundWords((prev) => [...prev, { word: match.word, points }]);

    // Calculado acá (no adentro del setTimeout) porque foundWords.length
    // todavía no refleja el setFoundWords de arriba en este mismo closure;
    // capturamos el total ya incrementado como número plano, que sí queda
    // bien en el closure diferido (a diferencia de leer foundWords de nuevo
    // ahí adentro, que traería el valor viejo).
    const newTotalWords = foundWords.length + 1;
    const willLevelUp = wordsIntoCurrentLevel(newTotalWords) === 0;
    const newLevel = levelFromWordsFound(newTotalWords);

    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = setTimeout(() => {
      let nextState = removeWordFromState(gameStateRef.current, match);
      if (willLevelUp) {
        nextState = growLetterPool(nextState, currentLanguage, maxLettersForLevel(newLevel));
      }
      gameStateRef.current = nextState;
      setGameState(nextState);
      setFlashIndices(null);

      if (willLevelUp) {
        setLevelUpNumber(newLevel);
        setPhase("levelup");
        if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
        levelUpTimeoutRef.current = setTimeout(() => {
          setLevelUpNumber(null);
          setPhase("playing");
        }, LEVEL_UP_POPUP_MS);
      }
    }, CLEAR_DELAY_MS);
  }

  function restartGame() {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
    savedRecordRef.current = false;
    pendingDirectionRef.current = "right";
    setDirection("right");
    setScore(0);
    setFoundWords([]);
    setFlashIndices(null);
    setErrorMsg("");
    setLevelUpNumber(null);
    setPhase("playing");
    setGameState(createInitialState(currentLanguage, maxLettersForLevel(1)));
  }

  // Teclado físico (desktop) además de botonera y swipe. El listener se
  // registra una sola vez (sin depender de `direction`/`phase`): setDirection
  // se llama en CADA tick, pero si el valor no cambió React no re-renderiza
  // (bailout de useState), así que un efecto con esos deps podía quedarse
  // sin re-suscribirse por varios ticks seguidos mientras la víbora seguía
  // derecho — y con eso, el closure de handleDetectWord/handleDirectionInput
  // quedaba viejo. Despachar siempre a través de refs actualizadas en cada
  // render evita ese problema de raíz.
  const handleDirectionInputRef = useRef(handleDirectionInput);
  handleDirectionInputRef.current = handleDirectionInput;
  const handleDetectWordRef = useRef(handleDetectWord);
  handleDetectWordRef.current = handleDetectWord;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp") handleDirectionInputRef.current("up");
      else if (e.key === "ArrowDown") handleDirectionInputRef.current("down");
      else if (e.key === "ArrowLeft") handleDirectionInputRef.current("left");
      else if (e.key === "ArrowRight") handleDirectionInputRef.current("right");
      else if (e.key === " " || e.code === "Space") {
        e.preventDefault(); // la barra espaciadora scrollea la página por default
        handleDetectWordRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const segments = currentSegments(gameState);

  if (phase === "gameover") {
    return (
      <Layout onBack={() => navigate("/")}>
        <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ borderRadius: "16px", backgroundColor: "#f3f3f3", p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 52 }}>🐍</Typography>
            <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 26, color: "#222", textAlign: "center" }}>
              {t.gameOverTitle}
            </Typography>
            <Typography sx={{ color: "#666", fontSize: 16 }}>{t.gameOverBody(score)}</Typography>
            <Typography sx={{ color: "#888", fontSize: 14, fontWeight: 700 }}>{t.levelReachedLabel(level)}</Typography>
          </Box>

          <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#222", mb: 1 }}>
              {t.wordsListTitle} ({foundWords.length})
            </Typography>
            <FoundWordsList title={t.wordsListTitle} emptyLabel={t.wordsListEmpty} words={foundWords} hideTitle />
          </Box>

          <Button onClick={restartGame} size="large" sx={{
            backgroundColor: "#fff", color: ACCENT, fontWeight: 800, fontSize: 18,
            py: 1.6, borderRadius: 999, textTransform: "none",
            boxShadow: "0 0 0 4px rgba(255,255,255,0.35), 0 10px 24px rgba(0,0,0,0.4)",
          }}>
            {t.playAgainButton}
          </Button>
          <Button onClick={() => navigate("/")} sx={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
            {t.backToHomeButton}
          </Button>
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
          backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "16px", px: 2, py: 1.25, mb: 1,
        }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
            {t.levelLabel} {level}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13 }}>
            {t.levelGoalLabel(wordsInLevel, WORDS_PER_LEVEL)}
          </Typography>
        </Box>

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
            direction={direction}
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

          {phase === "levelup" && levelUpNumber !== null && (
            <Box sx={{
              position: "absolute", inset: 0, zIndex: 3,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
              backgroundColor: "rgba(255,255,255,0.96)", textAlign: "center", px: 2,
            }}>
              <Typography sx={{ fontSize: 44 }}>🎉</Typography>
              <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 32, color: ACCENT }}>
                {t.levelUpTitle(levelUpNumber)}
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

        <HowToPlayCollapse title={t.howToPlayTitle} body={t.howToPlayBody} />
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
