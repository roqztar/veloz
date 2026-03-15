import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceGender = 'male' | 'female' | 'off';

interface SpeechOptions {
  gender: VoiceGender;
  rate: number; // 0.5 to 2
  volume: number; // 0 to 1
  pitch: number; // 0 to 2
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [options, setOptions] = useState<SpeechOptions>({
    gender: 'off',
    rate: 1.6, // Faster for RSVP
    volume: 1,
    pitch: 1
  });
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
    
    // Voices may load asynchronously
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);

  // Get pitch based on gender
  const getPitch = useCallback((): number => {
    if (options.gender === 'female') return 1.15; // Higher pitch for female
    if (options.gender === 'male') return 0.85;   // Lower pitch for male
    return 1;
  }, [options.gender]);

  // Select voice based on gender preference
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (options.gender === 'off') return null;
    
    // Prefer German voices, fallback to English
    const langPattern = /^de-|^en-/;
    const langVoices = voices.filter(v => langPattern.test(v.lang));
    const candidates = langVoices.length > 0 ? langVoices : voices;
    
    if (options.gender === 'female') {
      // Look for female voice names - expanded list
      const femaleVoice = candidates.find(v => 
        /female|woman|girl|frau|weiblich|anna|maria|lena|sarah|julia|laura|sophie|emma|victoria|emily|julia|helena/i.test(v.name)
      );
      return femaleVoice || candidates[0] || null;
    } else {
      // Look for male voice names - expanded list
      const maleVoice = candidates.find(v => 
        /male|man|boy|mann|männlich|hans|peter|stefan|max|tom|david|john|michael|alex|daniel|jonas/i.test(v.name)
      );
      return maleVoice || candidates[0] || null;
    }
  }, [voices, options.gender]);

  const speak = useCallback((text: string, wpm?: number) => {
    if (options.gender === 'off' || !synthRef.current) return;
    
    // Cancel previous speech
    synthRef.current.cancel();
    
    const voice = getVoice();
    if (!voice) return;
    
    // Adjust rate based on WPM if provided (200-1000 WPM range)
    // Base rate 1.6 for ~300 WPM, scale up to 2.0 for higher WPM
    let rate = options.rate;
    if (wpm) {
      rate = Math.min(2.0, Math.max(1.2, 1.2 + (wpm - 200) / 800 * 0.8));
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.volume = options.volume;
    utterance.pitch = getPitch();
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [getVoice, getPitch, options]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const setGender = useCallback((gender: VoiceGender) => {
    const newPitch = gender === 'female' ? 1.15 : gender === 'male' ? 0.85 : 1;
    setOptions(prev => ({ ...prev, gender, pitch: newPitch }));
    if (gender === 'off') {
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
    options,
    setGender,
    setRate: (rate: number) => setOptions(prev => ({ ...prev, rate })),
    setVolume: (volume: number) => setOptions(prev => ({ ...prev, volume })),
    setPitch: (pitch: number) => setOptions(prev => ({ ...prev, pitch }))
  };
}
