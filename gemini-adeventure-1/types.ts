
export interface Choice {
  text: string;
  prompt: string;
}

export interface GameState {
  story: string;
  inventory: string[];
  choices: Choice[];
  isGameOver: boolean;
  imagePrompt: string;
}
