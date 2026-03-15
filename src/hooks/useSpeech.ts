import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceGender = 'male' | 'female' | 'off';

interface SpeechOptions {
  gender: VoiceGender;
  rate: number; // 0.5 to 2
  volume: number; // 0 to 1
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [options, setOptions] = useState<SpeechOptions>({
    gender: 'off',
    rate: 1.2,
    volume: 1
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

  // Select voice based on gender preference
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (options.gender === 'off') return null;
    
    // Prefer German voices, fallback to English
    const langPattern = /^de-|^en-/;
    const langVoices = voices.filter(v => langPattern.test(v.lang));
    const candidates = langVoices.length > 0 ? langVoices : voices;
    
    if (options.gender === 'female') {
      // Look for female voice names
      const femaleVoice = candidates.find(v => 
        /female|woman|girl|frau|weiblich|anna|lena|sarah/i.test(v.name)
      );
      return femaleVoice || candidates[0] || null;
    } else {
      // Look for male voice names
      const maleVoice = candidates.find(v => 
        /male|man|boy|mann|männlich|hans|peter|stefan/i.test(v.name)
      );
      return maleVoice || candidates[0] || null;
    }
  }, [voices, options.gender]);

  const speak = useCallback((text: string) => {
    if (options.gender === 'off' || !synthRef.current) return;
    
    // Cancel previous speech
    synthRef.current.cancel();
    
    const voice = getVoice();
    if (!voice) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = options.rate;
    utterance.volume = options.volume;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [getVoice, options]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const setGender = useCallback((gender: VoiceGender) => {
    setOptions(prev => ({ ...prev, gender }));
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
    setVolume: (volume: number) => setOptions(prev => ({ ...prev, volume }))
  };
}
