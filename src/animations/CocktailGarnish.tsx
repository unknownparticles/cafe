import { Decoration, Ingredient } from './parts';
import type { FinishConfig, Garnish } from './types';

/** Citrus hangs outside the rim; placement and finished artwork share the same final position. */
export function CocktailGarnish({ finish, garnish = finish.garnish, progress = 1 }: { finish: FinishConfig; garnish?: Garnish; progress?: number }) {
  const p = Math.max(0, Math.min(1, progress));
  const rimY = finish.shape === 'coupe' ? 82 : finish.shape === 'highball' ? 63 : 116;
  const rimX = finish.shape === 'coupe' ? 207 : finish.shape === 'highball' ? 186 : 202;
  const citrus = garnish === 'lemon' || garnish === 'orange';
  return <g transform={`translate(${citrus ? rimX : 150} ${rimY - (1 - p) * 55}) scale(${Math.min(1, p * 3)})`} opacity={Math.min(1, p * 4)}>
    {citrus ? <g transform="rotate(155) scale(.78)"><Decoration kind={garnish} color={finish.accent} /></g> : garnish === 'cocoa' ? <g transform="scale(.55)">{[-16, 0, 16].map((x, index) => <g key={x} transform={`translate(${x} ${index === 1 ? -8 : 3})`}><Ingredient kind="bean" color="#704732" /></g>)}</g> : <Decoration kind={garnish} color={finish.accent} />}
  </g>;
}
