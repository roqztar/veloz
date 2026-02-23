/**
 * Text Cleaning Pipeline für Spritz Reader
 * Bereinigt Text vor dem RSVP-Display
 */

export interface CleanOptions {
  /** URLs durch [Link] ersetzen */
  cleanUrls: boolean;
  /** Klammerninhalt ausgrauen/markieren */
  handleParentheses: 'keep' | 'dim' | 'remove' | 'shorten';
  /** Zahlen formatieren (Tausender-Trenner entfernen) */
  cleanNumbers: boolean;
  /** Markdown/HTML-Tags entfernen */
  cleanMarkup: boolean;
  /** Abkürzungen expandieren */
  expandAbbreviations: boolean;
  /** PDF/Linebreaks korrigieren */
  fixLineBreaks: boolean;
  /** Sonderzeichen filtern */
  cleanSpecialChars: boolean;
}

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  cleanUrls: true,
  handleParentheses: 'dim',
  cleanNumbers: true,
  cleanMarkup: true,
  expandAbbreviations: false,
  fixLineBreaks: true,
  cleanSpecialChars: true,
};

/** Wort mit Metadaten für Smart Display */
export interface DisplayWord {
  text: string;
  originalText: string;
  type: 'normal' | 'url' | 'number' | 'parenthetical' | 'code' | 'abbreviation' | 'heading';
  delayMultiplier: number;
  isGhost?: boolean;
}

// Abkürzungen Lookup
const ABBREVIATIONS: Record<string, string> = {
  // Deutsch
  'z.B.': 'zum Beispiel',
  'z.b.': 'zum Beispiel',
  'u.a.': 'unter anderem',
  'usw.': 'und so weiter',
  'etc.': 'et cetera',
  'vgl.': 'vergleiche',
  'siehe': 'siehe',
  'S.': 'Seite',
  'Bd.': 'Band',
  'Nr.': 'Nummer',
  'Abb.': 'Abbildung',
  'Tab.': 'Tabelle',
  'Kap.': 'Kapitel',
  'Abs.': 'Absatz',
  'Art.': 'Artikel',
  'bzw.': 'beziehungsweise',
  'd.h.': 'das heißt',
  'D.h.': 'Das heißt',
  'i.d.R.': 'in der Regel',
  'i.A.': 'im Allgemeinen',
  'm.E.': 'meines Erachtens',
  'o.g.': 'oben genannte',
  's.o.': 'siehe oben',
  's.u.': 'siehe unten',
  // Englisch
  'e.g.': 'for example',
  'i.e.': 'that is',
  'etc': 'et cetera',
  'vs.': 'versus',
  'vs': 'versus',
  'Dr.': 'Doctor',
  'Prof.': 'Professor',
  'Mr.': 'Mister',
  'Mrs.': 'Misses',
  'Ms.': 'Miss',
  'Inc.': 'Incorporated',
  'Ltd.': 'Limited',
  'Corp.': 'Corporation',
  'No.': 'Number',
  'pp.': 'pages',
  'p.': 'page',
  'ch.': 'chapter',
  'Ch.': 'Chapter',
  'vol.': 'volume',
  'Vol.': 'Volume',
  'ed.': 'edition',
  'Ed.': 'Edition',
  'et al.': 'et alii',
  'cf.': 'confer',
};

/**
 * Erkennt ob Text Code enthält
 */
export function detectCode(text: string): boolean {
  const codePatterns = [
    /```[\s\S]*?```/,
    /`[^`]+`/,
    /^(\s{2,}|\t+)/m,
    /\b(function|const|let|var|if|else|for|while|return|import|export|class|interface|type)\b/,
    /[{};]\s*$/m,
    /\b(\w+)\s*\([^)]*\)\s*[{;]/,
  ];
  
  return codePatterns.some(pattern => pattern.test(text));
}

/**
 * Bereinigt URLs
 */
function cleanUrls(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>)"'`\]]+/g, '[Link]')
    .replace(/www\.[^\s<>)"'`\]]+/g, '[Link]');
}

/**
 * Extrahiert Domain aus URL für Kurzform
 */
export function shortenUrl(url: string): string {
  try {
    const match = url.match(/https?:\/\/([^\/]+)/);
    if (match) {
      return match[1].replace(/^www\./, '');
    }
  } catch {
    // ignore
  }
  return '[Link]';
}

/**
 * Bereinigt Zahlen
 */
function cleanNumbers(text: string): string {
  return text.replace(/(\d)\.(\d{3})/g, '$1$2');
}

/**
 * Bereinigt Markdown und HTML
 */
function cleanMarkup(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, ' - ');
}

/**
 * Korrigiert PDF/Linebreaks
 * Leerzeilen werden entfernt, keine Marker
 */
function fixLineBreaks(text: string): string {
  return text
    .replace(/([a-zäöüß,;])\n+([A-ZÄÖÜ])/g, '$1 $2')
    .replace(/\n\s*\n/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Bereinigt Sonderzeichen
 */
function cleanSpecialChars(text: string): string {
  return text.replace(/[*#^~|[\]]/g, '');
}

/**
 * Expandiert Abkürzungen
 */
function expandAbbreviations(text: string): string {
  let result = text;
  for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr.replace(/\./g, '\\.')}`, 'g');
    result = result.replace(regex, expansion);
  }
  return result;
}

/**
 * Markiert Klammern-Inhalt
 */
function markParentheses(text: string, mode: CleanOptions['handleParentheses']): string {
  if (mode === 'keep') return text;
  if (mode === 'remove') {
    return text.replace(/\([^)]*\)/g, '');
  }
  if (mode === 'shorten') {
    return text.replace(/\([^)]{10,}\)/g, '(...)');
  }
  return text.replace(/(\([^)]*\))/g, '\uFFF9$1\uFFFB');
}

/**
 * Haupt-Cleaning-Funktion
 */
export function cleanText(text: string, options: Partial<CleanOptions> = {}): string {
  const opts = { ...DEFAULT_CLEAN_OPTIONS, ...options };
  
  let cleaned = text;
  
  if (opts.fixLineBreaks) {
    cleaned = fixLineBreaks(cleaned);
  }
  
  if (opts.handleParentheses !== 'keep') {
    cleaned = markParentheses(cleaned, opts.handleParentheses);
  }
  
  if (opts.cleanMarkup) {
    cleaned = cleanMarkup(cleaned);
  }
  
  if (opts.cleanUrls) {
    cleaned = cleanUrls(cleaned);
  }
  
  if (opts.cleanNumbers) {
    cleaned = cleanNumbers(cleaned);
  }
  
  if (opts.expandAbbreviations) {
    cleaned = expandAbbreviations(cleaned);
  }
  
  if (opts.cleanSpecialChars) {
    cleaned = cleanSpecialChars(cleaned);
  }
  
  return cleaned.trim();
}

/**
 * Erkennt ob ein Wort eine Überschrift sein könnte (Titel-Case am Absatzanfang)
 */
function isHeadingWord(word: string, index: number, allWords: string[]): boolean {
  if (index === 0) return true; // Erstes Wort im Text
  
  // Prüfe ob vorheriger Satz mit Satzzeichen endet (dann ist es Absatzanfang)
  const prevWords = allWords.slice(0, index);
  const lastPrevWord = prevWords[prevWords.length - 1];
  
  // Wenn vorheriges Wort mit .!? endet UND aktuelles Wort ist Title-Case
  if (lastPrevWord && /[.!?]$/.test(lastPrevWord)) {
    // Prüfe ob aktuelles Wort Title-Case ist (erster Buchstabe groß, Rest klein oder spezielle Fälle)
    const isTitleCase = /^[A-ZÄÖÜ][a-zäöüß]*$/.test(word) || /^[A-ZÄÖÜ\s]+$/.test(word);
    return isTitleCase;
  }
  
  return false;
}

/**
 * Parst Text in DisplayWords mit Metadaten
 */
export function parseToDisplayWords(text: string, options: Partial<CleanOptions> = {}): DisplayWord[] {
  const opts = { ...DEFAULT_CLEAN_OPTIONS, ...options };
  
  // Erhalte Original-Text mit Zeilenumbrüchen für Absatz-Erkennung
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  let allWords: DisplayWord[] = [];
  
  for (let p = 0; p < paragraphs.length; p++) {
    const para = paragraphs[p];
    const cleaned = cleanText(para, opts);
    const rawWords = cleaned.split(/\s+/).filter(w => w.length > 0);
    
    for (let i = 0; i < rawWords.length; i++) {
      const word = rawWords[i];
      const original = word;
      let display = word;
      let type: DisplayWord['type'] = 'normal';
      let delayMultiplier = 1;
      
      // Prüfe ob letztes Wort im Absatz (außer letzter Absatz)
      const isLastWordInParagraph = (i === rawWords.length - 1) && (p < paragraphs.length - 1);
      
      // Prüfe auf Parentheses-Marker
      if (display.includes('\uFFF9') || display.includes('\uFFFB')) {
        display = display.replace(/[\uFFF9\uFFFB]/g, '');
        type = 'parenthetical';
        delayMultiplier = 0.5;
      }
      
      // Prüfe auf URL
      if (display === '[Link]' || /^https?:/.test(display)) {
        type = 'url';
        delayMultiplier = 3;
      }
      
      // Prüfe auf Zahl
      if (/^-?\d+([.,]\d+)?$/.test(display.replace(/[.,]/g, ''))) {
        type = 'number';
        delayMultiplier = 2.5;
      }
      
      // Prüfe auf Code
      if (/`[^`]+`/.test(original) || /^[{}[\];<>/=]+$/.test(display)) {
        type = 'code';
        delayMultiplier = 1.5;
      }
      
      // Prüfe auf Abkürzung
      if (ABBREVIATIONS[display]) {
        type = 'abbreviation';
        delayMultiplier = 1.2;
      }
      
      // Prüfe auf Überschrift (Titel am Absatzanfang)
      if (isHeadingWord(display, i, rawWords)) {
        type = 'heading';
        delayMultiplier = Math.max(delayMultiplier, 2.0);
      }
      
      // Letztes Wort im Absatz bekommt extra Pause
      if (isLastWordInParagraph) {
        delayMultiplier *= 1.5; // +50% Pause vor Absatzwechsel
      }
      
      // Lange Wörter
      const cleanLength = display.replace(/[^\w]/g, '').length;
      if (cleanLength > 12) {
        delayMultiplier *= 1.6;
      } else if (cleanLength > 9) {
        delayMultiplier *= 1.4;
      } else if (cleanLength > 6) {
        delayMultiplier *= 1.2;
      }
      
      // Satzzeichen-Pausen
      if (/[.!?]+$/.test(display)) {
        delayMultiplier += 1.0;
      } else if (display.includes(',')) {
        delayMultiplier += 0.2;
      } else if (/[;:]$/.test(display)) {
        delayMultiplier += 0.3;
      }
      
      allWords.push({
        text: display,
        originalText: original,
        type,
        delayMultiplier,
      });
    }
  }
  
  return allWords;
}

/**
 * Berechnet Delay für ein DisplayWord
 */
export function calculateSmartDelay(word: DisplayWord, baseDelay: number): number {
  return baseDelay * word.delayMultiplier;
}

/**
 * Erstellt Ghost-Wörter für Kontext-Buffer
 */
export function createContextBuffer(
  words: DisplayWord[],
  currentIndex: number,
  contextSize: number = 1
): { prev: DisplayWord[]; next: DisplayWord[] } {
  const prev: DisplayWord[] = [];
  const next: DisplayWord[] = [];
  
  for (let i = 1; i <= contextSize; i++) {
    const prevIndex = currentIndex - i;
    const nextIndex = currentIndex + i;
    
    if (prevIndex >= 0) {
      prev.unshift({ ...words[prevIndex], isGhost: true });
    }
    if (nextIndex < words.length) {
      next.push({ ...words[nextIndex], isGhost: true });
    }
  }
  
  return { prev, next };
}

/**
 * Erkennt Code-Blöcke und markiert sie
 */
export function detectCodeBlocks(text: string): Array<{ type: 'text' | 'code'; content: string }> {
  const blocks: Array<{ type: 'text' | 'code'; content: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    
    blocks.push({
      type: 'code',
      content: match[2].trim(),
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    blocks.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }
  
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: text });
  }
  
  return blocks;
}

/**
 * Formatiert Zeit in Minuten:Sekunden
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Berechnet die geschätzte Zeit für normales Lesen (250 WPM)
 */
export function calculateNormalReadingTime(wordCount: number): number {
  return (wordCount / 250) * 60;
}

/**
 * Berechnet die Zeitersparnis
 */
export function calculateTimeSaved(wordCount: number, spritzWPM: number): number {
  const normalTime = calculateNormalReadingTime(wordCount);
  const spritzTime = (wordCount / spritzWPM) * 60;
  return Math.max(0, normalTime - spritzTime);
}
