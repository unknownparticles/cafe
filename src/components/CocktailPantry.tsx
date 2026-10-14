import { useMemo, useRef, useState } from 'react';
import type { CocktailIngredient, PantryPreferences, Recipe } from '../types';
import { CocktailIngredientTabs } from './CocktailIngredientTabs';
import { FinishArtwork } from '../animations/FinishArtwork';
import { cocktailKindNames, generateCocktails, matchCocktails } from '../services/cocktails';

interface Props {
  recipes: Recipe[];
  dictionary: CocktailIngredient[];
  preferences: PantryPreferences;
  onChange: (value: PantryPreferences) => void;
  favorites: string[];
  onOpen: (recipe: Recipe) => void;
  onFavorite: (recipe: Recipe) => void;
}

/** Ingredient controls update the saved inventory; recommendation rules stay in the service. */
export function CocktailPantry({ recipes, dictionary, preferences, onChange, favorites, onOpen, onFavorite }: Props) {
  const [round, setRound] = useState(0);
  const [submitted, setSubmitted] = useState<PantryPreferences | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const results = useRef<HTMLDivElement>(null);
  const pool = submitted ?? preferences;
  const matches = useMemo(() => submitted ? matchCocktails(recipes.filter(recipe => recipe.cocktail?.kind === 'classic'), dictionary, { ...pool, shopping: 'only' }) : [], [recipes, dictionary, submitted, pool]);
  const generated = useMemo(() => submitted ? generateCocktails(recipes, dictionary, { ...pool, shopping: 'only' }, round) : [], [recipes, dictionary, submitted, pool, round]);
  const changed = submitted !== null && JSON.stringify(submitted) !== JSON.stringify(preferences);
  const toggle = (key: 'flavors' | 'tools', id: string) => {
    const selected = preferences[key].includes(id);
    const next = { ...preferences, [key]: selected ? preferences[key].filter(value => value !== id) : [...preferences[key], id] };
    onChange(next);
  };
  function combine() {
    // Older saved inventory may contain uncertain/excluded entries; only visible selections enter the pool.
    const next = { ...preferences, available: preferences.available.filter(id => !preferences.uncertain.includes(id) && !preferences.excluded.includes(id)), locked: [], excluded: [], uncertain: [], shopping: 'only' as const };
    onChange(next); setSubmitted(next);
    setRound(0); setVisibleCount(12);
    // Results mount after the selection is submitted; move focus there for keyboard and mobile users.
    requestAnimationFrame(() => { results.current?.focus({ preventScroll: true }); results.current?.scrollIntoView({ behavior: 'auto', block: 'start' }); });
  }
  return <section className="pantry-page">
    <div className="library-heading"><p className="eyebrow">YOUR LITTLE HOME BAR</p><h1>家里有什么，调一杯</h1><p className="muted">依次选择基酒、调和酒、软饮料和水果装饰；每类可多选，也可以留空。</p></div>
    <div className="pantry-layout">
      <div className="pantry-controls">
        <CocktailIngredientTabs dictionary={dictionary} preferences={preferences} onChange={onChange} onComplete={combine} />
        <details className="pantry-options"><summary>口味、酒精偏好与器具</summary>
        <section className="pantry-panel" aria-labelledby="pantry-preferences-title"><h2 id="pantry-preferences-title">今天的口味</h2><div className="preference-chips" role="group" aria-label="调酒口味">{['清爽', '果香', '酸', '甜', '苦', '浓郁', '草本', '辛香'].map(flavor => <button key={flavor} aria-pressed={preferences.flavors.includes(flavor)} onClick={() => toggle('flavors', flavor)}>{flavor}</button>)}</div><label className="pantry-select">酒精偏好<select aria-label="酒精偏好" value={preferences.alcohol} onChange={event => onChange({ ...preferences, alcohol: event.target.value as PantryPreferences['alcohol'] })}><option value="any">不限酒精度</option><option value="none">无酒精</option><option value="low">低酒精 · 估算 ≤ 8%</option></select></label><h3>我有这些器具</h3><div className="preference-chips" role="group" aria-label="调酒器具">{['量杯', '酒杯', '吧匙', '摇酒壶', '滤冰器', '调酒杯'].map(tool => <button key={tool} aria-pressed={preferences.tools.includes(tool)} onClick={() => toggle('tools', tool)}>{tool}</button>)}</div></section>
        </details>
        <div className="combine-action"><p>合并所有已选材料，查找能做的经典酒与框架组合。</p><button className="primary" onClick={combine}>我选好了，开始调酒 ↗</button>{changed && <span role="status">材料已调整，点击重新组合。</span>}</div>
      </div>
      {submitted ? <div ref={results} className="pantry-results" aria-live="polite" tabIndex={-1}>
        <p className="fine-print">{pool.available.length} 种材料 · {matches.length} 杯经典酒 · {generated.length} 种框架组合</p>
        <div className="section-heading"><div><p className="eyebrow">CLASSICS FIRST</p><h2>先遇见一杯经典</h2></div><span className="muted" role="status">{matches.length} 杯匹配</span></div>
        <p className="fine-print">先按必需材料完整度排序，再考虑口味、器具和材料利用率。分数只说明匹配程度，不保证口感。</p>
        <div className="cocktail-results-grid">{matches.map(match => <CocktailResult key={match.recipe.id} recipe={match.recipe} favorite={favorites.includes(match.recipe.id)} onOpen={() => onOpen(match.recipe)} onFavorite={() => onFavorite(match.recipe)}><span className={`match-status ${match.missing.length ? 'missing' : ''}`}>{match.missing.length ? '缺少必需材料' : match.optionalMissing.length ? '必需材料齐全 · 可省装饰' : '材料齐全'}</span><p>{match.reasons.join(' · ')}</p>{match.missing.length > 0 && <p className="missing-list">还需：{match.missing.map(item => item.name).join('、')}</p>}{match.optionalMissing.length > 0 && <p>可省装饰：{match.optionalMissing.map(item => item.name).join('、')}</p>}<small>匹配 {match.score} 分</small></CocktailResult>)}</div>
        {!matches.length && <div className="pantry-empty"><h3>暂时没有符合限制的经典酒谱</h3><p>当前材料尚不能做出经典酒谱，可以查看下方的框架组合。</p></div>}
        <div className="section-heading creative-heading"><div><p className="eyebrow">A LITTLE EXPERIMENT</p><h2>用现有材料，再发现一杯</h2></div><button className="filter-favorite" onClick={() => setRound(round + 1)} disabled={!generated.length}>再组合一次 ↻</button></div>
        <p className="fine-print">变体与实验配方只使用已确认材料，均未实际调酒测试。无酒精使用独立气泡模板；不会直接删除经典配方的基酒。</p>
        <div className="cocktail-results-grid">{generated.slice(0, visibleCount).map(recipe => <CocktailResult key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onOpen={() => onOpen(recipe)} onFavorite={() => onFavorite(recipe)}><span className="match-status">已有材料可组合</span><p>{recipe.ingredients.filter(item => item.ingredientId !== 'ice').map(item => item.name).join(' · ')}</p><p>{recipe.flavorTags.join(' / ')}</p>{recipe.equipment.some(tool => !pool.tools.includes(tool)) && <p>缺少器具：{recipe.equipment.filter(tool => !pool.tools.includes(tool)).join('、')}</p>}{recipe.cocktail?.variationOf && <small>参考骨架：约翰柯林斯 · 已单独调整比例</small>}</CocktailResult>)}</div>
        {generated.length > visibleCount && <button className="filter-favorite more-combinations" onClick={() => setVisibleCount(visibleCount + 12)}>再看 {Math.min(12, generated.length - visibleCount)} 杯 · 共 {generated.length} 种组合</button>}
        {!generated.length && <div className="pantry-empty"><h3>还差一个组合的起点</h3><p>试试基酒搭配软饮料，或基酒搭配柑橘汁与原味糖浆；无酒精也可以用柑橘汁、糖浆和苏打水。需要冰块时，请勾选基础准备。</p></div>}
      </div> : <div className="pantry-empty"><h2>从你选的材料，发现这一杯</h2><p>四类材料都可以多选或留空，选择完成后点击“我选好了”。</p></div>}
    </div>
  </section>;
}

/** Classic and generated recipes share the same detail and favorite actions. */
function CocktailResult({ recipe, favorite, onOpen, onFavorite, children }: { recipe: Recipe; favorite: boolean; onOpen: () => void; onFavorite: () => void; children: React.ReactNode }) {
  return <article className="cocktail-result"><button className="cocktail-result-art" aria-label={`查看${recipe.name}配方`} onClick={onOpen}><FinishArtwork config={recipe.artwork.finish} label={`${recipe.name}成品示意插画`} /></button><div className="cocktail-result-body"><span className="cocktail-kind">{cocktailKindNames[recipe.cocktail!.kind]}</span><button className="tile-title" onClick={onOpen}>{recipe.name}<span>↗</span></button>{children}<div className="cocktail-result-actions"><span>{recipe.cocktail?.estimatedAbv === null ? '酒精度未估算' : `酒精度估算 ${recipe.cocktail?.estimatedAbv}%`}</span><button className="text-button" aria-pressed={favorite} aria-label={`${favorite ? '取消收藏' : '收藏'}${recipe.name}`} onClick={onFavorite}>{favorite ? '♥ 已收藏' : '♡ 收藏'}</button></div></div></article>;
}
