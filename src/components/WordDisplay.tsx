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

      // Calculate base font size to fit longest word
      const availableWidth = containerWidth * (mobile ? 0.9 : 0.8);
      const charWidthRatio = mobile ? 0.65 : 0.6;
      const baseSize = Math.floor(availableWidth / (maxLength * charWidthRatio));

      // Apply font size level (-5 to +5 levels)
      const levelMultiplier = 1.0 + (fontSizeLevel * 0.15);
      const adjustedSize = Math.floor(baseSize * levelMultiplier);

      // Clamp to reasonable range
      const minSize = mobile ? 24 : 32;
      const maxSize = mobile ? 80 : 120;
      
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

  // Calculate ORP position
  const orpIndex = Math.min(
    currentWord.text.length <= 1 ? 0 :
    currentWord.text.length <= 5 ? 1 :
    currentWord.text.length <= 9 ? 2 : 3,
    currentWord.text.length - 1
  );
  
  const before = currentWord.text.slice(0, orpIndex);
  const orp = currentWord.text[orpIndex] || '';
  const after = currentWord.text.slice(orpIndex + 1);
  
  // Word color based on type
  const getWordColor = (type: DisplayWord['type']): string => {
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

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center h-32 md:h-48 ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-32 h-32 md:w-48 md:h-48 rounded-full blur-3xl"
          style={{ backgroundColor: neonColorGlow }}
        />
      </div>
      
      {/* Word display - simple inline layout */}
      <div 
        className={`relative z-10 whitespace-nowrap animate-in zoom-in-95 duration-75 ${fontFamilyClass} ${fontWeightClass}`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
      >
        {/* Full word with ORP highlighted */}
        {before && (
          <span className={wordColor}>
            {before}
          </span>
        )}
        
        {/* ORP - highlighted */}
        <span 
          className="inline-block font-black px-1.5 py-0.5 mx-0.5"
          style={{ 
            color: '#000000',
            backgroundColor: neonColor,
            textShadow: 'none',
            boxShadow: `0 0 ${isMobile ? '20px' : '40px'} ${neonColor}, 0 0 ${isMobile ? '40px' : '80px'} ${neonColorGlow}`,
            borderRadius: '4px',
          }}
        >
          {orp}
        </span>
        
        {/* After ORP */}
        {after && (
          <span className={wordColor}>
            {after}
          </span>
        )}
      </div>
    </div>
  );
}
