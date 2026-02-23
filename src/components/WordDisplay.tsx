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
    if (words.length === 0 || !containerRef.current) {
      setFontSize(64); // Default size when no container
      return;
    }

    const calculateFontSize = () => {
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      if (containerWidth === 0) return 64;
      
      // Find longest word (fallback to empty string if no words)
      const longestWord = words.reduce((max, word) => {
        if (!word) return max;
        const cleanWord = word.replace(/[^\w\säöüÄÖÜß]/g, '');
        return cleanWord.length > max.length ? cleanWord : max;
      }, '');

      const maxLength = longestWord.length;
      // If no words or very short words, use a reasonable default
      if (maxLength === 0) return 72;

      // Calculate available space - be more generous
      // The word display area is the full container width
      const availableWidth = containerWidth * 0.9; // 90% of container
      
      // Side padding for ORP alignment (each side)
      // This scales with font size, so we use a percentage-based approach
      const sidePaddingRatio = 0.35; // 35% each side for ORP centering
      const effectiveWidth = availableWidth * (1 - sidePaddingRatio * 2);

      // Estimate: average char is ~0.55em wide for monospace/sans-serif
      const charWidthRatio = 0.55;
      const baseSize = Math.floor(effectiveWidth / (maxLength * charWidthRatio));

      // Apply font size level (-5 to +5 levels)
      // Level 0 = 100% base calculation
      // Each step = 15% change
      const levelMultiplier = 1.0 + (fontSizeLevel * 0.15);
      const adjustedSize = Math.floor(baseSize * levelMultiplier);

      // Clamp between reasonable min and max
      // Min: 24px (readable), Max: 150px (not too huge)
      const finalSize = Math.max(24, Math.min(150, adjustedSize));
      
      return finalSize;
    };

    // Small delay to ensure container has correct dimensions
    const timeoutId = setTimeout(() => {
      setFontSize(calculateFontSize());
    }, 50);

    const handleResize = () => {
      setFontSize(calculateFontSize());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
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
  
  // Dynamic side padding based on font size - ensures ORP stays centered
  // Scale padding with font size but keep minimum for short words
  const sidePadding = Math.max(120, fontSize * 2.2);

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
