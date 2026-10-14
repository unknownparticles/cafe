/** Cards use a fixed animation vocabulary so saved recipes remain portable. */
export type AnimationTemplate = 'coffee-cup' | 'coffee-pour' | 'dessert-outline';

/** Quantities are for the recipe's declared number of servings. */
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  allergens?: string[];
  note?: string;
}

/** Editorial review checks completeness and ratios; it does not imply kitchen testing. */
export interface RecipeSource {
  sourceType: 'original' | 'api' | 'dataset';
  sourceName: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  reviewStatus: 'draft' | 'reviewed' | 'rejected';
  lastVerifiedAt: string;
  reviewNote: string;
}

/** A complete offline recipe; total time includes baking, cooling and chilling. */
export interface Recipe {
  id: string;
  name: string;
  category: 'coffee' | 'dessert';
  group: 'classic' | 'creative' | 'baked' | 'chilled';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  servings: number;
  prepTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  flavorTags: string[];
  equipment: string[];
  ingredients: Ingredient[];
  steps: string[];
  parameters: { label: string; value: string }[];
  allergens: string[];
  artwork: { image: string; lineArt: string; animationTemplate: AnimationTemplate };
  source: RecipeSource;
}
