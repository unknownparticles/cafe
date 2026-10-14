import { useEffect, useRef, useState } from 'react';
import type { Recipe } from './types';
import { FinishArtwork } from './animations/FinishArtwork';
import { AnimatedFinish } from './animations/AnimatedFinish';
import { RitualIcon } from './components/RitualIcon';
import { RecipeDetail } from './components/RecipeDetail';
import { useStoredState } from './hooks/useStoredState';
import { usePwa } from './hooks/usePwa';
import { difficultyNames, drawRecipe, filterRecipes, groupNames, rarityNames, type CategoryFilter } from './services/recipes';

type Page = 'draw' | 'collection' | 'favorites' | 'settings';
const stringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
const boolean = (value: unknown): value is boolean => typeof value === 'boolean';
const readPage = (): Page => ['collection', 'favorites', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) as Page : 'draw';

function Mark({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'brand-mark small' : 'brand-mark'} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M9 20h25v9a12.5 12.5 0 0 1-25 0v-9Zm25 2h3a5 5 0 0 1 0 10h-4M6 42h34M16 13c-5-5 5-5 0-10m9 10c-5-5 5-5 0-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

/** 页面只协调交互状态；配方筛选、缩放和抽取规则在独立服务中。 */
export default function App() {
  const [page, setPage] = useState<Page>(readPage);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [difficulty, setDifficulty] = useState('');
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, saveFavorites, favoritesError] = useStoredState('ritual-favorites', [], stringList);
  const [animation, saveAnimation, animationError] = useStoredState('ritual-animation', true, boolean);
  const [reduced, setReduced] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [current, setCurrent] = useState<Recipe | null>(null);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'flipping' | 'revealed'>('idle');
  const [announcement, setAnnouncement] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const drawButton = useRef<HTMLButtonElement>(null);
  const pwa = usePwa();
  const isBusy = phase === 'drawing' || phase === 'flipping';
  const filters = { category, difficulty, query, favoritesOnly: favoritesOnly || page === 'favorites' };
  const candidates = filterRecipes(recipes, filters, favorites);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');
    fetch(`${import.meta.env.BASE_URL}data/recipes.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('配方库暂时无法加载');
      return response.json() as Promise<Recipe[]>;
    }).then(data => { setRecipes(data); setCurrent(data.find(recipe => recipe.name === '拿铁') ?? data[0]); }).catch(error => {
      if (error.name !== 'AbortError') setLoadError('配方库加载失败。首次使用需要联网，请检查网络后重试。');
    });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    const change = () => { setPage(readPage()); window.scrollTo({ top: 0 }); };
    addEventListener('hashchange', change);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    media.addEventListener('change', motion);
    return () => { removeEventListener('hashchange', change); media.removeEventListener('change', motion); };
  }, []);

  function finishReveal() {
    timers.current.forEach(clearTimeout); timers.current = [];
    busy.current = false; setPhase('revealed');
  }
  useEffect(() => {
    const visibility = () => { if (document.hidden && busy.current) finishReveal(); };
    addEventListener('visibilitychange', visibility);
    return () => { removeEventListener('visibilitychange', visibility); timers.current.forEach(clearTimeout); };
  }, []);
  useEffect(() => { if ((reduced || !animation) && busy.current) finishReveal(); }, [reduced, animation]);
  useEffect(() => { if (phase === 'revealed' && current) setAnnouncement(`已揭晓：${current.name}，${difficultyNames[current.difficulty]}，${current.totalTimeMinutes} 分钟。`); }, [phase, current]);

  function toggleFavorite(id: string) {
    saveFavorites(favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id]);
  }
  function draw() {
    if (busy.current) return;
    const recipe = drawRecipe(candidates, hasDrawn ? current?.id : undefined);
    if (!recipe) { setAnnouncement('没有符合条件的配方，请调整筛选。'); return; }
    setCurrent(recipe); setHasDrawn(true);
    if (!animation || reduced) { setAnnouncement(`已揭晓：${recipe.name}，${difficultyNames[recipe.difficulty]}，${recipe.totalTimeMinutes} 分钟。`); setPhase('revealed'); return; }
    setAnnouncement('正在为你挑选一份灵感。');
    busy.current = true; setPhase('drawing');
    timers.current = [setTimeout(() => setPhase('flipping'), 1300), setTimeout(finishReveal, 3200)];
  }

  const navigation: { id: Page; name: string }[] = [{ id: 'draw', name: '今日灵感' }, { id: 'collection', name: '配方图鉴' }, { id: 'favorites', name: '我的收藏' }];
  return <div className={`${!animation || reduced ? 'motion-off' : ''} ${page === 'draw' ? 'draw-page' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>跳到主要内容</a>
    <header className="site-header"><a className="brand" href="#draw" aria-label="Daily Ritual 首页"><Mark /><span>daily ritual<span className="brand-caption">日 常 灵 感 事 务 所</span></span></a><nav aria-label="主导航">{navigation.map(item => <a key={item.id} href={`#${item.id}`} className={page === item.id ? 'active' : ''} aria-current={page === item.id ? 'page' : undefined}>{item.name}{item.id === 'favorites' && favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}</a>)}</nav><a className={`settings-link icon-button ${page === 'settings' ? 'active' : ''}`} href="#settings" aria-label={pwa.updateReady ? "偏好设置 · 新版就绪" : "偏好设置"}><RitualIcon kind="settings" />{pwa.updateReady && <span className="settings-update-dot" />}</a></header>
    <main id="main-content" tabIndex={-1}>
      {(!pwa.online || pwa.updateReady || pwa.connectionNotice || favoritesError || animationError) && <div className="notice" role="status">{favoritesError || animationError || (!pwa.online ? '你正在离线浏览 · 已缓存的灵感依然在这里' : pwa.updateReady ? '新版已准备好，关闭所有应用窗口后重新打开即可更新。' : pwa.connectionNotice)}</div>}
      {loadError ? <div className="empty-state"><Mark /><h1>灵感还在路上</h1><p>{loadError}</p><button className="primary" onClick={() => setReload(reload + 1)}>重新加载</button></div> : recipes.length === 0 ? <div className="empty-state" role="status"><Mark /><p>正在打开灵感手账…</p></div> : page === 'draw' ? <>
        <section className="hero">
          <div className="hero-copy"><p className="eyebrow"><span className="tiny-star"><RitualIcon kind="star" /></span> SLOW DOWN. SIP. SAVOUR.</p><h1>把日子过成<br />一口<span className="italic">小美好</span><span className="title-dot">。</span></h1><p className="hero-description">一杯咖啡，一份甜点，一点不期而遇。<br />抽一张灵感卡，把今天交给好味道。</p>
            <div className="mode-label">今天，想遇见什么？</div><div className="mode-selector" role="group" aria-label="抽卡分类">{([{ id: 'all', label: '随机惊喜' }, { id: 'coffee', label: '一杯咖啡' }, { id: 'dessert', label: '一份甜点' }] as const).map(mode => <button key={mode.id} aria-pressed={category === mode.id} disabled={isBusy} className={category === mode.id ? 'selected' : ''} onClick={() => setCategory(mode.id)}><RitualIcon kind={mode.id === 'all' ? 'star' : mode.id === 'coffee' ? 'cup' : 'dessert'} />{mode.label}</button>)}</div>
            <button ref={drawButton} className="primary draw-button" onClick={draw} disabled={isBusy || !candidates.length}><span> {isBusy ? '灵感正在缓缓显现' : hasDrawn ? '再遇见一份灵感' : '抽取今日灵感'}</span><span aria-hidden="true">↗</span></button>
            <div className="draw-caption">{isBusy ? <button className="text-button" onClick={() => { finishReveal(); requestAnimationFrame(() => drawButton.current?.focus()); }}>跳过动画 →</button> : <span>无需准备，随心抽取 <span aria-hidden="true">·</span> {candidates.length} 份小美好等你发现</span>}</div>
            {(query || difficulty || favoritesOnly) && <div className="active-filters" role="status"><span>{candidates.length ? '沿用图鉴筛选' : '没有符合筛选的配方'}{query && ` · ${query}`}{difficulty && ` · ${difficultyNames[difficulty]}`}{favoritesOnly && ' · 仅收藏'}</span><button className="text-button" onClick={() => { setQuery(''); setDifficulty(''); setFavoritesOnly(false); }}>清除筛选</button></div>}
          </div>
          <div className="card-stage"><span className="stage-note">a little ritual, just for you</span><span className="decor-star star-one" aria-hidden="true"><RitualIcon kind="star" /></span><span className="decor-star star-two" aria-hidden="true"><RitualIcon kind="sparkle" /></span><div className="card-shadow card-shadow-one" /><div className="card-shadow card-shadow-two" />
            {current && <article className={`ritual-card phase-${phase} art-${current.group}`} aria-busy={isBusy}><div className="card-top"><span>THE DAILY COLLECTION</span><span>No. {String(recipes.indexOf(current) + 1).padStart(2, '0')}</span></div><div className="card-illustration"><div className="art-orbit" /><AnimatedFinish key={current.id} config={current.artwork.finish} drawing={phase === 'drawing'} staticMode={!animation || reduced} /><span className="art-caption">{current.category === 'coffee' ? 'BREW A LITTLE HAPPINESS' : 'A MOMENT OF SWEETNESS'}</span></div><div className={`card-copy ${isBusy ? 'concealed' : ''}`}><span className="card-category">{groupNames[current.group]} · {rarityNames[current.rarity]}</span><h2>{current.name}</h2><p>{current.flavorTags.join(' / ')}</p><div className="card-divider" /><div className="card-bottom"><span>◷ {current.totalTimeMinutes} 分钟</span><span>{difficultyNames[current.difficulty]}</span></div></div><span className="card-seal" aria-hidden="true"><RitualIcon kind="star" /></span></article>}
            <div className="stage-bottom"><span className="handwritten">留一点时间，给喜欢的事。</span></div>
          </div>
        </section>
        {current && <div className="hero-card-actions"><button className="text-button" onClick={() => setDetail(current)} disabled={isBusy}>查看{hasDrawn ? '这份' : '示例'}配方 <span aria-hidden="true">↗</span></button><span className="small-divider" /><button className="text-button" aria-pressed={favorites.includes(current.id)} disabled={isBusy} onClick={() => toggleFavorite(current.id)}>{favorites.includes(current.id) ? '♥ 已收藏' : '♡ 收藏灵感'}</button></div>}
        <section className="ritual-strip" aria-label="产品特色"><div><span className="strip-icon"><RitualIcon kind="star" /></span><p><strong>让偶然，变成日常</strong><span>60 份咖啡与甜品灵感</span></p></div><div><span className="strip-icon">♧</span><p><strong>每份灵感，都能亲手实现</strong><span>清晰配方，陪你慢慢制作</span></p></div><div><span className="strip-icon">♡</span><p><strong>喜欢的，就好好收着</strong><span>本地收藏，离线也能翻阅</span></p></div></section>
        <section className="preview-section"><div className="section-heading"><div><p className="eyebrow">THE RECIPE JOURNAL</p><h2>下一口，或许是…</h2></div><a className="text-button" href="#collection">翻开全部图鉴 ↗</a></div><div className="preview-grid">{recipes.filter(recipe => recipe.group === 'creative' || recipe.group === 'baked' || recipe.group === 'chilled').filter((_, index) => index % 15 === 0).slice(0, 3).map(recipe => <RecipeTile key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onOpen={() => setDetail(recipe)} onFavorite={() => toggleFavorite(recipe.id)} />)}</div></section>
      </> : page === 'collection' || page === 'favorites' ? <section className="library"><div className="library-heading"><p className="eyebrow">{page === 'favorites' ? 'SAVED WITH LOVE' : 'THE DAILY COLLECTION'}</p><h1>{page === 'favorites' ? '留住喜欢的味道' : '灵感，慢慢翻'}</h1><p className="muted">{page === 'favorites' ? '属于你的小小味觉手账。收藏保存在这台设备上。' : '30 杯咖啡，30 份甜点。总有一份，刚好适合今天。'}</p></div>
        <div className="filter-bar"><label className="search-field"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜索配方、食材或风味" aria-label="搜索配方、食材或风味" value={query} onChange={event => setQuery(event.target.value)} /></label><label className="select-field"><span className="sr-only">配方分类</span><select value={category} onChange={event => setCategory(event.target.value as CategoryFilter)}><option value="all">全部分类</option><option value="coffee">咖啡</option><option value="dessert">甜品</option></select></label><label className="select-field"><span className="sr-only">制作难度</span><select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="">全部难度</option>{Object.entries(difficultyNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>{page === 'collection' && <button className={`filter-favorite ${favoritesOnly ? 'selected' : ''}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(!favoritesOnly)}>♡ 只看收藏</button>}</div>
        <div className="results-line"><span>共 {candidates.length} 份灵感</span>{(query || difficulty || category !== 'all' || favoritesOnly) && <button className="text-button" onClick={() => { setQuery(''); setDifficulty(''); setCategory('all'); setFavoritesOnly(false); }}>重置筛选</button>}</div>
        {candidates.length ? <div className="recipe-grid">{candidates.map(recipe => <RecipeTile key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onOpen={() => setDetail(recipe)} onFavorite={() => toggleFavorite(recipe.id)} />)}</div> : <div className="empty-state"><span className="empty-heart">♡</span><h2>{page === 'favorites' && !favorites.length ? '你的味觉手账，等待第一笔' : '暂时没有这份味道'}</h2><p>试试调整筛选，或去抽取一张新的灵感。</p><a className="primary" href="#draw">去遇见灵感 ↗</a></div>}
      </section> : <section className="settings-page"><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1>按你的节奏来</h1><div className="settings-panel"><div className="setting-row"><div><h2>制作与揭晓动画</h2><p>控制卡牌揭晓和配方步骤演示，可以随时暂停或跳过。</p></div><button className={`switch ${animation ? 'on' : ''}`} role="switch" aria-checked={animation} aria-label="卡牌揭晓动画" onClick={() => saveAnimation(!animation)}><span /></button></div><p className="fine-print">{reduced ? '系统已开启“减少动态效果”，当前使用静态揭晓。' : '自动尊重系统“减少动态效果”设置。'}</p></div><div className="settings-panel"><p className="eyebrow">YOUR POCKET COFFEE SHOP</p><h2>把灵感装进口袋</h2><p>添加到主屏幕，下次轻轻一点就能打开。</p>{pwa.installed ? <p className="status-good">✓ 已在独立窗口运行</p> : pwa.canInstall ? <button className="primary" onClick={pwa.install}>安装 Daily Ritual ↗</button> : null}<h3>iPhone / iPad Safari</h3><p>轻点浏览器的「分享」按钮 →「添加到主屏幕」→「添加」。</p><h3>Android / 电脑 Chrome 或 Edge</h3><p>打开浏览器菜单，选择「安装应用」或「添加到主屏幕」。安装入口由浏览器提供。</p><p className="fine-print">{pwa.offlineReady ? '✓ 核心内容已缓存，可以离线打开、抽卡和查看配方。' : '首次使用请保持联网，等待核心内容缓存完成后再离线使用。'} 收藏保存在当前浏览器，清除网站数据会同时移除收藏。</p></div></section>}
    </main>
    <footer className="site-footer"><a href="#draw" className="footer-brand"><Mark small /> daily ritual</a><span>把平凡的日常，酿成喜欢的模样。</span><span className="footer-status"><span className={pwa.offlineReady ? 'status-dot ready' : 'status-dot'} />{!pwa.online ? '离线时光' : pwa.offlineReady ? '离线灵感已就绪' : 'MADE FOR SLOW MOMENTS'}</span></footer>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    {detail && <RecipeDetail key={detail.id} recipe={detail} favorite={favorites.includes(detail.id)} onFavorite={() => toggleFavorite(detail.id)} onClose={() => setDetail(null)} staticMode={!animation || reduced} />}
  </div>;
}

/** 卡片的查看与收藏分别为按钮，避免嵌套交互造成键盘操作歧义。 */
function RecipeTile({ recipe, favorite, onOpen, onFavorite }: { recipe: Recipe; favorite: boolean; onOpen: () => void; onFavorite: () => void }) {
  return <article className="recipe-tile"><div className={`tile-art art-${recipe.group}`}><button className="tile-open" onClick={onOpen} aria-label={`查看${recipe.name}配方`}><FinishArtwork config={recipe.artwork.finish} label={`${recipe.name}成品示意插画`} /></button><button className={`tile-favorite icon-button ${favorite ? 'is-favorite' : ''}`} aria-label={`${favorite ? '取消收藏' : '收藏'}${recipe.name}`} aria-pressed={favorite} onClick={onFavorite}>{favorite ? '♥' : '♡'}</button><span className="tile-category">{groupNames[recipe.group]}</span></div><div className="tile-body"><button className="tile-title" onClick={onOpen}>{recipe.name}<span aria-hidden="true">↗</span></button><p>{recipe.flavorTags.join(' · ')}</p><div className="tile-meta"><span>◷ {recipe.totalTimeMinutes} 分钟</span><span>{difficultyNames[recipe.difficulty]}</span></div></div></article>;
}
