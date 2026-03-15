import { useState, useEffect, useCallback, useRef } from 'react';
import { WordDisplay } from './WordDisplay';
import { ProgressBar } from './ProgressBar';
import { SettingsModal } from './SettingsModal';
import { useSpritz } from '../hooks/useSpritz';
import { calculateTimeSaved, formatTime } from '../core/textCleaner';
import { parseFile, getSupportedFileTypes, getSupportedMimeTypes } from '../core/fileParser';

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
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Font settings
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold' | 'light'>('bold');
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -5 to +5 levels
  const [, setElapsedTime] = useState(0);
  // Long press state
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const scrubIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Touch/swipe state for mobile
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // min distance for swipe
  const SWIPE_TIMEOUT = 300; // max time for swipe
  
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
  
  // Touch/Swipe handlers for mobile navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current || !touchStartTime.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    const deltaTime = touchEndTime - touchStartTime.current;
    
    // Only process if within swipe timeout and horizontal movement is greater than vertical
    if (deltaTime < SWIPE_TIMEOUT && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          // Swipe right -> previous word
          prev();
        } else {
          // Swipe left -> next word
          next();
        }
      } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        // Tap (not a swipe) -> toggle play/pause
        toggle();
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
    touchStartTime.current = null;
  }, [prev, next, toggle]);
  
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
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDarkMode={isDarkMode}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontWeight={fontWeight}
        setFontWeight={setFontWeight}
        fontSizeLevel={fontSizeLevel}
        setFontSizeLevel={setFontSizeLevel}
        cleanOptions={cleanOptions}
        setCleanOptions={setCleanOptions}
      />
      
      {/* Scrubber Overlay */}
      {showScrubber && (
        <div 
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-8 animate-in fade-in duration-200"
          onClick={() => setShowScrubber(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div 
            className={`relative w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] ${glassClass} rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 animate-in zoom-in-95 duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className={`text-lg sm:text-xl font-semibold ${textColorClass}`}>Position wählen</h2>
                <p className={`text-xs sm:text-sm ${mutedColorClass}`}>{Math.round(progress)}% • {currentIndex + 1} / {words.length} Wörter</p>
              </div>
              <button 
                onClick={() => setShowScrubber(false)} 
                className={`p-2 sm:p-2 rounded-full ${accentBgClass} ${textColorClass} transition-transform hover:rotate-90 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
            
            <div className={`text-base sm:text-lg leading-loose max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={() => {
            // Click outside saves changes and closes (like "Save")
            saveEditor();
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div 
            className={`relative w-full max-w-3xl ${glassClass} rounded-t-3xl sm:rounded-3xl p-1 animate-in zoom-in-95 duration-300 max-h-[95vh] sm:max-h-none overflow-y-auto sm:overflow-visible`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="relative p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-lg sm:text-xl font-semibold ${textColorClass}`}>Text bearbeiten</h2>
                    <p className={`text-xs sm:text-sm ${mutedColorClass}`}>{inputText.split(/\s+/).filter(w => w.length > 0).length} Wörter</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditor(false)} 
                  className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full ${accentBgClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:rotate-90 hover:scale-105 hover:shadow-md active:scale-95 min-w-[44px]`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              {/* Textarea with glass effect */}
              <div className={`rounded-2xl p-1 ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                <textarea
                  id="editor-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Füge hier deinen Text ein..."
                  className={`w-full h-48 sm:h-64 p-4 sm:p-5 rounded-xl resize-none focus:outline-none text-base sm:text-lg leading-relaxed ${
                    isDarkMode 
                      ? 'bg-transparent text-slate-200 placeholder-slate-600' 
                      : 'bg-transparent text-gray-800 placeholder-gray-400'
                  }`}
                  autoFocus
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 sm:mt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => setInputText('')}
                    className={`px-4 sm:px-6 py-3 sm:py-3 rounded-xl font-medium transition-all ${accentBgClass} ${textColorClass} hover:scale-105 hover:text-red-400 min-h-[48px]`}
                  >
                    Alles löschen
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text?.trim()) {
                          setInputText(prev => prev + (prev ? '\n\n' : '') + text.trim());
                        }
                      } catch {
                        // Fallback: focus textarea and let user paste manually
                        const textarea = document.querySelector('#editor-textarea') as HTMLTextAreaElement;
                        textarea?.focus();
                      }
                    }}
                    className={`px-4 sm:px-6 py-3 sm:py-3 rounded-xl font-medium transition-all ${accentBgClass} ${textColorClass} hover:scale-105 min-h-[48px] flex items-center gap-2`}
                    title="Zwischenablage einfügen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span className="hidden sm:inline">Einfügen</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => {
                      // Restore original text without saving changes
                      setInputText(rawText);
                      setShowEditor(false);
                    }} 
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-3 rounded-xl font-medium transition-all ${accentBgClass} ${textColorClass} hover:scale-105 min-h-[48px]`}
                  >
                    Abbrechen
                  </button>
                  <button 
                    onClick={saveEditor}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-3 rounded-xl font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 transition-all min-h-[48px]"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Notifications */}
      {uploadError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span className="text-sm font-medium">{uploadError}</span>
            <button 
              onClick={() => setUploadError(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-green-500/90 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="text-sm font-medium">{uploadSuccess}</span>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative h-screen w-full flex flex-col">
        
        {/* Top Bar */}
        <div 
          className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-5 gap-3 sm:gap-0 transition-all duration-300 ${
            focusMode ? 'opacity-0 pointer-events-none' : showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* WPM Display */}
            <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-full ${glassClass} flex-1 sm:flex-none`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${mutedColorClass} hidden sm:inline`}>WPM</span>
              
              {/* Minus Button */}
              <button
                onClick={() => setWPM(Math.max(200, wpm - 10))}
                className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full ${accentBgClass} ${textColorClass} flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 hover:shadow-md active:scale-90`}
                title="WPM -10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              
              <span className={`text-lg sm:text-xl font-bold ${textColorClass} min-w-[3.5ch] text-center`}>{wpm}</span>
              
              {/* Plus Button */}
              <button
                onClick={() => setWPM(Math.min(1000, wpm + 10))}
                className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full ${accentBgClass} ${textColorClass} flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 hover:shadow-md active:scale-90`}
                title="WPM +10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              
              <div className="relative flex items-center flex-1 sm:flex-none ml-1">
                <input
                  type="range"
                  min={200}
                  max={1000}
                  step={10}
                  value={wpm}
                  onChange={(e) => setWPM(Number(e.target.value))}
                  className="w-full sm:w-24 h-8 sm:h-6 appearance-none cursor-pointer bg-transparent touch-manipulation"
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
              className={`relative w-11 h-11 sm:w-10 sm:h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 min-w-[44px] ${words.length > 1 ? 'ring-2 ring-red-500/50' : ''}`}
              title="Text bearbeiten (E)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              {/* Indicator dot when text is present */}
              {words.length > 1 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
              )}
            </button>
            
            {/* Upload Button */}
            <input
              type="file"
              accept={getSupportedMimeTypes() + ',' + getSupportedFileTypes()}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIsUploading(true);
                  setUploadError(null);
                  try {
                    const result = await parseFile(file);
                    if (result.error) {
                      setUploadError(result.error);
                    } else if (result.text) {
                      setText(result.text);
                      setStartTime(null);
                      // Show success feedback briefly
                      setUploadSuccess(`${result.wordCount} Wörter geladen`);
                      setTimeout(() => setUploadSuccess(null), 3000);
                    }
                  } catch {
                    setUploadError('Fehler beim Laden der Datei.');
                  } finally {
                    setIsUploading(false);
                    // Reset input to allow re-upload of same file
                    e.target.value = '';
                  }
                }
              }}
              id="file-upload"
              className="hidden"
              disabled={isUploading}
            />
            <label 
              htmlFor="file-upload" 
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 min-w-[44px] ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              title={`Datei importieren (${getSupportedFileTypes()})`}
            >
              {isUploading ? (
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              )}
            </label>
            
            {/* Delete Button */}
            <button 
              onClick={reset}
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 min-w-[44px]`}
              title="Text löschen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
            
            {/* Settings Button - weiter rechts */}
            <button
              onClick={() => setShowSettings(true)}
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 sm:ml-4 min-w-[44px]`}
              title="Einstellungen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
          
          {/* Stats */}
          <div className={`flex items-center justify-between sm:justify-start gap-2 sm:gap-4 px-3 sm:px-4 py-2 rounded-full ${glassClass}`}>
            <span 
              className={`text-xs sm:text-sm ${mutedColorClass} cursor-help hidden sm:inline`}
              title="Verglichen mit normalem Lesen (250 WPM)"
            >
              ⏱ {formatTime(timeSaved)} gespart
            </span>
            <span className={`text-xs sm:text-sm ${mutedColorClass} hidden sm:inline`}>•</span>
            <span className={`text-sm font-medium ${textColorClass}`}>{currentIndex + 1} / {words.length}</span>
          </div>
          
          {/* Theme & Focus */}
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={handleToggleFocusMode} 
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full ${glassClass} ${focusMode ? 'text-red-400' : textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 min-w-[44px]`}
              title="Focus Mode (F)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </button>
            
            <button 
              onClick={handleToggleTheme} 
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 min-w-[44px]`}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Word Display - with touch/swipe support */}
        <div 
          className="flex-1 flex items-center justify-center px-2 sm:px-4 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <WordDisplay 
            currentWord={currentWord}
            words={words.map(w => w.text)}
            prevWords={contextBuffer.prev}
            nextWords={contextBuffer.next}
            isDarkMode={isDarkMode}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontSizeLevel={fontSizeLevel}
            className="w-full max-w-5xl px-2 sm:px-4"
          />
          {/* Mobile touch hint */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 md:hidden">
            <span className={`text-xs ${mutedColorClass} opacity-50`}>
              Tippen: Play/Pause • Wischen: Navigation
            </span>
          </div>
        </div>
        
        {/* Bottom Controls */}
        <div 
          className={`px-3 sm:px-6 pb-6 sm:pb-8 transition-all duration-300 ${
            focusMode ? 'opacity-0 pointer-events-none' : showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {/* Skip to Start */}
            <button
              onClick={() => goTo(0)}
              className={`w-12 h-12 sm:w-11 sm:h-11 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 min-w-[48px]`}
              title="Von vorne beginnen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 select-none min-w-[56px]`}
              title="Zurück (←)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            {/* Play/Pause */}
            <button 
              onClick={toggle} 
              className={`w-20 h-20 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/20 active:scale-95 active:translate-y-0 shadow-lg min-w-[80px] sm:min-w-[64px] ${
                isPlaying 
                  ? 'bg-white text-black shadow-white/20' 
                  : 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-red-500/30'
              }`}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
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
              className={`w-14 h-14 sm:w-12 sm:h-12 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5 active:scale-95 active:translate-y-0 select-none min-w-[56px]`}
              title="Vor (→)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 sm:mt-6">
            <ProgressBar progress={progress} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
      
      {/* Focus Mode Exit Hint & Button */}
      {focusMode && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3">
          <span className={`px-4 py-2 rounded-full ${glassClass} ${mutedColorClass} text-xs opacity-60 hidden sm:inline-block`}>
            ESC oder F zum Beenden
          </span>
          {/* Mobile exit button - icon only */}
          <button
            onClick={handleToggleFocusMode}
            className={`sm:hidden w-12 h-12 rounded-full ${glassClass} ${textColorClass} flex items-center justify-center active:scale-95 transition-transform`}
            title="Focus Mode beenden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
