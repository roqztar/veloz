import { useState, useEffect, useCallback, useRef } from 'react';
import { WordDisplay } from './WordDisplay';
import { ProgressBar } from './ProgressBar';
import { useSpritz } from '../hooks/useSpritz';
import { calculateTimeSaved, formatTime, type CleanOptions } from '../core/textCleaner';

// Default Text - Informativer Beispieltext über Speed Reading
const DEFAULT_TEXT = `Willkommen beim Speed Reader

Diese App hilft dir, Texte schneller zu lesen. Statt deine Augen über Zeilen wandern zu lassen, werden dir die Wörter einzeln in der Mitte des Bildschirms angezeigt.

So funktioniert es:
Der rote Buchstabe markiert den sogenannten Optimal Reading Point. Das ist die Stelle, auf die dein Auge fokussieren sollte. Bei kurzen Wörtern liegt er links, bei längeren weiter rechts.

Die Geschwindigkeit kannst du selbst einstellen. Probiere es aus! Starte mit 250 Wörtern pro Minute und steigere dich langsam. Mit etwas Übung schaffst du locker 400 oder mehr.

Besonderheiten:
Zahlen wie 1234 oder 12,5 werden langsamer angezeigt, damit du sie besser erfassen kannst. Gleiches gilt für längere Wörter oder Satzzeichen.

Nutze die Pfeiltasten zum Navigieren, die Leertaste zum Pausieren. Mit F aktivierst du den Fokus-Modus, der alle Ablenkungen ausblendet.

Viel Spaß beim Lesen!`;

interface ReaderProps {
  className?: string;
}

export function Reader({ className = '' }: ReaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScrubber, setShowScrubber] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [inputText, setInputText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Font settings
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold' | 'light'>('bold');
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -5 to +5 levels
  const [, setElapsedTime] = useState(0);
  // Long press state
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const scrubIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const {
    words,
    currentIndex,
    currentWord,
    contextBuffer,
    isPlaying,
    wpm,
    progress,
    rawText,
    cleanOptions,

    setWPM,
    setText,
    setCleanOptions,
    toggle,
    pause,
    next,
    prev,
    goTo,
    reset,
  } = useSpritz({ 
    initialWPM: 300,
    initialText: DEFAULT_TEXT,
    enableContextBuffer: true,
    contextBufferSize: 1,
    skipCodeBlocks: false,
  });
  
  // Track elapsed time when playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPlaying) {
      if (!startTime) {
        setStartTime(Date.now());
      }
      interval = setInterval(() => {
        setElapsedTime((Date.now() - (startTime || Date.now())) / 1000);
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, startTime]);
  
  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);
    };
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings || showScrubber || showEditor) {
        if (e.code === 'Escape') {
          setShowSettings(false);
          setShowScrubber(false);
          setShowEditor(false);
        }
        return;
      }
      
      // Quick font size adjustments with +/- keys
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setFontSizeLevel(prev => Math.min(prev + 1, 5));
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setFontSizeLevel(prev => Math.max(prev - 1, -5));
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'KeyF':
          e.preventDefault();
          setFocusMode(prev => !prev);
          break;
        case 'KeyE':
          e.preventDefault();
          openEditor();
          break;
        case 'Escape':
          setFocusMode(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, next, prev, showSettings, showScrubber, showEditor]);
  
  const openEditor = useCallback(() => {
    setInputText(rawText);
    setShowEditor(true);
    pause();
  }, [rawText, pause]);
  
  const saveEditor = useCallback(() => {
    if (inputText.trim()) {
      setText(inputText);
      setStartTime(null);
    }
    setShowEditor(false);
  }, [inputText, setText]);
  
  const handlePointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (scrubIntervalRef.current) {
      clearInterval(scrubIntervalRef.current);
      scrubIntervalRef.current = null;
    }
    isLongPressRef.current = false;
  }, []);
  
  const handlePointerDown = useCallback((direction: 'prev' | 'next') => {
    isLongPressRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowScrubber(true);
      pause();
      
      scrubIntervalRef.current = setInterval(() => {
        if (direction === 'prev') {
          goTo(Math.max(0, currentIndex - 3));
        } else {
          goTo(Math.min(words.length - 1, currentIndex + 3));
        }
      }, 150);
    }, 500);
  }, [currentIndex, words.length, goTo, pause]);
  
  const handlePointerUp = useCallback((direction: 'prev' | 'next') => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (scrubIntervalRef.current) {
      clearInterval(scrubIntervalRef.current);
      scrubIntervalRef.current = null;
    }
    
    if (!isLongPressRef.current && !showScrubber) {
      if (direction === 'prev') prev();
      else next();
    }
  }, [prev, next, showScrubber]);
  
  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);
  
  const handleToggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
  }, []);
  
  // Calculate statistics
  const timeSaved = calculateTimeSaved(currentIndex + 1, wpm);
  
  // Get text around current position for scrubber
  const getScrubberText = () => {
    const windowSize = 200;
    const start = Math.max(0, currentIndex - windowSize);
    const end = Math.min(words.length, currentIndex + windowSize);
    return words.slice(start, end).map((w, i) => ({
      word: w,
      globalIndex: start + i,
      isCurrent: start + i === currentIndex
    }));
  };
  
  const scrubberText = getScrubberText();
  
  const bgClass = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100';
  const textColorClass = isDarkMode ? 'text-slate-200' : 'text-gray-900';
  const mutedColorClass = isDarkMode ? 'text-slate-500' : 'text-gray-600';
  const accentBgClass = isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20';
  
  // Glassmorphism classes
  const glassClass = isDarkMode 
    ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl' 
    : 'bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl';
  
  return (
    <div 
      className={`min-h-screen w-full ${bgClass} ${className} transition-colors duration-500`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className={`absolute top-0 left-0 w-full h-full opacity-30 ${
            isDarkMode ? 'bg-gradient-to-br from-red-900/10 via-transparent to-blue-900/10' : 'bg-gradient-to-br from-red-100/50 via-transparent to-blue-100/50'
          }`}
        />
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSettings(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            className={`relative w-full max-w-md ${glassClass} rounded-2xl p-8 animate-in zoom-in-95 duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-xl font-semibold ${textColorClass}`}>Einstellungen</h2>
              <button 
                onClick={() => setShowSettings(false)} 
                className={`p-2 rounded-full ${accentBgClass} ${textColorClass} transition-transform hover:rotate-90`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {/* Typography Settings */}
            <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
              <h3 className={`text-sm font-semibold ${textColorClass} uppercase tracking-wider`}>Schriftart</h3>
              
              {/* Font Family */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sans', label: 'Sans', font: 'font-sans' },
                  { id: 'serif', label: 'Serif', font: 'font-serif' },
                  { id: 'mono', label: 'Mono', font: 'font-mono' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.id as 'sans' | 'serif' | 'mono')}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${font.font} ${
                      fontFamily === font.id
                        ? 'bg-red-500 text-white'
                        : accentBgClass + ' ' + textColorClass
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
              
              {/* Font Weight */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', class: 'font-light' },
                  { id: 'normal', label: 'Normal', class: 'font-normal' },
                  { id: 'bold', label: 'Bold', class: 'font-bold' },
                ].map((weight) => (
                  <button
                    key={weight.id}
                    onClick={() => setFontWeight(weight.id as 'normal' | 'bold' | 'light')}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${weight.class} ${
                      fontWeight === weight.id
                        ? 'bg-red-500 text-white'
                        : accentBgClass + ' ' + textColorClass
                    }`}
                  >
                    {weight.label}
                  </button>
                ))}
              </div>
              
              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${mutedColorClass}`}>Schriftgröße</span>
                  <span className={`text-xs ${mutedColorClass}`}>Tasten + / −</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFontSizeLevel(prev => Math.max(prev - 1, -5))}
                    className={`w-10 h-10 rounded-lg ${accentBgClass} ${textColorClass} flex items-center justify-center hover:scale-110 transition-transform`}
                  >
                    −
                  </button>
                  <div className={`flex-1 text-center ${textColorClass} font-medium`}>
                    {fontSizeLevel > 0 ? '+' : ''}{fontSizeLevel}
                  </div>
                  <button
                    onClick={() => setFontSizeLevel(prev => Math.min(prev + 1, 5))}
                    className={`w-10 h-10 rounded-lg ${accentBgClass} ${textColorClass} flex items-center justify-center hover:scale-110 transition-transform`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className={`text-sm font-semibold ${textColorClass} uppercase tracking-wider`}>Text-Bereinigung</h3>
              
              {[
                { key: 'cleanUrls', label: 'URLs bereinigen' },
                { key: 'cleanNumbers', label: 'Zahlen formatieren' },
                { key: 'expandAbbreviations', label: 'Abkürzungen expandieren' },
                { key: 'fixLineBreaks', label: 'Zeilenumbrüche korrigieren' },
                { key: 'cleanMarkup', label: 'Markdown/HTML entfernen' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className={`${textColorClass} group-hover:text-red-400 transition-colors`}>{label}</span>
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${cleanOptions[key as keyof CleanOptions] ? 'bg-red-500' : isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={cleanOptions[key as keyof CleanOptions] as boolean}
                      onChange={(e) => setCleanOptions({ [key]: e.target.checked } as Partial<CleanOptions>)}
                      className="sr-only"
                    />
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${cleanOptions[key as keyof CleanOptions] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </label>
              ))}
              
              <div className="space-y-3 pt-4 border-t border-white/10">
                <span className={`${textColorClass}`}>Klammern-Inhalt</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['keep', 'dim', 'shorten', 'remove'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCleanOptions({ handleParentheses: mode })}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        cleanOptions.handleParentheses === mode
                          ? 'bg-red-500 text-white'
                          : accentBgClass + ' ' + textColorClass
                      }`}
                    >
                      {mode === 'keep' && 'Beibehalten'}
                      {mode === 'dim' && 'Ausgrauen'}
                      {mode === 'shorten' && 'Kürzen'}
                      {mode === 'remove' && 'Entfernen'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Scrubber Overlay */}
      {showScrubber && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setShowScrubber(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div 
            className={`relative w-full max-w-5xl max-h-[85vh] ${glassClass} rounded-2xl p-8 animate-in zoom-in-95 duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-xl font-semibold ${textColorClass}`}>Position wählen</h2>
                <p className={`text-sm ${mutedColorClass}`}>{Math.round(progress)}% • {currentIndex + 1} / {words.length} Wörter</p>
              </div>
              <button 
                onClick={() => setShowScrubber(false)} 
                className={`p-2 rounded-full ${accentBgClass} ${textColorClass} transition-transform hover:rotate-90`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
            
            <div className={`text-lg leading-loose max-h-[60vh] overflow-y-auto pr-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {scrubberText.map(({ word, globalIndex, isCurrent }) => (
                <span key={globalIndex}>
                  <span
                    onClick={() => { goTo(globalIndex); setShowScrubber(false); }}
                    className={`
                      inline cursor-pointer transition-all duration-150 mx-1 py-1 px-1 rounded
                      hover:text-white hover:bg-white/10
                      ${isCurrent ? 'bg-red-500 text-white px-2 font-medium' : ''}
                    `}
                  >
                    {word.text}
                  </span>
                  <span className="select-none"> </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Editor Modal - Glassmorphism centered */}
      {showEditor && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowEditor(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div 
            className={`relative w-full max-w-3xl ${glassClass} rounded-3xl p-1 animate-in zoom-in-95 duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    ✎
                  </div>
                  <div>
                    <h2 className={`text-xl font-semibold ${textColorClass}`}>Text bearbeiten</h2>
                    <p className={`text-sm ${mutedColorClass}`}>{inputText.split(/\s+/).filter(w => w.length > 0).length} Wörter</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditor(false)} 
                  className={`w-10 h-10 rounded-full ${accentBgClass} ${textColorClass} flex items-center justify-center transition-all hover:rotate-90 hover:scale-110`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              {/* Textarea with glass effect */}
              <div className={`rounded-2xl p-1 ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Füge hier deinen Text ein..."
                  className={`w-full h-64 p-5 rounded-xl resize-none focus:outline-none text-lg leading-relaxed ${
                    isDarkMode 
                      ? 'bg-transparent text-slate-200 placeholder-slate-600' 
                      : 'bg-transparent text-gray-800 placeholder-gray-400'
                  }`}
                  autoFocus
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowEditor(false)} 
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${accentBgClass} ${textColorClass} hover:scale-105`}
                >
                  Abbrechen
                </button>
                <button 
                  onClick={saveEditor}
                  className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 transition-all"
                >
                  Speichern & Lesen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative h-screen w-full flex flex-col">
        
        {/* Top Bar */}
        <div 
          className={`flex items-center justify-between px-6 py-5 transition-all duration-300 ${
            focusMode ? 'opacity-0 pointer-events-none' : showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* WPM Display */}
            <div className={`flex items-center gap-4 px-5 py-3 rounded-full ${glassClass}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${mutedColorClass}`}>WPM</span>
              <span className={`text-xl font-bold ${textColorClass} min-w-[3ch] text-center`}>{wpm}</span>
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={200}
                  max={1000}
                  step={10}
                  value={wpm}
                  onChange={(e) => setWPM(Number(e.target.value))}
                  className="w-32 h-6 appearance-none cursor-pointer bg-transparent"
                  style={{ 
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(wpm-200)/8}%, rgba(255,255,255,0.15) ${(wpm-200)/8}%, rgba(255,255,255,0.15) 100%)`,
                    borderRadius: '4px',
                    height: '8px'
                  }}
                />
              </div>
            </div>
            
            {/* Editor Button */}
            <button
              onClick={openEditor}
              className={`w-10 h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110`}
              title="Text bearbeiten (E)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            
            {/* Upload Button */}
            <input
              type="file"
              accept=".txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    if (text) {
                      setText(text);
                      setStartTime(null);
                    }
                  };
                  reader.readAsText(file);
                }
              }}
              id="file-upload"
              className="hidden"
            />
            <label 
              htmlFor="file-upload" 
              className={`w-10 h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center cursor-pointer transition-all hover:scale-110`}
              title=".txt Datei importieren"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </label>
            
            {/* Delete Button */}
            <button 
              onClick={reset}
              className={`w-10 h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110`}
              title="Text löschen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
            
            {/* Settings Button - weiter rechts */}
            <button
              onClick={() => setShowSettings(true)}
              className={`w-10 h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110 ml-4`}
              title="Einstellungen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
          
          {/* Stats */}
          <div className={`flex items-center gap-4 px-4 py-2 rounded-full ${glassClass}`}>
            <span 
              className={`text-sm ${mutedColorClass} cursor-help`}
              title="Verglichen mit normalem Lesen (250 WPM)"
            >
              ⏱ {formatTime(timeSaved)} gespart
            </span>
            <span className={`text-sm ${mutedColorClass}`}>•</span>
            <span className={`text-sm font-medium ${textColorClass}`}>{currentIndex + 1} / {words.length}</span>
          </div>
          
          {/* Theme & Focus */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleToggleFocusMode} 
              className={`w-10 h-10 rounded-full ${glassClass} ${focusMode ? 'text-red-400' : textColorClass} flex items-center justify-center transition-all hover:scale-110`}
              title="Focus Mode (F)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </button>
            
            <button 
              onClick={handleToggleTheme} 
              className={`w-10 h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110`}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
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
          </div>
        </div>
        
        {/* Word Display */}
        <div className="flex-1 flex items-center justify-center px-4">
          <WordDisplay 
            currentWord={currentWord}
            words={words.map(w => w.text)}
            prevWords={contextBuffer.prev}
            nextWords={contextBuffer.next}
            isDarkMode={isDarkMode}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontSizeLevel={fontSizeLevel}
            className="w-full max-w-5xl px-4"
          />
        </div>
        
        {/* Bottom Controls */}
        <div 
          className={`px-6 pb-8 transition-all duration-300 ${
            focusMode ? 'opacity-0 pointer-events-none' : showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* Skip to Start */}
            <button
              onClick={() => goTo(0)}
              className={`w-11 h-11 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5`}
              title="Von vorne beginnen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"/>
                <line x1="5" y1="19" x2="5" y2="5"/>
              </svg>
            </button>
            
            {/* Prev */}
            <button
              onMouseDown={() => handlePointerDown('prev')}
              onMouseUp={() => handlePointerUp('prev')}
              onMouseLeave={handlePointerLeave}
              onTouchStart={() => handlePointerDown('prev')}
              onTouchEnd={() => handlePointerUp('prev')}
              className={`w-12 h-12 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5 select-none`}
              title="Zurück (←)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            {/* Play/Pause */}
            <button 
              onClick={toggle} 
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-1 shadow-lg ${
                isPlaying 
                  ? 'bg-white text-black shadow-white/20' 
                  : 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-red-500/30'
              }`}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
            
            {/* Next */}
            <button
              onMouseDown={() => handlePointerDown('next')}
              onMouseUp={() => handlePointerUp('next')}
              onMouseLeave={handlePointerLeave}
              onTouchStart={() => handlePointerDown('next')}
              onTouchEnd={() => handlePointerUp('next')}
              className={`w-12 h-12 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5 select-none`}
              title="Vor (→)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <ProgressBar progress={progress} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
      
      {/* Focus Mode Hint */}
      {focusMode && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 animate-pulse">
          <span className={`px-4 py-2 rounded-full ${glassClass} ${mutedColorClass} text-xs`}>
            ESC oder F zum Beenden
          </span>
        </div>
      )}
    </div>
  );
}
