interface ProgressBarProps {
  progress: number;
  isDarkMode?: boolean;
  className?: string;
}

export function ProgressBar({ progress, isDarkMode = true, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`w-full h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} ${className}`}>
      <div 
        className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300 ease-out"
        style={{ width: `${clampedProgress}%` }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
