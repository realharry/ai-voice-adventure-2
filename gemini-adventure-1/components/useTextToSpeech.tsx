import React, { useState, useEffect, useCallback } from 'react';
import type { SpeechSettings } from '../types';

export const useTextToSpeech = (settings: SpeechSettings) => {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !settings.enabled || !text) {
      return;
    }
    
    // Cancel any ongoing speech before starting a new one
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
    
    utterance.voice = selectedVoice || null;
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [isSupported, settings, voices]);
  
  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, voices, speak, cancel, isSpeaking };
};
