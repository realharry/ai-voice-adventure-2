import React from 'react';
import { CompassIcon, SparklesIcon } from './IconComponents';
import type { Difficulty } from '../types';

interface StartScreenProps {
  onStartGame: (difficulty: Difficulty) => void;
  onLoadGame: () => void;
  isLoading: boolean;
  savedGameExists: boolean;
  onGoToIconGenerator: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onLoadGame, isLoading, savedGameExists, onGoToIconGenerator }) => {
  const difficultyButtonClass = "w-full inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-102 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300 button-glow-hover";

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
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-300 mb-4">Choose Your Challenge</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => onStartGame('Easy')} disabled={isLoading} className={difficultyButtonClass}>
                Easy
              </button>
              <button onClick={() => onStartGame('Medium')} disabled={isLoading} className={difficultyButtonClass}>
                Medium
              </button>
              <button onClick={() => onStartGame('Hard')} disabled={isLoading} className={difficultyButtonClass}>
                Hard
              </button>
            </div>
          </div>

          {savedGameExists && (
            <>
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-slate-400">or</span>
                    <div className="flex-grow border-t border-slate-600"></div>
                </div>
                <button
                  onClick={onLoadGame}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-cyan-300 bg-transparent border-2 border-cyan-500 rounded-lg shadow-lg hover:bg-cyan-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-102 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300 button-glow-hover"
                >
                  Load Quest
                </button>
            </>
          )}
        </div>
        <div className="mt-8 border-t border-slate-700 pt-6">
          <button
            onClick={onGoToIconGenerator}
            className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors duration-200 group"
          >
            <SparklesIcon className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            <span>Create an App Icon with AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;