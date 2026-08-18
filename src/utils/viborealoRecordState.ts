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
  maxLevel: number; // nivel más alto alcanzado en toda la historia
}

const EMPTY_RECORD: ViborealoRecord = { score: 0, wordsFound: 0, words: [], longestWord: "", maxLevel: 1 };

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
      maxLevel: parsed.maxLevel ?? 1,
    };
  } catch {
    return null;
  }
}

export interface RecordUpdateResult {
  scoreRecord: boolean;
  wordsRecord: boolean;
  longestWordRecord: boolean;
  maxLevelRecord: boolean;
  record: ViborealoRecord;
}

// Cuatro récords independientes que se actualizan cada uno por su cuenta al
// terminar una partida (no hace falta ganar los cuatro juntos): mejor
// puntaje, más palabras formadas en una partida, palabra más larga de
// todos los tiempos, y nivel más alto alcanzado. Si ninguno mejora, no se
// guarda nada.
export function maybeSaveRecord(lang: SupportedLanguage, score: number, words: string[], level: number): RecordUpdateResult {
  const current = getRecord(lang) ?? EMPTY_RECORD;
  const longestThisGame = words.reduce((longest, w) => (w.length > longest.length ? w : longest), "");

  const scoreRecord = score > current.score;
  const wordsRecord = words.length > current.wordsFound;
  const longestWordRecord = longestThisGame.length > current.longestWord.length;
  const maxLevelRecord = level > current.maxLevel;

  if (!scoreRecord && !wordsRecord && !longestWordRecord && !maxLevelRecord) {
    return { scoreRecord, wordsRecord, longestWordRecord, maxLevelRecord, record: current };
  }

  const updated: ViborealoRecord = {
    score: scoreRecord ? score : current.score,
    wordsFound: wordsRecord ? words.length : current.wordsFound,
    words: scoreRecord ? words : current.words,
    longestWord: longestWordRecord ? longestThisGame : current.longestWord,
    maxLevel: maxLevelRecord ? level : current.maxLevel,
  };
  localStorage.setItem(storeKey(lang), JSON.stringify(updated));
  return { scoreRecord, wordsRecord, longestWordRecord, maxLevelRecord, record: updated };
}
