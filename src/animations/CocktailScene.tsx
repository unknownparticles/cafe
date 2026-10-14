import type { AnimationScene, FinishConfig } from './types';
import { Container, Ingredient } from './parts';
import { FinishArtwork } from './FinishArtwork';
import { CocktailGarnish } from './CocktailGarnish';

/** Progress comes from the shared player, so shaking, stirring and filtering pause consistently. */
export function CocktailScene({ scene, progress, finish }: { scene: AnimationScene; progress: number; finish: FinishConfig }) {
  const p = Math.max(0, Math.min(1, progress));
  const color = scene.params.color;
  const glass = <Container kind="glass" />;
  const liquid = <path d={`M107 ${200 - p * 82}h86l-8 ${p * 82}h-70Z`} fill={color} stroke="none" opacity=".75" />;
  switch (scene.id) {
    case 'cocktail-shake': return <g transform={`translate(${Math.sin(p * Math.PI * 14) * 23 * Math.sin(p * Math.PI)} ${Math.cos(p * Math.PI * 14) * 11 * Math.sin(p * Math.PI)}) rotate(${Math.sin(p * Math.PI * 14) * 24 * Math.sin(p * Math.PI)} 150 130)`}><path d="M118 69h64l15 137h-94Z" fill="#d9ddd1" /><path d="M122 69V48q28-24 56 0v21m-53 24h50m-67 97h83" /><path d="m133 117 33 28m-28 11 27-29" stroke={color} strokeWidth="5" /></g>;
    case 'cocktail-stir': return <>{glass}<path d="M110 154h80l-7 50h-66Z" fill={color} opacity=".6" stroke="none" /><ellipse cx="150" cy="154" rx="35" ry="9" stroke={color} opacity={Math.sin(p * Math.PI)} /><g transform={`translate(${Math.sin(p * Math.PI * 8) * 27} ${Math.cos(p * Math.PI * 8) * 4})`}><path d="M153 52v115" /><ellipse cx="153" cy="171" rx="7" ry="13" fill="#dbc6a1" /></g></>;
    case 'cocktail-strain': return <><g transform="translate(97 68) rotate(58)"><path d="M-22-35h44l9 83h-62Z" fill="#d9ddd1" /><path d="M-24 48h48m-21-5v9m8-9v9m8-9v9m8-9v9" /></g>{glass}{liquid}<path d="M141 95q10 22 9 47" stroke={color} strokeWidth="5" opacity={p < .9 ? Math.min(1, p * 6) : (1 - p) * 10} /></>;
    case 'cocktail-layer': return <>{glass}{scene.params.layers.map((layer, index) => <rect key={index} x="115" y={195 - index * 39} width="70" height="39" fill={layer} stroke="none" opacity={Math.max(0, Math.min(1, p * scene.params.layers.length - index))} />)}<path d="M173 66v53" stroke={scene.params.layers.at(-1)} strokeWidth="3" opacity={p < .9 ? 1 : 0} /></>;
    case 'cocktail-add-ice': return <>{glass}{Array.from({ length: scene.params.iceCount }, (_, index) => { const local = Math.max(0, Math.min(1, p * 2 - index * .2)); return <g key={index} transform={`translate(${125 + index * 17 % 48} ${43 + local * (124 + index % 2 * 22)}) rotate(${index * 13})`} opacity={p * 2 > index * .2 ? 1 : 0}><Ingredient kind="ice" /></g>; })}</>;
    case 'cocktail-top-up': return <>{glass}{liquid}<path d="M150 53v85" stroke="#a6c5bd" strokeWidth="4" opacity={p < .9 ? 1 : 0} />{[0, 1, 2, 3, 4].map(index => <circle key={index} cx={129 + index * 9} cy={192 - ((p * 65 + index * 13) % 65)} r="2" stroke="#faf6ed" />)}<text x="224" y="63">{Math.round(scene.params.amount * p)} ml</text></>;
    case 'cocktail-garnish': return <><FinishArtwork config={{ ...finish, garnish: 'none' }} /><CocktailGarnish finish={finish} garnish={scene.params.garnish} progress={p} /></>;
    case 'cocktail-reveal': return <FinishArtwork config={finish} progress={p} />;
    default: return <FinishArtwork config={finish} />;
  }
}
