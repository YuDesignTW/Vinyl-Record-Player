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

export function youtubePlaylistId(input){try{const u=new URL(input);return ['youtube.com','www.youtube.com','music.youtube.com','m.youtube.com'].includes(u.hostname)&&/^[\w-]{10,150}$/.test(u.searchParams.get('list')||'')?u.searchParams.get('list'):null;}catch{return null;}}
export async function youtubeTitle(id){const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Unable to read video title');return (await r.json()).title;}

export async function youtubePlaylist(list) {
 const response = await fetch('/api/youtube-playlist?list='+encodeURIComponent(list), {headers:{Accept:'application/json'}});
 if (response.status === 404 || !response.headers.get('content-type')?.includes('application/json')) {
  throw new Error('此網站尚未提供 YouTube 匯入服務，請更新部署後重試。');
 }
 const data = await response.json();
 if (!response.ok) {
  if (data.error === 'YOUTUBE_PLAYLIST_UNAVAILABLE' && typeof data.message === 'string') throw new Error('YouTube 回覆：'+data.message);
  if (data.error === 'YOUTUBE_RESPONSE_UNRECOGNIZED') throw new Error('YouTube 未回傳可辨識的清單內容，請稍後重試。');
  if (data.error === 'YOUTUBE_TIMEOUT') throw new Error('YouTube 讀取逾時，請稍後重試。');
  if (data.error === 'PLAYLIST_EMPTY_OR_UNAVAILABLE') throw new Error('播放清單沒有可讀取的影片，請確認公開狀態。');
  if (data.error === 'PLAYLIST_INCOMPLETE') throw new Error('播放清單未能完整讀取，請稍後重試。');
  throw new Error('YouTube 暫時無法回應匯入服務，請稍後重試。');
 }
 if (!Array.isArray(data.videos) || !data.videos.length) throw new Error('播放清單沒有可讀取的影片，請確認公開狀態。');
 return data.videos;
}
