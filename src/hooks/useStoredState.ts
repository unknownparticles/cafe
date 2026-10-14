import { useState } from 'react';

/** 存储不可用或内容损坏时回退到内存，并向页面暴露警告。 */
export function useStoredState<T>(key: string, initial: T, isValid: (value: unknown) => value is T) {
  const [problem, setProblem] = useState('');
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const saved: unknown = JSON.parse(raw);
      if (isValid(saved)) return saved;
      setProblem('本地保存的数据格式异常，当前使用默认设置。');
      return initial;
    } catch { setProblem('浏览器无法读取本地数据，当前使用默认设置。'); return initial; }
  });
  function save(next: T) {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setProblem(''); }
    catch { setProblem('浏览器无法保存本地数据，本次操作仅在当前页面有效。'); }
  }
  return [value, save, problem] as const;
}
