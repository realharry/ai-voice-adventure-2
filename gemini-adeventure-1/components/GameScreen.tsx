import React from 'react';
import type { GameState, Choice } from '../types';
import { BackpackIcon, ScrollIcon, CompassIcon } from './IconComponents';

interface GameScreenProps {
  gameState: GameState;
  onMakeChoice: (choicePrompt: string) => void;
  onResetGame: () => void;
  onSaveGame: () => void;
  showSaveConfirmation: boolean;
  imageUrl: string | null;
  isGeneratingImage: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, onMakeChoice, onResetGame, onSaveGame, showSaveConfirmation, imageUrl, isGeneratingImage }) => {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Panel */}
          <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
            <div className="flex items-center mb-4 border-b border-slate-600 pb-3">
              <ScrollIcon className="w-8 h-8 mr-3 text-cyan-400" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Your Story
              </h2>
            </div>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
              {gameState.story}
            </p>
          </div>

          {/* Side Panel (Inventory & Image) */}
          <div className="space-y-8">
            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
              <div className="flex items-center mb-4 border-b border-slate-600 pb-3">
                <BackpackIcon className="w-8 h-8 mr-3 text-cyan-400" />
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Inventory
                </h2>
              </div>
              {gameState.inventory.length > 0 ? (
                <ul className="space-y-2">
                  {gameState.inventory.map((item, index) => (
                    <li key={index} className="text-slate-300 capitalize text-lg">
                      - {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic">Your pockets are empty.</p>
              )}
            </div>
             <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
                <div className="aspect-[4/3] w-full bg-slate-900/50 rounded-lg flex items-center justify-center mb-4 relative">
                    {/* Display current image if available */}
                    {imageUrl && (
                        <img src={imageUrl} alt={gameState.imagePrompt} className="w-full h-full object-cover rounded-lg" />
                    )}
                    
                    {/* Loading overlay/spinner */}
                    {isGeneratingImage && (
                        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-lg">
                            <div className="flex flex-col items-center text-cyan-300">
                                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-sm">{imageUrl ? 'Conjuring next scene...' : 'Conjuring scene...'}</p>
                            </div>
                        </div>
                    )}

                    {/* Placeholder if no image and not loading */}
                    {!imageUrl && !isGeneratingImage && (
                        <div className="text-slate-500 text-center p-4">
                            {gameState.isGameOver ? "The vision fades." : "An image of your surroundings will appear here."}
                        </div>
                    )}
                </div>
                <p className="text-slate-400 text-sm italic">{gameState.imagePrompt}</p>
             </div>
          </div>
        </div>

        {/* Choices / Game Over Panel */}
        <div className="mt-8 bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4 border-b border-slate-600 pb-3">
             <div className="flex items-center">
                <CompassIcon className="w-8 h-8 mr-3 text-cyan-400" />
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {gameState.isGameOver ? 'The End' : 'What will you do?'}
                </h2>
             </div>
             {!gameState.isGameOver && (
                <button
                    onClick={onSaveGame}
                    disabled={showSaveConfirmation}
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-lg shadow-md hover:bg-slate-500 disabled:bg-green-500 disabled:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                    {showSaveConfirmation ? 'Saved!' : 'Save Game'}
                </button>
             )}
          </div>
          {gameState.isGameOver ? (
            <div className="text-center">
              <button
                onClick={onResetGame}
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300"
              >
                Play Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => onMakeChoice(choice.prompt)}
                  className="w-full text-left p-4 bg-slate-700 rounded-lg hover:bg-cyan-700/50 border border-slate-600 hover:border-cyan-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <p className="font-semibold text-slate-100">{choice.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;