export type SupportedLanguage = "es" | "en" | "pt";

export interface Translation {
  // Layout / general
  appName: string;
  drawerHome: string;
  drawerPlay: string;
  language: string;
  privacyPolicyLabel: string;

  // Home
  tagline: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  daysWithoutPlayingMessage: (days: number) => string;
  readyToPlay: string;
  playButton: string;
  recordTitle: string;
  recordEmptyBody: string;
  recordScoreCaption: (score: number) => string;
  recordWordsCaption: (n: number) => string;
  recordLongestWordCaption: (word: string) => string;
  recordMaxLevelCaption: (level: number) => string;
  whatIsTitle: string;
  whatIsBody: string;
  howToPlayTitle: string;
  howToPlayBody: string;

  // Game
  scoreLabel: string;
  lengthLabel: string;
  levelLabel: string;
  levelGoalLabel: (current: number, total: number) => string;
  levelUpTitle: (level: number) => string;
  levelReachedLabel: (level: number) => string;
  wordsListTitle: string;
  wordsListEmpty: string;
  detectWordButton: string;
  errorNoWordFound: string;
  gameOverTitle: string;
  gameOverBody: (score: number) => string;
  playAgainButton: string;
  backToHomeButton: string;
}

const es: Translation = {
  appName: "Viborealo",
  drawerHome: "Inicio",
  drawerPlay: "Jugar",
  privacyPolicyLabel: "Política de Privacidad",
  language: "Idioma",

  tagline: "deslizá · comé · formá",
  greetingMorning: "Buenos días ☀️",
  greetingAfternoon: "Buenas tardes 🌤️",
  greetingEvening: "Buenas noches 🌙",
  daysWithoutPlayingMessage: (days) => `hace ${days} días que no jugás`,
  readyToPlay: "¿Listo para jugar Viborealo?",
  playButton: "JUGAR",
  recordTitle: "Récord",
  recordEmptyBody: "Todavía no jugaste ninguna partida.",
  recordScoreCaption: (score) => `${score} puntos`,
  recordWordsCaption: (n) => `Más palabras en una partida: ${n}`,
  recordLongestWordCaption: (word) => `Palabra más larga: ${word} (${word.length} letras)`,
  recordMaxLevelCaption: (level) => `Nivel máximo alcanzado: ${level}`,
  whatIsTitle: "¿Qué es Viborealo?",
  whatIsBody: "Viborealo es la viborita clásica, pero en vez de puntitos comés letras que van apareciendo en el tablero. Cada letra que comés se suma al cuerpo de la víbora. Cuando el cuerpo forma una palabra, apretás el botón de detectar y esa palabra desaparece del cuerpo (se achica) y sumás puntos.",
  howToPlayTitle: "¿Cómo jugar?",
  howToPlayBody: "Movete con los botones de abajo o deslizando el dedo sobre el tablero. Comé las letras para que se sumen al cuerpo de la víbora, en el orden en que las vas comiendo. Cuando creas que el cuerpo formó una palabra, apretá \"Detectar palabra\": si hay una palabra válida en el diccionario, se elimina del cuerpo (se achica) y sumás puntos — si hay más de una posible, se elige la más larga. Perdés si chocás contra vos misma o contra el borde del tablero.",

  scoreLabel: "Puntos",
  lengthLabel: "Largo",
  levelLabel: "Nivel",
  levelGoalLabel: (current, total) => `Objetivo: ${current}/${total} palabras`,
  levelUpTitle: (level) => `¡Nivel ${level}!`,
  levelReachedLabel: (level) => `Nivel alcanzado: ${level}`,
  wordsListTitle: "Palabras formadas",
  wordsListEmpty: "Comé letras y apretá \"Detectar palabra\"",
  detectWordButton: "Detectar palabra",
  errorNoWordFound: "No hay ninguna palabra válida en el cuerpo.",
  gameOverTitle: "¡Chocaste!",
  gameOverBody: (score) => `Terminaste con ${score} puntos.`,
  playAgainButton: "Jugar de nuevo",
  backToHomeButton: "Volver al inicio",
};

const en: Translation = {
  appName: "Viborealo",
  drawerHome: "Home",
  drawerPlay: "Play",
  privacyPolicyLabel: "Privacy Policy",
  language: "Language",

  tagline: "slide · eat · spell",
  greetingMorning: "Good morning ☀️",
  greetingAfternoon: "Good afternoon 🌤️",
  greetingEvening: "Good evening 🌙",
  daysWithoutPlayingMessage: (days) => `it's been ${days} days since you last played`,
  readyToPlay: "Ready to play Viborealo?",
  playButton: "PLAY",
  recordTitle: "Best score",
  recordEmptyBody: "You haven't played a game yet.",
  recordScoreCaption: (score) => `${score} points`,
  recordWordsCaption: (n) => `Most words in one game: ${n}`,
  recordLongestWordCaption: (word) => `Longest word: ${word} (${word.length} letters)`,
  recordMaxLevelCaption: (level) => `Highest level reached: ${level}`,
  whatIsTitle: "What is Viborealo?",
  whatIsBody: "Viborealo is classic Snake, but instead of dots you eat letters that appear on the board. Every letter you eat gets added to the snake's body. When the body spells a word, press the detect button and that word disappears from the body (it shrinks) and you score points.",
  howToPlayTitle: "How to play?",
  howToPlayBody: "Move with the buttons below or by swiping on the board. Eat letters so they're added to the snake's body, in the order you eat them. When you think the body spells a word, press \"Detect word\": if there's a valid dictionary word, it's removed from the body (it shrinks) and you score points — if there's more than one possible word, the longest one is chosen. You lose if you crash into yourself or the edge of the board.",

  scoreLabel: "Score",
  lengthLabel: "Length",
  levelLabel: "Level",
  levelGoalLabel: (current, total) => `Goal: ${current}/${total} words`,
  levelUpTitle: (level) => `Level ${level}!`,
  levelReachedLabel: (level) => `Level reached: ${level}`,
  wordsListTitle: "Words spelled",
  wordsListEmpty: "Eat letters and press \"Detect word\"",
  detectWordButton: "Detect word",
  errorNoWordFound: "There's no valid word in the body.",
  gameOverTitle: "You crashed!",
  gameOverBody: (score) => `You finished with ${score} points.`,
  playAgainButton: "Play again",
  backToHomeButton: "Back to home",
};

const pt: Translation = {
  appName: "Viborealo",
  drawerHome: "Início",
  drawerPlay: "Jogar",
  privacyPolicyLabel: "Política de Privacidade",
  language: "Idioma",

  tagline: "deslize · coma · forme",
  greetingMorning: "Bom dia ☀️",
  greetingAfternoon: "Boa tarde 🌤️",
  greetingEvening: "Boa noite 🌙",
  daysWithoutPlayingMessage: (days) => `faz ${days} dias que você não joga`,
  readyToPlay: "Pronto para jogar Viborealo?",
  playButton: "JOGAR",
  recordTitle: "Recorde",
  recordEmptyBody: "Você ainda não jogou nenhuma partida.",
  recordScoreCaption: (score) => `${score} pontos`,
  recordWordsCaption: (n) => `Mais palavras em uma partida: ${n}`,
  recordLongestWordCaption: (word) => `Palavra mais longa: ${word} (${word.length} letras)`,
  recordMaxLevelCaption: (level) => `Nível máximo alcançado: ${level}`,
  whatIsTitle: "O que é o Viborealo?",
  whatIsBody: "Viborealo é a cobrinha clássica, mas em vez de pontinhos você come letras que aparecem no tabuleiro. Cada letra que você come se junta ao corpo da cobra. Quando o corpo forma uma palavra, aperte o botão de detectar e essa palavra desaparece do corpo (ele encolhe) e você ganha pontos.",
  howToPlayTitle: "Como jogar?",
  howToPlayBody: "Mova-se com os botões abaixo ou deslizando o dedo pelo tabuleiro. Coma as letras para que se juntem ao corpo da cobra, na ordem em que você as come. Quando achar que o corpo formou uma palavra, aperte \"Detectar palavra\": se houver uma palavra válida no dicionário, ela é removida do corpo (ele encolhe) e você ganha pontos — se houver mais de uma possível, a mais longa é escolhida. Você perde se colidir consigo mesma ou com a borda do tabuleiro.",

  scoreLabel: "Pontos",
  lengthLabel: "Tamanho",
  levelLabel: "Nível",
  levelGoalLabel: (current, total) => `Objetivo: ${current}/${total} palavras`,
  levelUpTitle: (level) => `Nível ${level}!`,
  levelReachedLabel: (level) => `Nível alcançado: ${level}`,
  wordsListTitle: "Palavras formadas",
  wordsListEmpty: "Coma letras e aperte \"Detectar palavra\"",
  detectWordButton: "Detectar palavra",
  errorNoWordFound: "Não há nenhuma palavra válida no corpo.",
  gameOverTitle: "Você colidiu!",
  gameOverBody: (score) => `Você terminou com ${score} pontos.`,
  playAgainButton: "Jogar de novo",
  backToHomeButton: "Voltar ao início",
};

export const translations: Record<SupportedLanguage, Translation> = { es, en, pt };

export const availableLanguages: Array<{ code: SupportedLanguage; name: string; flag: string }> = [
  { code: "es", name: "Español", flag: "🇦🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];
