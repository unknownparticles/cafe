import type { Garnish, IngredientShape, Vessel } from './types';

/** Local coordinates shared by every action; the liquid is drawn separately behind the rim. */
export function Container({ kind = 'bowl' }: { kind?: Vessel }) {
  if (kind === 'glass') return <g><path d="M78 100h144l-17 127H95Z" /><ellipse cx="150" cy="100" rx="72" ry="9" /></g>;
  if (kind === 'cup') return <g><path d="M77 117h137v53c0 65-137 65-137 0Z" /><path d="M214 127c54-13 49 58 0 46" /><ellipse cx="145" cy="117" rx="68" ry="12" /><path d="M62 229h176" /></g>;
  if (kind === 'pot') return <g><path d="M73 119h155v67c0 35-155 35-155 0Z" /><path d="M73 130H45m183 0h27M79 113h142m-83-9h25" /></g>;
  if (kind === 'mold') return <g><path d="M55 143h190l-12 74H67Z" /><ellipse cx="150" cy="143" rx="95" ry="10" /></g>;
  if (kind === 'filter') return <g><path d="m84 88 65 95 67-95Z" /><ellipse cx="150" cy="88" rx="66" ry="12" /><path d="m105 197-5 35h100l-6-35m-63-91 18 69 22-70M84 185h132" /></g>;
  if (kind === 'press') return <g><path d="M87 86h126v133H87ZM213 107c47-8 47 76 0 67M80 83h140M98 228h104" /></g>;
  return <g><ellipse cx="150" cy="136" rx="94" ry="14" /><path d="M56 136c7 107 181 107 188 0M120 222h60" /></g>;
}

/** Reusable ingredient silhouettes, intentionally geometric rather than bitmap assets. */
export function Ingredient({ kind, color = '#ac7952' }: { kind: IngredientShape; color?: string }) {
  if (kind === 'bean') return <g fill={color}><ellipse rx="8" ry="12" transform="rotate(25)" /><path d="m3-8-6 16" stroke="#fff4df" strokeWidth="1" /></g>;
  if (kind === 'ice') return <rect x="-10" y="-10" width="20" height="20" rx="4" fill="#d9e9e3" />;
  if (kind === 'fruit') return <g fill={color}><circle r="10" /><path d="M0-8q0-10 10-9" fill="none" /></g>;
  if (kind === 'chocolate') return <path d="m-9 8 6-18L10 6Z" fill={color} />;
  if (kind === 'liquid') return <path d="M0-12C-18 8-8 18 0 18S18 8 0-12" fill={color} />;
  return <g fill={color}><circle cx="-5" cy="0" r={kind === 'spice' ? 2 : 3} /><circle cx="4" cy="-5" r="3" /><circle cx="5" cy="6" r="2" /></g>;
}

/** A garnish component is reused on finished recipes and ingredient placement scenes. */
export function Decoration({ kind, color = '#9a613e' }: { kind: Garnish; color?: string }) {
  if (kind === 'none') return null;
  if (kind === 'heart') return <path d="M0 15C-44-8-23-35 0-14 23-35 44-8 0 15Z" fill="#fff1d8" strokeWidth="1" />;
  if (kind === 'rosetta') return <g stroke="#fff1d8" strokeWidth="5"><path d="M0 24v-48M0 15Q-38 5-22-3M0 4Q-32-8-17-15M0 15Q38 5 22-3M0 4Q32-8 17-15" /></g>;
  if (kind === 'foam') return <g fill="#fff5df"><ellipse rx="34" ry="13" /><circle cx="-13" cy="-5" r="12" /><circle cx="9" cy="-8" r="13" /></g>;
  if (kind === 'strawberry') return <g fill="#bd6d62"><path d="M-16-7Q-20 7 0 24 20 7 16-7Z" /><path d="m-15-7 15 4 15-4-10-5-5 8-5-8Z" fill="#839375" /><path d="m-7 3 1 2m10-1 1 2m-4 7 1 2" stroke="#fff1d7" /></g>;
  if (kind === 'lemon' || kind === 'orange') return <g fill={kind === 'lemon' ? '#dfc46a' : '#d5a05c'}><path d="M-25 0a25 25 0 0 1 50 0Z" /><path d="M-18-2h36M0-2v-17m-3 17-11-12m17 12 11-12" stroke="#fff4d6" /></g>;
  if (kind === 'blueberry') return <g fill="#79768b">{[-16, 0, 16].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? -5 : 4} r="9" />)}</g>;
  if (kind === 'mango') return <g fill="#dfb259">{[-16, 0, 16].map((x, i) => <rect key={x} x={x - 7} y={i % 2 ? -12 : -5} width="14" height="14" rx="2" />)}</g>;
  if (kind === 'walnut' || kind === 'peanut' || kind === 'almond') return <g fill={color}>{[-20, 0, 20].map(x => <g key={x} transform={`translate(${x} ${Math.abs(x) / 4}) rotate(${x})`}><ellipse rx="6" ry="11" /><path d="M0-7v14" stroke="#eee0c6" strokeWidth="1" /></g>)}</g>;
  if (kind === 'tea' || kind === 'osmanthus') return <g fill={kind === 'tea' ? '#86936e' : '#d4b35a'}>{[-20, 0, 20].map(x => <path key={x} d={`M${x} 0q-9-20 8-15Q${x + 14} -2 ${x} 0Z`} />)}</g>;
  return <g fill={color} strokeWidth=".6">{Array.from({ length: kind === 'chocolate' || kind === 'raisin' ? 9 : 19 }, (_, i) => {
    const x = ((i * 17) % 63) - 31, y = ((i * 11) % 27) - 13;
    return kind === 'coconut' ? <path key={i} d={`m${x} ${y} 6 3`} /> : <ellipse key={i} cx={x} cy={y} rx={kind === 'chocolate' ? 3 : 1.7} ry={kind === 'sesame' ? 1 : 2.5} />;
  })}</g>;
}

export function Steam({ progress = 1 }: { progress?: number }) {
  return <g opacity={Math.sin(progress * Math.PI) * .5 + .5} transform={`translate(0 ${-progress * 12})`}>{[112, 148, 183].map((x, i) => <path key={x} d={`M${x} 92c-18-19 18-26 0-45`} strokeDasharray="80" strokeDashoffset={80 * (1 - Math.min(1, progress * 2 + i * .1))} />)}</g>;
}
