import { GoogleGenAI, Type } from "@google/genai";
import type { GameState } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const systemInstruction = `You are an expert text adventure game master. Your task is to create and manage a dynamic, engaging, and coherent text-based adventure for the player.

You MUST ALWAYS respond in a valid JSON format that adheres to the provided schema.

Your responsibilities are:
1.  **Storytelling:** Write descriptive, immersive, and creative story segments in a second-person narrative ("You see...", "You feel..."). The story should evolve based on the player's choices. The tone should be that of a classic fantasy text adventure game.
2.  **State Management:** Keep track of the player's inventory. Add or remove items as the story dictates.
3.  **Choice Generation:** Provide 2 to 4 meaningful choices for the player at the end of each story segment. Each choice must lead to a different outcome.
4.  **Game Progression:** Guide the story towards a conclusion. When the game ends (either in victory or defeat), set the 'isGameOver' flag to true and provide a concluding story segment. Do not provide any choices when the game is over.
5.  **Image Prompts:** For each scene, create a descriptive prompt for an AI image generator that captures the mood and setting. This should be in the 'imagePrompt' field. Example: "A lone adventurer stands at the entrance of a dark, moss-covered cave, a glowing sword held aloft, digital art, fantasy."`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "The next segment of the story. Written in the second person.",
    },
    inventory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of items the player is currently carrying.",
    },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The text displayed to the player for this choice.",
          },
          prompt: {
            type: Type.STRING,
            description: "A short prompt summarizing the player's action for the next turn.",
          },
        },
      },
      description: "An array of choices for the player to make.",
    },
    isGameOver: {
      type: Type.BOOLEAN,
      description: "Set to true if the story has reached a conclusion.",
    },
    imagePrompt: {
      type: Type.STRING,
      description: "A descriptive prompt for an AI image generator that captures the scene."
    }
  },
  required: ["story", "inventory", "choices", "isGameOver", "imagePrompt"],
};


export const getNextStep = async (playerChoice: string | null): Promise<GameState> => {
  const prompt = playerChoice
    ? `The player chose: "${playerChoice}". Continue the story.`
    : "Start a new fantasy adventure for the player.";
    
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    // Basic validation to ensure the parsed object matches the GameState structure
    if (
      typeof parsedResponse.story === 'string' &&
      Array.isArray(parsedResponse.inventory) &&
      Array.isArray(parsedResponse.choices) &&
      typeof parsedResponse.isGameOver === 'boolean'
    ) {
      return parsedResponse as GameState;
    } else {
      throw new Error("Invalid response structure from API");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Return a fallback error state
    return {
      story: "The ancient magicks fizzle and pop, and the world fades to static. It seems the connection to the story has been lost. Please try starting a new game.",
      inventory: [],
      choices: [],
      isGameOver: true,
      imagePrompt: "A glitchy, pixelated screen with static and arcane symbols, digital error."
    };
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};