import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import 'fake-indexeddb/auto';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'});
for(const key of ['window','document','HTMLElement','HTMLMediaElement','Element','Node','Event','KeyboardEvent','File','FileReader','MutationObserver','getComputedStyle'])Object.defineProperty(globalThis,key,{value:key==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[key],configurable:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.requestAnimationFrame=fn=>setTimeout(()=>fn(performance.now()),16);globalThis.cancelAnimationFrame=clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
window.HTMLCanvasElement.prototype.getContext=()=>null;
let playing=false;
Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return !playing;}});
HTMLMediaElement.prototype.play=function(){playing=true;this.dispatchEvent(new Event('play'));return Promise.resolve();};
HTMLMediaElement.prototype.pause=function(){playing=false;this.dispatchEvent(new Event('pause'));};
URL.createObjectURL=()=>`blob:test-${Math.random()}`;URL.revokeObjectURL=()=>{};
await build({entryPoints:['src/App.jsx'],bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',outfile:'node_modules/.cache/slowly-app-test.mjs'});
const React=await import('react');const {render,screen,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
const {App}=await import('../node_modules/.cache/slowly-app-test.mjs');
window.localStorage.setItem('hmusic-language','zh-TW');
const {listRecords}=await import('../src/storage.js');
function selectLanguage(language){const label={en:'EN',ja:'JP','zh-TW':'CN'}[language];for(let i=0;i<3;i++){const button=screen.getByTitle('English → 日本語 → 中文');if(button.textContent===label)return;fireEvent.click(button);}assert.fail('Language cycle did not reach '+language);}


test('import, independently label both faces, archive and remount, then switch records safely',async()=>{
 const originalError=console.error;console.error=(...args)=>{if(String(args[0]).includes('THREE.WebGLRenderer'))return;originalError(...args);};
 const ui=render(React.createElement(App));
 fireEvent.click(screen.getByRole('button',{name:'翻到背面，現在為 A 面'}));
 assert.ok(screen.getByRole('button',{name:'翻到正面，現在為 B 面'}));
 fireEvent.click(screen.getByRole('button',{name:'翻到正面，現在為 B 面'}));
 assert.ok(screen.getByRole('button',{name:'展開設定面板'}));
 fireEvent.click(screen.getByRole('button',{name:'展開設定面板'}));
 fireEvent.click(screen.getByRole('button',{name:'音樂',exact:true}));
 await waitFor(()=>assert.equal(document.querySelector('main').getAttribute('aria-busy'),'false'));
 assert.equal(screen.queryByRole('button',{name:'儲存',exact:true}),null);
 const files=[new File(['one'],'Evening.wav',{type:'audio/wav'}),new File(['two'],'Nightfall.wav',{type:'audio/wav'})];
 fireEvent.change(ui.container.querySelector('input[type=file][multiple]'),{target:{files}});
 assert.ok(screen.getByRole('button',{name:'播放 Evening'}));assert.ok(screen.getByRole('button',{name:'播放 Nightfall'}));
 fireEvent.click(screen.getByRole('button',{name:'外觀',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'封套',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'雙片 · A–D',exact:true}));
 assert.equal(screen.getByRole('button',{name:'收合雙片封套'}).getAttribute('aria-expanded'),'true');
 fireEvent.click(screen.getByRole('button',{name:'單片 · A / B',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'標籤',exact:true}));
 const pasted=new File(['image'],'clipboard.png',{type:'image/png'});
 fireEvent.paste(window,{clipboardData:{files:[pasted]}});
 await waitFor(()=>assert.ok(screen.getByAltText('面 A 標籤圖片').src.startsWith('data:image/png;base64,')));
 fireEvent.click(screen.getByRole('button',{name:'面 B',exact:true}));
 assert.equal(screen.queryByAltText('面 B 標籤圖片'),null);
 fireEvent.click(screen.getByRole('button',{name:'封套',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'背面',exact:true}));
 fireEvent.paste(window,{clipboardData:{items:[{kind:'file',type:'image/png',getAsFile:()=>pasted}]}});
 await waitFor(()=>assert.ok(screen.getByAltText('封套圖片')));
 fireEvent.click(screen.getByRole('button',{name:'正面',exact:true}));
 assert.equal(screen.queryByAltText('封套圖片'),null);
 fireEvent.click(screen.getByRole('button',{name:'標籤',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'面 A',exact:true}));
 fireEvent.change(screen.getByLabelText('面 A 名稱'),{target:{value:'FRONT'}});
 fireEvent.click(screen.getByRole('button',{name:'面 B',exact:true}));
 fireEvent.change(screen.getByLabelText('面 B 名稱'),{target:{value:'BACK'}});
 fireEvent.click(screen.getByRole('button',{name:'面 A',exact:true}));assert.equal(screen.getByLabelText('面 A 名稱').value,'FRONT');
 fireEvent.click(screen.getByRole('button',{name:'唱片庫',exact:true}));fireEvent.change(screen.getByLabelText('目前唱片'),{target:{value:'Collection One'}});
 await waitFor(async()=>assert.ok((await listRecords()).some(r=>r.name==='Collection One')));
 const saved=(await listRecords()).find(r=>r.name==='Collection One');assert.equal(saved.tracks.length,3);assert.equal(saved.labels.B.title,'BACK');assert.ok(saved.tracks[1].blob);
 cleanup();render(React.createElement(App));fireEvent.click(screen.getByRole('button',{name:'展開設定面板'}));fireEvent.click(screen.getByRole('button',{name:'音樂',exact:true}));await waitFor(()=>assert.ok(screen.getByRole('button',{name:'播放 Evening'})));
 fireEvent.click(screen.getByRole('button',{name:'播放 Evening'}));await waitFor(()=>assert.ok(screen.getByRole('button',{name:'暫停',exact:true})));
 const liveAudio=document.querySelector('audio');
 fireEvent.keyDown(document.body,{key:' ',code:'Space'});
 assert.equal(liveAudio.paused,true,'Space pauses the player');
 fireEvent.keyDown(document.body,{key:' ',code:'Space'});
 assert.equal(liveAudio.paused,false,'Space resumes the player');
 fireEvent.click(screen.getByRole('button',{name:'聆聽',exact:true}));
 assert.equal(document.querySelector('audio'),liveAudio);assert.equal(liveAudio.paused,false);
 assert.equal(screen.queryByRole('button',{name:'重設視角'}),null);
 assert.ok(screen.getByLabelText('播放進度').closest('.listening-progress-host'));
 fireEvent.click(screen.getByRole('button',{name:'收合曲目'}));
 assert.equal(screen.queryByRole('button',{name:'面 A',exact:true}),null);
 assert.equal(screen.queryByRole('button',{name:'播放 Evening'}),null);
 assert.equal(document.querySelector('audio'),liveAudio);assert.equal(liveAudio.paused,false);
 assert.ok(screen.getByRole('button',{name:'暫停',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'展開曲目'}));
 assert.ok(screen.getByRole('button',{name:'面 A',exact:true}));

 assert.ok(screen.getByRole('button',{name:'播放 Evening'}));
 fireEvent.click(screen.getByRole('button',{name:'面 B',exact:true}));
 assert.ok(screen.getByText('這一面還沒有歌曲。'));
 fireEvent.click(screen.getByRole('button',{name:'面 A',exact:true}));
 await waitFor(()=>assert.equal(liveAudio.paused,false));
 assert.ok(screen.getByRole('button',{name:'暫停',exact:true}));
 assert.ok(screen.getByRole('button',{name:'暫停',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'唱片庫',exact:true}));fireEvent.click(screen.getByRole('button',{name:'新唱片'}));
 await waitFor(()=>assert.equal(screen.getByLabelText('面 A 名稱').value,'未命名唱片'));
 fireEvent.change(screen.getByLabelText('面 A 名稱'),{target:{value:'SECOND'}});
 fireEvent.click(screen.getByRole('button',{name:'唱片庫',exact:true}));fireEvent.click(screen.getByRole('button',{name:/Collection One.*3 首/}));
 await waitFor(()=>assert.equal(screen.getByLabelText('目前唱片').value,'Collection One'));
 assert.equal(screen.queryByRole('dialog'),null);
 assert.ok((await listRecords()).some(r=>r.labels.A.title==='SECOND'));
 fireEvent.click(screen.getByRole('button',{name:'刪除唱片 未命名唱片',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'取消',exact:true}));
 assert.ok((await listRecords()).some(r=>r.labels.A.title==='SECOND'));
 fireEvent.click(screen.getByRole('button',{name:'刪除唱片 未命名唱片',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'確認刪除',exact:true}));
 await waitFor(async()=>assert.equal((await listRecords()).some(r=>r.labels.A.title==='SECOND'),false));
 await waitFor(()=>assert.equal(screen.queryByRole('dialog'),null));
 cleanup();console.error=originalError;
});

test('YouTube shares transport and seeking, then releases the iframe when switching to local audio',async()=>{
 const originalError=console.error;console.error=(...args)=>{if(!String(args[0]).includes('THREE.WebGLRenderer'))originalError(...args);};
 let fake,destroyed=false,pauseCalls=0;
 window.YT={Player:class {
  constructor(node,options){fake=this;this.events=options.events;this.time=0;this.iframe=document.createElement('iframe');node.replaceWith(this.iframe);queueMicrotask(()=>this.events.onReady());}
  getIframe(){return this.iframe;}
  setVolume(v){this.volume=v;} getDuration(){return 120;} getCurrentTime(){return this.time;}
  playVideo(){this.events.onStateChange({data:1});} pauseVideo(){pauseCalls++;this.events.onStateChange({data:2});}
  seekTo(v){this.time=v;} destroy(){destroyed=true;this.iframe.remove();}
 }};
 try{
  render(React.createElement(App));
  fireEvent.click(screen.getByRole('button',{name:'展開設定面板'}));
  fireEvent.click(screen.getByRole('button',{name:'音樂',exact:true}));
  await waitFor(()=>assert.equal(document.querySelector('main').getAttribute('aria-busy'),'false'));
 assert.equal(screen.queryByRole('button',{name:'儲存',exact:true}),null);
  fireEvent.click(screen.getByRole('button',{name:'YouTube',exact:true}));
  fireEvent.change(screen.getByLabelText('YouTube 連結'),{target:{value:'https://youtu.be/M7lc1UVf-VE'}});
  fireEvent.click(screen.getByRole('button',{name:'加入',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'播放 YouTube · M7lc1UVf-VE'}));
  await waitFor(()=>assert.ok(screen.getByRole('button',{name:'暫停',exact:true})));
  const originalPlayer=fake;
  fireEvent.click(screen.getByRole('button',{name:'聆聽',exact:true}));
  assert.equal(fake,originalPlayer,'switching views preserves the YouTube instance');
  assert.equal(destroyed,false);
  assert.ok(screen.getByRole('region',{name:'YouTube 播放器'}));
  assert.equal(document.querySelector('.youtube-player').classList.contains('panel-is-collapsed'),false);
  assert.ok(screen.getByLabelText('播放進度').closest('.listening-progress-host'));
  const backdropButton=screen.getByRole('button',{name:'關閉影片背景',exact:true});
  assert.ok(document.querySelector('main').classList.contains('video-background'),'YouTube starts in full background mode');
  assert.equal(backdropButton.previousElementSibling,screen.getByRole('button',{name:'收合曲目'}));
  assert.equal(backdropButton.closest('.topbar'),null);
  fireEvent.click(backdropButton);
  selectLanguage('en');
  assert.ok(screen.getByRole('button',{name:'Pause',exact:true}));
  assert.equal(fake,originalPlayer,'changing language keeps the YouTube player');
  selectLanguage('ja');
  assert.ok(screen.getByRole('button',{name:'一時停止',exact:true}));
  assert.equal(fake,originalPlayer);
  selectLanguage('zh-TW');
  fireEvent.change(screen.getByLabelText('播放進度'),{target:{value:'40'}});assert.equal(fake.time,40);
  const originalIframe=fake.getIframe(),previousPauses=pauseCalls;
  fireEvent.click(screen.getByRole('button',{name:'影片背景',exact:true}));
  assert.equal(screen.getByRole('button',{name:'關閉影片背景'}).getAttribute('aria-pressed'),'true');
  assert.ok(document.querySelector('main').classList.contains('video-background'));
  assert.equal(document.querySelector('.youtube-surface iframe'),originalIframe);
  assert.equal(fake,originalPlayer);assert.equal(fake.time,40);assert.equal(pauseCalls,previousPauses);
  fireEvent.click(screen.getByRole('button',{name:'收合設定面板'}));
  assert.equal(pauseCalls,previousPauses,'the visible video keeps playing when its panel collapses');
  assert.ok(screen.getByRole('region',{name:'YouTube 播放器'}));
  fireEvent.click(screen.getByRole('button',{name:'展開設定面板'}));
  fireEvent.click(screen.getByRole('button',{name:'關閉影片背景'}));
  assert.equal(document.querySelector('.youtube-surface iframe'),originalIframe);
  assert.equal(fake.time,40);assert.equal(pauseCalls,previousPauses);
  assert.equal(document.querySelector('main').classList.contains('video-background'),false);
  fireEvent.click(screen.getByRole('button',{name:'影片背景',exact:true}));

  fireEvent.click(screen.getByRole('button',{name:'暫停',exact:true}));assert.ok(screen.getByRole('button',{name:'播放',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'播放 Evening'}));
  await waitFor(()=>assert.equal(destroyed,true));assert.equal(document.querySelector('main').classList.contains('video-background'),false);assert.equal(screen.queryByRole('button',{name:'關閉影片背景'}),null);assert.ok(document.querySelector('audio'));assert.equal(screen.queryByRole('region',{name:'YouTube 播放器'}),null);
 }finally{cleanup();delete window.YT;console.error=originalError;}
});

test('deleting the active last record cancels pending autosave and stops playback',async()=>{
 const originalError=console.error;console.error=(...args)=>{if(!String(args[0]).includes('THREE.WebGLRenderer'))originalError(...args);};
 try{
  render(React.createElement(App));fireEvent.click(screen.getByRole('button',{name:'展開設定面板'}));
  await waitFor(()=>assert.equal(document.querySelector('main').getAttribute('aria-busy'),'false'));
  const saved=await listRecords();assert.equal(saved.length,1);
  fireEvent.click(screen.getByRole('button',{name:'播放',exact:true}));
  await waitFor(()=>assert.ok(screen.getByRole('button',{name:'暫停',exact:true})));
  fireEvent.change(screen.getByLabelText('目前唱片'),{target:{value:'Pending deletion'}});
  fireEvent.click(screen.getByRole('button',{name:`刪除唱片 ${saved[0].name}`,exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'確認刪除',exact:true}));
  await waitFor(()=>assert.ok(screen.getByText('尚無收藏')));
  assert.ok(screen.getByRole('button',{name:'播放',exact:true}));
  assert.equal(screen.getByLabelText('目前唱片').value,'未命名唱片');
  await new Promise(resolve=>setTimeout(resolve,550));
  assert.equal((await listRecords()).length,0);
 }finally{cleanup();console.error=originalError;}
});

test('language defaults to English, updates all controls without losing edits, and survives remount',async()=>{
 const originalError=console.error;console.error=(...args)=>{if(!String(args[0]).includes('THREE.WebGLRenderer'))originalError(...args);};
 window.localStorage.removeItem('hmusic-language');
 try{
  render(React.createElement(App));
  assert.ok(screen.getByText('Loading your library…'));
  await waitFor(()=>assert.equal(document.querySelector('main').getAttribute('aria-busy'),'false'));
  assert.equal(document.documentElement.lang,'en');
  assert.equal(screen.getByRole('button',{name:'Language',exact:true}).textContent,'EN');
  assert.equal(screen.getByRole('button',{name:'Back to library'}).textContent,'hMusic');
  fireEvent.click(screen.getByRole('button',{name:'Expand panel'}));
  fireEvent.change(screen.getByLabelText('Current record'),{target:{value:'我的專輯 / My album'}});
  selectLanguage('ja');
  assert.ok(screen.getByRole('button',{name:'ライブラリ',exact:true}));
  assert.equal(screen.getByLabelText('現在のレコード').value,'我的專輯 / My album');
  fireEvent.click(screen.getByRole('button',{name:'デザイン',exact:true}));
  assert.ok(screen.getByRole('button',{name:'ラベル',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'レコード',exact:true}));
  assert.ok(screen.getByRole('button',{name:'クリアレコード'}));
  assert.ok(screen.getByRole('button',{name:'マーブル'}));
  selectLanguage('zh-TW');
  assert.ok(screen.getByRole('button',{name:'透明水晶唱片'}));
  await waitFor(async()=>assert.ok((await listRecords()).some(r=>r.name==='我的專輯 / My album')));
  selectLanguage('ja');
  cleanup();render(React.createElement(App));
  await waitFor(()=>assert.equal(document.querySelector('main').getAttribute('aria-busy'),'false'));
  assert.equal(screen.getByRole('button',{name:'言語',exact:true}).textContent,'JP');
  assert.equal(document.documentElement.lang,'ja');
 }finally{cleanup();window.localStorage.setItem('hmusic-language','zh-TW');console.error=originalError;}
});
