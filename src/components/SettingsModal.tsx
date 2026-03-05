import type { CleanOptions } from '../core/textCleaner';

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
  
  // Cleaning
  cleanOptions: CleanOptions;
  setCleanOptions: (opts: Partial<CleanOptions>) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDarkMode,
  fontFamily,
  setFontFamily,
  fontWeight,
  setFontWeight,
  fontSizeLevel,
  setFontSizeLevel,
  cleanOptions,
  setCleanOptions,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const textColor = isDarkMode ? 'text-slate-200' : 'text-gray-900';
  const mutedColor = isDarkMode ? 'text-slate-500' : 'text-gray-600';
  const glassClass = isDarkMode 
    ? 'bg-white/5 backdrop-blur-xl border border-white/10' 
    : 'bg-white/80 backdrop-blur-xl border border-black/5';
  const accentBg = isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20';

  const toggleOption = (key: keyof CleanOptions) => {
    setCleanOptions({ [key]: !cleanOptions[key] } as Partial<CleanOptions>);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        className={`relative w-full max-w-md ${glassClass} rounded-2xl p-6 animate-in zoom-in-95 max-h-[85vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${textColor}`}>Einstellungen</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${accentBg} ${textColor}`}>
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
            <h3 className={`text-sm font-medium ${mutedColor}`}>Schriftart</h3>
            
            {/* Family */}
            <div className="flex gap-2">
              {(['sans', 'serif', 'mono'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                    fontFamily === f 
                      ? 'bg-red-500 text-white' 
                      : `${accentBg} ${textColor}`
                  }`}
                >
                  {f === 'sans' && 'Sans'}
                  {f === 'serif' && 'Serif'}
                  {f === 'mono' && 'Mono'}
                </button>
              ))}
            </div>

            {/* Weight */}
            <div className="flex gap-2">
              {(['light', 'normal', 'bold'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setFontWeight(w)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                    fontWeight === w 
                      ? 'bg-red-500 text-white' 
                      : `${accentBg} ${textColor}`
                  }`}
                >
                  {w === 'light' && 'Light'}
                  {w === 'normal' && 'Normal'}
                  {w === 'bold' && 'Bold'}
                </button>
              ))}
            </div>

            {/* Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${textColor}`}>Größe</span>
                <span className={`text-lg font-mono ${textColor}`}>
                  {fontSizeLevel > 0 ? '+' : ''}{fontSizeLevel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSizeLevel(Math.max(-5, fontSizeLevel - 1))}
                  disabled={fontSizeLevel <= -5}
                  className={`w-10 h-10 rounded-lg ${accentBg} ${textColor} flex items-center justify-center disabled:opacity-30`}
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
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((fontSizeLevel + 5) / 10) * 100}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${((fontSizeLevel + 5) / 10) * 100}%)`
                  }}
                />
                <button
                  onClick={() => setFontSizeLevel(Math.min(5, fontSizeLevel + 1))}
                  disabled={fontSizeLevel >= 5}
                  className={`w-10 h-10 rounded-lg ${accentBg} ${textColor} flex items-center justify-center disabled:opacity-30`}
                >
                  +
                </button>
              </div>
            </div>
          </section>

          <hr className={`border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`} />

          {/* Text Cleaning */}
          <section className="space-y-4">
            <h3 className={`text-sm font-medium ${mutedColor}`}>Text-Bereinigung</h3>
            
            <div className="space-y-2">
              {[
                { key: 'cleanUrls', label: 'URLs kürzen' },
                { key: 'cleanNumbers', label: 'Zahlen formatieren' },
                { key: 'expandAbbreviations', label: 'Abkürzungen auflösen' },
                { key: 'fixLineBreaks', label: 'Zeilenumbrüche korrigieren' },
                { key: 'cleanMarkup', label: 'Markup entfernen' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between py-2 cursor-pointer">
                  <span className={`text-sm ${textColor}`}>{label}</span>
                  <input
                    type="checkbox"
                    checked={cleanOptions[key as keyof CleanOptions] as boolean}
                    onChange={() => toggleOption(key as keyof CleanOptions)}
                    className="w-5 h-5 rounded border-2 border-red-500 text-red-500 focus:ring-red-500"
                  />
                </label>
              ))}
            </div>

            {/* Parentheses */}
            <div className="space-y-2 pt-2">
              <span className={`text-sm ${textColor}`}>Klammern</span>
              <div className="flex gap-2">
                {(['keep', 'dim', 'shorten', 'remove'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCleanOptions({ handleParentheses: mode })}
                    className={`flex-1 py-2 px-1 rounded-lg text-xs transition-all ${
                      cleanOptions.handleParentheses === mode
                        ? 'bg-red-500 text-white'
                        : `${accentBg} ${textColor}`
                    }`}
                  >
                    {mode === 'keep' && 'Anzeigen'}
                    {mode === 'dim' && 'Dimmen'}
                    {mode === 'shorten' && 'Kürzen'}
                    {mode === 'remove' && 'Entfernen'}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
