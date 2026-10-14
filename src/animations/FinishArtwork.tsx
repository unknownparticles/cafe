import { useId } from 'react';
import { Decoration } from './parts';
import { CocktailGarnish } from './CocktailGarnish';
import type { FinishConfig } from './types';

/** The same parametric finished recipe appears on cards, in the atlas and at the end of a step. */
export function FinishArtwork({ config, progress = 1, label }: { config: FinishConfig; progress?: number; label?: string }) {
  const clip = useId().replace(/:/g, '');
  const p = Math.max(0, Math.min(1, progress));
  const { shape, color, layers, accent, garnish, pattern } = config;
  const cup = ['espresso', 'latte', 'iced', 'filter'].includes(shape);
  const dish = ['pudding', 'jelly', 'mousse', 'layered', 'oats', 'rice', 'sago'].includes(shape);
  const cocktail = ['coupe', 'highball', 'rocks'].includes(shape);
  const body = (() => {
    if (shape === 'coupe') return 'M80 82h140c-7 66-133 66-140 0Z';
    if (shape === 'highball') return 'M109 63h82l-7 139h-68Z';
    if (shape === 'rocks') return 'M92 116h116l-9 86h-98Z';
    if (cup) return shape === 'iced' ? 'M92 75h116l-14 125H106Z' : 'M77 105h132v47c0 66-132 66-132 0Z';
    if (dish) return 'M91 86h118l-10 113c-22 14-76 14-98 0Z';
    if (shape === 'round-cake') return 'M79 122c0-40 142-40 142 0v58c-20 26-118 26-142 0Z';
    if (shape === 'cookie') return 'M80 127c-3-53 137-60 142 0 12 55-140 70-142 0Z';
    if (shape === 'brownie' || shape === 'square-cake') return 'm78 112 130-14 13 75-134 14Z';
    if (shape === 'loaf') return 'M74 123q2-55 150-20l-8 75-133 8Z';
    if (shape === 'muffin') return 'M99 133c-43-15-9-47 10-42-2-38 57-46 66-11 34-13 61 30 25 49l-15 66h-69Z';
    if (shape === 'scone') return 'm96 180 48-99 75 86-21 24-100 5Z';
    if (shape === 'madeleine') return 'M102 175c-68-90 47-149 102-79 47 60-39 135-102 79Z';
    if (shape === 'financier') return 'm87 106 121-14 8 88-120 12Z';
    if (shape === 'pear') return 'M150 65c-25-7-29 28-40 43-55 54-20 100 31 93 75 4 85-45 37-91-9-13-6-47-28-45Z';
    if (shape === 'tart') return 'M86 110q10-30 27-16 13-30 30-10 25-22 38 1 28-12 36 20l-12 71c-37 26-87 25-111 0Z';
    if (shape === 'crumble') return 'M76 129h150l-17 61c-34 16-65 16-115 0Z';
    return 'm79 129 89-68 48 66-3 62-134-2Z';
  })();
  return <svg viewBox="0 0 300 260" className="finish-artwork" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} fill="none" stroke="#78573c" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    <defs><clipPath id={clip}><path d={body} /></clipPath></defs>
    <circle cx="150" cy="132" r="96" fill={accent} opacity=".12" stroke="none" />
    <g opacity={Math.min(1, p * 3)} transform={`translate(0 ${12 * (1 - p)})`}>
      <ellipse cx="150" cy="214" rx="105" ry="18" fill="#fcf7ed" stroke="#bfa98b" />
      <ellipse cx="150" cy="214" rx="82" ry="10" stroke="#dfd0ba" />
      <path d={body} fill={color} />
      <g clipPath={`url(#${clip})`} opacity={Math.min(1, p * 2)}>
        {(cup || dish || cocktail ? layers : []).map((layer, i) => <rect key={i} x="65" y={(cocktail ? 202 : 192) - (i + 1) * (cocktail ? 139 : 92) / Math.max(1, layers.length)} width="170" height={(cocktail ? 139 : 92) / Math.max(1, layers.length)} fill={layer} stroke="none" />)}
        {pattern === 'speckled' && Array.from({ length: 26 }, (_, i) => <ellipse key={i} cx={88 + i * 19 % 125} cy={98 + i * 31 % 86} rx="2" ry="1.4" fill={accent} stroke="none" />)}
        {pattern === 'striped' && [0, 1, 2, 3, 4].map(i => <path key={i} d={`M${82 + i * 27} 80q-30 60 10 125`} stroke={accent} opacity=".7" />)}
        {pattern === 'scored' && <path d="m95 110 100 55m-95-10 87-46m-53-22 4 101" stroke={accent} />}
        {shape === 'iced' && [0, 1, 2].map(i => <rect key={i} x={107 + i * 25} y={88 + i % 2 * 19} width="22" height="25" rx="4" fill="#e1eae0" opacity=".65" transform={`rotate(${i * 17 - 10} ${118 + i * 25} 110)`} />)}
        {shape === 'muffin' && <path d="m120 144 5 43m22-46v49m24-49-4 46" stroke={accent} />}
        {shape === 'madeleine' && [-2, -1, 0, 1, 2].map(i => <path key={i} d={`M148 193Q${75 + i * 21} 125 ${133 + i * 17} 73`} stroke={accent} />)}
        {shape === 'sago' && Array.from({ length: 24 }, (_, i) => <circle key={i} cx={105 + i * 13 % 90} cy={130 + i * 19 % 60} r="3.4" fill="#faf3dc" stroke="none" />)}
      </g>
      <path d={body} />
      {shape === 'coupe' && <path d="M150 132v67m-32 2h64" />}
      {cocktail && <><ellipse cx="150" cy={shape === 'coupe' ? 82 : shape === 'highball' ? 63 : 116} rx={shape === 'coupe' ? 70 : shape === 'highball' ? 41 : 58} ry="7" />{shape !== 'coupe' && [0, 1, 2].map(i => <rect key={i} x={120 + i * 15} y={130 + i % 2 * 23} width="20" height="22" rx="3" fill="#e1eae0" opacity=".6" transform={`rotate(${i * 13} 150 155)`} />)}</>}
      {cup && shape !== 'iced' && <><path d="M210 117c48-14 48 49-1 44" /><ellipse cx="143" cy="105" rx="65" ry="13" fill={color} /></>}
      {shape === 'iced' && <ellipse cx="150" cy="75" rx="58" ry="8" />}
      {dish && <ellipse cx="150" cy="86" rx="59" ry="10" fill={layers.at(-1) ?? color} />}
      {shape === 'pear' && <path d="M147 77q-10-35 13-44m-10 22q26-25 35-8-20 21-35 8M145 117q-28 21-11 40 21 17 23-12-2-17-12-28Z" fill={accent} />}
      {shape === 'crumble' && <g fill={accent}>{Array.from({ length: 19 }, (_, i) => <path key={i} d={`m${86 + i * 17 % 128} ${117 + i * 13 % 18} 4-8 9 4-3 7Z`} />)}</g>}
      {shape === 'cheesecake' && <path d="m80 129 133-2-45-66Z" fill={accent} opacity=".45" />}
      {cocktail ? <CocktailGarnish finish={config} progress={Math.min(1, Math.max(0, (p - .35) / .4))} /> : <g transform={`translate(150 ${cup ? (shape === 'iced' ? 74 : 103) : dish ? 80 : shape === 'muffin' ? 83 : 108}) scale(${Math.min(1, Math.max(0, (p - .35) / .4))})`}><Decoration kind={garnish} color={accent} /></g>}
    </g>
    {p > .72 && <g opacity={(p - .72) / .28} stroke={accent}><path d="m237 60 0 18m-9-9h18m-191 95v12m-6-6h12" /></g>}
  </svg>;
}
