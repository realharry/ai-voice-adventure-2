import React, { useState, useCallback, useEffect } from 'react';
import type { GameState } from './types';
import { getNextStep, generateImage } from './services/geminiService';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import LoadingSpinner from './components/LoadingSpinner';

const SAVE_GAME_KEY = 'geminiAdventureSave';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [savedGameExists, setSavedGameExists] = useState<boolean>(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState<boolean>(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  
  useEffect(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    setSavedGameExists(!!savedGame);
  }, []);

  const handleImageGeneration = useCallback(async (prompt: string | undefined) => {
    if (!prompt) return;
    setIsGeneratingImage(true);
    const imageUrl = await generateImage(prompt);
    setCurrentImageUrl(imageUrl);
    setIsGeneratingImage(false);
  }, []);

  const handleApiCall = useCallback(async (choice: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const newState = await getNextStep(choice);
      setGameState(newState);
      if (!newState.isGameOver) {
         handleImageGeneration(newState.imagePrompt);
      } else {
        setCurrentImageUrl(null); // Clear image on game over
      }
      if (!gameStarted) {
        setGameStarted(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [gameStarted, handleImageGeneration]);

  const startGame = useCallback(() => {
    localStorage.removeItem(SAVE_GAME_KEY); // Clear old save when starting new
    setSavedGameExists(false);
    handleApiCall(null);
  }, [handleApiCall]);

  const makeChoice = useCallback((choicePrompt: string) => {
    handleApiCall(choicePrompt);
  }, [handleApiCall]);
  
  const saveGame = useCallback(() => {
    if (gameState) {
      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameState));
      setSavedGameExists(true);
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 2000);
    }
  }, [gameState]);

  const loadGame = useCallback(() => {
    const savedGameJSON = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGameJSON) {
      try {
        const savedGameState = JSON.parse(savedGameJSON) as GameState;
        setGameState(savedGameState);
        setGameStarted(true);
        setError(null);
        handleImageGeneration(savedGameState.imagePrompt);
      } catch (e) {
        setError("Failed to load saved game. The data might be corrupted.");
        localStorage.removeItem(SAVE_GAME_KEY);
        setSavedGameExists(false);
      }
    }
  }, [handleImageGeneration]);

  const resetGame = useCallback(() => {
    setGameState(null);
    setGameStarted(false);
    setError(null);
    setCurrentImageUrl(null);
    localStorage.removeItem(SAVE_GAME_KEY);
    setSavedGameExists(false);
  }, []);

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center text-red-400">
          <p className="text-2xl mb-4">Error</p>
          <p>{error}</p>
          <button onClick={resetGame} className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-500">
            Start Over
          </button>
        </div>
      );
    }

    if (!gameStarted) {
      return <StartScreen onStartGame={startGame} onLoadGame={loadGame} savedGameExists={savedGameExists} isLoading={isLoading} />;
    }

    if (gameState) {
      return <GameScreen 
        gameState={gameState} 
        onMakeChoice={makeChoice} 
        onResetGame={resetGame} 
        onSaveGame={saveGame} 
        showSaveConfirmation={showSaveConfirmation}
        imageUrl={currentImageUrl}
        isGeneratingImage={isGeneratingImage}
      />;
    }
    
    // This state should ideally not be reached if loading is handled, but it's a safe fallback.
    return <StartScreen onStartGame={startGame} onLoadGame={loadGame} savedGameExists={savedGameExists} isLoading={isLoading} />;
  };

  return (
    <main className="relative min-h-screen bg-slate-900 bg-gradient-to-b from-slate-900 to-gray-900 font-sans">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22none%22%20stroke%3D%22rgb(30%2041%2059%20/%200.4)%22%3E%3Cpath%20d%3D%22M0%20.5H31.5V32%22/%3E%3C/svg%3E')] opacity-30"></div>
      <div className="relative z-10">
        {isLoading && <LoadingSpinner />}
        {renderContent()}
      </div>
    </main>
  );
};

export default App;