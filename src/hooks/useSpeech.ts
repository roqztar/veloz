import { useState, useEffect, useCallback, useRef } from 'react';

export type SpeechState = 'on' | 'off';

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [enabled, setEnabled] = useState<SpeechState>('off');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      setVoices(availableVoices);
    };
    
    loadVoices();
    
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);

  // Detect language from text
  const detectLanguage = useCallback((text: string): 'de' | 'en' => {
    const germanPatterns = /[äöüß]|\b(der|die|das|und|ist|zu|den|mit|von|für|auf|sich|dem|ein|eine|nicht|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|paar|machen|können|haben|ihr|sein|zum|war|oder|über|wie|noch|wurde|durch|mehr|zwei|sein|man|daß|müssen|uns|wollen|ihnen|seine|vom|jetzt|immer|gegen|sehr|einfach|neu|gut|ganz|damit|ohne|lange|weil|wenn|diese|mein|etwas|keine|seit|nur|anderen|viele|mal|wo|weiß|dann|ihre|unter|eigene|deine|ob|wegen|weit|soll|diesem|beide|sagte|je|also|geht|beim|heute|trotz|gerade|eben|wohl|sieht|zwar|deshalb|während|bereits|bevor|sondern|sonst|etwa|meist|früher|weiter|wenig|niemand|zwischen|einmal|allenfalls|übrigens|schon|nochmal|natürlich|zusammen|danach|vorher|dadurch|deswegen|trotzdem)\b/gi;
    const germanMatches = (text.match(germanPatterns) || []).length;
    
    const englishPatterns = /\b(the|and|is|to|of|a|in|that|have|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us|are|was|were|been|have|has|had|will|shall|should|may|might|must|need|used|having)\b/gi;
    const englishMatches = (text.match(englishPatterns) || []).length;
    
    return germanMatches > englishMatches ? 'de' : 'en';
  }, []);

  // Get the best voice for high-speed RSVP reading
  // Always picks the fastest/most responsive voice available
  const getBestVoice = useCallback((preferredLang?: 'de' | 'en'): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;
    
    // Get German and English voices separately
    const germanVoices = voices.filter(v => /^de-/.test(v.lang));
    const englishVoices = voices.filter(v => /^en-/.test(v.lang));
    
    // Choose language priority
    let candidates: SpeechSynthesisVoice[] = [];
    if (preferredLang === 'de') {
      candidates = germanVoices.length > 0 ? germanVoices : englishVoices;
    } else if (preferredLang === 'en') {
      candidates = englishVoices.length > 0 ? englishVoices : germanVoices;
    } else {
      candidates = germanVoices.length > 0 ? germanVoices : englishVoices.length > 0 ? englishVoices : voices;
    }
    
    if (candidates.length === 0) candidates = voices;
    
    // Priority for high-speed reading:
    // 1. Google voices (best for fast reading)
    const googleVoice = candidates.find(v => /Google\s+(?:US|UK|Deutsch)/i.test(v.name) || /^Google\s/i.test(v.name));
    if (googleVoice) return googleVoice;
    
    // 2. Microsoft voices (good for fast reading)
    const msVoice = candidates.find(v => /Microsoft/i.test(v.name) && !/Mobile/i.test(v.name));
    if (msVoice) return msVoice;
    
    // 3. Any enhanced/neural voice
    const enhancedVoice = candidates.find(v => /Enhanced|Premium|Neural/i.test(v.name));
    if (enhancedVoice) return enhancedVoice;
    
    // 4. First available voice
    return candidates[0];
  }, [voices]);

  const speak = useCallback((text: string, _wpm?: number) => {
    if (enabled === 'off' || !synthRef.current) return;
    
    // Cancel previous speech immediately
    synthRef.current.cancel();
    
    // Detect language
    const detectedLang = detectLanguage(text);
    
    // Get best voice
    const voice = getBestVoice(detectedLang);
    if (!voice) return;
    
    // Always use maximum rate (2.0) for RSVP - this is the browser limit
    // The speech will be cut off by the next word, but that's intentional
    // to keep up with the reading pace
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 2.0; // Maximum browser limit
    utterance.volume = 1;
    utterance.pitch = 1;  // Neutral pitch
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [enabled, getBestVoice, detectLanguage]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
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

  // Check if speech synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    enabled,
    toggle,
    setState,
    currentVoice: voices.length > 0 ? getBestVoice() : null
  };
}
