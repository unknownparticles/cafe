import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFinish, validateStep } from './validate-animations.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(root, 'public');
const groups = ['classic', 'creative', 'baked', 'chilled'];
const templates = ['coffee-cup', 'coffee-pour', 'dessert-outline'];
// The library uses weight and volume only; household spoon sizes are not consistent.
const ingredientUnits = ['g', 'ml'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const strings = (value, allowEmpty = false) => Array.isArray(value) && (allowEmpty || value.length > 0) && value.every(nonempty);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Return actionable errors without throwing on malformed imported records. */
export function validateRecipes(recipes, { checkAssets = true } = {}) {
  const errors = [];
  if (!Array.isArray(recipes)) return ['配方库必须是数组'];
  if (recipes.length !== 60) errors.push(`配方应有 60 条，实际 ${recipes.length} 条`);
  const ids = new Set();
  const stepIds = new Set();
  const dessertFinishes = new Set();
  const counts = Object.fromEntries(groups.map(group => [group, 0]));
  recipes.forEach((recipe, index) => {
    const label = `配方 ${index + 1}`;
    const require = (condition, message) => { if (!condition) errors.push(`${label}: ${message}`); };
    if (!object(recipe)) { require(false, '必须是对象'); return; }
    for (const key of ['id', 'name', 'description']) require(nonempty(recipe[key]), `${key} 不能为空`);
    require(typeof recipe.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(recipe.id), 'id 必须是稳定的小写标识');
    require(!ids.has(recipe.id), 'id 重复');
    ids.add(recipe.id);
    require(['coffee', 'dessert'].includes(recipe.category), 'category 无效');
    require(groups.includes(recipe.group), 'group 无效');
    if (groups.includes(recipe.group)) counts[recipe.group]++;
    require((['classic', 'creative'].includes(recipe.group) && recipe.category === 'coffee') || (['baked', 'chilled'].includes(recipe.group) && recipe.category === 'dessert'), 'category 与 group 不一致');
    require(['common', 'rare', 'epic', 'legendary'].includes(recipe.rarity), 'rarity 无效');
    require(['easy', 'medium', 'hard'].includes(recipe.difficulty), 'difficulty 无效');
    require(Number.isInteger(recipe.servings) && recipe.servings > 0, 'servings 必须是正整数');
    require(positive(recipe.prepTimeMinutes), 'prepTimeMinutes 必须大于零');
    require(positive(recipe.totalTimeMinutes) && recipe.totalTimeMinutes >= recipe.prepTimeMinutes, '总时间必须包含准备时间');
    for (const key of ['flavorTags', 'equipment']) require(strings(recipe[key]), `${key} 必须包含非空文本`);
    require(Array.isArray(recipe.steps) && recipe.steps.length > 0, 'steps 必须包含步骤对象');
    if (Array.isArray(recipe.steps)) recipe.steps.forEach((step, i) => {
      for (const error of validateStep(step)) require(false, `步骤 ${i + 1}: ${error}`);
      if (object(step) && nonempty(step.id)) {
        require(!stepIds.has(step.id), `步骤 id 重复: ${step.id}`);
        stepIds.add(step.id);
      }
    });
    require(strings(recipe.allergens, true), 'allergens 必须是文本数组，可为空');
    const ingredientAllergens = new Set();
    require(Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0, 'ingredients 不能为空');
    if (Array.isArray(recipe.ingredients)) recipe.ingredients.forEach((ingredient, i) => {
      if (!object(ingredient)) { require(false, `原料 ${i + 1} 必须是对象`); return; }
      require(nonempty(ingredient.name) && nonempty(ingredient.unit) && positive(ingredient.amount), `原料 ${i + 1} 的名称、正数用量、单位必填`);
      require(ingredientUnits.includes(ingredient.unit), `原料 ${i + 1} 单位只支持 g 或 ml`);
      if (ingredient.note !== undefined) require(nonempty(ingredient.note), `原料 ${i + 1} note 不能为空`);
      if (ingredient.allergens !== undefined) {
        require(strings(ingredient.allergens, true), `原料 ${i + 1} allergens 无效`);
        if (Array.isArray(ingredient.allergens)) ingredient.allergens.forEach(value => ingredientAllergens.add(value));
      }
    });
    if (Array.isArray(recipe.allergens)) require(recipe.allergens.length === new Set(recipe.allergens).size && recipe.allergens.length === ingredientAllergens.size && recipe.allergens.every(value => ingredientAllergens.has(value)), '配方过敏原必须与原料过敏原汇总一致');
    require(Array.isArray(recipe.parameters) && recipe.parameters.length > 0 && recipe.parameters.every(item => object(item) && nonempty(item.label) && nonempty(item.value)), 'parameters 的 label/value 必填');
    const artwork = recipe.artwork;
    require(object(artwork), 'artwork 必填');
    if (object(artwork)) {
      const finishErrors = validateFinish(artwork.finish);
      for (const error of finishErrors) require(false, error);
      if (recipe.category === 'dessert' && finishErrors.length === 0) {
        // Canonical field order makes uniqueness independent of JSON key ordering.
        const finish = artwork.finish;
        const signature = JSON.stringify([finish.shape, finish.color, finish.layers, finish.garnish, finish.accent, finish.pattern]);
        require(!dessertFinishes.has(signature), '甜点成品图配置重复');
        dessertFinishes.add(signature);
      }
      require(templates.includes(artwork.animationTemplate), 'animationTemplate 无效');
      require(artwork.animationTemplate === (recipe.category === 'dessert' ? 'dessert-outline' : artwork.animationTemplate) && (recipe.category !== 'coffee' || ['coffee-cup', 'coffee-pour'].includes(artwork.animationTemplate)), '动画模板与分类不一致');
      for (const key of ['image', 'lineArt']) {
        const path = artwork[key];
        // Reject traversal and URL syntax even when asset existence checking is disabled.
        const directory = key === 'image' ? 'cards' : 'line-art';
        const safe = typeof path === 'string' && new RegExp(`^assets/${directory}/[a-z0-9-]+\\.svg$`).test(path) && !path.includes('..');
        require(safe, `${key} 必须是安全的 public 相对资源路径`);
        if (safe && checkAssets) {
          const fullPath = resolve(publicRoot, path);
          require(existsSync(fullPath) && realpathSync(fullPath).startsWith(realpathSync(publicRoot) + sep), `${key} 资源不存在或位于 public 外`);
        }
      }
      require(typeof artwork.lineArt === 'string' && artwork.lineArt === `assets/line-art/${artwork.animationTemplate}.svg`, '线稿必须匹配动画模板');
    }
    const source = recipe.source;
    require(object(source), 'source 必填');
    if (object(source)) {
      require(['original', 'api', 'dataset'].includes(source.sourceType), 'sourceType 无效');
      for (const key of ['sourceName', 'sourceUrl', 'license', 'attribution', 'reviewNote']) require(nonempty(source[key]), `source.${key} 必填`);
      require(source.reviewStatus === 'reviewed', '配方来源必须完成编辑审核');
      const date = source.lastVerifiedAt;
      require(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date, 'lastVerifiedAt 必须是有效日期');
      if (source.sourceType === 'original') require(source.sourceUrl === 'docs/recipe-sources.md' && existsSync(resolve(root, source.sourceUrl)), '原创来源说明文件不存在');
      else require(typeof source.sourceUrl === 'string' && /^https:\/\//.test(source.sourceUrl), '外部来源必须提供 HTTPS URL');
    }
  });
  for (const group of groups) if (counts[group] !== 15) errors.push(`${group} 应有 15 条，实际 ${counts[group]} 条`);
  if (dessertFinishes.size !== 30) errors.push(`甜点应有 30 套不同成品图配置，实际 ${dessertFinishes.size} 套`);
  return errors;
}

// Importing this module only exposes validation; the CLI additionally checks all local assets.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const recipes = JSON.parse(readFileSync(resolve(publicRoot, 'data/recipes.json'), 'utf8'));
    const errors = validateRecipes(recipes);
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log(`已验证 ${recipes.length} 条配方：经典咖啡 15、创意咖啡 15、烘焙甜点 15、冷藏甜点 15。`);
  } catch (error) { console.error(`读取配方失败：${error.message}`); process.exitCode = 1; }
}
