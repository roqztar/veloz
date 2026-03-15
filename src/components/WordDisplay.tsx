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
  orpColor?: string;
  neonColor?: string;
  neonColorGlow?: string;
  className?: string;
}

export function WordDisplay({ 
  currentWord,
  words,
  isDarkMode: _isDarkMode,
  fontFamily = 'mono',
  fontWeight = 'bold',
  fontSizeLevel = 0,
  orpColor: _orpColor,
  neonColor = '#00ffff',
  neonColorGlow = 'rgba(0, 255, 255, 0.5)',
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
        <span 
          className="text-xl md:text-2xl animate-pulse font-mono"
          style={{ color: neonColor, textShadow: `0 0 20px ${neonColorGlow}` }}
        >
          &gt; INITIALIZING...
        </span>
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
  
  // Cyberpunk word type colors - using the neon theme
  const getWordColor = (type: DisplayWord['type']): string => {
    switch (type) {
      case 'url':
      case 'code':
        return 'text-amber-400';
      case 'parenthetical':
        return 'text-slate-500';
      case 'number':
        return 'text-green-400';
      case 'heading':
        return 'text-white';
      default:
        return 'text-slate-200';
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
      {/* Cyberpunk glow effect using neon color */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-32 h-32 md:w-48 md:h-48 rounded-full blur-3xl"
          style={{ backgroundColor: neonColorGlow }}
        />
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
        
        {/* ORP character - INVERTED for maximum visibility */}
        <span 
          className="relative font-black px-1 mx-0.5"
          style={{ 
            color: '#000000',
            backgroundColor: neonColor,
            textShadow: 'none',
            boxShadow: `0 0 ${isMobile ? '20px' : '40px'} ${neonColor}, 0 0 ${isMobile ? '40px' : '80px'} ${neonColorGlow}`,
            borderRadius: '2px',
          }}
        >
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
