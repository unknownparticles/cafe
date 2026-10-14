import { useRef, useState } from 'react';
import type { CocktailIngredient, PantryPreferences } from '../types';

const tabs = [
  { id: 'base', name: '基酒', hint: '选几种喜欢的基酒，也可以留空做无酒精饮品。' },
  { id: 'modifier', name: '调和酒', hint: '选择味美思、利口酒；糖浆与调味也在这里。' },
  { id: 'soft', name: '软饮料', hint: '果汁、气泡饮料、咖啡与茶，可以多选。' },
  { id: 'garnish', name: '水果装饰', hint: '水果、果皮和香草均可选，不加装饰也可以。' },
] as const;

/** Every material has one visible tab; ice and water remain explicit preparation choices. */
function tabFor(item: CocktailIngredient) {
  if (item.role === 'base') return 'base';
  if (item.role === 'liqueur' || item.role === 'sweet' || item.id === 'salt') return 'modifier';
  if (item.role === 'garnish' || item.id === 'lime') return 'garnish';
  return 'soft';
}

/** Tabs select a union of available materials; changing tabs never clears another tab's choices. */
export function CocktailIngredientTabs({ dictionary, preferences, onChange, onComplete }: { dictionary: CocktailIngredient[]; preferences: PantryPreferences; onChange: (value: PantryPreferences) => void; onComplete: () => void }) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = (id: string) => preferences.available.includes(id) && !preferences.uncertain.includes(id) && !preferences.excluded.includes(id);
  const materials = dictionary.filter(item => !['ice', 'water'].includes(item.id));
  const visible = materials.filter(item => tabFor(item) === tabs[active].id && [item.name, ...item.aliases].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  function toggle(id: string) {
    onChange({ ...preferences, available: selected(id) ? preferences.available.filter(value => value !== id) : [...preferences.available.filter(value => value !== id), id], uncertain: preferences.uncertain.filter(value => value !== id), excluded: preferences.excluded.filter(value => value !== id), locked: preferences.locked.filter(value => value !== id) });
  }
  function changeTab(index: number, focus = false) {
    setActive(index); setQuery('');
    if (focus) buttons.current[index]?.focus();
  }
  return <section className="pantry-panel ingredient-tabs-panel" aria-label="选择调酒材料">
    <div className="ingredient-tabs" role="tablist" aria-label="调酒材料分类">{tabs.map((tab, index) => <button key={tab.id} ref={element => { buttons.current[index] = element; }} id={`ingredient-tab-${tab.id}`} role="tab" aria-selected={active === index} aria-controls={`ingredient-panel-${tab.id}`} tabIndex={active === index ? 0 : -1} onClick={() => changeTab(index)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (active + 1) % tabs.length : event.key === 'ArrowLeft' ? (active + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next !== null) { event.preventDefault(); changeTab(next, true); }
    }}><span className="ingredient-tab-number">0{index + 1}</span><span>{tab.name}</span><small>{materials.filter(item => tabFor(item) === tab.id && selected(item.id)).length} 已选</small></button>)}</div>
    <div role="tabpanel" id={`ingredient-panel-${tabs[active].id}`} aria-labelledby={`ingredient-tab-${tabs[active].id}`} className="ingredient-tab-panel">
      <div className="section-row"><div><h2>{tabs[active].name}</h2><p className="fine-print">{tabs[active].hint}</p></div><span>可多选 · 可留空</span></div>
      <label className="search-field"><input type="search" aria-label="搜索当前分类材料" placeholder={`搜索${tabs[active].name}`} value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="ingredient-choice-grid">{visible.map(item => <button key={item.id} aria-pressed={selected(item.id)} onClick={() => toggle(item.id)} className="ingredient-choice"><span className="ingredient-swatch" style={{ background: item.color }} /><span><strong>{item.name}</strong><small>{item.category}</small></span><span className="ingredient-check" aria-hidden="true">{selected(item.id) ? '✓' : '+'}</span></button>)}</div>
      {!visible.length && <p className="muted">当前分类没有匹配材料。</p>}
      <div className="ingredient-tab-navigation"><button className="text-button" disabled={active === 0} onClick={() => changeTab(active - 1, true)}>← 上一步</button>{active < tabs.length - 1 ? <button className="filter-favorite" onClick={() => changeTab(active + 1, true)}>下一步：{tabs[active + 1].name} →</button> : <button className="primary" onClick={onComplete}>我选好了，看看能调什么 ↗</button>}</div>
    </div>
    <div className="ingredient-preparation"><span>基础准备</span>{dictionary.filter(item => ['ice', 'water'].includes(item.id)).map(item => <button key={item.id} className="filter-favorite" aria-pressed={selected(item.id)} onClick={() => toggle(item.id)}>{selected(item.id) ? '✓ ' : '+ '}{item.name}</button>)}</div>
    <div className="ingredient-selection-summary"><strong>已选材料</strong><div>{dictionary.filter(item => selected(item.id)).map(item => <button key={item.id} className="selected-material" onClick={() => toggle(item.id)} aria-label={`移除${item.name}`}>{item.name} ×</button>)}{!preferences.available.some(selected) && <span className="muted">每类都可留空，从任意一类开始。</span>}</div></div>
  </section>;
}
