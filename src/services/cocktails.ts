import type { CocktailIngredient, Ingredient, PantryPreferences, Recipe } from '../types';
import type { AnimationScene, Garnish, RecipeStep } from '../animations/types';

/** Defaults assume no ingredients; tools are explicitly editable by the user. */
export const defaultPantry: PantryPreferences = {
  available: [], uncertain: [], locked: [], excluded: [], flavors: [],
  tools: ['量杯', '酒杯', '吧匙'], alcohol: 'any', shopping: 'minimal',
};
export const cocktailKindNames = { classic: '经典酒谱', variation: '创意变体', experimental: '实验配方 · 尚未实测' };

/** Match exact names and declared aliases only; a whole lime is not automatically lime juice. */
export function normalizeIngredientId(name: string, dictionary: CocktailIngredient[]): string | null {
  const key = name.trim().toLocaleLowerCase();
  return dictionary.find(item => [item.id, item.name, ...item.aliases].some(alias => alias.toLocaleLowerCase() === key))?.id ?? null;
}

/** Only measured liquids contribute to this rough estimate; unknown alcoholic units return null. */
export function estimateAbv(ingredients: Ingredient[], dilutionMl: number): number | null {
  if (!Number.isFinite(dilutionMl) || dilutionMl < 0) return null;
  const required = ingredients.filter(item => !item.optional);
  if (required.some(item => item.abv === undefined || ((item.abv ?? 0) > 0 && item.unit !== 'ml'))) return null;
  const volume = required.reduce((sum, item) => sum + (item.unit === 'ml' ? item.amount : 0), dilutionMl);
  const alcohol = required.reduce((sum, item) => sum + (item.unit === 'ml' ? item.amount * (item.abv ?? 0) / 100 : 0), 0);
  return volume > 0 ? Math.round(alcohol / volume * 1000) / 10 : null;
}

export interface CocktailMatch {
  recipe: Recipe;
  missing: Ingredient[];
  optionalMissing: Ingredient[];
  missingTools: string[];
  score: number;
  tier: number;
  reasons: string[];
}

function allowed(recipe: Recipe, dictionary: CocktailIngredient[], prefs: PantryPreferences): boolean {
  const ids = recipe.ingredients.map(item => item.ingredientId);
  if (ids.some(id => !id || !dictionary.some(item => item.id === id))) return false;
  if (prefs.excluded.some(id => ids.includes(id)) || prefs.locked.some(id => !ids.includes(id))) return false;
  if (prefs.alcohol === 'none' && recipe.ingredients.some(item => (dictionary.find(entry => entry.id === item.ingredientId)?.abv ?? 1) > 0)) return false;
  const strength = recipe.cocktail?.estimatedAbv;
  return prefs.alcohol !== 'low' || (strength !== null && strength !== undefined && strength <= 8);
}

/** Rank by required stock first; uncertain and excluded items never count as available. */
export function matchCocktails(recipes: Recipe[], dictionary: CocktailIngredient[], prefs: PantryPreferences): CocktailMatch[] {
  const stock = new Set(prefs.available.filter(id => !prefs.uncertain.includes(id) && !prefs.excluded.includes(id)));
  return recipes.filter(recipe => recipe.category === 'cocktail' && allowed(recipe, dictionary, prefs)).map(recipe => {
    const missing = recipe.ingredients.filter(item => !item.optional && !stock.has(item.ingredientId!));
    const optionalMissing = recipe.ingredients.filter(item => item.optional && !stock.has(item.ingredientId!));
    const required = recipe.ingredients.filter(item => !item.optional);
    const coverage = (required.length - missing.length) / required.length;
    const flavor = prefs.flavors.length ? prefs.flavors.filter(value => recipe.flavorTags.includes(value)).length / prefs.flavors.length : 0;
    const used = new Set(recipe.ingredients.filter(item => stock.has(item.ingredientId!)).map(item => item.ingredientId));
    const missingTools = recipe.equipment.filter(tool => !prefs.tools.includes(tool));
    const score = Math.round(coverage * 40 + flavor * 25 + used.size / Math.max(1, stock.size) * 15 + (1 - missingTools.length / recipe.equipment.length) * 10 + (recipe.cocktail?.kind === 'classic' ? 0 : 10));
    const tier = missing.length ? 2 : optionalMissing.length ? 1 : 0;
    const reasons = [missing.length ? `还需 ${missing.length} 种必需材料` : '必需材料齐全', ...(flavor > 0 ? ['符合已选口味'] : []), ...(missingTools.length ? [`缺少器具：${missingTools.join('、')}`] : ['器具齐全'])];
    return { recipe, missing, optionalMissing, missingTools, score, tier, reasons };
  }).filter(match => prefs.shopping !== 'only' || match.missing.length === 0)
    .sort((a, b) => a.tier - b.tier || a.missing.length - b.missing.length || b.score - a.score || a.recipe.id.localeCompare(b.recipe.id));
}

function action(id: AnimationScene['id'], color: string, label: string, extra: Record<string, unknown> = {}): AnimationScene {
  return { id, durationMs: 2400, params: { vessel: 'glass', color, label, ...extra } } as AnimationScene;
}

/** Build readable steps from measured ingredients, keeping carbonated mixers out of the shaker. */
function generatedSteps(id: string, ingredients: Ingredient[], dictionary: CocktailIngredient[], method: 'shake' | 'build' | 'stir', color: string, garnish: Garnish): RecipeStep[] {
  const mixers = ingredients.filter(item => dictionary.find(entry => entry.id === item.ingredientId)?.carbonated);
  const measured = ingredients.filter(item => item.unit === 'ml' && !mixers.includes(item));
  const steps: RecipeStep[] = [
    { id: `${id}-prepare`, title: '量取原料', description: measured.map(item => `${item.name} ${item.amount} ml`).join('、') + '。使用量杯分别量取，准备干净酒杯。', scenes: measured.map(item => action('measure-pour', color, `量取${item.name}`, { amount: item.amount, unit: 'ml' })) },
    { id: `${id}-ice`, title: '加冰降温', description: method === 'shake' ? '把约 120 g 冰块放入摇酒壶。' : method === 'stir' ? '把约 120 g 冰块放入调酒杯。' : '把约 120 g 冰块放入酒杯。', scenes: [action('cocktail-add-ice', color, '加冰', { iceCount: 4 })] },
    { id: `${id}-mix`, title: method === 'shake' ? '摇和与过滤' : method === 'stir' ? '搅拌与过滤' : '杯中混合', description: method === 'shake' ? '加入非气泡液体，盖紧摇酒壶，摇约 10–15 秒至壶外变冷，用滤冰器倒入酒杯。气泡饮料不可密闭摇和。' : method === 'stir' ? '将基酒和味美思倒入加冰的调酒杯，搅拌约 20 秒至杯壁变冷；过滤到预冷鸡尾酒杯中，成品不留冰。' : '加入已量好的非气泡原料，用吧匙轻柔搅匀。', scenes: method === 'shake' ? [action('cocktail-shake', color, '摇和'), action('cocktail-strain', color, '过滤')] : method === 'stir' ? [action('cocktail-stir', color, '搅拌'), action('cocktail-strain', color, '过滤')] : [action('cocktail-stir', color, '搅拌')] },
  ];
  if (mixers.length) steps.push({ id: `${id}-top`, title: '最后补入气泡饮料', description: mixers.map(item => `${item.name} ${item.amount} ml`).join('、') + '沿杯壁缓慢加入，轻轻带动混合。', scenes: [action('cocktail-top-up', color, '补入气泡饮料', { amount: mixers.reduce((sum, item) => sum + item.amount, 0) })] });
  steps.push({ id: `${id}-finish`, title: '完成这杯实验', description: ingredients.some(item => dictionary.find(entry => entry.id === item.ingredientId)?.role === 'garnish' || item.ingredientId === 'lime') ? '按原料表放入所选水果、果皮或香草装饰后及时饮用；这是尚未实测的组合。' : '及时饮用。这是尚未实测的组合，评分只反映材料与偏好匹配，不保证实际口感。', scenes: [action('cocktail-garnish', color, '装饰', { garnish }), action('cocktail-reveal', color, '成品')] });
  return steps;
}

function createGenerated(parent: Recipe, ingredients: Ingredient[], dictionary: CocktailIngredient[], name: string, kind: 'variation' | 'experimental', method: 'shake' | 'build' | 'stir', flavors: string[], garnish: Garnish = 'none'): Recipe {
  // Identity includes exact quantities so re-combining cannot overwrite a saved recipe with new ratios.
  const signature = ingredients.map(item => `${item.ingredientId}-${String(item.amount).replace('.', 'p')}-${item.unit === 'ml' ? 'ml' : 'g'}`).join('-');
  const id = `mix-${kind}-${method}-${signature}`;
  const color = dictionary.find(item => item.id === ingredients[0].ingredientId)?.color ?? '#c8c8a0';
  const dilutionMl = method === 'build' ? 15 : 20;
  return {
    ...parent, id, name, category: 'cocktail', group: 'cocktail', rarity: 'rare', description: kind === 'variation' ? `以「${parent.name}」为参考骨架的材料替换版本，比例已单独设计；尚未实测。` : '基于有限的酸甜与气泡模板组合，独立设计比例；尚未实测。',
    servings: 1, prepTimeMinutes: 5, totalTimeMinutes: 5, difficulty: method === 'shake' ? 'medium' : 'easy', flavorTags: flavors,
    equipment: ['量杯', '酒杯', '吧匙', ...(method === 'shake' ? ['摇酒壶', '滤冰器'] : method === 'stir' ? ['调酒杯', '滤冰器'] : [])], ingredients,
    steps: generatedSteps(id, ingredients, dictionary, method, color, garnish),
    parameters: [{ label: '杯型', value: method !== 'build' ? '鸡尾酒杯' : '高球杯' }, { label: '调制方法', value: method === 'shake' ? '摇和后过滤' : method === 'stir' ? '搅拌后过滤' : '杯中直调' }],
    allergens: [...new Set(ingredients.flatMap(item => item.allergens ?? []))],
    artwork: { ...parent.artwork, finish: { shape: method !== 'build' ? 'coupe' : 'highball', color, layers: [], garnish, accent: '#8e9b72', pattern: 'plain' } },
    source: { sourceType: 'original', sourceName: 'Daily Ritual 本地规则组合', sourceUrl: 'docs/cocktail-sources.md', license: '项目原创组合与插画；使用权限以仓库许可证为准。', attribution: 'Daily Ritual', reviewStatus: 'reviewed', lastVerifiedAt: '2026-10-14', reviewNote: '仅通过材料、比例模板与酒精限制规则，尚未实际调酒测试；不是 IBA 经典配方。', imageLicenseStatus: 'original' },
    cocktail: { kind, method, glassware: method !== 'build' ? '鸡尾酒杯' : '高球杯', ice: method === 'shake' ? '摇和后过滤' : method === 'stir' ? '搅拌后过滤' : '杯中加冰', baseSpirits: ingredients.filter(item => dictionary.find(entry => entry.id === item.ingredientId)?.role === 'base').map(item => item.ingredientId!), dilutionMl, estimatedAbv: estimateAbv(ingredients, dilutionMl), ...(kind === 'variation' ? { variationOf: parent.id } : {}), tested: false },
  };
}

/** Finite templates and explicit base substitutions; every generated required ingredient must be stocked. */
export function generateCocktails(recipes: Recipe[], dictionary: CocktailIngredient[], prefs: PantryPreferences, round: number): Recipe[] {
  const stock = dictionary.filter(item => prefs.available.includes(item.id) && !prefs.uncertain.includes(item.id) && !prefs.excluded.includes(item.id));
  const has = (id: string) => stock.some(item => item.id === id);
  const parent = recipes.find(recipe => recipe.id === 'cocktail-john-collins');
  if (!parent || !has('ice')) return [];
  const ingredient = (id: string, amount: number): Ingredient => {
    const entry = dictionary.find(item => item.id === id)!;
    return { ingredientId: id, name: entry.name, amount, unit: id === 'ice' ? 'g' : 'ml', abv: entry.abv, ...(entry.allergens?.length ? { allergens: entry.allergens } : {}) };
  };
  const results: Recipe[] = [];
  const acids = stock.filter(item => ['lime-juice', 'lemon-juice'].includes(item.id));
  const bases = stock.filter(item => ['gin', 'vodka', 'rum', 'tequila', 'bourbon'].includes(item.id));
  if (has('syrup')) {
    for (const acid of acids) {
      for (const base of bases) {
        // A Collins variation permits only this declared substitution set; no arbitrary liqueur swapping.
        if (has('soda') && ['vodka', 'rum', 'tequila'].includes(base.id)) {
          results.push(createGenerated(parent, [ingredient(base.id, 30), ingredient(acid.id, 20), ingredient('syrup', 10), ingredient('soda', 120), ingredient('ice', 120)], dictionary, `${base.name}${acid.name}气泡 · 柯林斯变体`, 'variation', 'build', ['清爽', '酸']));
        }
        results.push(createGenerated(parent, [ingredient(base.id, 45), ingredient(acid.id, 25), ingredient('syrup', 15), ingredient('ice', 120)], dictionary, `${base.name}${acid.name.replace('汁', '')}酸`, 'experimental', 'shake', ['酸', '甜']));
      }
      if (has('soda')) {
        results.push(createGenerated(parent, [ingredient(acid.id, 20), ingredient('syrup', 15), ingredient('soda', 120), ingredient('ice', 120)], dictionary, `${acid.name}无酒精气泡`, 'experimental', 'build', ['清爽', '酸', '甜']));
        if (has('tea')) results.push(createGenerated(parent, [ingredient('tea', 60), ingredient(acid.id, 15), ingredient('syrup', 10), ingredient('soda', 100), ingredient('ice', 120)], dictionary, '柑橘茶气泡 · 无酒精', 'experimental', 'build', ['清爽', '草本', '酸']));
      }
    }
  }
  // A material pool supplies alternatives, not ingredients that must all appear in every drink.
  const drinks = stock.filter(item => ['soda', 'tonic', 'cola', 'ginger-beer', 'grapefruit-soda', 'orange-juice', 'pineapple-juice', 'grapefruit-juice'].includes(item.id));
  for (const base of bases) {
    for (const mixer of drinks) {
      results.push(createGenerated(parent, [ingredient(base.id, 45), ingredient(mixer.id, 120), ingredient('ice', 120)], dictionary, `${base.name}${mixer.name}高球`, 'experimental', 'build', mixer.id === 'soda' ? ['清爽'] : ['清爽', '甜']));
    }
    if (['gin', 'vodka'].includes(base.id) && has('dry-vermouth')) {
      results.push(createGenerated(parent, [ingredient(base.id, 60), ingredient('dry-vermouth', 10), ingredient('ice', 120)], dictionary, `${base.name}干马天尼`, 'experimental', 'stir', ['浓郁', '草本']));
    }
  }
  if (has('soda')) {
    for (const modifier of stock.filter(item => ['campari', 'sweet-vermouth', 'dry-vermouth'].includes(item.id))) {
      results.push(createGenerated(parent, [ingredient(modifier.id, modifier.id === 'campari' ? 30 : 60), ingredient('soda', 90), ingredient('ice', 120)], dictionary, `${modifier.name}苏打`, 'experimental', 'build', ['清爽', '草本']));
    }
    for (const juice of stock.filter(item => ['orange-juice', 'pineapple-juice', 'grapefruit-juice'].includes(item.id))) {
      results.push(createGenerated(parent, [ingredient(juice.id, 60), ingredient('soda', 90), ingredient('ice', 120)], dictionary, `${juice.name}无酒精气泡`, 'experimental', 'build', ['清爽', '果香']));
    }
  }
  // Garnish is optional: retain each plain drink and offer each selected garnish separately.
  const garnishes = stock.filter(item => item.role === 'garnish' || item.id === 'lime');
  const garnishKinds: Record<string, Garnish> = { 'orange-slice': 'orange', 'orange-peel': 'orange', 'lemon-slice': 'lemon', 'lemon-peel': 'lemon', 'lime-slice': 'lemon', lime: 'lemon', mint: 'tea', 'coffee-beans': 'cocoa', cherry: 'strawberry' };
  for (const recipe of [...results]) {
    for (const garnish of garnishes) {
      const amounts: Record<string, number> = { mint: 1, 'coffee-beans': 1, 'orange-peel': 1, 'lemon-peel': 1 };
      const added: Ingredient = { ingredientId: garnish.id, name: garnish.name, amount: amounts[garnish.id] ?? 5, unit: 'g', abv: garnish.abv, note: '装饰参考用量；柑橘切片挂杯，咖啡豆放在表面，香草轻拍后放入。' };
      results.push(createGenerated(parent, [...recipe.ingredients, added], dictionary, `${recipe.name} · ${garnish.name}`, recipe.cocktail!.kind as 'variation' | 'experimental', recipe.cocktail!.method as 'shake' | 'build' | 'stir', recipe.flavorTags, garnishKinds[garnish.id] ?? 'none'));
    }
  }
  // Re-combine rotates distinct recipes, never changes a recipe's identity or saved proportions.
  const matches = matchCocktails(results, dictionary, { ...prefs, shopping: 'only' });
  const candidates = [...matches.filter(item => item.recipe.cocktail?.kind === 'variation'), ...matches.filter(item => item.recipe.cocktail?.kind === 'experimental')].map(item => item.recipe);
  const offset = candidates.length ? Math.max(0, round) % candidates.length : 0;
  return [...candidates.slice(offset), ...candidates.slice(0, offset)];
}
