import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface TTSSettings {
  enabled: boolean;
  voice: string | null;
  rate: number; // 0.1 to 10, default 1
  pitch: number; // 0 to 2, default 1
  volume: number; // 0 to 1, default 1
  autoReadHeadings: boolean;
  highlightText: boolean;
  autoReadFocus: boolean; // Read focused elements via tab navigation
}

export interface TTSContextType {
  // Settings
  settings: TTSSettings;
  updateSettings: (settings: Partial<TTSSettings>) => void;
  
  // State
  isSpeaking: boolean;
  isPaused: boolean;
  isAvailable: boolean;
  
  // Available voices
  voices: SpeechSynthesisVoice[];
  
  // Controls
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  readSelection: () => void;
  readPage: () => void;
}

export const TTSContext = createContext<TTSContextType | null>(null);

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: false,
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  autoReadHeadings: false,
  highlightText: true,
  autoReadFocus: true,
};

const TTSProviderContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation('common');
  const [settings, setSettings] = useState<TTSSettings>(() => {
    try {
      const stored = localStorage.getItem('tts-settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('Failed to load TTS settings from localStorage:', error);
      return DEFAULT_SETTINGS;
    }
  });
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isAvailable] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const previousLanguageRef = useRef<string>(i18n.language);

  // Helper function to get appropriate voice for current language
  const getVoiceForLanguage = useCallback((currentLang: string): SpeechSynthesisVoice | null => {
    if (voices.length === 0) {
      console.log('[TTS] No voices available yet');
      return null;
    }
    
    // Map language codes to language prefixes for voice matching
    const langMap: Record<string, string[]> = {
      'en': ['en-US', 'en-GB', 'en'],
      'fr': ['fr-FR', 'fr-CA', 'fr'],
      'ar': ['ar-SA', 'ar-AE', 'ar'],
      'tn': ['ar-TN', 'ar-DZ', 'ar'], // Tunisian Arabic similar to Algerian
    };
    
    const preferredLangs = langMap[currentLang] || [currentLang];
    console.log(`[TTS] Looking for voice for language: ${currentLang}, trying: ${preferredLangs.join(', ')}`);
    
    // First, try exact match
    for (const lang of preferredLangs) {
      const voice = voices.find(v => v.lang.startsWith(lang));
      if (voice) {
        console.log(`[TTS] ✓ Found matching voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }
    
    console.warn(`[TTS] ⚠️ No ${currentLang} voice found on this system!`);
    console.log('[TTS] Available voice languages:', [...new Set(voices.map(v => v.lang.split('-')[0]))].join(', '));
    
    // Fallback: try to find any voice starting with the language code
    const fallbackVoice = voices.find(v => v.lang.split('-')[0] === currentLang);
    if (fallbackVoice) {
      console.log(`[TTS] Using fallback voice: ${fallbackVoice.name} (${fallbackVoice.lang})`);
      return fallbackVoice;
    }
    
    // Last resort: Use English or first available voice for consistency
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      console.log(`[TTS] ⚠️ Using English fallback: ${englishVoice.name} (${englishVoice.lang})`);
      return englishVoice;
    }
    
    console.log(`[TTS] Using first available voice: ${voices[0]?.name} (${voices[0]?.lang})`);
    return voices[0] || null;
  }, [voices]);

  // Load voices
  useEffect(() => {
    if (!isAvailable) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Don't set a default voice - let getVoiceForLanguage select based on current language
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isAvailable]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tts-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save TTS settings to localStorage:', error);
    }
  }, [settings]);

  // Update speaking state
  useEffect(() => {
    if (!isAvailable) return;

    const interval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
      setIsPaused(window.speechSynthesis.paused);
    }, 100);

    return () => clearInterval(interval);
  }, [isAvailable]);

  // Listen for language changes and stop current speech
  useEffect(() => {
    const currentLanguage = i18n.language;
    const previousLanguage = previousLanguageRef.current;
    
    // Only act if the language actually changed
    if (currentLanguage !== previousLanguage) {
      console.log(`[TTS] Language changed from ${previousLanguage} to ${currentLanguage}`);
      previousLanguageRef.current = currentLanguage;
      
      // Stop any currently speaking utterance when language changes
      // This allows new speech to be generated in the new language
      if (isSpeaking) {
        console.log('[TTS] Stopping current speech due to language change');
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
      }
    }
  }, [i18n.language, isSpeaking]);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const speak = useCallback((text: string) => {
    if (!isAvailable || !text.trim()) {
      console.log('[TTS] Cannot speak - not available or empty text');
      return;
    }
    
    if (!settings.enabled) {
      console.log('[TTS] TTS is disabled in settings');
      return;
    }

    console.log(`[TTS] Starting speech: "${text.substring(0, 50)}..."`);

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get current language from i18n
    const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
    
    // Always auto-select voice based on current language (ignore saved voice setting)
    const langVoice = getVoiceForLanguage(currentLang);
    if (langVoice) {
      utterance.voice = langVoice;
      utterance.lang = langVoice.lang;
      console.log(`[TTS] Speaking in ${currentLang} with voice: ${langVoice.name} (${langVoice.lang})`);
    } else {
      console.warn(`[TTS] No voice found for language: ${currentLang}, using default`);
    }
    
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    console.log(`[TTS] Settings - Rate: ${settings.rate}, Pitch: ${settings.pitch}, Volume: ${settings.volume}`);

    // Event handlers
    utterance.onstart = () => {
      console.log('[TTS] Speech started');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('[TTS] Speech ended');
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      console.error('[TTS] Speech error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    console.log('[TTS] Calling speechSynthesis.speak()');
    window.speechSynthesis.speak(utterance);
  }, [isAvailable, settings, i18n, getVoiceForLanguage]);

  const pause = useCallback(() => {
    if (!isAvailable) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isAvailable]);

  const resume = useCallback(() => {
    if (!isAvailable) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isAvailable]);

  const stop = useCallback(() => {
    if (!isAvailable) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [isAvailable]);

  const readSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      speak(text);
    }
  }, [speak]);

  const readPage = useCallback(() => {
    // Get main content, skip navigation and UI elements
    const main = document.querySelector('main');
    if (!main) return;

    // Get all text content, filter out interactive elements
    const walker = document.createTreeWalker(
      main,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip buttons, inputs, and hidden elements
          if (
            parent.closest('button, input, textarea, select, nav, [aria-hidden="true"]') ||
            window.getComputedStyle(parent).display === 'none'
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let text = '';
    let node;
    while ((node = walker.nextNode())) {
      const content = node.textContent?.trim();
      if (content) {
        text += content + ' ';
      }
    }

    if (text) {
      speak(text);
    }
  }, [speak]);

  // Auto-read focused elements (tab navigation)
  useEffect(() => {
    if (!settings.autoReadFocus || !settings.enabled) return;

    const handleFocus = (e: FocusEvent) => {
      const element = e.target as HTMLElement;
      if (!element) return;

      // Skip certain elements that shouldn't be read
      if (
        element.tagName === 'BODY' ||
        element.tagName === 'HTML' ||
        element.getAttribute('aria-hidden') === 'true' ||
        window.getComputedStyle(element).display === 'none'
      ) {
        return;
      }

      // Get readable text
      let text = '';
      
      // For input/textarea, use the value
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        text = element.value || element.placeholder || element.getAttribute('aria-label') || '';
      }
      // For buttons/links, use the text content
      else if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        text = element.textContent?.trim() || element.getAttribute('aria-label') || '';
      }
      // For form labels, try to find associated input label
      else if (element.tagName === 'LABEL') {
        text = element.textContent?.trim() || '';
      }
      // For other elements, use text content or aria-label
      else {
        text = element.getAttribute('aria-label') || element.textContent?.trim() || '';
      }

      // Clean and speak if we have text
      text = text.replace(/\s+/g, ' ').trim();
      if (text && text.length > 0) {
        // Cancel any previous speech and read new text
        window.speechSynthesis.cancel();
        speak(text);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    return () => document.removeEventListener('focus', handleFocus, true);
  }, [settings.autoReadFocus, settings.enabled, speak]);

  const value: TTSContextType = {
    settings,
    updateSettings,
    isSpeaking,
    isPaused,
    isAvailable,
    voices,
    speak,
    pause,
    resume,
    stop,
    readSelection,
    readPage,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
};

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <TTSProviderContent>{children}</TTSProviderContent>;
};
