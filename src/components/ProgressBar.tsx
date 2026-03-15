import { useState, useRef, useCallback } from 'react';

interface ProgressBarProps {
  progress: number;
  currentIndex: number;
  totalWords: number;
  words: string[];
  onSeek: (index: number) => void;
  isDarkMode?: boolean;
  neonColor?: string;
  className?: string;
}

export function ProgressBar({ 
  progress, 
  currentIndex,
  totalWords,
  words,
  onSeek,
  isDarkMode = true, 
  neonColor = '#00ffff', 
  className = '' 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  
  const calculateIndexFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return Math.floor(percentage * (totalWords - 1));
  }, [totalWords]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const index = calculateIndexFromPosition(e.clientX);
    onSeek(index);
  }, [calculateIndexFromPosition, onSeek]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setTooltipPosition(percentage * 100);
    
    const index = Math.floor(percentage * (totalWords - 1));
    setHoverIndex(index);
    
    if (isDragging) {
      onSeek(index);
    }
  }, [calculateIndexFromPosition, isDragging, onSeek, totalWords]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoverIndex(null);
  }, []);
  
  const previewWord = hoverIndex !== null && words[hoverIndex] 
    ? words[hoverIndex].substring(0, 20) + (words[hoverIndex].length > 20 ? '...' : '')
    : '';
  
  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className={`w-full h-3 cursor-pointer relative ${isDarkMode ? 'bg-slate-800' : 'bg-black/10'} ${className}`}
        style={{ 
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(0,0,0,0.1)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Progress Fill */}
        <div 
          className="h-full transition-all duration-150 ease-out absolute left-0 top-0"
          style={{ 
            width: `${clampedProgress}%`,
            backgroundColor: neonColor,
            boxShadow: `0 0 10px ${neonColor}, 0 0 20px ${neonColor}`
          }}
        />
        
        {/* Hover Position Indicator */}
        {hoverIndex !== null && !isDragging && (
          <div 
            className="absolute top-0 h-full w-0.5 bg-white/50 pointer-events-none"
            style={{ left: `${tooltipPosition}%` }}
          />
        )}
        
        {/* Draggable Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-6 rounded-sm cursor-grab active:cursor-grabbing transition-transform hover:scale-110"
          style={{ 
            left: `calc(${clampedProgress}% - 8px)`,
            backgroundColor: neonColor,
            boxShadow: `0 0 15px ${neonColor}, 0 0 30px ${neonColor}`
          }}
        />
      </div>
      
      {/* Word Preview Tooltip */}
      {hoverIndex !== null && previewWord && (
        <div 
          className="absolute bottom-full mb-2 px-3 py-2 rounded-lg text-sm font-mono pointer-events-none z-50"
          style={{
            left: `${tooltipPosition}%`,
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: `1px solid ${neonColor}`,
            boxShadow: `0 0 20px ${neonColor}40`,
            color: neonColor,
            textShadow: `0 0 5px ${neonColor}`
          }}
        >
          {/* Speech bubble pointer */}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${neonColor}`
            }}
          />
          <span className="text-xs text-slate-400 block mb-1">{hoverIndex + 1} / {totalWords}</span>
          <span className="font-bold">{previewWord}</span>
        </div>
      )}
    </div>
  );
}
