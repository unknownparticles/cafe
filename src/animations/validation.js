const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const color = value => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
const oneOf = values => value => values.includes(value);
const range = (min, max, integer = false) => value => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));
const layers = (min = 0) => value => Array.isArray(value) && value.length >= min && value.length <= 5 && value.every(color);
const vessels = ['cup', 'glass', 'bowl', 'mold', 'pot', 'filter', 'press'];
const garnishes = ['none', 'heart', 'rosetta', 'foam', 'cocoa', 'cinnamon', 'sesame', 'walnut', 'almond', 'chocolate', 'raisin', 'lemon', 'orange', 'strawberry', 'mango', 'blueberry', 'osmanthus', 'coconut', 'peanut', 'tea'];
// Keep these schemas aligned with SceneParams in src/animations/types.ts.
const sceneSchemas = {
  'cocktail-shake': {},
  'cocktail-stir': {},
  'cocktail-strain': {},
  'cocktail-layer': { layers: layers(1) },
  'cocktail-add-ice': { iceCount: range(1, 8, true) },
  'cocktail-top-up': { amount: range(1, 3000) },
  'cocktail-garnish': { garnish: oneOf(garnishes) },
  'cocktail-reveal': {},
  'ingredient-drop': { ingredient: oneOf(['bean', 'ice', 'sugar', 'flour', 'spice', 'chocolate', 'fruit', 'liquid']) },
  'measure-pour': { amount: range(Number.MIN_VALUE, 3000), unit: oneOf(['g', 'ml']) },
  'mix-stir': { tool: oneOf(['spoon', 'whisk', 'spatula', 'blender']) },
  'sift-sprinkle': { ingredient: oneOf(['flour', 'spice', 'sugar']) },
  'espresso-extraction': { yieldGrams: value => value === null || range(1, 200)(value) },
  'pour-over': { waterMl: range(1, 3000) },
  'milk-pour-latte-art': { pattern: oneOf(['none', 'heart', 'rosetta', 'foam']) },
  'press-filter': { method: oneOf(['press', 'paper', 'mesh']) },
  'steam-rise': { temperature: value => value === null || range(0, 100)(value) },
  'iced-drink-build': { iceCount: range(1, 8, true) },
  'roll-shape': { shape: oneOf(['round', 'rectangle', 'ball']) },
  'pipe-cream': { pattern: oneOf(['spiral', 'dollop']) },
  'batter-pour': { fillRatio: range(0.1, 1) },
  'bake-rise': { temperature: value => value === null || range(0, 250)(value) },
  'layer-assemble': { layers: layers(1) },
  'chill-set': { minutes: range(0, 1440), mode: oneOf(['chill', 'freeze']) },
  'cut-slice': { target: oneOf(['fruit', 'cake', 'chocolate', 'nuts', 'butter']) },
  'dust-powder': { ingredient: oneOf(['cocoa', 'sugar', 'spice']) },
  'drizzle-sauce': { sauce: oneOf(['coffee', 'syrup', 'chocolate', 'honey']) },
  'garnish-place': { garnish: oneOf(garnishes) },
  'plate-present': { surface: oneOf(['plate', 'rack', 'cup']), action: oneOf(['wipe', 'tap', 'drain', 'cover', 'line', 'soften', 'cool', 'unmold', 'place', 'rinse', 'remove', 'serve']) },
  'reveal-finish': {},
  'whip-foam': { texture: oneOf(['light', 'soft', 'firm']) },
  'heat-melt': { temperature: value => value === null || range(0, 250)(value), mode: oneOf(['warm', 'melt', 'simmer']) },
};

/** Validate every required field and reject extras so typos cannot silently change artwork. */
function validateFields(value, schema, label) {
  if (!object(value)) return [`${label} 必须是对象`];
  const errors = [];
  for (const [key, check] of Object.entries(schema)) {
    if (!Object.hasOwn(value, key) || !check(value[key])) errors.push(`${label}.${key} 缺失或无效`);
  }
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(schema, key)) errors.push(`${label}.${key} 是未知字段`);
  }
  return errors;
}

/** Check a single discriminated scene; malformed imported JSON produces errors, never exceptions. */
export function validateAnimationScene(scene) {
  const errors = validateFields(scene, {
    id: value => typeof value === 'string' && Object.hasOwn(sceneSchemas, value),
    durationMs: range(400, 10000, true),
    params: object,
  }, 'scene');
  if (!object(scene) || !Object.hasOwn(sceneSchemas, scene.id)) return errors;
  return errors.concat(validateFields(scene.params, {
    vessel: oneOf(vessels), color, label: nonempty, ...sceneSchemas[scene.id],
  }, 'params'));
}

/** Check the complete finished recipe illustration configuration. */
export function validateFinish(config) {
  return validateFields(config, {
    shape: oneOf(['espresso', 'latte', 'iced', 'filter', 'cookie', 'brownie', 'loaf', 'muffin', 'scone', 'crumble', 'cheesecake', 'round-cake', 'square-cake', 'madeleine', 'financier', 'tart', 'pear', 'pudding', 'jelly', 'mousse', 'layered', 'oats', 'rice', 'sago', 'coupe', 'highball', 'rocks']),
    color, layers: layers(), garnish: oneOf(garnishes), accent: color,
    pattern: oneOf(['plain', 'speckled', 'striped', 'scored']),
  }, 'finish');
}

/** Check a readable recipe step and its bounded sequence of animation scenes. */
export function validateStep(step) {
  const errors = validateFields(step, {
    id: value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    title: nonempty, description: nonempty,
    scenes: value => Array.isArray(value) && value.length >= 1 && value.length <= 12,
  }, 'step');
  if (object(step) && Array.isArray(step.scenes)) step.scenes.forEach((scene, index) => {
    errors.push(...validateAnimationScene(scene).map(error => `场景 ${index + 1}: ${error}`));
  });
  return errors;
}
