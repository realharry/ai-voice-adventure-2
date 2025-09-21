import React, { useState, useCallback, useEffect } from 'react';
import type { GameState, Difficulty, InventoryItem, SpeechSettings } from './types';
import { getNextStep, generateImage } from './services/geminiService';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import LoadingSpinner from './components/LoadingSpinner';
import IconGenerator from './components/IconGenerator';
import QuickSaveToast from './components/QuickSaveToast';

const SAVE_GAME_KEY = 'geminiAdventureSave';
const SETTINGS_KEY = 'geminiAdventureSettings';

const defaultSpeechSettings: SpeechSettings = {
  enabled: false,
  voiceURI: null,
  rate: 1,
  pitch: 1,
};

type View = 'start' | 'game' | 'iconGenerator';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('start');
  const [savedGameExists, setSavedGameExists] = useState<boolean>(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState<boolean>(false);
  const [showQuickSaveToast, setShowQuickSaveToast] = useState<boolean>(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(defaultSpeechSettings);

  useEffect(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    setSavedGameExists(!!savedGame);
    
    const savedSettingsJSON = localStorage.getItem(SETTINGS_KEY);
    if (savedSettingsJSON) {
        try {
            const savedSettings = JSON.parse(savedSettingsJSON);
            setSpeechSettings(s => ({ ...s, ...savedSettings }));
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }
  }, []);
  
  const handleSpeechSettingsChange = useCallback((newSettings: Partial<SpeechSettings>) => {
      setSpeechSettings(prev => {
          const updatedSettings = { ...prev, ...newSettings };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
          return updatedSettings;
      });
  }, []);

  const handleImageGeneration = useCallback(async (prompt: string | undefined) => {
    if (!prompt) return;
    setIsGeneratingImage(true);
    const imageUrl = await generateImage(prompt); // Game uses default 4:3 ratio
    setCurrentImageUrl(imageUrl);
    setIsGeneratingImage(false);
  }, []);

  const handleApiCall = useCallback(async (choice: string | null, difficultyForCall: Difficulty = 'Medium') => {
    setIsLoading(true);
    setError(null);
    try {
      const currentInventory = gameState?.inventory ?? [];
      const currentHealth = gameState?.health ?? 100;
      const currentStatus = gameState?.status ?? null;
      const currentCombatState = gameState?.combatState ?? null;
      const newState = await getNextStep(choice, currentInventory, currentHealth, currentStatus, currentCombatState, difficultyForCall);
      setGameState(newState);
      if (!newState.isGameOver) {
         handleImageGeneration(newState.imagePrompt);
      } else {
        setCurrentImageUrl(null); // Clear image on game over
      }
      if (currentView !== 'game') {
        setCurrentView('game');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentView, handleImageGeneration, gameState]);

  const startGame = useCallback((selectedDifficulty: Difficulty) => {
    setGameState(null); // Ensure state from previous game is cleared
    setDifficulty(selectedDifficulty);
    localStorage.removeItem(SAVE_GAME_KEY); // Clear old save when starting new
    setSavedGameExists(false);
    handleApiCall(null, selectedDifficulty);
  }, [handleApiCall]);

  const makeChoice = useCallback((choicePrompt: string) => {
    handleApiCall(choicePrompt, difficulty);
  }, [handleApiCall, difficulty]);
  
  const handleCombineItems = useCallback((items: string[]) => {
    if (items.length < 2) return;
    const prompt = `Attempt to combine the following items: ${items.join(', ')}.`;
    handleApiCall(prompt, difficulty);
  }, [handleApiCall, difficulty]);

  const saveGame = useCallback(() => {
    if (gameState) {
      const dataToSave = { gameState, difficulty };
      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(dataToSave));
      setSavedGameExists(true);
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 2000);
    }
  }, [gameState, difficulty]);

  const loadGame = useCallback(() => {
    const savedGameJSON = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGameJSON) {
      try {
        const savedData = JSON.parse(savedGameJSON);
        let savedGameState = (savedData.gameState || savedData) as GameState;
        const savedDifficulty = (savedData.difficulty || 'Medium') as Difficulty;

        // Ensure compatibility with older saves
        if (savedGameState.health === undefined) savedGameState.health = 100;
        if (savedGameState.status === undefined) savedGameState.status = null;
        if (savedGameState.combatState === undefined) savedGameState.combatState = null;
        
        // Backward compatibility for inventory (string[] -> InventoryItem[])
        if (Array.isArray(savedGameState.inventory) && savedGameState.inventory.length > 0 && typeof (savedGameState.inventory as any)[0] === 'string') {
            savedGameState.inventory = ((savedGameState.inventory as unknown) as string[]).map((itemName): InventoryItem => ({
                name: itemName,
                description: 'An item from a bygone era, its secrets are yours to rediscover.'
            }));
        } else if (!Array.isArray(savedGameState.inventory)) {
            // If inventory is missing or not an array, reset it to prevent crashes.
            savedGameState.inventory = [];
        }

        setGameState(savedGameState);
        setDifficulty(savedDifficulty);
        setCurrentView('game');
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
    setCurrentView('start');
    setError(null);
    setCurrentImageUrl(null);
    setDifficulty('Medium');
    localStorage.removeItem(SAVE_GAME_KEY);
    setSavedGameExists(false);
  }, []);
  
  // Effect for Quick Save & Load keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;

        if (isCtrlOrCmd && event.key.toLowerCase() === 's') {
            event.preventDefault();
            if (currentView === 'game' && gameState) {
                saveGame();
                setShowQuickSaveToast(true);
                setTimeout(() => setShowQuickSaveToast(false), 2500);
            }
        }

        if (isCtrlOrCmd && event.key.toLowerCase() === 'l') {
            event.preventDefault();
            if (savedGameExists) {
                loadGame();
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [currentView, gameState, saveGame, loadGame, savedGameExists]);


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

    switch (currentView) {
      case 'iconGenerator':
        return <IconGenerator onBack={() => setCurrentView('start')} />;
      case 'game':
        if (gameState) {
          return <GameScreen 
            gameState={gameState} 
            onMakeChoice={makeChoice} 
            onResetGame={resetGame} 
            onSaveGame={saveGame} 
            onCombineItems={handleCombineItems}
            showSaveConfirmation={showSaveConfirmation}
            imageUrl={currentImageUrl}
            isGeneratingImage={isGeneratingImage}
            speechSettings={speechSettings}
            onSpeechSettingsChange={handleSpeechSettingsChange}
            isLoading={isLoading}
          />;
        }
        // Fallback to start if gameState is null
        return <StartScreen onStartGame={startGame} onLoadGame={loadGame} savedGameExists={savedGameExists} isLoading={isLoading} onGoToIconGenerator={() => setCurrentView('iconGenerator')} />;
      case 'start':
      default:
        return <StartScreen onStartGame={startGame} onLoadGame={loadGame} savedGameExists={savedGameExists} isLoading={isLoading} onGoToIconGenerator={() => setCurrentView('iconGenerator')} />;
    }
  };

  return (
    <main className="relative min-h-screen bg-slate-900 bg-gradient-to-b from-slate-900 to-gray-900 font-sans">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22none%22%20stroke%3D%22rgb(30%2041%2059%20/%200.4)%22%3E%3Cpath%20d%3D%22M0%20.5H31.5V32%22/%3E%3C/svg%3E')] opacity-30"></div>
      <div className="relative z-10">
        {isLoading && <LoadingSpinner />}
        {renderContent()}
        <QuickSaveToast show={showQuickSaveToast} />
      </div>
    </main>
  );
};

export default App;