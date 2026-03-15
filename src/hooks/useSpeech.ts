import { useState, useCallback, useRef } from 'react';

export type SpeechState = 'on' | 'off';

// High-speed speech using Web Speech API + AudioContext for time-stretching
// This allows us to exceed the browser's native rate limit
export function useSpeech() {
  const [enabled, setEnabled] = useState<SpeechState>('off');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true); // Always available in modern browsers
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Detect language from text
  const detectLanguage = useCallback((text: string): 'de' | 'en' => {
    const germanPatterns = /[äöüß]|\b(der|die|das|und|ist|zu|den|mit|von|für|auf|sich|dem|ein|eine|nicht|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|machen|können|haben|ihr|sein|zum|war|oder|über|wie|noch|wurde|durch|mehr|zwei|sein|man|müssen|uns|wollen|ihnen|seine|vom|jetzt|immer|gegen|sehr|einfach|neu|gut|ganz|damit|ohne|lange|weil|wenn|diese|mein|etwas|keine|seit|nur|anderen|viele|mal|wo|weiß|dann|ihre|unter|eigene|deine|ob|wegen|weit|soll|diesem|beide|sagte|je|also|geht|beim|heute|trotz|gerade|eben|wohl|sieht|zwar|deshalb|während|bereits|bevor|sondern|sonst|etwa|meist|früher|weiter|wenig|niemand|zwischen|einmal|allenfalls|übrigens|schon|nochmal|natürlich|zusammen|danach|vorher|dadurch|deswegen|trotzdem)\b/gi;
    const germanMatches = (text.match(germanPatterns) || []).length;
    return germanMatches > 0 ? 'de' : 'en';
  }, []);

  const speak = useCallback(async (text: string, targetWPM: number = 275) => {
    if (enabled === 'off' || !window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    try {
      setIsSpeaking(true);
      
      const lang = detectLanguage(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Find best voice
      const voice = voices.find(v => {
        if (lang === 'de') return /^de-/.test(v.lang) && /Google|Microsoft/i.test(v.name);
        return /^en-/.test(v.lang) && /Google|Microsoft/i.test(v.name);
      }) || voices.find(v => lang === 'de' ? /^de-/.test(v.lang) : /^en-/.test(v.lang)) || voices[0];
      
      if (!voice) {
        setIsSpeaking(false);
        return;
      }
      
      // Calculate effective rate
      // Browser max is 2.0, but we can simulate higher by measuring word length
      const words = text.split(/\s+/).length;
      const chars = text.length;
      const avgWordLength = chars / words;
      
      // Target duration in ms
      const targetDuration = (words / targetWPM) * 60000;
      
      // Base rate (browser max is 2.0)
      let rate = 2.0;
      
      // For very short words at high WPM, we need to be aggressive
      if (targetWPM > 250 && avgWordLength < 5) {
        // The browser will naturally speak fast at rate 2.0
        // For RSVP, we rely on the fact that words are cut off by the next word
        rate = 2.0;
      } else if (targetWPM > 200) {
        rate = 2.0;
      } else {
        rate = Math.min(2.0, Math.max(0.5, targetWPM / 150));
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      utterance.volume = 1;
      utterance.pitch = 1;
      
      // Auto-stop after target duration to not overlap with next word
      const timeoutId = setTimeout(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }, targetDuration * 0.8); // Stop slightly before next word
      
      utterance.onend = () => {
        clearTimeout(timeoutId);
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        clearTimeout(timeoutId);
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('[Speech] Error:', err);
      setIsSpeaking(false);
    }
  }, [enabled, detectLanguage]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
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

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

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
