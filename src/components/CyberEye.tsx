import { useState } from 'react';

interface CyberEyeProps {
  timeSaved: number; // in seconds
  neonColor: string;
  className?: string;
}

export function CyberEye({ timeSaved, neonColor, className = '' }: CyberEyeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate sand level based on time saved (max 60 seconds for full)
  const maxTime = 60;
  const fillLevel = Math.min(1, timeSaved / maxTime);
  
  // Format time for display
  const formatTime = (seconds: number) => {
    if (seconds >= 3600) {
      return `${(seconds / 3600).toFixed(1)}h`;
    } else if (seconds >= 60) {
      return `${(seconds / 60).toFixed(1)}m`;
    }
    return `${Math.floor(seconds)}s`;
  };
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: '70px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container with fixed dimensions */}
      <div className="flex flex-col items-center">
        
        {/* Pixel Hourglass Icon */}
        <svg 
          width="32" 
          height="40" 
          viewBox="0 0 32 40" 
          className="overflow-visible cursor-help flex-shrink-0"
          shapeRendering="crispEdges"
        >
          <defs>
            <filter id="hourglassGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <g filter="url(#hourglassGlow)">
            {/* Top cap */}
            <rect x="8" y="0" width="16" height="2" fill={neonColor} opacity="0.9" />
            <rect x="6" y="2" width="20" height="2" fill={neonColor} opacity="0.8" />
            
            {/* Top bulb (emptying) */}
            <rect x="8" y="4" width="16" height="2" fill={neonColor} opacity={0.3 + (1 - fillLevel) * 0.5} />
            <rect x="10" y="6" width="12" height="2" fill={neonColor} opacity={0.3 + (1 - fillLevel) * 0.5} />
            <rect x="12" y="8" width="8" height="2" fill={neonColor} opacity={0.3 + (1 - fillLevel) * 0.4} />
            
            {/* Middle neck */}
            <rect x="14" y="10" width="4" height="4" fill={neonColor} opacity="0.6" />
            
            {/* Falling sand particle (animated) */}
            <rect x="15" y="12" width="2" height="2" fill={neonColor} opacity="0.9">
              <animate attributeName="y" values="12;18;12" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
            </rect>
            
            {/* Bottom bulb (filling) */}
            <rect x="12" y="16" width="8" height="2" fill={neonColor} opacity={0.3 + fillLevel * 0.4} />
            <rect x="10" y="18" width="12" height="2" fill={neonColor} opacity={0.3 + fillLevel * 0.5} />
            <rect x="8" y="20" width="16" height="2" fill={neonColor} opacity={0.3 + fillLevel * 0.6} />
            <rect x="10" y="22" width="12" height="2" fill={neonColor} opacity={0.4 + fillLevel * 0.5} />
            <rect x="12" y="24" width="8" height="2" fill={neonColor} opacity={0.5 + fillLevel * 0.4} />
            <rect x="14" y="26" width="4" height="2" fill={neonColor} opacity={0.6 + fillLevel * 0.3} />
            
            {/* Bottom cap */}
            <rect x="6" y="28" width="20" height="2" fill={neonColor} opacity="0.8" />
            <rect x="8" y="30" width="16" height="2" fill={neonColor} opacity="0.9" />
            
            {/* Side frame lines */}
            <rect x="4" y="0" width="2" height="32" fill={neonColor} opacity="0.4" />
            <rect x="26" y="0" width="2" height="32" fill={neonColor} opacity="0.4" />
            
            {/* Corner accents */}
            <rect x="2" y="2" width="2" height="2" fill={neonColor} opacity="0.6" />
            <rect x="28" y="2" width="2" height="2" fill={neonColor} opacity="0.6" />
            <rect x="2" y="28" width="2" height="2" fill={neonColor} opacity="0.6" />
            <rect x="28" y="28" width="2" height="2" fill={neonColor} opacity="0.6" />
          </g>
        </svg>
        
        {/* Time display - minimal */}
        <div 
          className="mt-2 px-2 py-1 rounded font-mono text-xs text-center w-full"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.4)',
            border: `1px solid ${neonColor}30`,
          }}
        >
          <span 
            className="font-bold tabular-nums"
            style={{ color: neonColor }}
          >
            {formatTime(timeSaved)}
          </span>
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
            className="text-xs mb-1"
            style={{ color: neonColor, opacity: 0.7 }}
          >
            // TIME_SAVED
          </div>
          <div 
            className="text-lg font-bold"
            style={{ color: neonColor }}
          >
            {formatTime(timeSaved)}
          </div>
          <div 
            className="text-xs mt-1"
            style={{ color: neonColor, opacity: 0.5 }}
          >
            VS NORMAL_READ (250WPM)
          </div>
        </div>
      </div>
    </div>
  );
}
