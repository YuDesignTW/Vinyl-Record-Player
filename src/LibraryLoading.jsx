import { useEffect, useRef, useState } from 'react';
import { useTranslation } from './i18n';
import { playEntranceTransition } from './entranceTransition';
import { Pause, Play } from 'lucide-react';
const titles = ['After Hours', 'Soft Signal', 'Sun Room', 'Coastline', 'Silver Hours', 'Quiet Form', 'Still Air'];
export function LibraryLoading({ loading, onEnter }) {
 const { t: tr, language } = useTranslation();
 const [paused, setPaused] = useState(false);
 const [artwork, setArtwork] = useState(null);
 const busy = loading || artwork === null;
 useEffect(() => {
  let active = true;
  const disposers = [];
  const sources = ['/assets/entrance-covers.png', '/assets/entrance-covers-extra.png', '/assets/vinyl.png'];
  Promise.all(sources.map(src => new Promise(resolve => {
   const img = new window.Image();
   let settled = false;
   const finish = ok => {if (settled) return;settled = true;clearTimeout(timer);img.onload = img.onerror = null;resolve(ok);};
   const timer = setTimeout(() => finish(false), 15000);
   disposers.push(() => finish(false));
   img.onerror = () => finish(false);
   img.onload = async () => {try {await img.decode?.();finish(true);} catch {finish(false);}};
   img.src = src;
  }))).then(results => {if (active) setArtwork(results);});
  return () => {active = false;disposers.forEach(dispose => dispose());};
 }, []);
 const [leaving, setLeaving] = useState(false);
 const root = useRef(null);
 const cleanup = useRef(null);
 const locked = useRef(false);
 useEffect(() => () => cleanup.current?.(), []);
 const enter = (event) => {
  if (busy || locked.current) return;
  locked.current = true;
  setLeaving(true);
  cleanup.current = playEntranceTransition(root.current, event.currentTarget, onEnter);
 };
 return <section ref={root} className={`record-entrance ${busy ? 'is-loading' : 'is-ready'} ${artwork?.[0] === false ? 'missing-covers' : ''} ${artwork?.[1] === false ? 'missing-extra' : ''} ${paused ? 'is-paused' : ''} ${leaving ? 'is-transitioning' : ''}`} aria-label={tr("OhMusic 入口")} inert={leaving ? true : undefined}>
  <div className="entrance-wall"><div className="entrance-grid">{Array.from({length:4}, (_, row) => <div className="entrance-row" key={row}><div className="entrance-track">{[0,1].map(copy => <div className="entrance-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>{Array.from({length:7}, (_, col) => {const i = (col + row * 2) % 7;return <button key={col} className="entrance-record" disabled={busy} tabIndex={copy ? -1 : 0} onClick={enter} aria-label={`${tr("進入唱片庫")} · ${titles[i]}`}><span className="entrance-corner corner-tl"/><span className="entrance-corner corner-tr"/><span className="entrance-corner corner-br"/><span className="entrance-corner corner-bl"/><span className="entrance-disc">{artwork?.[2] && <img src="/assets/vinyl.png" alt="" />}</span><span className={`entrance-cover cover-${i}`} /></button>;})}</div>)}</div></div>)}</div></div>
  <header className="entrance-header"><span className="entrance-brand">OhMusic<span>{tr("YOUR OWN LITTLE RECORD STORE")}</span></span><button className="entrance-motion" onClick={() => setPaused(!paused)} aria-label={tr(paused ? '繼續動畫' : '暫停動畫')}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button></header>
  <div className={`entrance-loading ${busy ? 'is-active' : ''}`} role="status" aria-live="polite" aria-atomic="true">
   <div className="entrance-equalizer" aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} style={{'--bar':i}} />)}</div>
   <div><strong>{busy ? tr('正在載入') : ''}</strong></div>
  </div>
  <footer className="entrance-footer"><span /><a href={`/disclaimer.html?lang=${language}`}>{tr("使用與免責聲明")} ↗</a></footer>
 </section>;
}
