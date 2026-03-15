import { useState, useRef, useCallback, useEffect } from 'react';

interface ProgressBarProps {
  progress: number;
  currentIndex: number;
  totalWords: number;
  words: string[];
  onSeek: (index: number) => void;
  onSeekStart?: () => void;
  isDarkMode?: boolean;
  neonColor?: string;
  className?: string;
}

export function ProgressBar({ 
  progress, 
  currentIndex: _currentIndex,
  totalWords,
  words,
  onSeek,
  onSeekStart,
  isDarkMode = true, 
  neonColor = '#00ffff', 
  className = '' 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const isDraggingRef = useRef(false);
  
  const calculateIndexFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return Math.floor(percentage * (totalWords - 1));
  }, [totalWords]);
  
  // Update ref when state changes
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  
  // Global mouse move/up handlers
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      setTooltipPosition(percentage * 100);
      
      const index = Math.floor(percentage * (totalWords - 1));
      setHoverIndex(index);
      onSeek(index);
    };
    
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
      }
    };
    
    // Add global listeners when dragging starts
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [isDragging, onSeek, totalWords]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    onSeekStart?.(); // Pause playback when seeking
    const index = calculateIndexFromPosition(e.clientX);
    onSeek(index);
  }, [calculateIndexFromPosition, onSeek, onSeekStart]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setTooltipPosition(percentage * 100);
    
    const index = Math.floor(percentage * (totalWords - 1));
    setHoverIndex(index);
  }, [totalWords]);
  
  const handleMouseLeave = useCallback(() => {
    if (!isDraggingRef.current) {
      setHoverIndex(null);
    }
  }, []);
  
  const previewWord = hoverIndex !== null && words[hoverIndex] 
    ? words[hoverIndex].substring(0, 20) + (words[hoverIndex].length > 20 ? '...' : '')
    : '';
  
  return (
    <div className="relative py-2">
      <div 
        ref={containerRef}
        className={`w-full h-6 cursor-pointer relative rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-black/10'} ${className}`}
        style={{ 
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(0,0,0,0.1)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Progress Fill */}
        <div 
          className="h-full transition-all duration-150 ease-out absolute left-0 top-0 rounded-full"
          style={{ 
            width: `${clampedProgress}%`,
            backgroundColor: neonColor,
            boxShadow: `0 0 8px ${neonColor}, 0 0 16px ${neonColor}60`
          }}
        />
        
        {/* Hover Position Indicator */}
        {hoverIndex !== null && !isDragging && (
          <div 
            className="absolute top-0 h-full w-1 bg-white/70 pointer-events-none rounded-full"
            style={{ left: `${tooltipPosition}%` }}
          />
        )}
        
        {/* Draggable Handle - larger for easier grabbing */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-10 rounded-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110 border-2 border-white pointer-events-none"
          style={{ 
            left: `calc(${clampedProgress}% - 12px)`,
            backgroundColor: neonColor,
            boxShadow: `0 0 10px ${neonColor}, 0 0 20px ${neonColor}60, inset 0 0 10px rgba(255,255,255,0.3)`
          }}
        >
          {/* Grip lines */}
          <div className="absolute inset-0 flex items-center justify-center gap-1 pointer-events-none">
            <div className="w-0.5 h-4 bg-black/30 rounded-full" />
            <div className="w-0.5 h-4 bg-black/30 rounded-full" />
            <div className="w-0.5 h-4 bg-black/30 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Word Preview Tooltip - Comic Speech Bubble Style */}
      {hoverIndex !== null && previewWord && (
        <div 
          className="absolute bottom-full mb-3 px-4 py-3 text-sm font-mono pointer-events-none z-50"
          style={{
            left: `${tooltipPosition}%`,
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: `2px solid ${neonColor}`,
            borderRadius: '16px',
            boxShadow: `0 0 10px ${neonColor}40, inset 0 0 10px ${neonColor}10`,
            color: neonColor,
            textShadow: `0 0 5px ${neonColor}`,
            minWidth: '120px',
            textAlign: 'center'
          }}
        >
          {/* Speech bubble tail */}
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            style={{
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: `10px solid ${neonColor}`
            }}
          />
          <div 
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2"
            style={{
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid rgba(0, 0, 0, 0.95)'
            }}
          />
          
          {/* Word index */}
          <span 
            className="text-xs block mb-1"
            style={{ color: neonColor, opacity: 0.7 }}
          >
            [{hoverIndex + 1}/{totalWords}]
          </span>
          
          {/* Preview word */}
          <span className="font-bold text-lg block truncate max-w-[200px]">
            {previewWord}
          </span>
        </div>
      )}
    </div>
  );
}
