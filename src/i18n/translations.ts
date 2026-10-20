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
  removeAdsButton: string;
  removeAdsButtonBuying: string;
  whatIsTitle: string;
  whatIsBody: string;
  howToPlayTitle: string;
  howToPlayBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];

  // Game
  scoreLabel: string;
  lengthLabel: string;
  levelLabel: string;
  levelGoalLabel: (current: number, total: number) => string;
  levelUpTitle: (level: number) => string;
  levelReachedLabel: (level: number) => string;
  wordsListTitle: string;
  wordsListEmpty: string;
  shareResultText: (level: number, score: number) => string;
  sharePointsLabel: (score: number) => string;
  shareRecordText: (score: number) => string;
  detectWordButton: string;
  errorNoWordFound: string;
  gameOverTitle: string;
  gameOverBody: (score: number) => string;
  playAgainButton: string;
  backToHomeButton: string;
  rewardedAdButton: string;
  rewardedAdHint: string;
  rewardedAdConfirmButton: string;
  rewardedAdSkipButton: string;
  rewardedAdWaitLabel: (seconds: number) => string;
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
  removeAdsButton: "Sacar los anuncios",
  removeAdsButtonBuying: "Redirigiendo a MercadoPago...",
  whatIsTitle: "¿Qué es Viborealo?",
  whatIsBody: "Viborealo es la viborita clásica, pero en vez de puntitos comés letras que van apareciendo en el tablero. Cada letra que comés se suma al cuerpo de la víbora. Cuando el cuerpo forma una palabra, apretás el botón de detectar y esa palabra desaparece del cuerpo (se achica) y sumás puntos.",
  howToPlayTitle: "¿Cómo jugar?",
  howToPlayBody: "Movete con los botones de abajo o deslizando el dedo sobre el tablero. Comé las letras para que se sumen al cuerpo de la víbora, en el orden en que las vas comiendo. Cuando creas que el cuerpo formó una palabra, apretá \"Detectar palabra\": si hay una palabra válida en el diccionario, se elimina del cuerpo (se achica) y sumás puntos — si hay más de una posible, se elige la más larga. Perdés si chocás contra vos misma o contra el borde del tablero.",
  faqTitle: "Preguntas frecuentes",
  faq: [
    { q: "¿Viborealo es gratis?", a: "Sí, jugar a Viborealo es completamente gratis. La app se sostiene con publicidad, nunca vas a tener que pagar para jugar." },
    { q: "¿Necesito crear una cuenta?", a: "No. Tu récord y tu progreso se guardan en este dispositivo automáticamente, no hace falta registrarse ni iniciar sesión." },
    { q: "¿Cómo subo de nivel?", a: "Cada 5 palabras que detectás subís de nivel. Al subir, aparecen más letras a la vez en el tablero (empieza en 15 y suma 5 más por nivel), así que la partida se pone más exigente de a poco." },
    { q: "¿Qué pasa si el cuerpo forma más de una palabra posible?", a: "Se detecta la más larga de todas las que sean válidas en el diccionario en ese momento." },
    { q: "¿Cuándo termina la partida?", a: "Perdés si la víbora choca contra su propio cuerpo o contra el borde del tablero. Podés jugar de nuevo las veces que quieras." },
    { q: "¿En qué idiomas puedo jugar?", a: "Viborealo está disponible en español, inglés y portugués. Podés cambiar el idioma desde el selector de la parte de abajo de esta pantalla." },
  ],

  scoreLabel: "Puntos",
  lengthLabel: "Largo",
  levelLabel: "Nivel",
  levelGoalLabel: (current, total) => `Objetivo: ${current}/${total} palabras`,
  levelUpTitle: (level) => `¡Nivel ${level}!`,
  levelReachedLabel: (level) => `Nivel alcanzado: ${level}`,
  wordsListTitle: "Palabras formadas",
  wordsListEmpty: "Comé letras y apretá \"Detectar palabra\"",
  shareResultText: (level, score) => `¡Jugué Viborealo! Llegué al nivel ${level} con ${score} puntos 🐍`,
  sharePointsLabel: (score) => `${score} puntos`,
  shareRecordText: (score) => `¡Mi récord en Viborealo es de ${score} puntos! ¿Podés superarlo? 🐍`,
  detectWordButton: "Detectar palabra",
  errorNoWordFound: "No hay ninguna palabra válida en el cuerpo.",
  gameOverTitle: "¡Chocaste!",
  gameOverBody: (score) => `Terminaste con ${score} puntos.`,
  playAgainButton: "Jugar de nuevo",
  backToHomeButton: "Volver al inicio",
  rewardedAdButton: "Ver un anuncio y seguir jugando",
  rewardedAdHint: "Se limpia el cuerpo de la víbora y seguís la partida con el mismo puntaje.",
  rewardedAdConfirmButton: "Reclamar recompensa",
  rewardedAdSkipButton: "Cerrar",
  rewardedAdWaitLabel: (seconds) => `Esperá ${seconds}s...`,
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
  removeAdsButton: "Remove ads",
  removeAdsButtonBuying: "Redirecting to MercadoPago...",
  whatIsTitle: "What is Viborealo?",
  whatIsBody: "Viborealo is classic Snake, but instead of dots you eat letters that appear on the board. Every letter you eat gets added to the snake's body. When the body spells a word, press the detect button and that word disappears from the body (it shrinks) and you score points.",
  howToPlayTitle: "How to play?",
  howToPlayBody: "Move with the buttons below or by swiping on the board. Eat letters so they're added to the snake's body, in the order you eat them. When you think the body spells a word, press \"Detect word\": if there's a valid dictionary word, it's removed from the body (it shrinks) and you score points — if there's more than one possible word, the longest one is chosen. You lose if you crash into yourself or the edge of the board.",
  faqTitle: "Frequently asked questions",
  faq: [
    { q: "Is Viborealo free?", a: "Yes, playing Viborealo is completely free. The app runs on ads, so you'll never have to pay to play." },
    { q: "Do I need to create an account?", a: "No. Your record and progress are saved automatically on this device — no sign-up or login required." },
    { q: "How do I level up?", a: "Every 5 words you detect levels you up. Each level adds more letters on the board at once (it starts at 15 and adds 5 more per level), so the game gets gradually more demanding." },
    { q: "What happens if the body spells more than one possible word?", a: "The longest valid dictionary word is the one that gets detected." },
    { q: "When does the game end?", a: "You lose if the snake crashes into its own body or into the edge of the board. You can start a new game as many times as you want." },
    { q: "What languages can I play in?", a: "Viborealo is available in Spanish, English and Portuguese. You can switch languages from the selector at the bottom of this screen." },
  ],

  scoreLabel: "Score",
  lengthLabel: "Length",
  levelLabel: "Level",
  levelGoalLabel: (current, total) => `Goal: ${current}/${total} words`,
  levelUpTitle: (level) => `Level ${level}!`,
  levelReachedLabel: (level) => `Level reached: ${level}`,
  wordsListTitle: "Words spelled",
  wordsListEmpty: "Eat letters and press \"Detect word\"",
  shareResultText: (level, score) => `I played Viborealo! Reached level ${level} with ${score} points 🐍`,
  sharePointsLabel: (score) => `${score} points`,
  shareRecordText: (score) => `My Viborealo record is ${score} points! Can you beat it? 🐍`,
  detectWordButton: "Detect word",
  errorNoWordFound: "There's no valid word in the body.",
  gameOverTitle: "You crashed!",
  gameOverBody: (score) => `You finished with ${score} points.`,
  playAgainButton: "Play again",
  backToHomeButton: "Back to home",
  rewardedAdButton: "Watch an ad to keep playing",
  rewardedAdHint: "The snake's body gets cleared and you keep playing with the same score.",
  rewardedAdConfirmButton: "Claim reward",
  rewardedAdSkipButton: "Close",
  rewardedAdWaitLabel: (seconds) => `Wait ${seconds}s...`,
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
  removeAdsButton: "Remover anúncios",
  removeAdsButtonBuying: "Redirecionando para o MercadoPago...",
  whatIsTitle: "O que é o Viborealo?",
  whatIsBody: "Viborealo é a cobrinha clássica, mas em vez de pontinhos você come letras que aparecem no tabuleiro. Cada letra que você come se junta ao corpo da cobra. Quando o corpo forma uma palavra, aperte o botão de detectar e essa palavra desaparece do corpo (ele encolhe) e você ganha pontos.",
  howToPlayTitle: "Como jogar?",
  howToPlayBody: "Mova-se com os botões abaixo ou deslizando o dedo pelo tabuleiro. Coma as letras para que se juntem ao corpo da cobra, na ordem em que você as come. Quando achar que o corpo formou uma palavra, aperte \"Detectar palavra\": se houver uma palavra válida no dicionário, ela é removida do corpo (ele encolhe) e você ganha pontos — se houver mais de uma possível, a mais longa é escolhida. Você perde se colidir consigo mesma ou com a borda do tabuleiro.",
  faqTitle: "Perguntas frequentes",
  faq: [
    { q: "O Viborealo é grátis?", a: "Sim, jogar Viborealo é totalmente grátis. O app se sustenta com publicidade, você nunca vai precisar pagar para jogar." },
    { q: "Preciso criar uma conta?", a: "Não. Seu recorde e seu progresso são salvos automaticamente neste dispositivo, não precisa se cadastrar nem fazer login." },
    { q: "Como eu subo de nível?", a: "A cada 5 palavras detectadas você sobe de nível. Cada nível adiciona mais letras ao mesmo tempo no tabuleiro (começa em 15 e soma 5 a mais por nível), então a partida vai ficando mais exigente pouco a pouco." },
    { q: "O que acontece se o corpo formar mais de uma palavra possível?", a: "É detectada a mais longa entre todas as válidas no dicionário naquele momento." },
    { q: "Quando a partida termina?", a: "Você perde se a cobra colidir com o próprio corpo ou com a borda do tabuleiro. Pode jogar de novo quantas vezes quiser." },
    { q: "Em quais idiomas posso jogar?", a: "O Viborealo está disponível em espanhol, inglês e português. Você pode trocar o idioma no seletor na parte de baixo desta tela." },
  ],

  scoreLabel: "Pontos",
  lengthLabel: "Tamanho",
  levelLabel: "Nível",
  levelGoalLabel: (current, total) => `Objetivo: ${current}/${total} palavras`,
  levelUpTitle: (level) => `Nível ${level}!`,
  levelReachedLabel: (level) => `Nível alcançado: ${level}`,
  wordsListTitle: "Palavras formadas",
  wordsListEmpty: "Coma letras e aperte \"Detectar palavra\"",
  shareResultText: (level, score) => `Joguei Viborealo! Cheguei ao nível ${level} com ${score} pontos 🐍`,
  sharePointsLabel: (score) => `${score} pontos`,
  shareRecordText: (score) => `Meu recorde no Viborealo é de ${score} pontos! Consegue superar? 🐍`,
  detectWordButton: "Detectar palavra",
  errorNoWordFound: "Não há nenhuma palavra válida no corpo.",
  gameOverTitle: "Você colidiu!",
  gameOverBody: (score) => `Você terminou com ${score} pontos.`,
  playAgainButton: "Jogar de novo",
  backToHomeButton: "Voltar ao início",
  rewardedAdButton: "Assista um anúncio e continue jogando",
  rewardedAdHint: "O corpo da cobra é limpo e você continua a partida com a mesma pontuação.",
  rewardedAdConfirmButton: "Resgatar recompensa",
  rewardedAdSkipButton: "Fechar",
  rewardedAdWaitLabel: (seconds) => `Espere ${seconds}s...`,
};

export const translations: Record<SupportedLanguage, Translation> = { es, en, pt };

export const availableLanguages: Array<{ code: SupportedLanguage; name: string; flag: string }> = [
  { code: "es", name: "Español", flag: "🇦🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];
