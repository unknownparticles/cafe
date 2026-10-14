import { useRef, useState } from 'react';
import type { CocktailIngredient, Recipe } from '../types';
import { validateBackup, type LocalBackup } from '../services/localData';

/** Read and validate the entire backup before offering an explicit local replacement. */
export function LocalDataPanel({ snapshot, recipes, dictionary, onImport }: { snapshot: LocalBackup; recipes: Recipe[]; dictionary: CocktailIngredient[]; onImport: (backup: LocalBackup) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<LocalBackup | null>(null);
  const [message, setMessage] = useState('');
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'daily-ritual-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('已生成备份文件，请妥善保存。');
  }
  async function read(file?: File) {
    setPending(null); setMessage('');
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage('文件超过 2 MB，无法导入。'); return; }
    try {
      const value: unknown = JSON.parse(await file.text());
      if (!validateBackup(value, recipes, dictionary)) { setMessage('备份版本、材料或配方数据无效，本机数据未改动。'); return; }
      setPending(value);
    } catch { setMessage('无法读取 JSON 备份文件，本机数据未改动。'); }
  }
  return <section className="settings-panel"><h2>把手账带到新设备</h2><p>备份包括收藏、创意酒谱、制作记录、材料库存和偏好。导入将替换本机数据，建议先导出一份。</p><div className="backup-actions"><button className="filter-favorite" onClick={download}>导出本地数据</button><button className="filter-favorite" onClick={() => input.current?.click()}>选择备份文件</button><input ref={input} type="file" accept=".json,application/json" className="sr-only" aria-label="导入本地备份" onChange={event => { void read(event.target.files?.[0]); event.target.value = ''; }} /></div>{pending && <div className="backup-preview"><p>待导入：{pending.favorites.length} 个收藏，{pending.generated.length} 张创意酒谱，{Object.keys(pending.records).length} 条记录，{pending.pantry.available.length} 种已有材料。</p><button className="primary" onClick={() => { onImport(pending); setPending(null); setMessage('已载入备份。若出现本地保存失败提示，请保留原备份文件。'); }}>替换本机数据</button><button className="text-button" onClick={() => setPending(null)}>取消</button></div>}<p className="fine-print" role="status">{message}</p></section>;
}
