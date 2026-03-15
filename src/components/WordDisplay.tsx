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
  showGlow?: boolean;
  className?: string;
}

export function WordDisplay({ 
  currentWord,
  words,
  prevWords = [],
  nextWords = [],
  isDarkMode: _isDarkMode,
  fontFamily = 'mono',
  fontWeight = 'bold',
  fontSizeLevel = 0,
  orpColor: _orpColor,
  neonColor = '#00ffff',
  neonColorGlow = 'rgba(0, 255, 255, 0.5)',
  showGlow = false,
  className = '' 
}: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(64);
  const [isMobile, setIsMobile] = useState(false);
  const [showNavBuffer, setShowNavBuffer] = useState(false);

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

      // Apply font size level (-5 to +5 levels) - 20% per level for more noticeable changes
      const levelMultiplier = 1.0 + (fontSizeLevel * 0.20);
      const adjustedSize = Math.floor(baseSize * levelMultiplier);

      // Clamp to reasonable range - increased max for larger font sizes
      const minSize = mobile ? 20 : 28;
      const maxSize = mobile ? 120 : 180;
      
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

  // Calculate side padding for ORP centering - based on max word length for stability
  const maxWordLength = Math.max(3, ...words.map(w => w?.length || 0));
  const charWidth = fontSize * 0.6;
  const sidePadding = Math.max(charWidth * 3, (maxWordLength * charWidth) / 2);

  return (
    <div 
      ref={containerRef} 
      className={`relative flex items-center justify-center h-32 md:h-48 ${className}`}
      onClick={() => setShowNavBuffer(!showNavBuffer)}
    >
      {/* Click hint */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-mono opacity-50 pointer-events-none">
        [CLICK FOR NAV_BUFFER]
      </div>
      
      {/* Optional background glow */}
      {showGlow && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="w-32 h-32 md:w-48 md:h-48 rounded-full blur-3xl"
            style={{ backgroundColor: neonColorGlow }}
          />
        </div>
      )}
      
      {/* NAV_Buffer - Previous words */}
      {showNavBuffer && prevWords.length > 0 && (
        <div 
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 animate-in fade-in duration-200"
          style={{ maxWidth: '30%' }}
        >
          <div className="text-[10px] text-slate-500 font-mono mb-1">// PREV</div>
          {prevWords.map((word, i) => (
            <span 
              key={`prev-${i}`}
              className="text-sm md:text-base text-slate-400 font-mono truncate"
              style={{ opacity: 0.6 - (i * 0.15) }}
            >
              {word.text}
            </span>
          ))}
        </div>
      )}
      
      {/* Word display with fixed positioning for ORP centering */}
      <div 
        className={`flex items-baseline animate-in zoom-in-95 duration-75 ${fontFamilyClass} ${fontWeightClass} cursor-pointer hover:opacity-90 transition-opacity`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
      >
        {/* Before ORP - fixed width for stability */}
        <span 
          className={`text-right whitespace-pre ${wordColor}`}
          style={{ 
            width: `${sidePadding}px`,
            minWidth: `${sidePadding}px`,
          }}
        >
          {before}
        </span>
        
        {/* ORP - subtle highlight */}
        <span 
          className="relative font-bold px-1 py-0.5 mx-0.5"
          style={{ 
            color: '#000000',
            backgroundColor: neonColor,
            textShadow: 'none',
            boxShadow: `0 0 ${isMobile ? '8px' : '15px'} ${neonColor}`,
            borderRadius: '3px',
          }}
        >
          {orp}
        </span>
        
        {/* After ORP - fixed width for stability */}
        <span 
          className={`text-left whitespace-pre ${wordColor}`}
          style={{ 
            width: `${sidePadding}px`,
            minWidth: `${sidePadding}px`,
          }}
        >
          {after}
        </span>
      </div>
      
      {/* NAV_Buffer - Next words */}
      {showNavBuffer && nextWords.length > 0 && (
        <div 
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-start gap-1 animate-in fade-in duration-200"
          style={{ maxWidth: '30%' }}
        >
          <div className="text-[10px] text-slate-500 font-mono mb-1">// NEXT</div>
          {nextWords.map((word, i) => (
            <span 
              key={`next-${i}`}
              className="text-sm md:text-base text-slate-400 font-mono truncate"
              style={{ opacity: 0.6 - (i * 0.15) }}
            >
              {word.text}
            </span>
          ))}
        </div>
      )}
      
      {/* Slow subtle scanline animation */}
      <style>{`
        @keyframes scanline {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 0.3; }
          80% { opacity: 0.3; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
