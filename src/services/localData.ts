import type { CocktailIngredient, MakingRecord, PantryPreferences, Recipe } from '../types';
import { validateFinish, validateStep } from '../animations/validation.js';
import { estimateAbv, generateCocktails } from './cocktails';

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 3000): value is string => typeof value === 'string' && value.length <= max;
const strings = (value: unknown, max = 100): value is string[] => Array.isArray(value) && value.length <= max && value.every(item => text(item, 200)) && new Set(value).size === value.length;
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 3000;
const date = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
// Coercing an array to a string would make invalid imports appear to satisfy a restriction.
const oneOf = (value: unknown, options: string[]): value is string => typeof value === 'string' && options.includes(value);

/** Validate shape first; dictionary membership is checked once the ingredient library is loaded. */
export function isPantry(value: unknown): value is PantryPreferences {
  return object(value) && ['available', 'uncertain', 'locked', 'excluded', 'flavors', 'tools'].every(key => strings(value[key])) && oneOf(value.alcohol, ['any', 'none', 'low']) && oneOf(value.shopping, ['only', 'minimal']);
}

/** Ratings are bounded to 0–5; malformed notes never enter the persisted record map. */
export function isMakingRecords(value: unknown): value is Record<string, MakingRecord> {
  return object(value) && Object.keys(value).length <= 500 && Object.entries(value).every(([id, entry]) => /^[a-z0-9-]+$/.test(id) && object(entry) && oneOf(entry.status, ['want', 'made']) && Number.isInteger(entry.rating) && Number(entry.rating) >= 0 && Number(entry.rating) <= 5 && text(entry.note) && text(entry.adjustments));
}

/** Dynamic recipes may only refer to local cocktail artwork and validated animation templates. */
export function isGeneratedRecipes(value: unknown): value is Recipe[] {
  return Array.isArray(value) && value.length <= 100 && new Set(value.map(item => object(item) ? item.id : null)).size === value.length && value.every(recipe => {
    if (!object(recipe) || typeof recipe.id !== 'string' || !/^mix-[a-z0-9-]+$/.test(recipe.id) || recipe.category !== 'cocktail' || recipe.group !== 'cocktail' || !text(recipe.name, 200) || !recipe.name || !text(recipe.description) || recipe.servings !== 1 || !positive(recipe.prepTimeMinutes) || !positive(recipe.totalTimeMinutes) || recipe.totalTimeMinutes < recipe.prepTimeMinutes) return false;
    if (!oneOf(recipe.rarity, ['common', 'rare', 'epic', 'legendary']) || !oneOf(recipe.difficulty, ['easy', 'medium', 'hard']) || !strings(recipe.flavorTags) || !strings(recipe.equipment) || !recipe.equipment.length || !strings(recipe.allergens)) return false;
    if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length || recipe.ingredients.length > 12 || !recipe.ingredients.every(item => object(item) && text(item.ingredientId, 100) && text(item.name, 200) && positive(item.amount) && oneOf(item.unit, ['ml', 'g']) && typeof item.abv === 'number' && Number.isFinite(item.abv) && item.abv >= 0 && item.abv <= 100 && !item.optional && (item.allergens === undefined || strings(item.allergens)))) return false;
    if (!Array.isArray(recipe.steps) || !recipe.steps.length || recipe.steps.length > 10 || recipe.steps.some(step => validateStep(step).length)) return false;
    if (!Array.isArray(recipe.parameters) || !recipe.parameters.length || !recipe.parameters.every(item => object(item) && text(item.label, 100) && text(item.value, 300))) return false;
    if (!object(recipe.artwork) || recipe.artwork.image !== 'assets/cards/cocktail.svg' || recipe.artwork.lineArt !== 'assets/line-art/cocktail-outline.svg' || recipe.artwork.animationTemplate !== 'cocktail-outline' || validateFinish(recipe.artwork.finish).length) return false;
    const source = recipe.source;
    if (!object(source) || source.sourceType !== 'original' || source.sourceUrl !== 'docs/cocktail-sources.md' || source.reviewStatus !== 'reviewed' || source.imageLicenseStatus !== 'original' || !date(source.lastVerifiedAt) || !['sourceName', 'license', 'attribution', 'reviewNote'].every(key => text(source[key]))) return false;
    const info = recipe.cocktail;
    if (!object(info) || !oneOf(info.kind, ['variation', 'experimental']) || !oneOf(info.method, ['shake', 'build', 'stir']) || info.tested !== false || !text(info.glassware, 100) || !text(info.ice, 100) || !strings(info.baseSpirits) || typeof info.dilutionMl !== 'number' || !Number.isFinite(info.dilutionMl) || info.dilutionMl < 0 || info.dilutionMl > 200) return false;
    const typed = recipe as unknown as Recipe;
    return info.estimatedAbv === estimateAbv(typed.ingredients, info.dilutionMl) && (info.kind !== 'variation' || info.variationOf === 'cocktail-john-collins');
  });
}

export interface LocalBackup {
  version: 1;
  favorites: string[];
  generated: Recipe[];
  pantry: PantryPreferences;
  records: Record<string, MakingRecord>;
  animation: boolean;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Imports are all-or-nothing; generated recipes must match a real output of the current finite rules. */
export function validateBackup(value: unknown, recipes: Recipe[], dictionary: CocktailIngredient[]): value is LocalBackup {
  if (!object(value) || value.version !== 1 || !strings(value.favorites, 500) || !isGeneratedRecipes(value.generated) || !isPantry(value.pantry) || !isMakingRecords(value.records) || typeof value.animation !== 'boolean') return false;
  const ids = new Set([...recipes, ...value.generated].map(recipe => recipe.id));
  if (value.favorites.some(id => !ids.has(id)) || Object.keys(value.records).some(id => !ids.has(id))) return false;
  const pantry = value.pantry;
  if ([...pantry.available, ...pantry.uncertain, ...pantry.locked, ...pantry.excluded].some(id => !dictionary.some(item => item.id === id))) return false;
  if (pantry.available.some(id => pantry.uncertain.includes(id))) return false;
  if (pantry.tools.some(tool => !['量杯', '酒杯', '吧匙', '摇酒壶', '滤冰器', '调酒杯'].includes(tool)) || pantry.flavors.some(flavor => !['清爽', '果香', '酸', '甜', '苦', '浓郁', '草本', '辛香'].includes(flavor))) return false;
  return value.generated.every(recipe => {
    const preferences: PantryPreferences = { available: recipe.ingredients.map(item => item.ingredientId!), uncertain: [], locked: [], excluded: [], flavors: [], tools: ['量杯', '酒杯', '吧匙', '摇酒壶', '滤冰器', '调酒杯'], alcohol: 'any', shopping: 'only' };
    const match = generateCocktails(recipes, dictionary, preferences, 0).find(item => item.id === recipe.id);
    if (!match) return false;
    if (canonical(match) === canonical(recipe)) return true;
    // Sour names changed with the tab UI; accept the exact prior name without changing saved ratios.
    if (match.cocktail?.method === 'shake' && !recipe.ingredients.some(item => item.note)) {
      const base = dictionary.find(item => item.id === recipe.ingredients[0]?.ingredientId);
      const acid = dictionary.find(item => item.id === recipe.ingredients[1]?.ingredientId);
      if (base && acid && recipe.name === `${base.name}${acid.name}酸甜实验`) return canonical({ ...match, name: recipe.name }) === canonical(recipe);
    }
    return false;
  });
}
