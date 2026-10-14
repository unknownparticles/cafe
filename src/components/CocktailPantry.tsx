import { useMemo, useState } from 'react';
import type { CocktailIngredient, PantryPreferences, Recipe } from '../types';
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [commonOnly, setCommonOnly] = useState(false);
  const [round, setRound] = useState(0);
  const categories = [...new Set(dictionary.map(item => item.category))];
  const common = ['gin', 'vodka', 'rum', 'lime-juice', 'lemon-juice', 'syrup', 'soda', 'ice'];
  const visible = dictionary.filter(item => (category === 'all' || item.category === category) && (!commonOnly || common.includes(item.id)) && [item.name, item.id, ...item.aliases].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const matches = useMemo(() => matchCocktails(recipes.filter(recipe => recipe.cocktail?.kind === 'classic'), dictionary, preferences), [recipes, dictionary, preferences]);
  const generated = useMemo(() => generateCocktails(recipes, dictionary, preferences, round), [recipes, dictionary, preferences, round]);
  const toggle = (key: 'locked' | 'excluded' | 'flavors' | 'tools', id: string) => {
    const selected = preferences[key].includes(id);
    const next = { ...preferences, [key]: selected ? preferences[key].filter(value => value !== id) : [...preferences[key], id] };
    // Excluding an ingredient also removes its lock rather than leaving contradictory constraints.
    if (key === 'excluded' && !selected) next.locked = next.locked.filter(value => value !== id);
    onChange(next);
  };
  function changeStock(id: string, status: string) {
    onChange({ ...preferences, available: [...preferences.available.filter(value => value !== id), ...(status === 'available' ? [id] : [])], uncertain: [...preferences.uncertain.filter(value => value !== id), ...(status === 'uncertain' ? [id] : [])], locked: status === 'available' ? preferences.locked : preferences.locked.filter(value => value !== id) });
  }
  const stockCount = preferences.available.filter(id => !preferences.excluded.includes(id) && !preferences.uncertain.includes(id)).length;
  const conflict = preferences.locked.some(id => !preferences.available.includes(id) || preferences.uncertain.includes(id) || preferences.excluded.includes(id));
  return <section className="pantry-page">
    <div className="library-heading"><p className="eyebrow">YOUR LITTLE HOME BAR</p><h1>家里有什么，调一杯</h1><p className="muted">从已有材料开始，发现经典酒款与新的组合。库存只保存在这台设备上。</p></div>
    <div className="pantry-layout">
      <div className="pantry-controls">
        <section className="pantry-panel" aria-labelledby="pantry-stock-title">
          <div className="section-row"><h2 id="pantry-stock-title">我的材料</h2><span>{stockCount} 种已有 · {preferences.uncertain.length} 种待确认</span></div>
          <p className="fine-print">只有“已有”计入库存；青柠与青柠汁分别记录。酒精度、糖度和过敏原请核对包装，姜汁汽水选择标示 0% 的商品。</p>
          <label className="search-field"><input type="search" aria-label="搜索调酒材料" placeholder="青柠汁 / lime juice" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <div className="pantry-filter-row"><label className="select-field"><span className="sr-only">材料分类</span><select value={category} onChange={event => setCategory(event.target.value)}><option value="all">全部材料</option>{categories.map(name => <option key={name}>{name}</option>)}</select></label><button className={`filter-favorite ${commonOnly ? 'selected' : ''}`} aria-pressed={commonOnly} onClick={() => setCommonOnly(!commonOnly)}>常用材料</button></div>
          <div className="ingredient-picker">{visible.map(item => <div key={item.id} className={`stock-item ${preferences.excluded.includes(item.id) ? 'excluded' : ''}`}><div><strong>{item.name}</strong><small>{item.category}</small></div><label><span className="sr-only">{item.name}库存</span><select aria-label={`${item.name}库存`} value={preferences.available.includes(item.id) ? 'available' : preferences.uncertain.includes(item.id) ? 'uncertain' : 'absent'} onChange={event => changeStock(item.id, event.target.value)}><option value="absent">没有</option><option value="available">已有</option><option value="uncertain">待确认</option></select></label><div className="stock-actions"><button aria-label={`锁定${item.name}`} aria-pressed={preferences.locked.includes(item.id)} disabled={!preferences.available.includes(item.id) || preferences.excluded.includes(item.id)} onClick={() => toggle('locked', item.id)}>{preferences.locked.includes(item.id) ? '已锁定' : '锁定'}</button><button aria-label={`排除${item.name}`} aria-pressed={preferences.excluded.includes(item.id)} onClick={() => toggle('excluded', item.id)}>{preferences.excluded.includes(item.id) ? '已排除' : '排除'}</button></div></div>)}</div>
          {!visible.length && <p className="muted">没有找到材料。试试中文名或英文别名。</p>}
          <p className="fine-print">锁定表示每杯必须包含；排除表示每杯都不能包含。库存不记录数量，请制作前确认余量。</p>
        </section>
        <section className="pantry-panel" aria-labelledby="pantry-preferences-title"><h2 id="pantry-preferences-title">今天的口味</h2><div className="preference-chips" role="group" aria-label="调酒口味">{['清爽', '果香', '酸', '甜', '苦', '浓郁', '草本', '辛香'].map(flavor => <button key={flavor} aria-pressed={preferences.flavors.includes(flavor)} onClick={() => toggle('flavors', flavor)}>{flavor}</button>)}</div><label className="pantry-select">酒精偏好<select aria-label="酒精偏好" value={preferences.alcohol} onChange={event => onChange({ ...preferences, alcohol: event.target.value as PantryPreferences['alcohol'] })}><option value="any">不限酒精度</option><option value="none">无酒精</option><option value="low">低酒精 · 估算 ≤ 8%</option></select></label><label className="pantry-select">材料限制<select aria-label="材料限制" value={preferences.shopping} onChange={event => onChange({ ...preferences, shopping: event.target.value as PantryPreferences['shopping'] })}><option value="minimal">尽量少买 · 显示缺失项</option><option value="only">只用已有材料</option></select></label><h3>我有这些器具</h3><div className="preference-chips" role="group" aria-label="调酒器具">{['量杯', '酒杯', '吧匙', '摇酒壶', '滤冰器', '调酒杯'].map(tool => <button key={tool} aria-pressed={preferences.tools.includes(tool)} onClick={() => toggle('tools', tool)}>{tool}</button>)}</div></section>
      </div>
      <div className="pantry-results">
        {conflict && <p className="notice" role="status">锁定材料存在库存冲突，请先确认该材料已有且未被排除。</p>}
        <div className="section-heading"><div><p className="eyebrow">CLASSICS FIRST</p><h2>先遇见一杯经典</h2></div><span className="muted" role="status">{matches.length} 杯匹配</span></div>
        <p className="fine-print">先按必需材料完整度排序，再考虑口味、器具和材料利用率。分数只说明匹配程度，不保证口感。</p>
        <div className="cocktail-results-grid">{matches.map(match => <CocktailResult key={match.recipe.id} recipe={match.recipe} favorite={favorites.includes(match.recipe.id)} onOpen={() => onOpen(match.recipe)} onFavorite={() => onFavorite(match.recipe)}><span className={`match-status ${match.missing.length ? 'missing' : ''}`}>{match.missing.length ? '缺少必需材料' : match.optionalMissing.length ? '必需材料齐全 · 可省装饰' : '材料齐全'}</span><p>{match.reasons.join(' · ')}</p>{match.missing.length > 0 && <p className="missing-list">还需：{match.missing.map(item => item.name).join('、')}</p>}{match.optionalMissing.length > 0 && <p>可省装饰：{match.optionalMissing.map(item => item.name).join('、')}</p>}<small>匹配 {match.score} 分</small></CocktailResult>)}</div>
        {!matches.length && <div className="pantry-empty"><h3>暂时没有符合限制的经典酒谱</h3><p>检查锁定、排除或酒精偏好；也可以查看下方组合。</p></div>}
        <div className="section-heading creative-heading"><div><p className="eyebrow">A LITTLE EXPERIMENT</p><h2>用现有材料，再发现一杯</h2></div><button className="filter-favorite" onClick={() => setRound(round + 1)} disabled={!generated.length}>再组合一次 ↻</button></div>
        <p className="fine-print">变体与实验配方只使用已确认材料，均未实际调酒测试。无酒精使用独立气泡模板；不会直接删除经典配方的基酒。</p>
        <div className="cocktail-results-grid">{generated.map(recipe => <CocktailResult key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onOpen={() => onOpen(recipe)} onFavorite={() => onFavorite(recipe)}><span className="match-status">已有材料可组合</span><p>{recipe.ingredients.filter(item => item.ingredientId !== 'ice').map(item => item.name).join(' · ')}</p><p>{recipe.flavorTags.join(' / ')}</p>{recipe.equipment.some(tool => !preferences.tools.includes(tool)) && <p>缺少器具：{recipe.equipment.filter(tool => !preferences.tools.includes(tool)).join('、')}</p>}{recipe.cocktail?.variationOf && <small>参考骨架：约翰柯林斯 · 已单独调整比例</small>}</CocktailResult>)}</div>
        {!generated.length && <div className="pantry-empty"><h3>还差一个组合的起点</h3><p>现有模板需要冰块、青柠汁或柠檬汁和原味糖浆，再搭配基酒或苏打水。锁定材料也必须进入模板；无法满足时不生成。</p></div>}
      </div>
    </div>
  </section>;
}

/** Classic and generated recipes share the same detail and favorite actions. */
function CocktailResult({ recipe, favorite, onOpen, onFavorite, children }: { recipe: Recipe; favorite: boolean; onOpen: () => void; onFavorite: () => void; children: React.ReactNode }) {
  return <article className="cocktail-result"><button className="cocktail-result-art" aria-label={`查看${recipe.name}配方`} onClick={onOpen}><FinishArtwork config={recipe.artwork.finish} label={`${recipe.name}成品示意插画`} /></button><div className="cocktail-result-body"><span className="cocktail-kind">{cocktailKindNames[recipe.cocktail!.kind]}</span><button className="tile-title" onClick={onOpen}>{recipe.name}<span>↗</span></button>{children}<div className="cocktail-result-actions"><span>{recipe.cocktail?.estimatedAbv === null ? '酒精度未估算' : `酒精度估算 ${recipe.cocktail?.estimatedAbv}%`}</span><button className="text-button" aria-pressed={favorite} aria-label={`${favorite ? '取消收藏' : '收藏'}${recipe.name}`} onClick={onFavorite}>{favorite ? '♥ 已收藏' : '♡ 收藏'}</button></div></div></article>;
}
