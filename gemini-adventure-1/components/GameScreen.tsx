import React, { useState, useEffect, useRef } from 'react';
import type { GameState, SpeechSettings } from '../types';
import { MAX_INVENTORY_SIZE } from '../types';
import { BackpackIcon, ScrollIcon, CompassIcon, WrenchIcon, HeartIcon, ShieldIcon, CombineIcon, SpeakerOnIcon, SpeakerOffIcon, SettingsIcon, MicrophoneIcon, SwordIcon } from './IconComponents';
import StatusEffectParticles from './StatusEffectParticles';
import SettingsModal from './SettingsModal';
import { useTextToSpeech } from './useTextToSpeech';
import { useSpeechRecognition } from './useSpeechRecognition';


interface GameScreenProps {
  gameState: GameState;
  onMakeChoice: (choicePrompt: string) => void;
  onResetGame: () => void;
  onSaveGame: () => void;
  onCombineItems: (itemNames: string[]) => void;
  showSaveConfirmation: boolean;
  imageUrl: string | null;
  isGeneratingImage: boolean;
  speechSettings: SpeechSettings;
  onSpeechSettingsChange: (newSettings: Partial<SpeechSettings>) => void;
  isLoading: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ 
    gameState, 
    onMakeChoice, 
    onResetGame, 
    onSaveGame, 
    onCombineItems, 
    showSaveConfirmation, 
    imageUrl, 
    isGeneratingImage,
    speechSettings,
    onSpeechSettingsChange,
    isLoading
}) => {
  const [storyKey, setStoryKey] = React.useState(0);
  const prevStatusRef = React.useRef<string | null | undefined>(undefined);
  const [statusEffect, setStatusEffect] = React.useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [healthAnimation, setHealthAnimation] = useState('');
  const prevHealthRef = useRef<number>(gameState.health);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const tts = useTextToSpeech(speechSettings);
  const stt = useSpeechRecognition();

  const prevEnemyHealthRef = useRef<number | undefined>(gameState.combatState?.enemyHealth);
  const [enemyHealthBarAnimation, setEnemyHealthBarAnimation] = useState('');
  
  // Handle narration
  useEffect(() => {
    if (speechSettings.enabled && gameState.story) {
        let textToRead = gameState.story;
        if (!gameState.isGameOver && gameState.choices.length > 0) {
            textToRead += "\n\nYour choices are: \n" + gameState.choices.map((c, i) => `Option ${i + 1}: ${c.text}`).join('.\n');
        }
        tts.speak(textToRead);
    }
    
    // Cleanup function to stop speech when component unmounts or story changes
    return () => {
      tts.cancel();
    };
  }, [gameState.story, gameState.choices, speechSettings.enabled, tts.speak, tts.cancel, gameState.isGameOver]);
  
  // Handle voice commands
  useEffect(() => {
    if (stt.transcript) {
        const cleanedTranscript = stt.transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const match = cleanedTranscript.match(/(?:option|choose|select)\s*(\d+)/);
        if (match) {
            const choiceIndex = parseInt(match[1], 10) - 1;
            if (choiceIndex >= 0 && choiceIndex < gameState.choices.length) {
                onMakeChoice(gameState.choices[choiceIndex].prompt);
            }
        }
    }
  }, [stt.transcript, gameState.choices, onMakeChoice]);

  React.useEffect(() => {
    setStoryKey(prevKey => prevKey + 1);
  }, [gameState.story]);

  // Scroll to top when the story changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [gameState.story]);

  useEffect(() => {
    const currentHealth = gameState.health ?? 100;
    if (prevHealthRef.current !== currentHealth) {
        if (currentHealth < prevHealthRef.current) {
            setHealthAnimation('animate-health-loss');
        } else if (currentHealth > prevHealthRef.current) {
            setHealthAnimation('animate-health-gain');
        }
        
        const timer = setTimeout(() => setHealthAnimation(''), 600);
        
        prevHealthRef.current = currentHealth;
        return () => clearTimeout(timer);
    }
  }, [gameState.health]);

  useEffect(() => {
    const currentEnemyHealth = gameState.combatState?.enemyHealth;
    if (prevEnemyHealthRef.current !== undefined && currentEnemyHealth !== undefined && currentEnemyHealth < prevEnemyHealthRef.current) {
      setEnemyHealthBarAnimation('enemy-health-bar-hit-flash');
      const timer = setTimeout(() => setEnemyHealthBarAnimation(''), 300);
      return () => clearTimeout(timer);
    }
    prevEnemyHealthRef.current = currentEnemyHealth;
  }, [gameState.combatState?.enemyHealth]);

  React.useEffect(() => {
    if (prevStatusRef.current !== undefined && gameState.status !== prevStatusRef.current) {
        if (gameState.status) {
            setStatusEffect(gameState.status);
            const timer = setTimeout(() => setStatusEffect(null), 2000);
            return () => clearTimeout(timer);
        }
    }
    prevStatusRef.current = gameState.status;
  }, [gameState.status]);

  const handleItemSelect = (itemName: string) => {
    setSelectedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };
  
  const handleCombineClick = () => {
      if (selectedItems.length < 2) return;
      onCombineItems(selectedItems);
      setSelectedItems([]);
  };

  const getStatusColor = (status: string | null): string => {
    if (!status) return 'text-slate-400';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('poisoned') || lowerStatus.includes('cursed') || lowerStatus.includes('weakened')) {
      return 'text-purple-400';
    }
    if (lowerStatus.includes('blessed') || lowerStatus.includes('strengthened') || lowerStatus.includes('hasted')) {
      return 'text-yellow-400';
    }
    return 'text-slate-300';
  };

  const getHealthBarColor = (percentage: number): string => {
    if (percentage > 0.5) return 'bg-green-500';
    if (percentage > 0.2) return 'bg-yellow-500';
    return 'bg-red-600';
  };
  
  const handleToggleNarration = () => {
      onSpeechSettingsChange({ enabled: !speechSettings.enabled });
      if (speechSettings.enabled) {
          tts.cancel();
      }
  };

  const handleMicClick = () => {
    if (stt.isListening) {
      stt.stopListening();
    } else {
      stt.startListening();
    }
  };
  
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={speechSettings}
        onSettingsChange={onSpeechSettingsChange}
        voices={tts.voices}
      />
      <div className="w-full max-w-5xl relative pb-20">
        {statusEffect && <StatusEffectParticles status={statusEffect} />}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Panel */}
          <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 animate-card-fade-in">
            <div className="flex items-center mb-4 border-b border-slate-600 pb-3">
              <ScrollIcon className="w-8 h-8 mr-3 text-cyan-400" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Your Story
              </h2>
            </div>
            <p key={storyKey} className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif text-lg animate-fade-in">
              {gameState.story}
            </p>
          </div>

          {/* Side Panel (Status, Inventory & Image) */}
          <div className="space-y-8">
            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 animate-card-fade-in" style={{ animationDelay: '100ms' }}>
               <div className="flex items-center mb-4 border-b border-slate-600 pb-3">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Player Status
                  </h2>
               </div>
               <div className="space-y-3 text-lg">
                  <div className="flex items-center">
                    <HeartIcon className="w-6 h-6 mr-3 text-red-500" />
                    <span className="font-semibold text-slate-300">Health:</span>
                    <span className="ml-2 font-mono font-bold text-white">
                      <span className={healthAnimation}>{gameState.health ?? 100}</span> / 100
                    </span>
                  </div>
                  {(gameState.status && gameState.status.toLowerCase() !== 'normal') && (
                    <div className="flex items-center">
                      <ShieldIcon className="w-6 h-6 mr-3 text-cyan-400" />
                      <span className="font-semibold text-slate-300">Status:</span>
                      <span className={`ml-2 font-bold capitalize ${getStatusColor(gameState.status)}`}>{gameState.status}</span>
                    </div>
                  )}
               </div>
            </div>

            {gameState.combatState && (
                <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-red-800/50 animate-card-fade-in">
                    <div className="flex items-center mb-4 border-b border-slate-600 pb-3">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                            Combat
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <span className="font-bold text-lg text-slate-200 capitalize">{gameState.combatState.enemyName}</span>
                            <span className="font-mono font-bold text-white">{gameState.combatState.enemyHealth} / {gameState.combatState.maxEnemyHealth}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-4 border border-slate-600">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${getHealthBarColor(gameState.combatState.enemyHealth / gameState.combatState.maxEnemyHealth)} ${enemyHealthBarAnimation}`}
                                style={{ width: `${(gameState.combatState.enemyHealth / gameState.combatState.maxEnemyHealth) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 animate-card-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center mb-4 border-b border-slate-600 pb-3">
                <BackpackIcon className="w-8 h-8 mr-3 text-cyan-400" />
                <div className="flex-grow flex justify-between items-baseline">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                      Inventory
                    </h2>
                    <span className={`font-mono text-lg ${gameState.inventory.length >= MAX_INVENTORY_SIZE ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                      {gameState.inventory.length}/{MAX_INVENTORY_SIZE}
                    </span>
                </div>
              </div>
              {gameState.inventory.length > 0 ? (
                <>
                  <ul className="space-y-1">
                    {gameState.inventory.map((item, index) => (
                      <li 
                        key={index} 
                        className={`group relative text-slate-300 capitalize text-lg animate-fade-in rounded-md transition-all duration-200 transform hover:translate-x-1 ${selectedItems.includes(item.name) ? 'bg-cyan-900/60' : 'hover:bg-slate-700/50'}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                         <label htmlFor={`item-${index}`} className="flex items-center w-full cursor-pointer p-2 select-none">
                            <input
                              type="checkbox"
                              id={`item-${index}`}
                              name={item.name}
                              checked={selectedItems.includes(item.name)}
                              onChange={() => handleItemSelect(item.name)}
                              className="mr-3 h-5 w-5 rounded-sm bg-slate-700 border-slate-500 text-cyan-500 focus:ring-2 focus:ring-offset-slate-800 focus:ring-offset-2 focus:ring-cyan-500"
                            />
                            {item.name}
                        </label>
                        <div className="absolute left-0 bottom-full mb-2 hidden w-max max-w-xs group-hover:block bg-slate-900 text-white text-sm rounded-md p-2 border border-slate-600 shadow-lg z-20 pointer-events-none">
                          <p className="font-bold capitalize">{item.name}</p>
                          <p className="font-normal normal-case italic text-slate-300">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {selectedItems.length >= 2 && (
                    <button
                      onClick={handleCombineClick}
                      className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 button-glow-hover transform hover:scale-105 active:scale-100"
                    >
                      Combine Selected ({selectedItems.length})
                    </button>
                  )}
                </>
              ) : (
                <p className="text-slate-400 italic">Your pockets are empty.</p>
              )}
            </div>

             <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 animate-card-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="aspect-[4/3] w-full bg-slate-900/50 rounded-lg flex items-center justify-center mb-4 relative">
                    <img 
                      src={imageUrl ?? ''} 
                      alt={imageUrl ? gameState.imagePrompt : ''} 
                      className="w-full h-full object-cover rounded-lg transition-opacity duration-700 ease-in-out"
                      style={{ opacity: imageUrl && !isGeneratingImage ? 1 : 0 }}
                    />
                    
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

        <div className="mt-8 bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 animate-card-fade-in" style={{ animationDelay: '400ms' }}>
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
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-lg shadow-md hover:bg-slate-500 disabled:bg-green-500 disabled:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 transform hover:scale-105 active:scale-95"
                >
                    {showSaveConfirmation ? 'Saved!' : 'Save Game'}
                </button>
             )}
          </div>
          {gameState.isGameOver ? (
            <div className="text-center">
              <button
                onClick={onResetGame}
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-500 transform hover:scale-105 active:scale-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300 button-glow-hover"
              >
                Play Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.choices.map((choice, index) => {
                const isItemUseChoice = !!choice.isItemUse;
                const isItemCombineChoice = !!choice.isItemCombine;
                const isAttackChoice = !!choice.isAttack;

                let buttonClasses = 'w-full text-left p-4 bg-slate-700 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] ';
                
                if (isAttackChoice) {
                  buttonClasses += 'border-red-600 hover:border-red-500 hover:bg-red-900/50 focus:ring-red-400';
                } else if (isItemUseChoice) {
                  buttonClasses += 'border-amber-600 hover:border-amber-500 hover:bg-amber-900/50 focus:ring-amber-400';
                } else if (isItemCombineChoice) {
                  buttonClasses += 'border-green-600 hover:border-green-500 hover:bg-green-900/50 focus:ring-green-400';
                } else {
                  buttonClasses += 'border-slate-600 hover:border-cyan-500 hover:bg-cyan-700/50 focus:ring-cyan-400';
                }

                return (
                  <button
                    key={index}
                    onClick={() => onMakeChoice(choice.prompt)}
                    disabled={isLoading}
                    className={`${buttonClasses} animate-fade-in`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {isAttackChoice && <SwordIcon className="w-5 h-5 mr-3 flex-shrink-0 text-red-400" />}
                    {isItemUseChoice && <WrenchIcon className="w-5 h-5 mr-3 flex-shrink-0 text-amber-400" />}
                    {isItemCombineChoice && <CombineIcon className="w-5 h-5 mr-3 flex-shrink-0 text-green-400" />}
                    <span className="font-semibold text-slate-100"><span className="font-mono mr-2 text-cyan-400">({index + 1})</span>{choice.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Voice Controls Bar */}
      {(tts.isSupported || stt.isSupported) && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/70 backdrop-blur-sm border-t border-slate-700 shadow-lg">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center h-16 gap-6">
                    {tts.isSupported && (
                        <button
                          onClick={handleToggleNarration}
                          className="p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-all transform active:scale-90"
                          title={speechSettings.enabled ? 'Disable Narration' : 'Enable Narration'}
                          aria-label={speechSettings.enabled ? 'Disable story narration' : 'Enable story narration'}
                        >
                            {speechSettings.enabled ? <SpeakerOnIcon className="w-7 h-7" /> : <SpeakerOffIcon className="w-7 h-7" />}
                        </button>
                    )}
                    {stt.isSupported && (
                        <button
                          onClick={handleMicClick}
                          className={`p-4 text-slate-300 hover:text-white rounded-full transition-all duration-300 ${stt.isListening ? 'bg-green-600 animate-mic-pulse shadow-lg' : 'hover:bg-slate-700'}`}
                          title={stt.isListening ? 'Stop Listening' : 'Use Voice Command'}
                          aria-label={stt.isListening ? 'Stop listening for voice command' : 'Activate voice command'}
                        >
                            <MicrophoneIcon className="w-8 h-8" />
                        </button>
                    )}
                    {tts.isSupported && (
                        <button
                          onClick={() => setIsSettingsModalOpen(true)}
                          className="p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-all transform active:scale-90"
                          title="Voice Settings"
                          aria-label="Open voice and narration settings"
                        >
                            <SettingsIcon className="w-7 h-7" />
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;