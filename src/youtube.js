export function youtubeId(input) {
 try {
  const u=new URL(input.trim());
  if(!['https:','http:'].includes(u.protocol))return null;
  const host=u.hostname.toLowerCase();
  let id;
  if(host==='youtu.be')id=u.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(host)) {
   const parts=u.pathname.split('/');
   id=u.pathname==='/watch'?u.searchParams.get('v'):['shorts','embed','live'].includes(parts[1])?parts[2]:null;
  }
  return /^[\w-]{11}$/.test(id||'')?id:null;
 } catch {return null;}
}
let apiPromise;
export function youtubeAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(!apiPromise)apiPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=setTimeout(()=>{apiPromise=null;reject(new Error('YouTube 載入逾時，請檢查網路後重新選取歌曲。'));},15000);
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);previous?.();resolve(window.YT);};
  script.src='https://www.youtube.com/iframe_api';
  script.onerror=()=>{clearTimeout(timer);apiPromise=null;reject(new Error('YouTube 無法載入，請檢查網路。'));};
  document.head.appendChild(script);
 });
 return apiPromise;
}
