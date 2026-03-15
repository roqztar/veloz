interface CyberEyeProps {
  timeSaved: number; // in seconds
  neonColor: string;
  className?: string;
}

export function CyberEye({ timeSaved, neonColor, className = '' }: CyberEyeProps) {
  // Calculate eye openness based on time saved (max 10 seconds for full opening)
  const maxTime = 10;
  const openness = Math.min(1, timeSaved / maxTime);
  
  // Calculate iris size based on time saved
  const irisScale = 0.5 + (openness * 0.5);
  
  return (
    <div className={`relative ${className}`}>
      {/* Cyberpunk Eye SVG */}
      <svg 
        width="60" 
        height="40" 
        viewBox="0 0 60 40" 
        className="overflow-visible"
      >
        {/* Outer glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Iris gradient */}
          <radialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={neonColor} stopOpacity="1" />
            <stop offset="70%" stopColor={neonColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={neonColor} stopOpacity="0.1" />
          </radialGradient>
        </defs>
        
        {/* Eye outer shape (sclera) */}
        <path
          d={`M5,20 Q30,${5 + (1 - openness) * 30} 55,20 Q30,${35 - (1 - openness) * 30} 5,20`}
          fill="none"
          stroke={neonColor}
          strokeWidth="2"
          filter="url(#glow)"
          style={{
            transition: 'all 0.3s ease-out'
          }}
        />
        
        {/* Inner glow line */}
        <path
          d={`M8,20 Q30,${8 + (1 - openness) * 24} 52,20 Q30,${32 - (1 - openness) * 24} 8,20`}
          fill="none"
          stroke={neonColor}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* Iris - scales with time saved */}
        <circle
          cx="30"
          cy="20"
          r={12 * irisScale}
          fill="url(#irisGradient)"
          filter="url(#glow)"
          style={{
            transition: 'all 0.3s ease-out'
          }}
        />
        
        {/* Pupil - darkest center */}
        <circle
          cx="30"
          cy="20"
          r={5 * irisScale}
          fill="#000"
          style={{
            transition: 'all 0.3s ease-out'
          }}
        />
        
        {/* Digital scan lines across eye */}
        <line 
          x1="5" 
          y1="20" 
          x2="55" 
          y2="20" 
          stroke={neonColor} 
          strokeWidth="0.5" 
          opacity="0.3"
        />
        
        {/* Corner accents */}
        <path
          d="M5,20 L0,15 M5,20 L0,25"
          stroke={neonColor}
          strokeWidth="1"
          opacity="0.7"
        />
        <path
          d="M55,20 L60,15 M55,20 L60,25"
          stroke={neonColor}
          strokeWidth="1"
          opacity="0.7"
        />
        
        {/* Tech markers */}
        <circle cx="30" cy="5" r="1.5" fill={neonColor} opacity="0.5" />
        <circle cx="30" cy="35" r="1.5" fill={neonColor} opacity="0.5" />
      </svg>
      
      {/* Time display below eye - rounded to 1 decimal, stable */}
      <div 
        className="text-center font-mono text-xs mt-1 font-bold"
        style={{ 
          color: neonColor,
          textShadow: `0 0 5px ${neonColor}`
        }}
      >
        {timeSaved >= 60 
          ? `${(timeSaved / 60).toFixed(1)}m` 
          : `${timeSaved.toFixed(1)}s`}
      </div>
    </div>
  );
}
