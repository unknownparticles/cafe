import { useEffect, useRef, useState } from 'react';
import type { AnimationScene, FinishConfig } from './types';
import { StepScene } from './StepScene';

/** A single clock drives all scenes; pause preserves elapsed time and unmount cancels the frame. */
export function StepAnimationPlayer({ scenes, finish, staticMode }: { scenes: AnimationScene[]; finish: FinishConfig; staticMode: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(!staticMode && !document.hidden);
  const elapsedRef = useRef(0);
  const total = scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  const ended = elapsed >= total;
  useEffect(() => {
    if (staticMode) setPlaying(false);
  }, [staticMode]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (!playing || staticMode || ended) return;
    let frame = 0, previous = performance.now(), lastRender = previous;
    const tick = (now: number) => {
      elapsedRef.current = Math.min(total, elapsedRef.current + now - previous);
      previous = now;
      // One active scene at 30fps is enough for this illustrative movement on mobile.
      if (now - lastRender >= 1000 / 30 || elapsedRef.current >= total) {
        setElapsed(elapsedRef.current); lastRender = now;
      }
      if (elapsedRef.current < total) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, staticMode, ended, total]);
  let start = 0, index = Math.max(0, scenes.length - 1), progress = 1;
  for (let i = 0; i < scenes.length; i++) {
    if (elapsed < start + scenes[i].durationMs) { index = i; progress = (elapsed - start) / scenes[i].durationMs; break; }
    start += scenes[i].durationMs;
  }
  const scene = scenes[index];
  function replay() { elapsedRef.current = 0; setElapsed(0); setPlaying(true); }
  return <div className="step-player">
    <div className="step-player-visual">{scene ? <StepScene scene={scene} progress={staticMode ? 1 : progress} finish={finish} /> : <p>此步骤暂无动画，请参考下方制作说明。</p>}</div>
    <div className="scene-caption" aria-live="polite">{staticMode ? '静态示意' : ended ? '本步骤演示完成' : scene?.params.label}<span>{index + 1} / {scenes.length}</span></div>
    <div className="scene-progress" aria-label="动作进度">{scenes.map((item, i) => <button key={i} aria-label={`查看动作${i + 1}：${item.params.label}`} aria-pressed={index === i} onClick={() => {
      const time = scenes.slice(0, i).reduce((sum, part) => sum + part.durationMs, 0);
      elapsedRef.current = time; setElapsed(time); setPlaying(!staticMode);
    }}><span style={{ transform: `scaleX(${staticMode || i < index ? 1 : i > index ? 0 : progress})` }} /></button>)}</div>
    <div className="player-controls"><button disabled={staticMode || !scene} onClick={() => ended ? replay() : setPlaying(!playing)}>{ended ? '播放' : playing ? '暂停' : '播放'}</button><button disabled={staticMode || !scene} onClick={replay}>重新播放</button><button disabled={staticMode || ended || !scene} onClick={() => { elapsedRef.current = total; setElapsed(total); setPlaying(false); }}>跳过演示</button></div>
    <p className="animation-hint">{staticMode ? '已遵循动画偏好，展示当前动作完成画面。' : '动画为动作示意，实际用量、温度与时间请以步骤文字为准。'}</p>
  </div>;
}
