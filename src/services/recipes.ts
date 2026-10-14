import type { Recipe } from '../types';

export type CategoryFilter = 'all' | 'coffee' | 'dessert' | 'cocktail';
export type Filters = { category: CategoryFilter; difficulty: string; query: string; favoritesOnly?: boolean };

/** 从原始配方筛选候选，不修改库；收藏集合只在开启收藏筛选时生效。 */
export function filterRecipes(recipes: Recipe[], filters: Filters, favorites: string[] = []): Recipe[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return recipes.filter(recipe =>
    (filters.category === 'all' || recipe.category === filters.category) &&
    (!filters.difficulty || recipe.difficulty === filters.difficulty) &&
    (!filters.favoritesOnly || favorites.includes(recipe.id)) &&
    (!query || [recipe.name, recipe.description, ...recipe.flavorTags, ...recipe.ingredients.map(item => item.name)].join(' ').toLocaleLowerCase().includes(query))
  );
}

/** 多候选时排除上一张；空候选返回 null，单张允许重复。 */
export function drawRecipe(recipes: Recipe[], previousId?: string, random = Math.random): Recipe | null {
  const candidates = recipes.length > 1 ? recipes.filter(recipe => recipe.id !== previousId) : recipes;
  return candidates.length ? candidates[Math.floor(random() * candidates.length)] : null;
}

/** 仅计算展示数量，保留原始配方及非线性制作参数。 */
export function scaledAmount(amount: number, servings: number, originalServings: number): string {
  const scaled = amount * servings / originalServings;
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: scaled < 1 ? 2 : 1 }).format(scaled);
}

export const difficultyNames: Record<string, string> = { easy: '轻松上手', medium: '稍加练习', hard: '值得挑战' };
export const groupNames: Record<string, string> = { classic: '经典咖啡', creative: '创意咖啡', baked: '烘焙甜品', chilled: '冷藏甜品', cocktail: '鸡尾酒' };
export const rarityNames: Record<string, string> = { common: '日常之选', rare: '一点新意', epic: '特别灵感', legendary: '珍藏时刻' };
