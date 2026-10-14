import type { FinishConfig, RecipeStep } from './animations/types';

/** Cards use a fixed animation vocabulary so saved recipes remain portable. */
export type AnimationTemplate = 'coffee-cup' | 'coffee-pour' | 'dessert-outline' | 'cocktail-outline';

/** Quantities are for the recipe's declared number of servings. */
export interface Ingredient {
  ingredientId?: string;
  name: string;
  amount: number;
  unit: string;
  allergens?: string[];
  note?: string;
  optional?: boolean;
  abv?: number;
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
  referenceUrl?: string;
  referenceLicenseStatus?: 'review_required' | 'approved';
  imageLicenseStatus?: 'original' | 'approved';
}

/** A complete offline recipe; total time includes baking, cooling and chilling. */
export interface Recipe {
  id: string;
  name: string;
  category: 'coffee' | 'dessert' | 'cocktail';
  group: 'classic' | 'creative' | 'baked' | 'chilled' | 'cocktail';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  servings: number;
  prepTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  flavorTags: string[];
  equipment: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  parameters: { label: string; value: string }[];
  allergens: string[];
  artwork: { image: string; lineArt: string; animationTemplate: AnimationTemplate; finish: FinishConfig };
  source: RecipeSource;
  cocktail?: CocktailInfo;
}

/** Estimated strength includes declared dilution; brands and melting ice change the result. */
export interface CocktailInfo {
  kind: 'classic' | 'variation' | 'experimental';
  glassware: string;
  method: 'shake' | 'stir' | 'build' | 'layer';
  ice: string;
  baseSpirits: string[];
  dilutionMl: number;
  estimatedAbv: number | null;
  variationOf?: string;
  tested: boolean;
}

/** Explicit IDs prevent names and aliases from being counted as different stock items. */
export interface CocktailIngredient {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  role: 'base' | 'liqueur' | 'acid' | 'sweet' | 'mixer' | 'garnish' | 'other';
  abv: number;
  color: string;
  carbonated?: boolean;
  allergens?: string[];
}

export interface PantryPreferences {
  available: string[];
  uncertain: string[];
  locked: string[];
  excluded: string[];
  flavors: string[];
  tools: string[];
  alcohol: 'any' | 'none' | 'low';
  shopping: 'only' | 'minimal';
}

/** Personal notes never alter the published reference recipe. */
export interface MakingRecord {
  status: 'want' | 'made';
  rating: number;
  note: string;
  adjustments: string;
}
