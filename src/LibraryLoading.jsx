import { useEffect, useRef, useState } from 'react';
import { useTranslation } from './i18n';
import { playEntranceTransition } from './entranceTransition';
import { Pause, Play } from 'lucide-react';
const titles = ['After Hours', 'Soft Signal', 'Sun Room', 'Coastline', 'Silver Hours', 'Quiet Form', 'Still Air'];
export function LibraryLoading({ loading, onEnter }) {
 const { t: tr, language } = useTranslation();
 const [paused, setPaused] = useState(false);
 const [leaving, setLeaving] = useState(false);
 const root = useRef(null);
 const cleanup = useRef(null);
 const locked = useRef(false);
 useEffect(() => () => cleanup.current?.(), []);
 const enter = (event) => {
  if (loading || locked.current) return;
  locked.current = true;
  setLeaving(true);
  cleanup.current = playEntranceTransition(root.current, event.currentTarget, onEnter);
 };
 // Pick the visible sleeve nearest the viewport center once real loading finishes.
 useEffect(() => {
  if (loading) return;
  const frame = requestAnimationFrame(() => {
   if (locked.current || !root.current) return;
   const candidates = [...root.current.querySelectorAll('.entrance-record')];
   const visible = candidates.map(button => ({button, rect: button.getBoundingClientRect()}))
    .filter(({rect:r}) => r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight)
    .sort((a,b) => Math.hypot(a.rect.x+a.rect.width/2-window.innerWidth/2,a.rect.y+a.rect.height/2-window.innerHeight/2)-Math.hypot(b.rect.x+b.rect.width/2-window.innerWidth/2,b.rect.y+b.rect.height/2-window.innerHeight/2));
   const button = visible[0]?.button || candidates[0];
   if (button) enter({currentTarget:button});
  });
  return () => cancelAnimationFrame(frame);
 }, [loading]);
 return <section ref={root} className={`record-entrance ${paused ? 'is-paused' : ''} ${leaving ? 'is-transitioning' : ''}`} aria-label={tr("OhMusic 入口")} inert={leaving ? true : undefined}>
  <div className="entrance-wall"><div className="entrance-grid">{Array.from({length:4}, (_, row) => <div className="entrance-row" key={row}><div className="entrance-track">{[0,1].map(copy => <div className="entrance-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>{Array.from({length:7}, (_, col) => {const i = (col + row * 2) % 7;return <button key={col} className="entrance-record" disabled={loading} tabIndex={copy ? -1 : 0} onClick={enter} aria-label={`${tr("進入唱片庫")} · ${titles[i]}`}><span className="entrance-corner corner-tl"/><span className="entrance-corner corner-tr"/><span className="entrance-corner corner-br"/><span className="entrance-corner corner-bl"/><span className="entrance-disc"><img src="/assets/vinyl.png" alt="" /></span><span className={`entrance-cover cover-${i}`} /></button>;})}</div>)}</div></div>)}</div></div>
  <header className="entrance-header"><span className="entrance-brand">OhMusic<span>{tr("YOUR OWN LITTLE RECORD STORE")}</span></span><button className="entrance-motion" onClick={() => setPaused(!paused)} aria-label={tr(paused ? '繼續動畫' : '暫停動畫')}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button></header>
  <div className={`entrance-loading ${loading ? 'is-active' : ''}`} role="status" aria-live="polite" aria-atomic="true">
   <div className="entrance-equalizer" aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} style={{'--bar':i}} />)}</div>
   <div><strong>{loading ? tr('正在載入') : ''}</strong></div>
  </div>
  <footer className="entrance-footer"><span /><a href={`/disclaimer.html?lang=${language}`}>{tr("使用與免責聲明")} ↗</a></footer>
 </section>;
}
