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
import HouseAdBanner from "../ads/HouseAdBanner";
import { useRewardedAd } from "../ads/useRewardedAd";
import RewardedAdModal from "../ads/RewardedAdModal";
import { useLanguage } from "../i18n/LanguageContext";
import { track } from "../lib/analytics";
import { recordLastPlayed } from "../utils/lastPlayedState";
import { maybeSaveRecord } from "../utils/viborealoRecordState";
import { buildViborealoResultPngFile } from "../utils/shareImage";
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
  clearSnakeBody,
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
  const [sharingResult, setSharingResult] = useState(false);
  const canShareResult = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const level = levelFromWordsFound(foundWords.length);
  const wordsInLevel = wordsIntoCurrentLevel(foundWords.length);
  const maxLetters = maxLettersForLevel(level);

  const pendingDirectionRef = useRef<Direction>("right");
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRecordRef = useRef(false);
  // Marca de tiempo de la partida actual (se renueva en cada restart), para
  // calcular duration_sec al llegar a game_over.
  const gameStartedAtRef = useRef(Date.now());
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
    track("game_start", { level: 1 });
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
      // "collision" es la única causa real de game over en este juego (la
      // víbora se choca contra su propio cuerpo) — no hay abandono explícito.
      const durationSec = Math.round((Date.now() - gameStartedAtRef.current) / 1000);
      track("game_over", { level, score, duration_sec: durationSec, reason: "collision" });
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
        track("level_start", { level: newLevel });
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
    gameStartedAtRef.current = Date.now();
    track("game_start", { level: 1 });
  }

  // Recompensa del rewarded ad en game over: limpia el cuerpo (la única
  // causa de choque, ver clearSnakeBody) y retoma la misma partida —
  // mismo puntaje, nivel y palabras encontradas, no un restart. Resetea
  // savedRecordRef para que, si el jugador supera su récord después de
  // revivir, maybeSaveRecord lo guarde en el gameover real que venga.
  function handleRevive() {
    const next = clearSnakeBody(gameStateRef.current);
    gameStateRef.current = next;
    setGameState(next);
    savedRecordRef.current = false;
    setPhase("playing");
  }

  const rewardedAd = useRewardedAd("viborealo-revive-rewarded", "viborealo", currentLanguage, handleRevive, "clear_snake");

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

  async function handleShareResult(method: "whatsapp" | "facebook") {
    if (!canShareResult || sharingResult) return;
    setSharingResult(true);
    track("share", { method });
    try {
      const imageFile = await buildViborealoResultPngFile(foundWords, score, level, "viborealo-resultado.png");
      const shareUrl = "https://www.viborealo.com";
      const shareData: ShareData = {
        title: "Viborealo",
        text: `${t.shareResultText(level, score)}\n${shareUrl}`,
      };
      if (imageFile && (!navigator.canShare || navigator.canShare({ files: [imageFile] }))) {
        shareData.files = [imageFile];
      }
      await navigator.share(shareData);
    } catch {
      // Canceló el panel de compartir sin elegir nada.
    } finally {
      setSharingResult(false);
    }
  }

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
            <Typography sx={{ fontSize: 20, fontWeight: 900, color: ACCENT, textAlign: "center", mb: 1.5 }}>
              www.viborealo.com
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#222", mb: 1 }}>
              {t.wordsListTitle} ({foundWords.length})
            </Typography>
            <FoundWordsList title={t.wordsListTitle} emptyLabel={t.wordsListEmpty} words={foundWords} hideTitle />

            {canShareResult && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 2 }}>
                <Box
                  component="button"
                  onClick={() => handleShareResult("whatsapp")}
                  disabled={sharingResult}
                  aria-label="Compartir por WhatsApp"
                  sx={{
                    display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: "#25D366", color: "#fff", border: "none", cursor: "pointer",
                    opacity: sharingResult ? 0.6 : 1,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.92L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.75 2.67 4.3 3.74.6.26 1.07.41 1.44.52.6.19 1.15.17 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.37-.78-1.87-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01Z" />
                  </svg>
                </Box>
                <Box
                  component="button"
                  onClick={() => handleShareResult("facebook")}
                  disabled={sharingResult}
                  aria-label="Compartir por Facebook"
                  sx={{
                    display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: "#1877F2", color: "#fff", border: "none", cursor: "pointer",
                    opacity: sharingResult ? 0.6 : 1,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95Z" />
                  </svg>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            onClick={rewardedAd.requestAd}
            disabled={!rewardedAd.canShowAd}
            size="large"
            sx={{
              backgroundColor: "#f0b429", color: "#1a1a1a", fontWeight: 800, fontSize: 16,
              py: 1.4, borderRadius: 999, textTransform: "none",
              "&:hover": { backgroundColor: "#d99f1a" },
              "&.Mui-disabled": { backgroundColor: "rgba(240,180,41,0.35)", color: "rgba(26,26,26,0.5)" },
            }}
          >
            {rewardedAd.loadingAd ? "..." : t.rewardedAdButton}
          </Button>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12, textAlign: "center", mt: -1 }}>
            {t.rewardedAdHint}
          </Typography>

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

        <RewardedAdModal
          locale={currentLanguage}
          open={rewardedAd.showingAd}
          adCreative={rewardedAd.adCreative}
          canConfirmReward={rewardedAd.canConfirmReward}
          secondsUntilCanConfirm={rewardedAd.secondsUntilCanConfirm}
          onConfirm={rewardedAd.handleAdWatched}
          onSkip={rewardedAd.handleAdSkipped}
          onImageClick={rewardedAd.handleImageClick}
          confirmLabel={t.rewardedAdConfirmButton}
          skipLabel={t.rewardedAdSkipButton}
          waitLabel={t.rewardedAdWaitLabel}
        />
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

        <Box sx={{ mt: 2, mb: 2 }}>
          <HouseAdBanner slot="viborealo-game-banner" gameSlug="viborealo" locale={currentLanguage} />
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
