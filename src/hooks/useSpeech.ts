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
    rate: 2.0, // Maximum speed for RSVP - browser limit
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

  // Detect language from text (simple heuristic)
  const detectLanguage = useCallback((text: string): 'de' | 'en' => {
    // Check for German-specific characters and words
    const germanPatterns = /[äöüß]|\b(der|die|das|und|ist|zu|den|mit|von|für|auf|sich|dem|ein|eine|nicht|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|paar|machen|können|haben|ihr|sein|zum|war|oder|über|wie|noch|wurde|durch|mehr|zwei|sein|man|daß|müssen|uns|wollen|ihnen|seine|vom|jetzt|immer|gegen|sehr|einfach|neu|gut|ganz|damit|ohne|lange|weil|wenn|diese|mein|etwas|keine|seit|nur|anderen|viele|mal|wo|weiß|dann|ihre|unter|eigene|deine|ob|wegen|weit|soll|diesem|beide|sagte|je|also|geht|beim|heute|trotz|gerade|eben|wohl|sieht|zwar|deshalb|während|bereits|bevor|sondern|sonst|etwa|meist|früher|weiter|wenig|niemand|zwischen|einmal|allenfalls|übrigens|schon|nochmal|natürlich|zusammen|danach|vorher|dadurch|deswegen|trotzdem|des|ihm|ihn|uns|euch|ihnen|einen|einem|eines|einer|dieser|dieses|jener|jene|jenes|welcher|welche|welches|mancher|manche|jedoch|darum|woran|wovon|wobei|wohin|woher|worauf|woraus|worin|wodurch|wogegen|womit|worüber|wovor|wozu)\b/gi;
    const germanMatches = (text.match(germanPatterns) || []).length;
    
    // Check for English-specific patterns
    const englishPatterns = /\b(the|and|is|to|of|a|in|that|have|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us|are|was|were|been|have|has|had|do|does|did|will|shall|should|would|may|might|must|can|could|need|dare|ought|used|to|going|used|having)\b/gi;
    const englishMatches = (text.match(englishPatterns) || []).length;
    
    return germanMatches > englishMatches ? 'de' : 'en';
  }, []);

  // Get pitch based on gender
  const getPitch = useCallback((): number => {
    if (options.gender === 'female') return 1.15; // Higher pitch for female
    if (options.gender === 'male') return 0.85;   // Lower pitch for male
    return 1;
  }, [options.gender]);

  // Select voice based on gender and language preference
  const getVoice = useCallback((preferredLang?: 'de' | 'en'): SpeechSynthesisVoice | null => {
    if (options.gender === 'off') return null;
    
    // Get German and English voices separately
    const germanVoices = voices.filter(v => /^de-/.test(v.lang));
    const englishVoices = voices.filter(v => /^en-/.test(v.lang));
    
    // Choose language priority
    let primaryVoices: SpeechSynthesisVoice[] = [];
    let secondaryVoices: SpeechSynthesisVoice[] = [];
    
    if (preferredLang === 'de') {
      primaryVoices = germanVoices;
      secondaryVoices = englishVoices;
    } else if (preferredLang === 'en') {
      primaryVoices = englishVoices;
      secondaryVoices = germanVoices;
    } else {
      // Default: German first, then English
      primaryVoices = germanVoices;
      secondaryVoices = englishVoices;
    }
    
    // Combine with fallback to all voices
    const candidates = primaryVoices.length > 0 
      ? primaryVoices 
      : secondaryVoices.length > 0 
        ? secondaryVoices 
        : voices;
    
    if (options.gender === 'female') {
      // Look for female voice names - expanded for DE/EN
      const femaleVoice = candidates.find(v => 
        /female|woman|girl|frau|weiblich|anna|maria|lena|sarah|julia|laura|sophie|emma|victoria|emily|helena|samantha|victoria|kate|amy|joanna|salli|kimberly|kendra|joey|ivy|justin|matthew|geraint|nicole|russell|amy|emma|brian|cam|catherine|lucy|mathieu|chantal|celine|lea|louise|mads|naja|lotte|ruben|laura|linda|lisa|maja|marlene|mathilde|nora|therese|hannah|grace|ashley|libby|tiffany|microsoft|google/i.test(v.name)
      );
      return femaleVoice || candidates[0] || null;
    } else {
      // Look for male voice names - expanded for DE/EN
      const maleVoice = candidates.find(v => 
        /male|man|boy|mann|männlich|hans|peter|stefan|max|tom|david|john|michael|alex|daniel|jonas|james|robert|michael|william|david|joseph|thomas|christopher|daniel|paul|mark|donald|kenneth|steven|edward|brian|ronald|anthony|kevin|jason|matthew|gary|timothy|jose|larry|jeffrey|frank|scott|eric|stephen|andrew|raymond|gregory|joshua|jerry|dennis|walter|patrick|peter|harold|douglas|henry|carl|arthur|ryan|roger|joe|juan|jack|albert|jonathan|justin|terry|gerald|keith|samuel|willie|ralph|lawrence|nicholas|roy|benjamin|bruce|brandon|adam|harry|fred|wayne|bill|steve|howard|ernest|philip|todd|craig|alan|philip|carl|daryl|matt|nate|tony|chris|sean|kyle|jordan|liam|noah|oliver|elijah|lucas|mason|ethan|logan|aiden|jayden|william|alexander|benjamin|samuel|henry|jacob|owen|dylan|luke|gabriel|anthony|isaac|grayson|jackson|levi|mateo|david|wyatt|carter|julian|ryan|jaxon|nathan|adrian|eli|aaron|charles|thomas|hunter|christian|connor|ezra|landon|adrian|jonathan|nolan|jeremiah|easton|emmett|colton|josiah|roman|axel|hudson|silas|jordan|atlas|ryker|luke|cole|charlie|sam|dean|microsoft|google/i.test(v.name)
      );
      return maleVoice || candidates[0] || null;
    }
  }, [voices, options.gender]);

  const speak = useCallback((text: string, wpm?: number) => {
    if (options.gender === 'off' || !synthRef.current) return;
    
    // Cancel previous speech
    synthRef.current.cancel();
    
    // Detect language from text
    const detectedLang = detectLanguage(text);
    
    // Get voice for detected language
    const voice = getVoice(detectedLang);
    if (!voice) return;
    
    // Adjust rate based on WPM - always use max speed to keep up with RSVP
    // Browser TTS needs to be at maximum to not fall behind
    let rate = options.rate;
    if (wpm) {
      // Always use max rate (2.0) for RSVP - speech will be cut off by next word anyway
      // This prevents words from overlapping/piling up
      rate = 2.0;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang; // Ensure correct language is set
    utterance.rate = rate;
    utterance.volume = options.volume;
    utterance.pitch = getPitch();
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [getVoice, getPitch, detectLanguage, options]);

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
    setRate: (rate: number) => setOptions(prev => ({ ...prev, rate: Math.min(2.0, Math.max(0.5, rate)) })),
    setVolume: (volume: number) => setOptions(prev => ({ ...prev, volume: Math.min(1, Math.max(0, volume)) })),
    setPitch: (pitch: number) => setOptions(prev => ({ ...prev, pitch: Math.min(2, Math.max(0, pitch)) }))
  };
}
