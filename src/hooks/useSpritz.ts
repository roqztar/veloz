import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  parseToDisplayWords, 
  calculateSmartDelay, 
  createContextBuffer,
  detectCodeBlocks,
  DEFAULT_CLEAN_OPTIONS,
  type CleanOptions,
  type DisplayWord,
} from '../core/textCleaner';

interface UseSpritzOptions {
  initialWPM?: number;
  initialText?: string;
  cleanOptions?: Partial<CleanOptions>;
  enableContextBuffer?: boolean;
  contextBufferSize?: number;
  skipCodeBlocks?: boolean;
}

interface UseSpritzReturn {
  words: DisplayWord[];
  currentIndex: number;
  currentWord: DisplayWord;
  contextBuffer: { prev: DisplayWord[]; next: DisplayWord[] };
  isPlaying: boolean;
  wpm: number;
  progress: number;
  rawText: string;
  cleanOptions: CleanOptions;
  hasCodeBlocks: boolean;
  setWPM: (wpm: number) => void;
  setText: (text: string) => void;
  setCleanOptions: (options: Partial<CleanOptions>) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  reset: () => void;
}

export function useSpritz({ 
  initialWPM = 300, 
  initialText = '',
  cleanOptions: initialCleanOptions = {},
  enableContextBuffer = true,
  contextBufferSize = 1,
  skipCodeBlocks = false,
}: UseSpritzOptions = {}): UseSpritzReturn {
  const [rawText, setRawText] = useState(initialText);
  const [cleanOptions, setCleanOptionsState] = useState<CleanOptions>({
    ...DEFAULT_CLEAN_OPTIONS,
    ...initialCleanOptions,
  });
  
  // Parse text mit Cleaning Pipeline
  const words = useMemo(() => {
    if (!rawText.trim()) return [];
    
    // Erkenne Code-Blöcke
    const blocks = detectCodeBlocks(rawText);
    let allWords: DisplayWord[] = [];
    
    for (const block of blocks) {
      if (block.type === 'code' && skipCodeBlocks) {
        // Füge Marker für übersprungenen Code-Block hinzu
        allWords.push({
          text: '[Code-Block]',
          originalText: block.content.slice(0, 50) + '...',
          type: 'code',
          delayMultiplier: 2,
        });
      } else {
        const blockWords = parseToDisplayWords(block.content, cleanOptions);
        allWords.push(...blockWords);
      }
    }
    
    return allWords;
  }, [rawText, cleanOptions, skipCodeBlocks]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWPMState] = useState(initialWPM);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const currentWord = words[currentIndex] || { 
    text: '', 
    originalText: '', 
    type: 'normal' as const, 
    delayMultiplier: 1 
  };
  
  // Kontext-Buffer berechnen
  const contextBuffer = useMemo(() => {
    if (!enableContextBuffer) return { prev: [], next: [] };
    return createContextBuffer(words, currentIndex, contextBufferSize);
  }, [words, currentIndex, enableContextBuffer, contextBufferSize]);
  
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;
  const hasCodeBlocks = useMemo(() => {
    return detectCodeBlocks(rawText).some(b => b.type === 'code');
  }, [rawText]);
  
  // Berechne Basis-Verzögerung in Millisekunden aus WPM
  const getBaseDelay = useCallback(() => {
    return (60 / wpm) * 1000;
  }, [wpm]);
  
  // Stoppe den aktuellen Timer
  const stopTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // Pausiere die Wiedergabe (muss vor next/prev/goTo definiert werden)
  const pause = useCallback(() => {
    setIsPlaying(false);
    stopTimer();
  }, [stopTimer]);
  
  // Gehe zum nächsten Wort (pausiert automatisch)
  const next = useCallback(() => {
    pause();
    setCurrentIndex(prev => {
      if (prev < words.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [words.length, pause]);
  
  // Gehe zum vorherigen Wort (pausiert automatisch)
  const prev = useCallback(() => {
    pause();
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, [pause]);
  
  // Springe zu einem bestimmten Index (pausiert automatisch)
  const goTo = useCallback((index: number) => {
    pause();
    setCurrentIndex(Math.max(0, Math.min(words.length - 1, index)));
  }, [words.length, pause]);
  
  // Starte die Wiedergabe
  const play = useCallback(() => {
    if (currentIndex >= words.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  }, [currentIndex, words.length]);
  
  // Toggle Play/Pause
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);
  
  // Setze neuen Text
  const setText = useCallback((text: string) => {
    stopTimer();
    setRawText(text);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [stopTimer]);
  
  // Setze Clean Options
  const setCleanOptions = useCallback((options: Partial<CleanOptions>) => {
    setCleanOptionsState(prev => ({ ...prev, ...options }));
  }, []);
  
  // Setze WPM - erlaubt 50-1000 WPM (50 für sehr langsames Lesen mit Voice)
  const updateWPM = useCallback((newWPM: number) => {
    setWPMState(Math.max(50, Math.min(1000, newWPM)));
  }, []);
  
  // Reset
  const reset = useCallback(() => {
    stopTimer();
    setRawText('');
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [stopTimer]);
  
  // Haupt-Loop für die Wort-Anzeige (mit Smart Delay)
  useEffect(() => {
    if (!isPlaying) return;
    if (currentIndex >= words.length) {
      setIsPlaying(false);
      return;
    }
    
    const baseDelay = getBaseDelay();
    const word = words[currentIndex];
    const delay = calculateSmartDelay(word, baseDelay);
    
    timeoutRef.current = setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentIndex, words, getBaseDelay]);
  
  // Cleanup bei Unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);
  
  return {
    words,
    currentIndex,
    currentWord,
    contextBuffer,
    isPlaying,
    wpm,
    progress,
    rawText,
    cleanOptions,
    hasCodeBlocks,
    setWPM: updateWPM,
    setText,
    setCleanOptions,
    play,
    pause,
    toggle,
    next,
    prev,
    goTo,
    reset,
  };
}
