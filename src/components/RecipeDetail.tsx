import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '../types';
import { difficultyNames, groupNames, scaledAmount } from '../services/recipes';
import { FinishArtwork } from '../animations/FinishArtwork';
import { StepAnimationPlayer } from '../animations/StepAnimationPlayer';

/** 原生 dialog 提供焦点限制和 Escape；份量变化只影响原料展示。 */
export function RecipeDetail({ recipe, favorite, onFavorite, onClose, staticMode }: { recipe: Recipe; favorite: boolean; onFavorite: () => void; onClose: () => void; staticMode: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [servings, setServings] = useState(recipe.servings);
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = recipe.steps[stepIndex];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
      // 取消收藏会移除列表中的原按钮，此时将焦点交回主内容。
      if (previous?.isConnected) previous.focus();
      else document.getElementById('main-content')?.focus();
    };
  }, []);
  return <dialog ref={dialog} className="recipe-dialog" aria-labelledby="recipe-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <button className="close-button icon-button" onClick={onClose} aria-label="关闭配方">×</button>
    <div className={`detail-art art-${recipe.group}`}><FinishArtwork config={recipe.artwork.finish} label={`${recipe.name}成品示意插画`} /><span>{groupNames[recipe.group]}</span></div>
    <div className="detail-body">
      <p className="eyebrow">A LITTLE RECIPE FOR YOUR DAY</p>
      <h2 id="recipe-title">{recipe.name}</h2><p className="muted">{recipe.description}</p>
      <div className="detail-meta"><span>◷ 总计 {recipe.totalTimeMinutes} 分钟</span><span>准备 {recipe.prepTimeMinutes} 分钟</span><span>{difficultyNames[recipe.difficulty]}</span></div>
      <div className="section-row"><h3>准备食材</h3><div className="servings"><button onClick={() => setServings(Math.max(1, servings - 1))} disabled={servings <= 1} aria-label="减少份量">−</button><output aria-live="polite">{servings} 份</output><button onClick={() => setServings(Math.min(24, servings + 1))} disabled={servings >= 24} aria-label="增加份量">+</button></div></div>
      <ul className="ingredients">{recipe.ingredients.map((item, index) => <li key={index}><span>{item.name}{item.note && <small>{item.note}</small>}</span><strong>{scaledAmount(item.amount, servings, recipe.servings)} <span>{item.unit}</span></strong></li>)}</ul>
      <p className="fine-print">原配方为 {recipe.servings} 份。份量调整只换算食材；温度、时间与萃取参数保持原值，增量制作请分批操作。</p>
      <section className="recipe-steps-section" aria-label="制作步骤动画">
        <div className="step-guide-heading"><h3>一步一步，慢慢来</h3><span className="step-position">{stepIndex + 1} / {recipe.steps.length}</span></div>
        <StepAnimationPlayer key={activeStep.id} scenes={activeStep.scenes} finish={recipe.artwork.finish} staticMode={staticMode} />
        <div className="step-current-copy" aria-live="polite"><h4>{activeStep.title}</h4><p>{activeStep.description}</p></div>
        <div className="step-navigation"><button disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>← 上一步</button><button disabled={stepIndex === recipe.steps.length - 1} onClick={() => setStepIndex(stepIndex + 1)}>下一步 →</button></div>
        <ol className="step-index">{recipe.steps.map((step, index) => <li key={step.id}><button aria-current={stepIndex === index ? 'step' : undefined} onClick={() => setStepIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span><span>{step.title}</span><span>{step.scenes.length} 个动作</span></button></li>)}</ol>
      </section>
      <h3>器具与制作参数</h3><p className="muted">{recipe.equipment.join(' · ')}</p><dl className="parameters">{recipe.parameters.map((item, index) => <div key={index}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
      <div className="allergen-note"><strong>过敏原提示</strong><p>{recipe.allergens.length ? recipe.allergens.join('、') : '配方未包含常见过敏原，请仍检查原料包装及交叉接触。'}</p></div>
      <details className="source"><summary>配方来源与审核说明</summary><p>{recipe.source.sourceName} · {recipe.source.lastVerifiedAt}</p><p>{recipe.source.license}</p><p>{recipe.source.reviewNote}</p><p>{recipe.source.attribution}</p></details>
      <button className={`primary full ${favorite ? 'saved' : ''}`} onClick={onFavorite}>{favorite ? '♥ 已收藏 · 点击取消' : '♡ 收藏这份小美好'}</button>
    </div>
  </dialog>;
}
