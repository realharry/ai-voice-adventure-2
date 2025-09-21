import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon } from './IconComponents';

interface IconGeneratorProps {
  onBack: () => void;
}

const IconGenerator: React.FC<IconGeneratorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState<string>('A simple, abstract, geometric logo for a tech startup, minimalist, clean, vector style, blue and cyan gradient.');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const result = await generateImage(prompt, '1:1');
      if (result) {
        setImageUrl(result);
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } catch (e) {
      console.error('Image generation error:', e);
      setError('An unexpected error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full bg-slate-800/50 rounded-2xl shadow-2xl p-8 border border-slate-700 backdrop-blur-sm relative">
        <button onClick={onBack} className="absolute top-4 left-4 text-slate-400 hover:text-cyan-400 transition-colors">
          &larr; Back to Adventure
        </button>

        <div className="flex items-center justify-center mb-6 pt-4">
          <SparklesIcon className="w-12 h-12 mr-4 text-cyan-400" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Icon Generator
          </h1>
        </div>

        <p className="text-slate-300 mb-6 text-center">
          Use the power of Gemini to create a unique icon. Describe your vision below and bring it to life.
        </p>

        <div className="mb-4">
          <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-300 mb-2">
            Describe your icon:
          </label>
          <textarea
            id="prompt-input"
            rows={3}
            className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A minimalist fox logo, origami style"
          />
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-102 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300 button-glow-hover"
        >
          {isLoading ? 'Generating...' : 'Generate Icon'}
        </button>
        
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

        <div className="mt-8">
          <div className="aspect-square w-full max-w-sm mx-auto bg-slate-900/50 rounded-lg flex items-center justify-center relative border border-slate-700">
            {imageUrl && !isLoading && (
              <img src={imageUrl} alt={prompt} className="w-full h-full object-cover rounded-lg" />
            )}
            
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center text-cyan-300">
                  <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-sm">Conjuring icon...</p>
                </div>
              </div>
            )}

            {!imageUrl && !isLoading && (
              <div className="text-slate-500 text-center p-4">
                Your generated icon will appear here.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default IconGenerator;