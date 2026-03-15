import { useState, useEffect, useCallback, useRef } from 'react';
import { WordDisplay } from './WordDisplay';
import { ProgressBar } from './ProgressBar';
import { SettingsModal } from './SettingsModal';
import { CyberEye } from './CyberEye';
import { useSpritz } from '../hooks/useSpritz';
import { calculateTimeSaved } from '../core/textCleaner';
import { parseFile, getSupportedFileTypes, getSupportedMimeTypes } from '../core/fileParser';

// Default Text - Cyberpunk themed welcome message
const DEFAULT_TEXT = `SYSTEM INITIALIZED

Welcome to NEURO-READ v2.0
This speed reading interface uses Rapid Serial Visual Presentation technology to maximize your data absorption rate.

PROTOCOL:
The highlighted character marks the Optimal Recognition Point. Keep your visual cortex focused on this anchor point. Position shifts based on word length vectors.

CALIBRATION:
Adjust your Words Per Minute throughput. Recommended start: 250 WPM. Experienced users can push to 400+ WPM.

PARAMETERS:
Numeric data streams and complex tokens receive extended display cycles for enhanced comprehension.

CONTROLS:
[SPACE] Toggle playback
[ARROWS] Navigate buffer
[E] Access text editor
[+/-] Adjust font size

> Ready for neural link...`;

interface ReaderProps {
  className?: string;
}

// Helper to calculate contrast color for ORP (black or white)
function getContrastColor(hslColor: string): string {
  // Extract lightness from HSL string like "hsl(180, 100%, 50%)"
  const match = hslColor.match(/hsl\(\d+,\s*\d+%,\s*(\d+)%\)/);
  if (match) {
    const lightness = parseInt(match[1], 10);
    // Use black for light colors, white for dark colors
    return lightness > 60 ? '#000000' : '#ffffff';
  }
  return '#ffffff';
}

// Format time as HH:MM:SS with cyberpunk styling
function formatTimeCyberpunk(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function Reader({ className = '' }: ReaderProps) {
  // Cyberpunk is always dark mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Inactivity timer for auto-hiding controls
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_DELAY = 2000; // 2 seconds
  const [showSettings, setShowSettings] = useState(false);
  const [showScrubber, setShowScrubber] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [inputText, setInputText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Rainbow color picker state
  const [hue, setHue] = useState(180); // Cyan default (cyberpunk aesthetic)
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Font settings - mono default for terminal look
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('mono');
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
  
  // Calculate neon color from hue
  const neonColor = `hsl(${hue}, 100%, 50%)`;
  const neonColorDim = `hsl(${hue}, 100%, 30%)`;
  const neonColorGlow = `hsl(${hue}, 100%, 50%, 0.5)`;
  const orpColor = getContrastColor(neonColor);
  
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
      if (showSettings || showScrubber || showEditor || showColorPicker) {
        if (e.code === 'Escape') {
          setShowSettings(false);
          setShowScrubber(false);
          setShowEditor(false);
          setShowColorPicker(false);
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
        case 'KeyE':
          e.preventDefault();
          openEditor();
          break;
        case 'Escape':
          // Just closes modals now
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, next, prev, showSettings, showScrubber, showEditor, showColorPicker, toggleFullscreen]);
  
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
    setShowControls(false);
  }, []);
  
  // Inactivity detection - hide controls after cursor is still for 2 seconds
  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, INACTIVITY_DELAY);
  }, []);
  
  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or failed
    }
  }, []);
  
  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
  
  // Calculate statistics - TIME SAVED in seconds
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
  
  // Cyberpunk dark theme classes
  const bgClass = 'bg-[#050505]';
  const textColorClass = 'text-slate-200';
  const mutedColorClass = 'text-slate-500';
  
  // Cyberpunk terminal-style glass class with neon borders
  const terminalClass = 'bg-black/60 border border-slate-700/50';
  
  return (
    <div 
      className={`min-h-screen w-full ${bgClass} ${className} transition-colors duration-500`}
      onMouseMove={resetInactivityTimer}
      onMouseLeave={() => setShowControls(false)}
      onClick={resetInactivityTimer}
    >
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${neonColorDim} 1px, transparent 1px),
              linear-gradient(to bottom, ${neonColorDim} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Scanline effect */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)'
          }}
        />
      </div>
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDarkMode={true}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontWeight={fontWeight}
        setFontWeight={setFontWeight}
        fontSizeLevel={fontSizeLevel}
        setFontSizeLevel={setFontSizeLevel}
        cleanOptions={cleanOptions}
        setCleanOptions={setCleanOptions}
        neonColor={neonColor}
      />
      
      {/* Color Picker Modal */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowColorPicker(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div 
            className={`relative ${terminalClass} p-6 rounded-none animate-in zoom-in-95 duration-200`}
            style={{ 
              boxShadow: `0 0 40px ${neonColorGlow}, inset 0 0 20px ${neonColorGlow}`,
              borderColor: neonColor
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-mono uppercase tracking-widest" style={{ color: neonColor }}>
                // COLOR_PROTOCOL
              </h2>
              <button 
                onClick={() => setShowColorPicker(false)} 
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {/* Rainbow Slider */}
            <div className="w-72 mb-6">
              <div 
                className="h-8 rounded cursor-pointer relative overflow-hidden"
                style={{
                  background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  setHue(Math.round(percentage * 360));
                }}
              >
                {/* Slider thumb */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                  style={{ 
                    left: `${(hue / 360) * 100}%`,
                    boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                  }}
                />
              </div>
              
              {/* Hue value display */}
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-slate-500 font-mono">HUE: {hue}°</span>
                <div 
                  className="w-8 h-8 rounded border-2 border-white/20"
                  style={{ backgroundColor: neonColor }}
                />
              </div>
            </div>
            
            {/* Preview */}
            <div 
              className="p-4 border border-slate-700 text-center font-mono text-lg"
              style={{ 
                borderColor: neonColorDim,
                color: neonColor,
                textShadow: `0 0 10px ${neonColorGlow}`
              }}
            >
              NEON_PREVIEW_MODE
            </div>
          </div>
        </div>
      )}
      
      {/* Scrubber Overlay */}
      {showScrubber && (
        <div 
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-8 animate-in fade-in duration-200"
          onClick={() => setShowScrubber(false)}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div 
            className={`relative w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] ${terminalClass} rounded-none sm:rounded-none p-4 sm:p-6 lg:p-8 animate-in zoom-in-95 duration-200`}
            style={{ boxShadow: `0 0 30px ${neonColorGlow}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold font-mono uppercase tracking-wider`} style={{ color: neonColor }}>
                  // NAV_BUFFER
                </h2>
                <p className={`text-xs sm:text-sm ${mutedColorClass} font-mono`}>
                  POS: {Math.round(progress)}% | WORD: {currentIndex + 1}/{words.length}
                </p>
              </div>
              <button 
                onClick={() => setShowScrubber(false)} 
                className={`p-2 sm:p-2 text-slate-400 hover:text-white transition-all hover:rotate-90 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="w-full h-1 bg-slate-800 mb-6 overflow-hidden">
              <div 
                className="h-full transition-all duration-150" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: neonColor,
                  boxShadow: `0 0 10px ${neonColor}`
                }} 
              />
            </div>
            
            <div className={`text-base sm:text-lg leading-loose max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-2 font-mono text-slate-400`}>
              {scrubberText.map(({ word, globalIndex, isCurrent }) => (
                <span key={globalIndex}>
                  <span
                    onClick={() => { goTo(globalIndex); setShowScrubber(false); }}
                    className="inline cursor-pointer transition-all duration-150 mx-1 py-1 px-1 hover:text-white hover:bg-white/10"
                    style={isCurrent ? { 
                      backgroundColor: neonColor, 
                      color: '#000',
                      fontWeight: 'bold'
                    } : {}}
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
      
      {/* Editor Modal - Cyberpunk Terminal Style */}
      {showEditor && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={() => {
            saveEditor();
          }}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div 
            className={`relative w-full max-w-3xl ${terminalClass} rounded-none sm:rounded-none p-1 animate-in zoom-in-95 duration-300 h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col`}
            style={{ 
              boxShadow: `0 0 40px ${neonColorGlow}, inset 0 0 20px ${neonColorGlow}`,
              borderColor: neonColorDim
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-4 sm:p-6 lg:p-8 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-black font-bold font-mono"
                    style={{ 
                      backgroundColor: neonColor,
                      boxShadow: `0 0 15px ${neonColor}`
                    }}
                  >
                    &gt;_
                  </div>
                  <div>
                    <h2 className={`text-lg sm:text-xl font-bold font-mono uppercase tracking-wider`} style={{ color: neonColor }}>
                      // TEXT_INPUT
                    </h2>
                    <p className={`text-xs sm:text-sm ${mutedColorClass} font-mono`}>{inputText.split(/\s+/).filter(w => w.length > 0).length} TOKENS</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditor(false)} 
                  className={`w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 ease-out hover:rotate-90 hover:scale-105 active:scale-95 min-w-[44px]`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              {/* Textarea - Terminal style */}
              <div className={`flex-1 p-1 bg-black/80 border border-slate-700 min-h-0`}>
                <textarea
                  id="editor-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="> Enter data stream..."
                  className="w-full h-full min-h-[200px] sm:min-h-[250px] p-4 sm:p-5 resize-none focus:outline-none text-base sm:text-lg leading-relaxed bg-transparent text-green-400 placeholder-slate-600 font-mono"
                  style={{
                    textShadow: '0 0 5px rgba(74, 222, 128, 0.5)'
                  }}
                  autoFocus
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 sm:mt-6 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => setInputText('')}
                    className={`px-4 sm:px-6 py-3 sm:py-3 border border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-500/50 font-mono transition-all min-h-[48px]`}
                  >
                    PURGE
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text?.trim()) {
                          setInputText(prev => prev + (prev ? '\n\n' : '') + text.trim());
                        }
                      } catch {
                        const textarea = document.querySelector('#editor-textarea') as HTMLTextAreaElement;
                        textarea?.focus();
                      }
                    }}
                    className={`px-4 sm:px-6 py-3 sm:py-3 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-mono transition-all min-h-[48px] flex items-center gap-2`}
                    title="Import from clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span className="hidden sm:inline">PASTE</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => {
                      setInputText(rawText);
                      setShowEditor(false);
                    }} 
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-3 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-mono transition-all min-h-[48px]`}
                  >
                    ABORT
                  </button>
                  <button 
                    onClick={saveEditor}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-3 text-black font-bold font-mono transition-all min-h-[48px] hover:scale-105"
                    style={{ 
                      backgroundColor: neonColor,
                      boxShadow: `0 0 20px ${neonColorGlow}`
                    }}
                  >
                    EXECUTE
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
          <div 
            className="px-4 py-3 flex items-center gap-3 font-mono text-sm"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span className="font-bold">ERROR: {uploadError}</span>
            <button 
              onClick={() => setUploadError(null)}
              className="ml-2 p-1 hover:bg-white/20 transition-colors"
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
          <div 
            className="px-4 py-3 flex items-center gap-3 font-mono text-sm"
            style={{ 
              backgroundColor: neonColor,
              color: '#000',
              boxShadow: `0 0 20px ${neonColorGlow}`
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="font-bold">{uploadSuccess}</span>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative h-screen w-full flex flex-col">
        
        {/* Top Bar - Cyberpunk Terminal */}
        <div 
          className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-5 gap-3 sm:gap-0 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* WPM Display - Terminal Style */}
            <div 
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 ${terminalClass} flex-1 sm:flex-none`}
              style={{ borderColor: neonColorDim }}
            >
              <span 
                className={`text-xs font-bold uppercase tracking-widest hidden sm:inline font-mono`}
                style={{ color: neonColor }}
              >
                WPM
              </span>
              
              {/* Minus Button */}
              <button
                onClick={() => setWPM(Math.max(200, wpm - 10))}
                className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 ease-out hover:scale-110 active:scale-90 border border-slate-700 hover:border-slate-500"
                title="WPM -10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              
              <span 
                className={`text-lg sm:text-xl font-bold min-w-[3.5ch] text-center font-mono`}
                style={{ color: neonColor, textShadow: `0 0 10px ${neonColorGlow}` }}
              >
                {wpm}
              </span>
              
              {/* Plus Button */}
              <button
                onClick={() => setWPM(Math.min(1000, wpm + 10))}
                className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 ease-out hover:scale-110 active:scale-90 border border-slate-700 hover:border-slate-500"
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
                    background: `linear-gradient(to right, ${neonColor} 0%, ${neonColor} ${(wpm-200)/8}%, rgba(51,65,85,0.5) ${(wpm-200)/8}%, rgba(51,65,85,0.5) 100%)`,
                    height: '8px'
                  }}
                />
              </div>
            </div>
            
            {/* Editor Button */}
            <button
              onClick={openEditor}
              className={`relative w-11 h-11 sm:w-10 sm:h-10 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 min-w-[44px] ${words.length > 1 ? '' : ''}`}
              style={{ borderColor: neonColorDim }}
              title="Text bearbeiten (E)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              {words.length > 1 && (
                <span 
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: neonColor,
                    boxShadow: `0 0 8px ${neonColor}`
                  }} 
                />
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
                      setUploadSuccess(`${result.wordCount} Wörter geladen`);
                      setTimeout(() => setUploadSuccess(null), 3000);
                    }
                  } catch {
                    setUploadError('Fehler beim Laden der Datei.');
                  } finally {
                    setIsUploading(false);
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
              className={`w-11 h-11 sm:w-10 sm:h-10 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-105 active:scale-95 min-w-[44px] ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ borderColor: neonColorDim }}
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
              className={`w-11 h-11 sm:w-10 sm:h-10 ${terminalClass} text-slate-300 hover:text-red-400 flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 min-w-[44px]`}
              style={{ borderColor: neonColorDim }}
              title="Text löschen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className={`w-11 h-11 sm:w-10 sm:h-10 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 sm:ml-4 min-w-[44px]`}
              style={{ borderColor: neonColorDim }}
              title="Einstellungen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`w-11 h-11 sm:w-10 sm:h-10 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 min-w-[44px]`}
              style={{ borderColor: neonColorDim }}
              title="Vollbild (F)"
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Stats - TIME SAVED in HH:MM:SS format */}
          <div className="flex items-center gap-4">
            {/* CyberEye Time Saved Display */}
            <CyberEye 
              timeSaved={timeSaved} 
              neonColor={neonColor}
              className="hidden sm:block"
            />
            
            {/* Word Counter */}
            <div 
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 ${terminalClass} font-mono`}
              style={{ borderColor: neonColorDim }}
            >
              <span className={`text-sm font-bold`} style={{ color: neonColor }}>{currentIndex + 1} / {words.length}</span>
            </div>
          </div>
          
          {/* Color Picker Button */}
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => setShowColorPicker(true)}
              className={`w-11 h-11 sm:w-10 sm:h-10 ${terminalClass} flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 min-w-[44px]`}
              style={{ 
                borderColor: neonColor,
                color: neonColor,
                boxShadow: `0 0 10px ${neonColorGlow}`
              }}
              title="Neon Color"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"/>
                <path d="M12 2v6.5"/>
                <path d="M12 21.5v-6.5"/>
                <path d="M2 12h6.5"/>
                <path d="M21.5 12H15"/>
                <path d="M4.34 4.34l4.6 4.6"/>
                <path d="M19.66 19.66l-4.6-4.6"/>
                <path d="M4.34 19.66l4.6-4.6"/>
                <path d="M19.66 4.34l-4.6 4.6"/>
              </svg>
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
            isDarkMode={true}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontSizeLevel={fontSizeLevel}
            orpColor={orpColor}
            neonColor={neonColor}
            neonColorGlow={neonColorGlow}
            className="w-full max-w-5xl px-2 sm:px-4"
          />
          {/* Mobile touch hint */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 md:hidden">
            <span className={`text-xs ${mutedColorClass} opacity-50 font-mono`}>
              [TAP] PLAY/PAUSE • [SWIPE] NAV
            </span>
          </div>
        </div>
        
        {/* Bottom Controls */}
        <div 
          className={`px-3 sm:px-6 pb-6 sm:pb-8 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {/* Skip to Start */}
            <button
              onClick={() => goTo(0)}
              className={`w-12 h-12 sm:w-11 sm:h-11 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 min-w-[48px]`}
              style={{ borderColor: neonColorDim }}
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
              className={`w-14 h-14 sm:w-12 sm:h-12 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 select-none min-w-[56px]`}
              style={{ borderColor: neonColorDim }}
              title="Zurück (←)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            {/* Play/Pause */}
            <button 
              onClick={toggle} 
              className={`w-20 h-20 sm:w-16 sm:h-16 flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 active:scale-95 active:translate-y-0 shadow-lg min-w-[80px] sm:min-w-[64px] border-2 ${
                isPlaying 
                  ? 'bg-black text-white border-white' 
                  : 'text-black'
              }`}
              style={!isPlaying ? {
                backgroundColor: neonColor,
                borderColor: neonColor,
                boxShadow: `0 0 30px ${neonColorGlow}`
              } : {
                boxShadow: '0 0 20px rgba(255,255,255,0.3)'
              }}
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
              className={`w-14 h-14 sm:w-12 sm:h-12 ${terminalClass} text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 select-none min-w-[56px]`}
              style={{ borderColor: neonColorDim }}
              title="Vor (→)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          
          {/* Progress Bar - Draggable with word preview */}
          <div className="mt-4 sm:mt-6">
            <ProgressBar 
              progress={progress} 
              currentIndex={currentIndex}
              totalWords={words.length}
              words={words.map(w => w.text)}
              onSeek={goTo}
              isDarkMode={true} 
              neonColor={neonColor} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
