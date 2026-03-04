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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and calculate font size
  useEffect(() => {
    if (words.length === 0 || !containerRef.current) {
      setFontSize(64);
      return;
    }

    const calculateFontSize = () => {
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const containerHeight = containerRef.current?.offsetHeight || window.innerHeight;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerWidth === 0) return mobile ? 48 : 64;
      
      // Find longest word
      const longestWord = words.reduce((max, word) => {
        if (!word) return max;
        const cleanWord = word.replace(/[^\w\säöüÄÖÜß]/g, '');
        return cleanWord.length > max.length ? cleanWord : max;
      }, '');

      const maxLength = longestWord.length;
      if (maxLength === 0) return mobile ? 56 : 72;

      // Mobile: use more available width, less padding
      const availableWidth = containerWidth * (mobile ? 0.95 : 0.9);
      const sidePaddingRatio = mobile ? 0.25 : 0.35;
      const effectiveWidth = availableWidth * (1 - sidePaddingRatio * 2);

      // Mobile: slightly larger char width ratio for readability
      const charWidthRatio = mobile ? 0.6 : 0.55;
      const baseSize = Math.floor(effectiveWidth / (maxLength * charWidthRatio));

      // Apply font size level (-5 to +5 levels)
      const levelMultiplier = 1.0 + (fontSizeLevel * 0.15);
      const adjustedSize = Math.floor(baseSize * levelMultiplier);

      // Mobile: smaller min/max, but ensure readability
      const minSize = mobile ? 20 : 24;
      const maxSize = mobile ? Math.min(containerHeight * 0.25, 100) : 150;
      
      return Math.max(minSize, Math.min(maxSize, adjustedSize));
    };

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
        <span className="text-slate-500 text-xl md:text-2xl animate-pulse">Bereit...</span>
      </div>
    );
  }

  // Calculate ORP - adjusted for mobile
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
  
  const fontFamilyClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  }[fontFamily];

  const fontWeightClass = {
    light: 'font-light',
    normal: 'font-normal',
    bold: 'font-bold'
  }[fontWeight];
  
  // Responsive side padding - smaller on mobile
  const sidePadding = isMobile 
    ? Math.max(60, fontSize * 1.5)
    : Math.max(120, fontSize * 2.2);

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center h-32 md:h-48 ${className}`}>
      {/* Glow effect - smaller on mobile */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-red-500/10 rounded-full blur-3xl" />
      </div>
      
      <div 
        className={`flex items-baseline tracking-tight animate-in zoom-in-95 duration-75 ${fontFamilyClass} ${fontWeightClass}`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
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
