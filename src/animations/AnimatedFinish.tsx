import { useEffect, useState } from 'react';
import type { FinishConfig } from './types';
import { FinishArtwork } from './FinishArtwork';

/** The item clock starts after the card flip; initial progress prevents a complete-frame flash. */
export function AnimatedFinish({ config, drawing, staticMode }: { config: FinishConfig; drawing: boolean; staticMode: boolean }) {
  const [progress, setProgress] = useState(drawing && !staticMode ? 0 : 1);
  useEffect(() => {
    if (!drawing || staticMode) { setProgress(1); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    setProgress(0); frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [drawing, staticMode]);
  return <FinishArtwork config={config} progress={progress} />;
}
