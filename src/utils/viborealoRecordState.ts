import { SupportedLanguage } from "../i18n/translations";

const STORE_KEY_PREFIX = "viborealo_best_v1";

function storeKey(lang: SupportedLanguage): string {
  return `${STORE_KEY_PREFIX}_${lang}`;
}

export interface ViborealoRecord {
  score: number;
  wordsFound: number; // mejor cantidad de palabras encontradas en UNA partida
  words: string[]; // palabras de la partida que estableció el récord de puntaje
  longestWord: string; // palabra más larga encontrada en toda la historia
}

const EMPTY_RECORD: ViborealoRecord = { score: 0, wordsFound: 0, words: [], longestWord: "" };

export function getRecord(lang: SupportedLanguage): ViborealoRecord | null {
  try {
    const raw = localStorage.getItem(storeKey(lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ViborealoRecord>;
    return {
      score: parsed.score ?? 0,
      wordsFound: parsed.wordsFound ?? 0,
      words: parsed.words ?? [],
      longestWord: parsed.longestWord ?? "",
    };
  } catch {
    return null;
  }
}

export interface RecordUpdateResult {
  scoreRecord: boolean;
  wordsRecord: boolean;
  longestWordRecord: boolean;
  record: ViborealoRecord;
}

// Tres récords independientes que se actualizan cada uno por su cuenta al
// terminar una partida (no hace falta ganar los tres juntos): mejor
// puntaje, más palabras formadas en una partida, y palabra más larga de
// todos los tiempos. Si ninguno mejora, no se guarda nada.
export function maybeSaveRecord(lang: SupportedLanguage, score: number, words: string[]): RecordUpdateResult {
  const current = getRecord(lang) ?? EMPTY_RECORD;
  const longestThisGame = words.reduce((longest, w) => (w.length > longest.length ? w : longest), "");

  const scoreRecord = score > current.score;
  const wordsRecord = words.length > current.wordsFound;
  const longestWordRecord = longestThisGame.length > current.longestWord.length;

  if (!scoreRecord && !wordsRecord && !longestWordRecord) {
    return { scoreRecord, wordsRecord, longestWordRecord, record: current };
  }

  const updated: ViborealoRecord = {
    score: scoreRecord ? score : current.score,
    wordsFound: wordsRecord ? words.length : current.wordsFound,
    words: scoreRecord ? words : current.words,
    longestWord: longestWordRecord ? longestThisGame : current.longestWord,
  };
  localStorage.setItem(storeKey(lang), JSON.stringify(updated));
  return { scoreRecord, wordsRecord, longestWordRecord, record: updated };
}
