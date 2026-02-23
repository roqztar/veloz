/**
 * Legacy ORP utilities - jetzt in core/textCleaner.ts integriert
 * Diese Datei bleibt für Abwärtskompatibilität
 */

// Functions re-exported from core/textCleaner
export { formatTime, calculateNormalReadingTime, calculateTimeSaved } from '../core/textCleaner';

// Fallback calculateORP für direkte Verwendung
export function calculateORP(word: string): number {
  const cleanWord = word.replace(/[^\wäöüÄÖÜß]$/, '');
  const cleanLength = cleanWord.length;
  
  if (cleanLength <= 1) return 0;
  if (cleanLength <= 5) return 1;
  if (cleanLength <= 9) return 2;
  return 3;
}
