/** SVG avoids platform emoji substitution while keeping decorative icons consistent. */
export function RitualIcon({ kind }: { kind: 'star' | 'sparkle' | 'cup' | 'dessert' | 'cocktail' | 'settings' }) {
  return <svg className="ritual-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'star' ? <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" /> : kind === 'sparkle' ? <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" /> : kind === 'cup' ? <><path d="M4 9h13v6a6.5 6.5 0 0 1-13 0V9Zm13 1h2a3 3 0 0 1 0 6h-2M2 23h20M8 5c-3-3 3-3 0-6m5 6c-3-3 3-3 0-6" /></> : kind === 'dessert' ? <><path d="m4 12 11-7 6 8-1 7H4Zm0 0 17 1M4 16h16" /><path d="M12 7c-6-3 1-9 3-3 4-3 5 3 0 4" /></> : kind === 'cocktail' ? <path d="M3 5h18l-9 9-9-9Zm9 9v7m-5 0h10m-3-16 4-4" /> : <path d="M4 5h4m4 0h8M4 12h10m4 0h2M4 19h4m4 0h8" />}
  </svg>;
}
