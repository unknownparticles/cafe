/** Shared shape vocabulary keeps recipe-specific artwork declarative and small. */
export type Vessel = 'cup' | 'glass' | 'bowl' | 'mold' | 'pot' | 'filter' | 'press';
export type IngredientShape = 'bean' | 'ice' | 'sugar' | 'flour' | 'spice' | 'chocolate' | 'fruit' | 'liquid';
export type FinishShape = 'espresso' | 'latte' | 'iced' | 'filter' | 'cookie' | 'brownie' | 'loaf' | 'muffin' | 'scone' | 'crumble' | 'cheesecake' | 'madeleine' | 'financier' | 'tart' | 'pear' | 'pudding' | 'jelly' | 'mousse' | 'layered' | 'oats' | 'rice' | 'sago' | 'round-cake' | 'square-cake' | 'coupe' | 'highball' | 'rocks';
export type Garnish = 'none' | 'heart' | 'rosetta' | 'foam' | 'cocoa' | 'cinnamon' | 'sesame' | 'walnut' | 'almond' | 'chocolate' | 'raisin' | 'lemon' | 'orange' | 'strawberry' | 'mango' | 'blueberry' | 'osmanthus' | 'coconut' | 'peanut' | 'tea';

/** Colors and layers describe the actual recipe; no per-recipe SVG file is needed. */
export interface FinishConfig {
  shape: FinishShape;
  color: string;
  layers: string[];
  garnish: Garnish;
  accent: string;
  pattern: 'plain' | 'speckled' | 'striped' | 'scored';
}

export interface SceneContext { vessel: Vessel; color: string; label: string }
type SceneParams = {
  'cocktail-shake': Record<string, never>;
  'cocktail-stir': Record<string, never>;
  'cocktail-strain': Record<string, never>;
  'cocktail-layer': { layers: string[] };
  'cocktail-add-ice': { iceCount: number };
  'cocktail-top-up': { amount: number };
  'cocktail-garnish': { garnish: Garnish };
  'cocktail-reveal': Record<string, never>;
  'ingredient-drop': { ingredient: IngredientShape };
  'measure-pour': { amount: number; unit: 'g' | 'ml' };
  'mix-stir': { tool: 'spoon' | 'whisk' | 'spatula' | 'blender' };
  'sift-sprinkle': { ingredient: 'flour' | 'spice' | 'sugar' };
  'espresso-extraction': { yieldGrams: number | null };
  'pour-over': { waterMl: number };
  'milk-pour-latte-art': { pattern: 'none' | 'heart' | 'rosetta' | 'foam' };
  'press-filter': { method: 'press' | 'paper' | 'mesh' };
  'steam-rise': { temperature: number | null };
  'iced-drink-build': { iceCount: number };
  'roll-shape': { shape: 'round' | 'rectangle' | 'ball' };
  'pipe-cream': { pattern: 'spiral' | 'dollop' };
  'batter-pour': { fillRatio: number };
  'bake-rise': { temperature: number | null };
  'layer-assemble': { layers: string[] };
  'chill-set': { minutes: number; mode: 'chill' | 'freeze' };
  'cut-slice': { target: 'fruit' | 'cake' | 'chocolate' | 'nuts' | 'butter' };
  'dust-powder': { ingredient: 'cocoa' | 'sugar' | 'spice' };
  'drizzle-sauce': { sauce: 'coffee' | 'syrup' | 'chocolate' | 'honey' };
  'garnish-place': { garnish: Garnish };
  'plate-present': { surface: 'plate' | 'rack' | 'cup'; action: 'wipe' | 'tap' | 'drain' | 'cover' | 'line' | 'soften' | 'cool' | 'unmold' | 'place' | 'rinse' | 'remove' | 'serve' };
  'reveal-finish': Record<string, never>;
  'whip-foam': { texture: 'light' | 'soft' | 'firm' };
  'heat-melt': { temperature: number | null; mode: 'warm' | 'melt' | 'simmer' };
};
export type StepAnimationId = keyof SceneParams;
/** Discriminated union prevents parameters for one action being assigned to another. */
export type AnimationScene = { [Id in StepAnimationId]: { id: Id; durationMs: number; params: SceneContext & SceneParams[Id] } }[StepAnimationId];
export interface RecipeStep { id: string; title: string; description: string; scenes: AnimationScene[] }
