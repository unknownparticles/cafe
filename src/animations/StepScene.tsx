import type { ReactNode } from 'react';
import { Container, Decoration, Ingredient, Steam } from './parts';
import { FinishArtwork } from './FinishArtwork';
import { CocktailScene } from './CocktailScene';
import type { AnimationScene, FinishConfig } from './types';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };

/** Actions share their vessel/ingredients; progress is controlled externally so pause is exact. */
export function StepScene({ scene, progress, finish }: { scene: AnimationScene; progress: number; finish: FinishConfig }) {
  const p = clamp(progress), q = ease(p), params = scene.params;
  const liquid = (level = q, color = params.color) => <path d={`M91 ${204 - 60 * level}Q150 ${211 - 60 * level} 209 ${204 - 60 * level}L201 204Q150 223 99 204Z`} fill={color} stroke="none" opacity=".68" />;
  const pour = (color = params.color, x = 150) => <g opacity={p < .9 ? clamp(p * 8) : (1 - p) * 10}><path d={`M${x} 65Q${x + 5} 99 ${x} 151`} stroke={color} strokeWidth="6" /><ellipse cx={x} cy="158" rx={8 + Math.sin(p * 30) * 3} ry="3" stroke={color} /></g>;
  const bowl = (content: ReactNode, kind = params.vessel) => <>{content}<Container kind={kind} /></>;
  const particles = (kind: Parameters<typeof Ingredient>[0]['kind'], color = params.color) => <g>{Array.from({ length: 8 }, (_, i) => {
    const start = i * .065, local = clamp((p - start) / .35);
    const x = 111 + i * 31 % 85, y = 42 + local * (120 + i % 3 * 7);
    return <g key={i} transform={`translate(${x} ${y}) rotate(${local * 90})`} opacity={p >= start ? 1 : 0}><Ingredient kind={kind} color={color} /></g>;
  })}</g>;
  const spoon = (kind: 'spoon' | 'whisk' | 'spatula' | 'blender') => <g transform={`translate(${145 + Math.sin(p * Math.PI * 8) * 28} ${137 + Math.cos(p * Math.PI * 8) * 5}) rotate(${Math.sin(p * Math.PI * 8) * 18})`}><path d="M0-92v67" strokeWidth="5" />{kind === 'whisk' ? <><ellipse cy="-4" rx="16" ry="25" /><ellipse cy="-4" rx="7" ry="25" /></> : kind === 'spatula' ? <rect x="-13" y="-24" width="26" height="41" rx="5" fill="#dbc6a1" /> : kind === 'blender' ? <><rect x="-15" y="-90" width="30" height="41" rx="7" fill="#e3d8c6" /><path d="m-19 7h38m-15-7 5 14" /></> : <ellipse cy="-4" rx="9" ry="17" fill="#dcc9ab" />}</g>;
  let content: ReactNode;
  switch (scene.id) {
    case 'cocktail-shake': case 'cocktail-stir': case 'cocktail-strain': case 'cocktail-layer':
    case 'cocktail-add-ice': case 'cocktail-top-up': case 'cocktail-garnish': case 'cocktail-reveal':
      content = <CocktailScene scene={scene} progress={p} finish={finish} />; break;
    case 'ingredient-drop': content = bowl(particles(scene.params.ingredient)); break;
    case 'measure-pour': content = <>{bowl(<>{liquid()}{pour()}</>)}<g transform={`translate(78 45) rotate(${q * 65})`}><path d="M-25-22h48v48h-48Z" fill="#eee3cd" /><path d="M23-13h12v26H23m-37-27h13m-13 12h9m-9 12h13" /></g><text x="231" y="61" textAnchor="middle">{Math.round(scene.params.amount * q)} {scene.params.unit}</text></>; break;
    case 'mix-stir': content = bowl(<>{liquid(1)}<g opacity={Math.sin(p * Math.PI)}><ellipse cx="150" cy="168" rx="43" ry="7" /><path d="M120 165q32-12 60 0" /></g>{spoon(scene.params.tool)}</>); break;
    case 'sift-sprinkle': content = <>{bowl(particles(scene.params.ingredient))}<g transform={`translate(${Math.sin(p * 40) * 9} 0)`}><path d="M103 54q45 46 91 0m-91 0h91l44-6" /><path d="m118 60 22 13m-7-16 24 16m-7-16 23 9" /></g></>; break;
    case 'espresso-extraction': if (params.vessel === 'pot') { content = <><path d="M117 62h72l16 80-23 20 14 57H111l13-57-23-20Z" fill="#e5d8c0" /><path d="M115 142h75M149 151v-37m0 0q-16 0-16 22m16-22q16 0 16 22m32-47 27-14 7 10-33 23" /><path d={`M130 ${139 - q * 24}h37`} stroke={params.color} strokeWidth="6" /><Steam progress={p} /></>; break; } content = <><path d="M67 37h168v43H67ZM110 80h81v14h-81m81-9h47" fill="#e5d8c0" /><path d="M133 94v50m35-50v50" stroke={params.color} strokeWidth={p < .85 ? 2 + Math.sin(p * 35) : 0} opacity={p < .95 ? 1 : 0} /><g transform="translate(19 38) scale(.86)">{liquid()}<Container kind="cup" /></g>{scene.params.yieldGrams !== null && <text x="238" y="165">{Math.round(scene.params.yieldGrams * q)} g</text>}</>; break;
    case 'pour-over': content = <><Container kind="filter" /><path d={`M${149 + Math.sin(p * 30) * 15} 47v48`} stroke="#9caeaa" strokeWidth="4" opacity={p < .9 ? 1 : 0} /><g transform={`translate(${Math.sin(p * 30) * 15} 0)`}><path d="M91 26h48l8 17 21-5 6 9-27 13-8-18H91Z" fill="#e3d5ba" /></g><path d="M149 181v23" stroke={params.color} strokeWidth="3" /><path d={`M108 ${228 - q * 27}h84v5h-84Z`} fill={params.color} stroke="none" /><text x="235" y="120">{Math.round(scene.params.waterMl * q)} ml</text></>; break;
    case 'milk-pour-latte-art': content = bowl(<>{liquid(1, params.vessel === 'glass' ? '#e0e9df' : '#946440')}{pour('#f6e7c9', 141)}<g opacity={clamp((p - .45) * 3)} transform={`translate(145 117) scale(${clamp(p * 1.5)})`}>{scene.params.pattern === 'none' ? <ellipse rx="32" ry="7" fill="#d5b78e" stroke="none" /> : <Decoration kind={scene.params.pattern} />}</g></>, params.vessel); break;
    case 'press-filter': content = scene.params.method === 'press' ? <>{liquid(1)}<Container kind="press" /><g transform={`translate(0 ${q * 84})`}><path d="M150 38v62m-49 0h98M133 37h34" strokeWidth="3" /></g></> : <>{scene.params.method === 'mesh' ? <g><path d="M80 91q70 70 140 0M80 91h140l40-9" /><path d="m99 98 67 32m-44-37 59 29m-35-29 51 16m-84 1 32-20m-18 31 46-30m-24 35 54-31" strokeWidth="1" /></g> : <path d="m85 80 64 81 67-81Z" fill="#e9ddc6" />}<path d="M149 162v38" stroke={params.color} strokeWidth="3" opacity={p < .9 ? 1 : 0} /><g transform="translate(32 46) scale(.78)">{liquid()}<Container kind="cup" /></g></>; break;
    case 'steam-rise': content = <>{bowl(liquid(1))}<Steam progress={p} />{scene.params.temperature !== null && <text x="242" y="90">{scene.params.temperature}°C</text>}</>; break;
    case 'iced-drink-build': content = bowl(<>{liquid(q)}{Array.from({ length: scene.params.iceCount }, (_, i) => <g key={i} transform={`translate(${116 + i * 23 % 75} ${60 + ease(p * 2 - i * .1) * (115 + i % 2 * 20)}) rotate(${i * 20})`} opacity={clamp(p * 8 - i * .3)}><Ingredient kind="ice" /></g>)}{pour()}</>, 'glass'); break;
    case 'roll-shape': content = <><path d="M63 219h179" /><g transform={`translate(150 184) scale(${.7 + q * .5} ${1.1 - q * .35})`} fill={params.color}>{scene.params.shape === 'rectangle' ? <rect x="-60" y="-25" width="120" height="45" rx="8" /> : <ellipse rx={scene.params.shape === 'ball' ? 35 : 65} ry="28" />}</g><g transform={`translate(150 ${143 + Math.sin(p * Math.PI * 6) * 24})`}><rect x="-66" y="-10" width="132" height="24" rx="8" fill="#c9ac83" /><path d="M-86 2h20m132 0h20" strokeWidth="7" /></g></>; break;
    case 'pipe-cream': content = <><Container kind="mold" /><path d={scene.params.pattern === 'spiral' ? "M116 166q-30-8 0-19l57-5q39 5 5 16l-47 3q-21-7 1-12h28" : "M120 169q30-6 30-48 0 42 30 48Z"} stroke={params.color} strokeWidth="9" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q} /><g transform={`translate(${120 + q * 52} ${107 - q * 10})`}><path d="m-26-62 51 10-22 44-7 8-5-11Z" fill="#f0e6d2" /></g></>; break;
    case 'batter-pour': content = <>{bowl(<>{liquid(q * scene.params.fillRatio)}{pour()}</>, params.vessel)}<path d="M85 35q55-15 65 17l-23 20-43-22Z" fill="#e8dac2" /></>; break;
    case 'bake-rise': content = <><rect x="50" y="47" width="200" height="183" rx="12" fill="#e8decc" /><rect x="67" y="85" width="166" height="126" rx="4" fill="#f4e6cc" /><circle cx="82" cy="66" r="5" />{scene.params.temperature !== null && <text x="190" y="70" textAnchor="middle">{scene.params.temperature}°C</text>}<path d={`M104 183v-${22 + 27 * q}q45-${25 * q} 90 0v${22 + 27 * q}Z`} fill={params.color} /><path d="M84 188h134" /><g opacity={Math.sin(p * Math.PI)}><path d="M101 109q-9 12 0 23m48-23q-9 12 0 23m48-23q-9 12 0 23" stroke="#b7895a" /></g></>; break;
    case 'layer-assemble': content = bowl(<>{scene.params.layers.map((color, i) => <rect key={i} x="102" y={194 - i * 24 - (1 - ease(p * scene.params.layers.length - i)) * 115} width="96" height="24" fill={color} stroke="none" opacity={clamp(p * scene.params.layers.length - i + .1)} />)}</>, 'glass'); break;
    case 'chill-set': content = <><rect x="64" y="31" width="173" height="207" rx="10" fill="#e8eee8" /><path d="M64 89h173m-151 20v26m0-84v20" /><g transform="translate(42 68) scale(.72)">{liquid(1)}<Container kind={params.vessel} /></g><g transform={`translate(196 59) rotate(${q * 90})`} stroke="#8baca5"><path d="M-13 0h26M0-13v26m-9-9 18 18m-18 0L9-9" /></g><text x="153" y="224" textAnchor="middle">{scene.params.minutes} 分钟 · {scene.params.mode === 'freeze' ? '冷冻' : '冷藏'}</text></>; break;
    case 'cut-slice': {
      const target = scene.params.target;
      const outline = target === 'fruit' ? 'M105 172c-44-67 80-67 82-10-4 40-63 45-82 10Z' : target === 'nuts' ? 'M114 159c-19-43 72-53 69-7 23 42-72 53-69 7Z' : target === 'butter' ? 'm92 150 106-16v55l-106 8Z' : target === 'chocolate' ? 'm88 156 110-18 10 47-116 15Z' : 'm92 150 106-16v55l-106 8Z';
      content = <><ellipse cx="150" cy="217" rx="99" ry="9" fill="#e1d0ae" /><g transform={`translate(${-q * 9} 0)`}><path d={outline} fill={params.color} /></g><g transform={`translate(${q * 13} 0)`}><path d="m166 140 37-4 12 49-49 9Z" fill={params.color} /></g><g transform={`translate(0 ${q * 50})`}><path d="M161 55h14v72l-14 16Z" fill="#d7ded6" /><path d="M167 35v22" strokeWidth="10" /></g></>; break; }
    case 'dust-powder': content = <><g transform="translate(0 35)"><FinishArtwork config={finish} /></g><g opacity={clamp(p * 3)}>{particles(scene.params.ingredient === 'cocoa' ? 'spice' : scene.params.ingredient)}</g></>; break;
    case 'drizzle-sauce': content = <><g transform="translate(0 22)"><FinishArtwork config={finish} /></g><path d="M98 124q25-24 50-3t50-2" stroke={params.color} strokeWidth="5" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q} /><path d={`M${98 + q * 100} 44v75`} stroke={params.color} strokeWidth="3" opacity={p < .9 ? 1 : 0} /></>; break;
    case 'garnish-place': content = <><FinishArtwork config={{ ...finish, garnish: 'none' }} /><g transform={`translate(150 ${30 + q * 73})`} opacity={clamp(p * 4)}><Decoration kind={scene.params.garnish} color={finish.accent} /></g></>; break;
    case 'plate-present': {
      const action = scene.params.action;
      const cooked = ['cookie', 'brownie', 'loaf', 'muffin', 'scone', 'crumble', 'cheesecake', 'madeleine', 'financier', 'tart', 'pear', 'round-cake', 'square-cake'].includes(finish.shape);
      if (action === 'serve' || action === 'unmold' || (action === 'cool' && cooked && params.vessel === 'mold')) {
        content = <g transform={`translate(${action === 'serve' ? (1 - q) * 55 : 0} ${action === 'unmold' ? -q * 12 : 0})`}><FinishArtwork config={finish} />{scene.params.surface === 'rack' && <path d="M46 226h208m-193-6v19m25-19v19m25-19v19m25-19v19m25-19v19m25-19v19m25-19v19m25-19v19" />}{action === 'cool' && <g opacity={1 - q}><Steam progress={p} /></g>}</g>;
      } else if (action === 'soften') {
        content = <><Container kind={params.vessel} /><rect x={122 - q * 12} y={130 + q * 20} width={57 + q * 24} height={45 - q * 21} rx={2 + q * 12} fill={params.color} /><path d="M226 68v47m-5-47v47" /><circle cx="223" cy="122" r="9" /></>;
      } else if (action === 'rinse') {
        content = <>{particles('fruit', params.color)}<Container kind="bowl" /><path d="M200 38h-42v19m-7 9v22m7-20v25m7-27v22" stroke="#91aba5" /></>;
      } else {
        content = <g transform={`translate(${action === 'tap' ? Math.sin(p * 45) * (1 - p) * 9 : action === 'place' ? (1 - q) * 65 : 0} 0) rotate(${action === 'drain' ? -q * 30 : 0} 150 180)`}>
          {['cover', 'cool', 'drain', 'remove'].includes(action) && liquid(1)}<Container kind={params.vessel} />
          {action === 'cover' && <g transform={`translate(0 ${-55 * (1 - q)})`}><path d="M71 109h159m-99-9h39" strokeWidth="4" /></g>}
          {action === 'wipe' && <g transform={`translate(${Math.sin(p * Math.PI * 5) * 30} 0)`}><path d="m111 105 57-3 12 25-63 4Z" fill="#d2d9c2" /></g>}
          {action === 'line' && <path d={`M80 ${80 + q * 45}l15 59h109l17-59-21 6-18-8-20 7-25-9-23 9-15-4Z`} fill="#fcf5e5" stroke="#c5b89d" />}
          {action === 'remove' && <g transform={`translate(0 ${-q * 74})`}><path d="M177 68v97l-14 8" /><Ingredient kind="spice" color={params.color} /></g>}
          {action === 'drain' && <path d="M82 139q-20 10-24 57" stroke={params.color} strokeWidth="4" opacity={p < .9 ? 1 : 0} />}
          {action === 'cool' && <g opacity={1 - q}><Steam progress={p} /></g>}
          {['cool', 'cover', 'tap'].includes(action) && <g transform={`translate(238 64) rotate(${q * 180})`}><circle r="15" /><path d="M0-10V0h8" /></g>}
        </g>;
      }
      break;
    }
    case 'reveal-finish': content = <FinishArtwork config={finish} progress={p} />; break;
    case 'whip-foam': {
      const volume = scene.params.texture === 'light' ? .5 : scene.params.texture === 'soft' ? .8 : 1;
      content = bowl(<><path d={`M82 161q10-${10 + q * 25 * volume} 32-12 15-${q * 45 * volume} 37-10 25-${q * 30 * volume} 38 10 22-10 31 13c-30 48-113 45-138-1Z`} fill={params.color} />{spoon('whisk')}<g opacity={Math.sin(p * Math.PI)}>{[0, 1, 2].map(i => <circle key={i} cx={109 + i * 39} cy={125 - i % 2 * 21} r={3 + q * 4} />)}</g></>); break; }
    case 'heat-melt': content = <>{bowl(<>{liquid(.4 + q * .6)}{scene.params.mode === 'melt' && [0, 1, 2].map(i => <g key={i} transform={`translate(${116 + i * 31} 160) scale(${1 - q})`}><Ingredient kind="chocolate" color={params.color} /></g>)}<g opacity={p > .35 ? 1 : 0}>{scene.params.mode === 'simmer' && [0, 1, 2, 3].map(i => <circle key={i} cx={105 + i * 28} cy={161 - (p * 48 + i * 13) % 27} r="3" />)}<Steam progress={p} /></g></>, 'pot')}<path d="M104 237q-12-16 0-23 12 11 0 23m45 0q-12-16 0-23 12 11 0 23m45 0q-12-16 0-23 12 11 0 23" stroke="#bb8658" />{scene.params.temperature !== null && <text x="246" y="84">{scene.params.temperature}°C</text>}</>; break;
    default: content = <FinishArtwork config={finish} />;
  }
  return <svg className="step-scene" viewBox="0 0 300 260" role="img" aria-label={params.label} fill="none" stroke="#78573c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="150" cy="137" r="103" fill={finish.accent} opacity=".07" stroke="none" />{content}</svg>;
}
