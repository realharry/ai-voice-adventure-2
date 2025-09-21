
import { GoogleGenAI, Type } from "@google/genai";
import type { GameState, Difficulty, InventoryItem, CombatState } from '../types';
import { MAX_INVENTORY_SIZE } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const systemInstruction = `You are an expert text adventure game master. Your task is to create and manage a dynamic, engaging, and coherent text-based adventure for the player.

You MUST ALWAYS respond in a valid JSON format that adheres to the provided schema.

Your responsibilities are:
1.  **Storytelling:** Write descriptive, immersive, and creative story segments in a second-person narrative ("You see...", "You feel..."). The story should evolve based on the player's choices. The tone should be that of a classic fantasy text adventure game. Crucially, enrich your descriptions with sensory details. Describe the musty smell of the dungeon, the chilling sound of dripping water, the rough texture of a stone wall, the glint of treasure in the dim light. Make the world feel real and tangible.
2.  **State Management:**
    -   **Inventory:** Keep track of the player's inventory. Add or remove items as the story dictates. The inventory is crucial and must reflect the player's actions and the story's events.
    -   **Health:** Manage the player's health, which starts at 100. It should decrease from dangers (traps, monsters, poison) and can be restored by items or events. If health reaches 0 or less, the game is over.
    -   **Status:** Manage the player's status (e.g., 'Poisoned', 'Blessed', 'Cursed'). Status effects can be positive or negative and should influence the story. A null or 'Normal' status means no effect is active.
3.  **Inventory Limit:** The player has a limited inventory and can only carry a maximum of ${MAX_INVENTORY_SIZE} items. If the player tries to pick up an item but their inventory is full, you must inform them in the story text and NOT add the item. You can present choices to drop an existing item to make room.
4.  **Choice Generation:** Provide 2 to 4 meaningful choices for the player at the end of each story segment. Each choice must lead to a different outcome.
5.  **Game Progression:** Guide the story towards a conclusion. When the game ends (either in victory or defeat, or player health is <= 0), set the 'isGameOver' flag to true and provide a concluding story segment. Do not provide any choices when the game is over.
6.  **Image Prompts:** For each scene, create a highly evocative and descriptive prompt for an AI image generator. This prompt should not just describe the scene, but also the mood, lighting, and artistic style. Use dynamic language. Example: 'An ancient, moss-draped crypt, bathed in the eerie green glow of phosphorescent fungi. A lone adventurer, clutching a flickering torch, cautiously steps over skeletal remains. Cinematic lighting, hyper-detailed, dark fantasy concept art.'
7.  **Item Usage:** You MUST proactively check the player's inventory on every turn. If an item is relevant to the current situation (e.g., a key for a lock, a potion for a wound), you MUST present a choice to use it. This choice's text must be explicit, like "Use the silver key". When an item is successfully used, it MUST be removed from the inventory in the next state you provide. For all choices that involve using an item, you MUST set the 'isItemUse' flag to true in the response.
8.  **Item Descriptions:** For any new item added to the inventory, you MUST provide a brief, flavorful description.
9.  **Item Combination:** You MUST proactively check the player's inventory for items that can be combined. If two or more items can logically be combined to create a new item or solve a puzzle (e.g., 'stick' and 'flint' to make a 'torch'), you MUST present a choice to combine them. This choice text should be explicit, like "Combine stick and flint". When items are combined, they MUST be removed from the inventory and the new item (if any) MUST be added. For these choices, set the 'isItemCombine' flag to true and list the names of the items in 'itemsToCombine'.
10. **Combat Rules:**
    -   **Initiating Combat:** To start a fight, populate the 'combatState' object. Be creative with your enemies! Instead of a generic monster, create specific types (e.g., 'Goblin Archer', 'Cave Troll', 'Shadow Imp'). Describe the enemy's appearance vividly in the story. Assign 'maxEnemyHealth' based on the creature's perceived toughness—a small imp might have 20 health, while a giant troll could have 80 or more.
    -   **Combat Choices:** During combat, choices should be tactical. Provide attack options (e.g., "Attack with your sword") and mark them with 'isAttack: true'. Also consider other actions like using a healing potion (marked as 'isItemUse: true') or attempting to flee.
    -   **Turn Flow:** When the player attacks, describe the action. Then, describe the enemy's counter-attack in the same story segment. Both player and enemy health should be updated in the same turn.
    -   **Damage:** Calculate damage based on the story and difficulty. A powerful hit might do 20-30 damage, a weak one 5-10. Describe enemy attacks in a way that reflects their type (e.g., a goblin uses a rusty dagger, a troll uses a giant club). Harder difficulties mean enemies hit harder and might have special attacks.
    -   **Ending Combat:** When the enemy's health is <= 0, set 'combatState' to null. Describe the enemy's defeat in the story and provide choices for what to do next (e.g., "Loot the body", "Continue down the corridor").`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "The next segment of the story. Written in the second person.",
    },
    inventory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the item." },
            description: { type: Type.STRING, description: "A brief, flavorful description of the item." }
        },
        required: ["name", "description"]
      },
      description: "An updated list of items the player is carrying, with their descriptions.",
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
          isItemUse: {
            type: Type.BOOLEAN,
            description: "Set to true if this choice involves using an item from the inventory.",
          },
          isItemCombine: {
            type: Type.BOOLEAN,
            description: "Set to true if this choice involves combining items from the inventory."
          },
          itemsToCombine: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of item names to be combined if isItemCombine is true."
          },
          isAttack: {
            type: Type.BOOLEAN,
            description: "Set to true if this choice is a combat attack."
          }
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
    },
    health: {
        type: Type.INTEGER,
        description: "The player's current health points. Must be between 0 and 100. If it reaches 0, isGameOver must be true."
    },
    status: {
        type: Type.STRING,
        description: "The player's current status effect (e.g., 'Poisoned', 'Blessed'). Can be null if no status is active.",
        nullable: true,
    },
    combatState: {
        type: Type.OBJECT,
        nullable: true,
        description: "The state of the current combat encounter. Null if not in combat.",
        properties: {
            enemyName: { type: Type.STRING },
            enemyHealth: { type: Type.INTEGER },
            maxEnemyHealth: { type: Type.INTEGER }
        }
    }
  },
  required: ["story", "inventory", "choices", "isGameOver", "imagePrompt", "health", "status", "combatState"],
};

const difficultyInstructions = {
  Easy: "The story should be straightforward and forgiving. The player should feel heroic. The game should be relatively short, reaching a conclusion in about 5-7 steps. Provide more descriptive hints in the story. Be generous with health. Enemies should be weak.",
  Medium: "The story should have a balanced level of challenge. Choices should have clear consequences, both good and bad. The game should be of moderate length, about 8-12 steps. Damage and healing should be moderate. Enemies have standard strength.",
  Hard: "The story should be complex, with difficult challenges and ambiguous choices. The world is dangerous, and failure is a real possibility. The player must be clever to succeed. The game should be longer and more intricate, taking 15+ steps to complete. Make the descriptions more terse and challenging to interpret. Be punishing with health loss. Enemies should be strong and smart.",
};


export const getNextStep = async (
    playerChoice: string | null, 
    currentInventory: InventoryItem[], 
    currentHealth: number,
    currentStatus: string | null,
    currentCombatState: CombatState | null,
    difficulty: Difficulty = 'Medium'
): Promise<GameState> => {
  const instructionForDifficulty = difficultyInstructions[difficulty];
  let prompt: string;
  const inventoryStatus = `(${currentInventory.length}/${MAX_INVENTORY_SIZE} items)`;

  if (playerChoice) {
    const inventoryString = currentInventory.length > 0 
      ? `[${currentInventory.map(item => item.name).join(', ')}] ${inventoryStatus}` 
      : `empty ${inventoryStatus}`;
    const statusString = currentStatus ? ` The player's status is ${currentStatus}.` : '';
    const combatString = currentCombatState 
        ? ` The player is in combat with a ${currentCombatState.enemyName} (${currentCombatState.enemyHealth}/${currentCombatState.maxEnemyHealth} health).`
        : '';

    prompt = `Player state: Health is ${currentHealth}/100. Inventory is ${inventoryString}.${statusString}${combatString} The player chose: "${playerChoice}". Continue the story, logically updating health, status, inventory, and combat state based on the events, and adhering to these difficulty guidelines: ${instructionForDifficulty}`;
  } else {
    prompt = `Start a new fantasy adventure for the player with ${difficulty} difficulty. The player begins with 100 health, no status effects, and is not in combat. Here are the guidelines: ${instructionForDifficulty}`;
  }

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
      parsedResponse.inventory.every((item: any) => typeof item === 'object' && item !== null && 'name' in item && 'description' in item) &&
      Array.isArray(parsedResponse.choices) &&
      typeof parsedResponse.isGameOver === 'boolean' &&
      typeof parsedResponse.health === 'number'
    ) {
      // Status can be null, so we check its existence but allow null
      if (!('status' in parsedResponse)) {
        parsedResponse.status = null;
      }
      if (!('combatState' in parsedResponse)) {
        parsedResponse.combatState = null;
      }
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
      imagePrompt: "A glitchy, pixelated screen with arcane symbols, digital error.",
      health: 100,
      status: null,
      combatState: null,
    };
  }
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' = '4:3'): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
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
