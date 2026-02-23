import { useRef, useCallback } from 'react';

interface ControlsProps {
  wpm: number;
  isPlaying: boolean;
  onWPMChange: (wpm: number) => void;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  wordCount: number;
  currentIndex: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  className?: string;
}

export function Controls({
  wpm,
  isPlaying,
  onWPMChange,
  onToggle,
  onNext,
  onPrev,
  onReset,
  wordCount,
  currentIndex,
  isDarkMode,
  onToggleTheme,
  focusMode,
  onToggleFocusMode,
  className = '',
}: ControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          // Dispatch custom event with the text
          window.dispatchEvent(new CustomEvent('spritz:textLoaded', { detail: text }));
        }
      };
      reader.readAsText(file);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          window.dispatchEvent(new CustomEvent('spritz:textLoaded', { detail: text }));
        }
      };
      reader.readAsText(file);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Top Controls Row */}
      <div className="flex items-center justify-between gap-4">
        {/* WPM Control */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            WPM
          </span>
          <span className="text-sm font-bold text-slate-300 w-12">
            {wpm}
          </span>
          <input
            type="range"
            min={200}
            max={1000}
            step={10}
            value={wpm}
            onChange={(e) => onWPMChange(Number(e.target.value))}
            className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-slate-300"
          />
        </div>
        
        {/* Center Controls */}
        <div className="flex items-center gap-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
            title="Textdatei laden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          
          {/* Focus Mode Toggle */}
          <button
            onClick={onToggleFocusMode}
            className={`p-2 transition-colors ${focusMode ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}
            title="Fokus-Modus"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v10"/>
              <path d="M21 12h-6m-6 0H1"/>
              <path d="m20.5 3.5-4 4m-9 9-4 4"/>
              <path d="m3.5 3.5 4 4m9 9 4 4"/>
            </svg>
          </button>
          
          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
            title="Zurücksetzen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        
        {/* Word Counter */}
        <div className="text-xs text-slate-500">
          {currentIndex + 1} / {wordCount}
        </div>
      </div>
      
      {/* Playback Controls - Only show when not in focus mode */}
      {!focusMode && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPrev}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Zurück (←)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"/>
              <line x1="5" y1="19" x2="5" y2="5"/>
            </svg>
          </button>
          
          <button
            onClick={onToggle}
            className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
            title={isPlaying ? 'Pause (Leertaste)' : 'Play (Leertaste)'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={onNext}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Weiter (→)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center text-slate-500 text-sm hover:border-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <p>.txt Datei hierher ziehen oder klicken zum Auswählen</p>
      </div>
    </div>
  );
}
