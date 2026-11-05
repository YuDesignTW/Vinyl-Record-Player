import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { vinylArtwork } from './vinylArtwork';
import { ChevronDown } from 'lucide-react';

const revealTiming={easing:'cubic-bezier(.22,1,.36,1)',fill:'both'};

function Cover({record,back=false}) {
 const image=record.sleeve[back?'back':'front'];
 return image ? <img src={image} alt="" draggable="false"/> : <div className="shelf-cover-type"><small>hdame RECORDS</small><strong>{record.name || '未命名唱片'}</strong><span>A LITTLE TIME FOR MUSIC</span></div>;
}

export function LibraryStage({record,library,onSelect,disabled,resetKey,active,playing,side}) {
 const stage=useRef(null), animations=useRef(new Set()), sequence=useRef(0), busy=useRef(false);
 const previous=useRef({id:null,side:null,resetKey:null});
 const [back,setBack]=useState(false),[flipping,setFlipping]=useState(false),[shelfCollapsed,setShelfCollapsed]=useState(false);
 function cancelMotion(){
  sequence.current++;busy.current=false;
  animations.current.forEach(a=>a.cancel());animations.current.clear();
  if(stage.current)stage.current.dataset.motion='idle';
 }
 function animate(node,frames,options){
  const animation=node.animate(frames,options);animations.current.add(animation);return animation;
 }
 async function flip(){
  if(busy.current)return;
  const el=stage.current;if(!el)return;
  const next=!back;
  if(!el.animate||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setBack(next);return;}
  cancelMotion();busy.current=true;setFlipping(true);
  const token=sequence.current,disc=el.querySelector('[data-reveal="vinyl"]'),jacket=el.querySelector('[data-reveal="jacket"]');
  const move=async(node,frames,duration)=>{
   const a=animate(node,frames,{duration,fill:'forwards',easing:'cubic-bezier(.4,0,.2,1)'});
   await a.finished;if(sequence.current!==token)throw new Error('cancelled');
  };
  try{
   // Retract fully before turning; change the artwork only at the edge-on midpoint.
   await Promise.all([
    move(disc,[{transform:'translateX(51%)'},{transform:'translateX(0)'}],260),
    move(jacket,[{transform:'rotateY(-12deg)'},{transform:'rotateY(0deg)'}],260)
   ]);
   await move(el,[{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)'}],190);
   flushSync(()=>setBack(next));
   await move(el,[{transform:'rotateY(-90deg)'},{transform:'rotateY(0deg)'}],190);
   await Promise.all([
    move(disc,[{transform:'translateX(0)'},{transform:'translateX(51%)'}],340),
    move(jacket,[{transform:'rotateY(0deg)'},{transform:'rotateY(-12deg)'}],340)
   ]);
  }catch{/* Switching records or leaving the scene cancels this sequence. */}
  finally{if(sequence.current===token){cancelMotion();setFlipping(false);}}
 }
 const vinylImage=useMemo(()=>vinylArtwork(record),[record.vinylColor,record.vinylFinish,record.vinylPattern,record.vinylAccent]);
 const records=library.some(r=>r.id===record.id)?library.map(r=>r.id===record.id?record:r):[record,...library];
 function reveal() {
  cancelMotion();setFlipping(false);
  const el=stage.current;
  if(!el?.animate||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const token=sequence.current;
  busy.current=true;el.dataset.motion='arriving';
  const motion=[
   animate(el,[{opacity:0,transform:'translate3d(0,12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{...revealTiming,duration:260}),
   animate(el.querySelector('[data-reveal="vinyl"]'),[
    {transform:'translateX(32%)'},
    {transform:'translateX(51%)'}
   ],{...revealTiming,duration:320,delay:80}),
   animate(el.parentElement.querySelector('.library-caption'),[{opacity:0},{opacity:1}],{...revealTiming,duration:180,delay:100})
  ];
  Promise.all(motion.map(a=>a.finished)).then(()=>{if(sequence.current===token)cancelMotion();}).catch(()=>{/* A newer selection owns the stage. */});
 }
 useLayoutEffect(()=>{
  const last=previous.current;previous.current={id:record.id,side,resetKey};
  if(last.id!==record.id||last.side!==side||last.resetKey!==resetKey)setBack(['B','D'].includes(side));
  if(!active){cancelMotion();setFlipping(false);return;}
  reveal();
  return cancelMotion;
 },[record.id,resetKey,side,active]);
 useEffect(()=>{
  const settle=()=>{cancelMotion();setFlipping(false);};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  window.addEventListener('resize',settle);reduced?.addEventListener?.('change',settle);
  return()=>{window.removeEventListener('resize',settle);reduced?.removeEventListener?.('change',settle);};
 },[]);
 const frontSide=['C','D'].includes(side)?'C':'A',displaySide=back?(frontSide==='C'?'D':'B'):frontSide;
 const label=record.labels[displaySide]||record.labels.A;
 return <div className={`library-stage ${active?'':'scene-hidden'}`} aria-hidden={!active} inert={!active?true:undefined}>
  <section className={`shelf ${shelfCollapsed?'shelf-collapsed':''}`} aria-label="立體唱片收藏"><button className="shelf-heading" aria-label={shelfCollapsed?'展開唱片清單':'收合唱片清單'} aria-expanded={!shelfCollapsed} aria-controls="collection-shelf" onClick={()=>setShelfCollapsed(value=>!value)}><ChevronDown size={12}/><span>THE COLLECTION</span><small>{records.length.toString().padStart(2,'0')} RECORDS</small></button><div id="collection-shelf" className="shelf-scroll" inert={shelfCollapsed?true:undefined} aria-hidden={shelfCollapsed} tabIndex={shelfCollapsed?-1:0} aria-label="捲動瀏覽唱片"><div className="shelf-stack">{records.map((r,i)=><button className={`shelf-item ${r.id===record.id?'selected':''}`} aria-label={`展示唱片 ${r.name||'未命名唱片'}`} aria-pressed={r.id===record.id} disabled={disabled} key={r.id} style={{'--paper':r.sleeve.color,'--order':i}} onClick={()=>{if(r.id!==record.id)onSelect(r);}}><span className="shelf-jacket"><Cover record={r}/><span className="shelf-spine">{r.name||'未命名唱片'}<small>{r.sleeve.type==='double'?'2 LP':'1 LP'}</small></span></span></button>)}</div></div></section>
  <div className="library-focus"><div className="library-presentation" ref={stage} role="button" tabIndex={0} aria-label={`翻到${back?'正':'背'}面，現在為 ${displaySide} 面`} aria-busy={flipping} onClick={flip} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();flip();}}} style={{'--paper':record.sleeve.color}}><div className="library-vinyl" data-reveal="vinyl"><div className="library-disc-spin" style={{animationPlayState:playing?'running':'paused',animationDuration:`${60/record.rpm}s`}}><img src={vinylImage} alt="" draggable="false"/><div className="library-disc-label" style={{background:label.color}}>{label.image?<img src={label.image} alt=""/>:<><b>hdame</b><span>{label.title}</span></>}<i/></div></div></div><div className="library-open-jacket" data-reveal="jacket"><Cover record={record} back={back}/><span className="jacket-edge"/></div></div><div className="library-caption"><span className="eyebrow">YOUR SELECTED RECORD</span><h1>{record.name||'未命名唱片'}</h1><p aria-live="polite">SIDE {displaySide} · {record.tracks.length} 首歌曲 · {record.sleeve.type==='double'?'雙片':'單片'}收藏</p></div></div>
 </div>;
}
