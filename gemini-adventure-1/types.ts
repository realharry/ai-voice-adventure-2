export const MAX_INVENTORY_SIZE = 10;

export interface InventoryItem {
  name: string;
  description: string;
}

export interface Choice {
  text: string;
  prompt: string;
  isItemUse?: boolean;
  isItemCombine?: boolean;
  itemsToCombine?: string[];
  isAttack?: boolean;
}

export interface CombatState {
  enemyName: string;
  enemyHealth: number;
  maxEnemyHealth: number;
}

export interface GameState {
  story: string;
  inventory: InventoryItem[];
  choices: Choice[];
  isGameOver: boolean;
  imagePrompt: string;
  health: number;
  status: string | null;
  combatState: CombatState | null;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface SpeechSettings {
  enabled: boolean;
  voiceURI: string | null;
  rate: number;
  pitch: number;
}
