// Map a square to its actual projected corners, preserving the sleeve's pose.
export function projectedMatrix(points, size) {
 const a = [], b = [];
 [[0,0],[size,0],[size,size],[0,size]].forEach(([x,y], i) => {
  const {x:u,y:v} = points[i];
  a.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u);
  a.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v);
 });
 for(let k=0;k<8;k++) {
  let pivot=k; for(let j=k+1;j<8;j++) if(Math.abs(a[j][k])>Math.abs(a[pivot][k])) pivot=j;
  [a[k],a[pivot]]=[a[pivot],a[k]]; [b[k],b[pivot]]=[b[pivot],b[k]];
  const d=a[k][k]; if(Math.abs(d)<1e-9) return null;
  for(let c=k;c<8;c++) a[k][c]/=d; b[k]/=d;
  for(let r=0;r<8;r++) if(r!==k) {const f=a[r][k];for(let c=k;c<8;c++) a[r][c]-=f*a[k][c];b[r]-=f*b[k];}
 }
 return `matrix3d(${[b[0],b[3],0,b[6],b[1],b[4],0,b[7],0,0,1,0,b[2],b[5],0,1].join(',')})`;
}
export function playEntranceTransition(root, button, finish) {
 const animations=[];
 let done=false;
 const complete=()=>{if(done)return;done=true;finish();};
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(reduced || !button.animate){complete();return ()=>{};}
 root.classList.add('is-transitioning');
 const size=button.offsetWidth;
 const points=[...button.querySelectorAll('.entrance-corner')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y};});
 const start=projectedMatrix(points,size);
 if(!start){complete();return ()=>{};}
 const hero=document.createElement('div');
 hero.className='entrance-hero';hero.setAttribute('aria-hidden','true');
 hero.style.cssText=`width:${size}px;height:${size}px;transform:${start}`;
 hero.append(button.querySelector('.entrance-disc').cloneNode(true),button.querySelector('.entrance-cover').cloneNode(true));
 hero.firstChild.style.transform=getComputedStyle(button.querySelector('.entrance-disc')).transform;
 root.append(hero);button.style.visibility='hidden';
 const animate=(el,frames,options)=>{const a=el.animate(frames,{fill:'forwards',...options});animations.push(a);return a;};
 // Reveal the existing interface in spatial order without changing its layout.
 const studio=root.parentElement.querySelector('main.studio');
 const revealGroups=[
  ['.topbar',1300],
  ['.library-stage:not(.scene-hidden) .shelf, .control-panel:not(.collapsed)',1550],
  ['.library-stage:not(.scene-hidden) .library-focus, .scene-region:not(.scene-hidden)',1850],
 ];
 const reveals=[];
 for(const [selector,delay] of revealGroups) {
  for(const el of studio?.querySelectorAll(selector) || []) {
   const opacity=getComputedStyle(el).opacity;
   reveals.push(animate(el,[{opacity:0},{opacity}],{delay,duration:650,fill:'both',easing:'cubic-bezier(.22,1,.36,1)'}));
  }
 }
 const target=Math.min(420,innerWidth*.64,innerHeight*.55), scale=target/size;
 const x=(innerWidth-target)/2,y=(innerHeight-target)/2;
 animate(hero,[{transform:start},{transform:`translate(${x}px,${y}px) scale(${scale})`}],{duration:1100,easing:'cubic-bezier(.22,1,.36,1)'});
 animate(hero.firstChild,[{transform:hero.firstChild.style.transform},{transform:'translateX(0) rotate(0deg)',offset:.25},{transform:'translateX(12%) rotate(18deg)'}],{duration:1200,easing:'cubic-bezier(.22,1,.36,1)'});
 root.querySelectorAll('.entrance-row').forEach((row,i)=>animate(row,[{transform:'translateX(0) scale(1)',opacity:1},{transform:`translateX(-${innerWidth*1.05}px) translateY(${(1.5-i)*110}px) scale(.65)`,opacity:0}],{duration:950,delay:i*55,easing:'cubic-bezier(.65,0,.25,1)'}));
 for(const el of root.querySelectorAll('.entrance-header,.entrance-footer')) animate(el,[{opacity:1},{opacity:0}],{duration:250});
 animate(hero,[{opacity:1},{opacity:0}],{delay:1350,duration:500,easing:'ease-in-out'});
 const fade=animate(root,[{backgroundColor:'#f1f1f3'},{backgroundColor:'rgba(241,241,243,0)'}],{delay:1250,duration:650,easing:'ease-in-out'});
 Promise.all([fade.finished,...reveals.map(a=>a.finished)]).then(complete).catch(()=>{});
 const timeout=setTimeout(complete,2800);
 const resize=()=>complete();window.addEventListener('resize',resize,{once:true});
 return ()=>{done=true;clearTimeout(timeout);window.removeEventListener('resize',resize);animations.forEach(a=>a.cancel());hero.remove();};
}
