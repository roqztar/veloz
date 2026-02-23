import { useRef, useEffect, useState } from 'react';
import type { DisplayWord } from '../core/textCleaner';

interface WordDisplayProps {
  currentWord: DisplayWord;
  words: string[];
  prevWords?: DisplayWord[];
  nextWords?: DisplayWord[];
  isDarkMode?: boolean;
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontWeight?: 'normal' | 'bold' | 'light';
  fontSizeLevel?: number;
  className?: string;
}

export function WordDisplay({ 
  currentWord,
  words,
  isDarkMode = true,
  fontFamily = 'sans',
  fontWeight = 'bold',
  fontSizeLevel = 0,
  className = '' 
}: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(64);

  // Calculate dynamic font size based on longest word
  useEffect(() => {
    if (words.length === 0 || !containerRef.current) return;

    const calculateFontSize = () => {
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      
      // Find longest word
      const longestWord = words.reduce((max, word) => {
        const cleanWord = word.replace(/[^\w\säöüÄÖÜß]/g, '');
        return cleanWord.length > max.length ? cleanWord : max;
      }, '');

      const maxLength = longestWord.length;
      if (maxLength === 0) return 64;

      // Calculate available space (accounting for side containers and padding)
      const availableWidth = containerWidth * 0.75; // 75% for the word itself
      const sideContainersWidth = 600; // 300px each side at base size
      const effectiveWidth = Math.max(availableWidth - sideContainersWidth, 200);

      // Estimate: average char is ~0.6em wide
      const charWidthRatio = 0.6;
      const baseSize = Math.floor(effectiveWidth / (maxLength * charWidthRatio));

      // Apply font size level (-5 to +5 levels)
      // Level 0 = 200% (was previously +4)
      // Each step = 15%
      const levelMultiplier = 2.0 + (fontSizeLevel * 0.15);
      const adjustedSize = Math.floor(baseSize * levelMultiplier);

      // Clamp between 20px (min) and 250px (max)
      return Math.max(20, Math.min(250, adjustedSize));
    };

    setFontSize(calculateFontSize());

    const handleResize = () => {
      setFontSize(calculateFontSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [words, fontSizeLevel]);

  if (!currentWord || !currentWord.text) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center ${className}`}>
        <span className="text-slate-500 text-2xl animate-pulse">Bereit...</span>
      </div>
    );
  }

  // Calculate ORP
  const orpIndex = Math.min(
    currentWord.text.length <= 1 ? 0 :
    currentWord.text.length <= 5 ? 1 :
    currentWord.text.length <= 9 ? 2 : 3,
    currentWord.text.length - 1
  );
  
  const before = currentWord.text.slice(0, orpIndex);
  const orp = currentWord.text[orpIndex] || '';
  const after = currentWord.text.slice(orpIndex + 1);
  
  const getWordColor = (type: DisplayWord['type']): string => {
    if (isDarkMode) {
      switch (type) {
        case 'url':
        case 'code':
          return 'text-amber-300';
        case 'parenthetical':
          return 'text-slate-400';
        case 'number':
          return 'text-cyan-300';
        case 'heading':
          return 'text-white';
        default:
          return 'text-white';
      }
    } else {
      switch (type) {
        case 'url':
        case 'code':
          return 'text-amber-700';
        case 'parenthetical':
          return 'text-gray-500';
        case 'number':
          return 'text-cyan-700';
        case 'heading':
          return 'text-gray-900';
        default:
          return 'text-gray-900';
      }
    }
  };
  
  const wordColor = getWordColor(currentWord.type);
  
  // Font family classes
  const fontFamilyClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  }[fontFamily];

  // Font weight classes
  const fontWeightClass = {
    light: 'font-light',
    normal: 'font-normal',
    bold: 'font-bold'
  }[fontWeight];
  
  // Dynamic side padding based on font size
  const sidePadding = Math.max(150, fontSize * 2.5);

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center h-48 ${className}`}>
      {/* Glow effect behind the word */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
      </div>
      
      <div 
        className={`flex items-baseline tracking-tight animate-in zoom-in-95 duration-75 ${fontFamilyClass} ${fontWeightClass}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <span 
          className={`text-right overflow-visible whitespace-pre ${wordColor}`}
          style={{ 
            width: `${sidePadding}px`, 
            minWidth: `${sidePadding}px`,
          }}
        >
          {before}
        </span>
        
        <span className={`relative ${isDarkMode ? 'text-red-400 drop-shadow-[0_0_30px_rgba(248,113,113,0.5)]' : 'text-red-600'}`}>
          {orp}
        </span>
        
        <span 
          className={`text-left overflow-visible whitespace-pre ${wordColor}`}
          style={{ 
            width: `${sidePadding}px`, 
            minWidth: `${sidePadding}px`,
          }}
        >
          {after}
        </span>
      </div>
    </div>
  );
}
