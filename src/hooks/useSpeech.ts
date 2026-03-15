import { useState, useCallback, useRef, useEffect } from 'react';

export type SpeechState = 'on' | 'off';

const TTS_SERVER_URL = 'http://localhost:3001';

export function useSpeech() {
  const [enabled, setEnabled] = useState<SpeechState>('off');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if TTS server is available
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${TTS_SERVER_URL}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          setServerAvailable(true);
          setIsLoaded(true);
        }
      } catch {
        setServerAvailable(false);
        setIsLoaded(true); // Still loaded, just not available
      }
    };
    
    checkServer();
    // Check every 10 seconds
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Detect language from text
  const detectLanguage = useCallback((text: string): 'de' | 'en' => {
    const germanPatterns = /[äöüß]|\b(der|die|das|und|ist|zu|den|mit|von|für|auf|sich|dem|ein|eine|nicht|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|machen|können|haben|ihr|sein|zum|war|oder|über|wie|noch|wurde|durch|mehr|zwei|sein|man|müssen|uns|wollen|ihnen|seine|vom|jetzt|immer|gegen|sehr|einfach|neu|gut|ganz|damit|ohne|lange|weil|wenn|diese|mein|etwas|keine|seit|nur|anderen|viele|mal|wo|weiß|dann|ihre|unter|eigene|deine|ob|wegen|weit|soll|diesem|beide|sagte|je|also|geht|beim|heute|trotz|gerade|eben|wohl|sieht|zwar|deshalb|während|bereits|bevor|sondern|sonst|etwa|meist|früher|weiter|wenig|niemand|zwischen|einmal|allenfalls|übrigens|schon|nochmal|natürlich|zusammen|danach|vorher|dadurch|deswegen|trotzdem)\b/gi;
    const germanMatches = (text.match(germanPatterns) || []).length;
    return germanMatches > 0 ? 'de' : 'en';
  }, []);

  const speak = useCallback(async (text: string, wpm: number = 275) => {
    if (enabled === 'off' || !serverAvailable) return;
    
    // Stop any current speech
    stop();
    
    try {
      setIsSpeaking(true);
      
      const lang = detectLanguage(text);
      
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Call local eSpeak server
      const response = await fetch(`${TTS_SERVER_URL}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, wpm, lang }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play audio
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
      
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[eSpeak] Error:', err);
      }
      setIsSpeaking(false);
    }
  }, [enabled, serverAvailable, detectLanguage]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: serverAvailable,
    enabled,
    toggle,
    setState,
    isLoaded,
    serverAvailable
  };
}
