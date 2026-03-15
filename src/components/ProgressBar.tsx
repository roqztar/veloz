interface ProgressBarProps {
  progress: number;
  isDarkMode?: boolean;
  neonColor?: string;
  className?: string;
}

export function ProgressBar({ progress, isDarkMode = true, neonColor = '#00ffff', className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div 
      className={`w-full h-1 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-black/10'} ${className}`}
    >
      <div 
        className="h-full transition-all duration-300 ease-out"
        style={{ 
          width: `${clampedProgress}%`,
          backgroundColor: neonColor,
          boxShadow: `0 0 10px ${neonColor}, 0 0 20px ${neonColor}`
        }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
