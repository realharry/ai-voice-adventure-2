import React, { useState, useEffect, useRef } from 'react';

// For browser compatibility
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[event.resultIndex][0].transcript;
        setTranscript(result);
      };
    }
  }, []);

  const startListening = () => {
    if (isSupported && !isListening) {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const stopListening = () => {
    if (isSupported && isListening) {
      recognitionRef.current?.stop();
    }
  };

  return { isSupported, isListening, startListening, stopListening, transcript };
};
