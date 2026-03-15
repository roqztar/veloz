import type { CleanOptions } from '../core/textCleaner';
import type { SpeechState } from '../hooks/useSpeech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  
  // Typography
  fontFamily: 'sans' | 'serif' | 'mono';
  setFontFamily: (f: 'sans' | 'serif' | 'mono') => void;
  fontWeight: 'normal' | 'bold' | 'light';
  setFontWeight: (w: 'normal' | 'bold' | 'light') => void;
  fontSizeLevel: number;
  setFontSizeLevel: (l: number) => void;
  
  // Visual effects
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  showGlow: boolean;
  setShowGlow: (v: boolean) => void;
  
  // Speech synthesis - simplified
  speechEnabled: SpeechState;
  toggleSpeech: () => void;
  speechSupported: boolean;
  currentVoice: SpeechSynthesisVoice | null;
  
  // Cleaning
  cleanOptions: CleanOptions;
  setCleanOptions: (opts: Partial<CleanOptions>) => void;
  
  // Cyberpunk theme
  neonColor?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDarkMode: _isDarkMode,
  fontFamily,
  setFontFamily,
  fontWeight,
  setFontWeight,
  fontSizeLevel,
  setFontSizeLevel,
  showGrid,
  setShowGrid,
  showGlow,
  setShowGlow,
  speechEnabled,
  toggleSpeech,
  speechSupported,
  currentVoice,
  cleanOptions: _cleanOptions,
  setCleanOptions: _setCleanOptions,
  neonColor = '#00ffff',
}: SettingsModalProps) {
  if (!isOpen) return null;

  const textColor = 'text-slate-200';
  const mutedColor = 'text-slate-500';
  const terminalClass = 'bg-black/60 border border-slate-700/50';
  const accentBg = 'bg-slate-800 hover:bg-slate-700';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('bg-black/80')) {
          (e.currentTarget as HTMLElement).dataset.clickedOnBackdrop = 'true';
        }
      }}
      onMouseUp={(e) => {
        if ((e.currentTarget as HTMLElement).dataset.clickedOnBackdrop === 'true') {
          onClose();
        }
        delete (e.currentTarget as HTMLElement).dataset.clickedOnBackdrop;
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div 
        className={`relative w-full max-w-md ${terminalClass} p-6 animate-in zoom-in-95 max-h-[85vh] overflow-hidden flex flex-col`}
        style={{ 
          borderColor: neonColor,
          boxShadow: `0 0 30px ${neonColor}40, inset 0 0 20px ${neonColor}20`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold font-mono uppercase tracking-wider`} style={{ color: neonColor }}>
            // SYSTEM_CONFIG
          </h2>
          <button 
            onClick={onClose} 
            className={`p-2 ${accentBg} ${textColor} transition-all hover:rotate-90`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-6 pr-2">
          
          {/* Typography */}
          <section className="space-y-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${mutedColor} font-mono`}>// Typography</h3>
            
            {/* Family */}
            <div className="flex gap-2">
              {(['sans', 'serif', 'mono'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={`flex-1 py-2 px-3 text-sm font-mono transition-all border ${
                    fontFamily === f 
                      ? 'text-black font-bold' 
                      : `${accentBg} ${textColor} border-slate-700 hover:border-slate-500`
                  }`}
                  style={fontFamily === f ? { backgroundColor: neonColor } : {}}
                >
                  {f === 'sans' && 'SANS'}
                  {f === 'serif' && 'SERIF'}
                  {f === 'mono' && 'MONO'}
                </button>
              ))}
            </div>

            {/* Weight */}
            <div className="flex gap-2">
              {(['light', 'normal', 'bold'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setFontWeight(w)}
                  className={`flex-1 py-2 px-3 text-sm font-mono transition-all border ${
                    fontWeight === w 
                      ? 'text-black font-bold' 
                      : `${accentBg} ${textColor} border-slate-700 hover:border-slate-500`
                  }`}
                  style={fontWeight === w ? { backgroundColor: neonColor } : {}}
                >
                  {w === 'light' && 'LIGHT'}
                  {w === 'normal' && 'NORMAL'}
                  {w === 'bold' && 'BOLD'}
                </button>
              ))}
            </div>

            {/* Size */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textColor} font-mono`}>SCALE_FACTOR</span>
                <span 
                  className={`text-lg font-mono font-bold`}
                  style={{ color: neonColor }}
                >
                  {fontSizeLevel > 0 ? '+' : ''}{fontSizeLevel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSizeLevel(Math.max(-5, fontSizeLevel - 1))}
                  disabled={fontSizeLevel <= -5}
                  className={`w-10 h-10 ${accentBg} ${textColor} flex items-center justify-center disabled:opacity-30 border border-slate-700 font-mono font-bold`}
                >
                  -
                </button>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={1}
                  value={fontSizeLevel}
                  onChange={(e) => setFontSizeLevel(Number(e.target.value))}
                  className="flex-1 h-2 appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${neonColor} 0%, ${neonColor} ${((fontSizeLevel + 5) / 10) * 100}%, rgba(51,65,85,0.5) ${((fontSizeLevel + 5) / 10) * 100}%)`,
                    height: '8px'
                  }}
                />
                <button
                  onClick={() => setFontSizeLevel(Math.min(5, fontSizeLevel + 1))}
                  disabled={fontSizeLevel >= 5}
                  className={`w-10 h-10 ${accentBg} ${textColor} flex items-center justify-center disabled:opacity-30 border border-slate-700 font-mono font-bold`}
                >
                  +
                </button>
              </div>
            </div>
          </section>
          
          <hr className="border-t border-slate-700" />
          
          {/* Visual Effects */}
          <section className="space-y-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${mutedColor} font-mono`}>// Visual_Effects</h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex-1 py-2 px-3 text-sm font-mono transition-all border ${
                  showGrid 
                    ? 'text-black font-bold' 
                    : `${accentBg} ${textColor} border-slate-700 hover:border-slate-500`
                }`}
                style={showGrid ? { backgroundColor: neonColor } : {}}
              >
                GRID
              </button>
              <button
                onClick={() => setShowGlow(!showGlow)}
                className={`flex-1 py-2 px-3 text-sm font-mono transition-all border ${
                  showGlow 
                    ? 'text-black font-bold' 
                    : `${accentBg} ${textColor} border-slate-700 hover:border-slate-500`
                }`}
                style={showGlow ? { backgroundColor: neonColor } : {}}
              >
                GLOW
              </button>
            </div>
          </section>
          
          <hr className="border-t border-slate-700" />
          
          {/* Speech Synthesis - Simplified */}
          {speechSupported && (
            <section className="space-y-4">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${mutedColor} font-mono`}>// Speech</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm ${textColor} font-mono`}>TTS</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    {currentVoice ? currentVoice.name : 'Loading...'}
                  </div>
                </div>
                <button
                  onClick={toggleSpeech}
                  className={`py-2 px-4 text-sm font-mono transition-all border ${
                    speechEnabled === 'on'
                      ? 'text-black font-bold' 
                      : `${accentBg} ${textColor} border-slate-700 hover:border-slate-500`
                  }`}
                  style={speechEnabled === 'on' ? { backgroundColor: neonColor } : {}}
                >
                  {speechEnabled === 'on' ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {speechEnabled === 'on' && currentVoice && (
                <div className="text-xs text-slate-500 font-mono">
                  Auto-optimized for high-speed reading
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
