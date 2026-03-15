import { useState, useEffect, useCallback, useRef } from 'react';

export type SpeechState = 'on' | 'off';

// eSpeak-js is a WebAssembly port of eSpeak - extremely fast but robotic sounding
// It can handle 300+ WPM easily
export function useSpeech() {
  const [enabled, setEnabled] = useState<SpeechState>('off');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const espeakRef = useRef<any>(null);

  // Initialize eSpeak on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    const initEspeak = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { default: espeak } = await import('espeak-js');
        
        if (!mounted) return;
        
        // Initialize eSpeak with German and English voices
        await espeak.load();
        
        if (!mounted) return;
        
        espeakRef.current = espeak;
        setIsLoaded(true);
        
        console.log('[eSpeak] Loaded successfully');
      } catch (err) {
        console.error('[eSpeak] Failed to load:', err);
      }
    };
    
    initEspeak();
    
    return () => {
      mounted = false;
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Detect language from text
  const detectLanguage = useCallback((text: string): 'de' | 'en' => {
    const germanPatterns = /[äöüß]|\b(der|die|das|und|ist|zu|den|mit|von|für|auf|sich|dem|ein|eine|nicht|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|machen|können|haben|ihr|sein|zum|war|oder|über|wie|noch|wurde|durch|mehr|zwei|sein|man|müssen|uns|wollen|ihnen|seine|vom|jetzt|immer|gegen|sehr|einfach|neu|gut|ganz|damit|ohne|lange|weil|wenn|diese|mein|etwas|keine|seit|nur|anderen|viele|mal|wo|weiß|dann|ihre|unter|eigene|deine|ob|wegen|weit|soll|diesem|beide|sagte|je|also|geht|beim|heute|trotz|gerade|eben|wohl|sieht|zwar|deshalb|während|bereits|bevor|sondern|sonst|etwa|meist|früher|weiter|wenig|niemand|zwischen|einmal|allenfalls|übrigens|schon|nochmal|natürlich|zusammen|danach|vorher|dadurch|deswegen|trotzdem)\b/gi;
    const germanMatches = (text.match(germanPatterns) || []).length;
    
    return germanMatches > 0 ? 'de' : 'en';
  }, []);

  const speak = useCallback(async (text: string, wpm: number = 275) => {
    if (enabled === 'off' || !espeakRef.current || !isLoaded) return;
    
    // Stop any current speech
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {}
      currentSourceRef.current = null;
    }
    
    try {
      setIsSpeaking(true);
      
      const lang = detectLanguage(text);
      const voice = lang === 'de' ? 'de' : 'en';
      
      // eSpeak uses words-per-minute directly!
      // Much better than Web Speech API's arbitrary rate
      const effectiveWPM = Math.min(400, Math.max(100, wpm));
      
      // Generate audio using eSpeak
      const audioData = espeakRef.current.synth(text, {
        voice: voice,
        speed: effectiveWPM, // eSpeak accepts WPM directly!
        pitch: 50, // 0-100
        amplitude: 100, // volume
      });
      
      if (!audioData || audioData.length === 0) {
        setIsSpeaking(false);
        return;
      }
      
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Convert to AudioBuffer
      const arrayBuffer = new Uint8Array(audioData).buffer;
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      // Play the audio
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        currentSourceRef.current = null;
      };
      
      currentSourceRef.current = source;
      source.start(0);
      
    } catch (err) {
      console.error('[eSpeak] Speak error:', err);
      setIsSpeaking(false);
    }
  }, [enabled, isLoaded, detectLanguage]);

  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {}
      currentSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const newState = prev === 'off' ? 'on' : 'off';
      if (newState === 'off') {
        stop();
      }
      return newState;
    });
  }, [stop]);

  const setState = useCallback((state: SpeechState) => {
    setEnabled(state);
    if (state === 'off') {
      stop();
    }
  }, [stop]);

  // Check if speech synthesis is available
  const isSupported = isLoaded;

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    enabled,
    toggle,
    setState,
    isLoaded
  };
}
