import { useState } from 'react';

interface CyberEyeProps {
  timeSaved: number; // in seconds
  wordsSeen: number;
  neonColor: string;
  className?: string;
}

export function CyberEye({ timeSaved, wordsSeen, neonColor, className = '' }: CyberEyeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate eye animation based on reading progress
  const maxTime = 30;
  const openness = Math.min(1, timeSaved / maxTime);
  const irisScale = 0.6 + (openness * 0.4);
  
  // Format numbers with fixed width
  const formatTime = (seconds: number) => {
    if (seconds >= 3600) {
      return `${(seconds / 3600).toFixed(1)}h`;
    } else if (seconds >= 60) {
      return `${(seconds / 60).toFixed(1)}m`;
    }
    return `${Math.floor(seconds)}s`;
  };
  
  const formatWords = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return `${count}`;
  };
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: '90px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container with fixed dimensions */}
      <div className="flex flex-col items-center">
        
        {/* Pixel Eye Icon */}
        <svg 
          width="48" 
          height="32" 
          viewBox="0 0 48 32" 
          className="overflow-visible cursor-help flex-shrink-0"
          shapeRendering="crispEdges"
        >
          <defs>
            <filter id="pixelGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Pixel Eye Outline */}
          <g filter="url(#pixelGlow)">
            {/* Top row */}
            <rect x="12" y="4" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.7} />
            <rect x="16" y="4" width="4" height="4" fill={neonColor} opacity={0.5 + openness * 0.5} />
            <rect x="20" y="4" width="8" height="4" fill={neonColor} opacity={0.8} />
            <rect x="28" y="4" width="4" height="4" fill={neonColor} opacity={0.5 + openness * 0.5} />
            <rect x="32" y="4" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.7} />
            
            {/* Second row - opens with time saved */}
            <rect x="8" y="8" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.7} />
            <rect x="12" y="8" width="4" height="4" fill={neonColor} opacity={0.6} />
            
            {/* Iris area - scales with time */}
            <rect x="20" y="8" width="8" height="4" fill={neonColor} opacity={0.9} />
            
            <rect x="32" y="8" width="4" height="4" fill={neonColor} opacity={0.6} />
            <rect x="36" y="8" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.7} />
            
            {/* Middle row - center (pupil) */}
            <rect x="4" y="12" width="4" height="4" fill={neonColor} opacity={0.4} />
            <rect x="8" y="12" width="4" height="4" fill={neonColor} opacity={0.6} />
            
            {/* Iris left */}
            <rect x="16" y="12" width="4" height="4" fill={neonColor} opacity={0.7} />
            <rect x="20" y="12" width="2" height="4" fill="#000" opacity={0.8} />
            <rect x="22" y="12" width="4" height="4" fill="#000" opacity={0.9} />
            <rect x="26" y="12" width="2" height="4" fill="#000" opacity={0.8} />
            {/* Iris right */}
            <rect x="28" y="12" width="4" height="4" fill={neonColor} opacity={0.7} />
            
            <rect x="36" y="12" width="4" height="4" fill={neonColor} opacity={0.6} />
            <rect x="40" y="12" width="4" height="4" fill={neonColor} opacity={0.4} />
            
            {/* Lower middle */}
            <rect x="4" y="16" width="4" height="4" fill={neonColor} opacity={0.4} />
            <rect x="8" y="16" width="4" height="4" fill={neonColor} opacity={0.6} />
            
            <rect x="16" y="16" width="4" height="4" fill={neonColor} opacity={0.7} />
            <rect x="20" y="16" width="8" height="4" fill={neonColor} opacity={0.5 + irisScale * 0.4} />
            <rect x="28" y="16" width="4" height="4" fill={neonColor} opacity={0.7} />
            
            <rect x="36" y="16" width="4" height="4" fill={neonColor} opacity={0.6} />
            <rect x="40" y="16" width="4" height="4" fill={neonColor} opacity={0.4} />
            
            {/* Bottom row - opens with time saved */}
            <rect x="8" y="20" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.7} />
            <rect x="12" y="20" width="4" height="4" fill={neonColor} opacity={0.6} />
            <rect x="20" y="20" width="8" height="4" fill={neonColor} opacity={0.8} />
            <rect x="32" y="20" width="4" height="4" fill={neonColor} opacity={0.6} />
            <rect x="36" y="20" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.7} />
            
            {/* Bottom most */}
            <rect x="12" y="24" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.5} />
            <rect x="16" y="24" width="4" height="4" fill={neonColor} opacity={0.4 + openness * 0.4} />
            <rect x="20" y="24" width="8" height="4" fill={neonColor} opacity={0.5 + openness * 0.3} />
            <rect x="28" y="24" width="4" height="4" fill={neonColor} opacity={0.4 + openness * 0.4} />
            <rect x="32" y="24" width="4" height="4" fill={neonColor} opacity={0.3 + openness * 0.5} />
          </g>
          
          {/* Scan line animation */}
          <line 
            x1="4" 
            y1="14" 
            x2="44" 
            y2="14" 
            stroke={neonColor} 
            strokeWidth="1" 
            opacity={0.3 + openness * 0.4}
          >
            <animate attributeName="y1" values="8;24;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="y2" values="8;24;8" dur="2s" repeatCount="indefinite" />
          </line>
        </svg>
        
        {/* Fixed-size data panel */}
        <div 
          className="mt-2 px-2 py-1.5 rounded font-mono text-xs text-center w-full"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: `1px solid ${neonColor}40`,
          }}
        >
          {/* Time saved row */}
          <div className="flex justify-between items-center mb-1">
            <span style={{ color: neonColor, opacity: 0.6 }}>⏱</span>
            <span 
              className="font-bold tabular-nums"
              style={{ color: neonColor }}
            >
              {formatTime(timeSaved)}
            </span>
          </div>
          
          {/* Words seen row */}
          <div className="flex justify-between items-center">
            <span style={{ color: neonColor, opacity: 0.6 }}>✓</span>
            <span 
              className="font-bold tabular-nums"
              style={{ color: neonColor }}
            >
              {formatWords(wordsSeen)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Hover Tooltip */}
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 pointer-events-none z-[100] whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          border: `2px solid ${neonColor}`,
          borderRadius: '4px',
          boxShadow: `0 0 20px ${neonColor}, 0 0 40px ${neonColor}`,
        }}
      >
        {/* Arrow pointing down */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          style={{
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${neonColor}`
          }}
        />
        
        {/* Content */}
        <div className="font-mono text-center">
          <div 
            className="text-xs mb-2"
            style={{ color: neonColor, opacity: 0.7 }}
          >
            // STATS
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span style={{ color: neonColor, opacity: 0.6 }}>TIME_SAVED:</span>
              <span 
                className="font-bold"
                style={{ color: neonColor }}
              >
                {formatTime(timeSaved)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: neonColor, opacity: 0.6 }}>WORDS_SEEN:</span>
              <span 
                className="font-bold"
                style={{ color: neonColor }}
              >
                {formatWords(wordsSeen)}
              </span>
            </div>
          </div>
          
          <div 
            className="text-xs mt-2 pt-2 border-t border-slate-700"
            style={{ color: neonColor, opacity: 0.5 }}
          >
            VS NORMAL_READ (250WPM)
          </div>
        </div>
      </div>
    </div>
  );
}
