import { useContext } from 'react';
import type { TTSContextType } from './TTSContext';
import { TTSContext } from './TTSContext';

export const useTTS = (): TTSContextType => {
  const context = useContext(TTSContext);
  
  if (!context) {
    // Return a safe default instead of throwing
    return {
      settings: {
        enabled: false,
        voice: null,
        rate: 1,
        pitch: 1,
        volume: 1,
        autoReadHeadings: false,
        highlightText: false,
        autoReadFocus: true,
      },
      updateSettings: () => {},
      isSpeaking: false,
      isPaused: false,
      isAvailable: false,
      voices: [],
      speak: () => {},
      pause: () => {},
      resume: () => {},
      stop: () => {},
      readSelection: () => {},
      readPage: () => {},
    };
  }
  
  return context;
};
