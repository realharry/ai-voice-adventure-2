import React from 'react';
import { CompassIcon } from './IconComponents';

interface StartScreenProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  isLoading: boolean;
  savedGameExists: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onLoadGame, isLoading, savedGameExists }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-2xl w-full bg-slate-800/50 rounded-2xl shadow-2xl p-8 border border-slate-700 backdrop-blur-sm">
        <CompassIcon className="w-24 h-24 mx-auto mb-6 text-cyan-400" />
        <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Gemini Adventure
        </h1>
        <p className="text-lg text-slate-300 mb-8 max-w-lg mx-auto">
          Your story awaits. Every choice you make crafts a unique journey in a world
          conjured by Gemini. No two adventures are the same.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStartGame}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300"
            >
              {isLoading ? 'Starting...' : 'Begin Your Quest'}
            </button>
            {savedGameExists && (
               <button
                  onClick={onLoadGame}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-cyan-300 bg-transparent border-2 border-cyan-500 rounded-lg shadow-lg hover:bg-cyan-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300"
               >
                 Load Quest
               </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
