import { useEffect, useState, useRef } from 'react';
import type { AnimationTemplate } from '../types';

const loaded = new Map<string, string>();

/** 仅加载本项目的 SVG；加载失败仍显示静态成品图，描边使用每条路径的真实长度。 */
export function Artwork({ template, drawing = false }: { template: AnimationTemplate; drawing?: boolean }) {
  const [svg, setSvg] = useState(loaded.get(template) ?? '');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    if (loaded.has(template)) { setSvg(loaded.get(template)!); return; }
    setSvg('');
    fetch(`${import.meta.env.BASE_URL}assets/line-art/${template}.svg`).then(response => {
      if (!response.ok) throw new Error('线稿加载失败');
      return response.text();
    }).then(text => { loaded.set(template, text); if (active) setSvg(text); }).catch(() => { if (active) setSvg(''); });
    return () => { active = false; };
  }, [template]);
  useEffect(() => {
    ref.current?.querySelectorAll<SVGGeometryElement>('path, ellipse, circle, line, polyline').forEach((path, index) => {
      path.style.setProperty('--path-length', String(path.getTotalLength()));
      path.style.setProperty('--delay', `${index * 65}ms`);
    });
  }, [svg]);
  return <div ref={ref} className={`line-art ${drawing ? 'is-drawing' : ''}`} aria-hidden="true">
    {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <img src={`${import.meta.env.BASE_URL}assets/cards/${template === 'coffee-pour' ? 'pour' : template === 'coffee-cup' ? 'coffee' : 'cake'}.svg`} alt="" />}
  </div>;
}
