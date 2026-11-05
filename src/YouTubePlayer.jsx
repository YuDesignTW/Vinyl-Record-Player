import {useEffect,useRef} from 'react';
import {youtubeAPI} from './youtube';
export function YouTubePlayer({collapsed,track,audioRef,onPlaying,onEnded,onError,onTime,onDuration,volume}){
 const host=useRef(null),live=useRef({});
 live.current={track,onPlaying,onEnded,onError,onTime,onDuration,volume};
 useEffect(()=>{
  if(!track)return;
  let player,disposed=false,ready=false,wantsPlay=false,paused=true,level=live.current.volume,position=0;
  const adapter={
   get paused(){return paused;},
   play(){wantsPlay=true;if(ready)player.playVideo();return Promise.resolve();},
   pause(){wantsPlay=false;paused=true;if(ready)player.pauseVideo();live.current.onPlaying(false);},
   get currentTime(){return ready?player.getCurrentTime():position;},
   set currentTime(value){position=value;if(ready)player.seekTo(value,true);},
   get volume(){return level;},
   set volume(value){level=value;if(ready)player.setVolume(value*100);}
  };
  audioRef.current=adapter;
  live.current.onPlaying(false);
  const mount=document.createElement('div');host.current.appendChild(mount);
  youtubeAPI().then(YT=>{
   if(disposed)return;
   player=new YT.Player(mount,{width:'100%',height:'200',videoId:track.youtubeId,playerVars:{playsinline:1,origin:window.location.origin},events:{
    onReady:()=>{if(disposed)return;ready=true;mount.classList.add('is-ready');player.getIframe?.().classList.add('is-ready');player.setVolume(level*100);if(position)player.seekTo(position,true);if(wantsPlay)player.playVideo();},
    onStateChange:e=>{if(disposed)return;paused=e.data!==1;live.current.onPlaying(e.data===1);live.current.onDuration(player.getDuration()||0);if(e.data===0)live.current.onEnded();},
    onAutoplayBlocked:()=>{wantsPlay=false;live.current.onPlaying(false);live.current.onError('請點右側 YouTube 播放器開始播放。');},
    onError:e=>{paused=true;wantsPlay=false;live.current.onPlaying(false);live.current.onError([101,150].includes(e.data)?'這部影片不允許嵌入播放，請更換 YouTube 連結。':'YouTube 影片無法播放，可能已移除、受到限制或連線失敗。');}
   }});
  }).catch(error=>{if(!disposed)live.current.onError(error.message);});
  const timer=setInterval(()=>{if(ready&&!disposed){live.current.onTime(player.getCurrentTime()||0);live.current.onDuration(player.getDuration()||0);}},300);
  return()=>{
   disposed=true;clearInterval(timer);if(ready)player.pauseVideo();
   if(audioRef.current===adapter)audioRef.current=null;
   const remove=()=>{player?.destroy();mount.remove();};
   if(!live.current.track&& !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)setTimeout(remove,320);else remove();
  };
 },[track?.id]);
 return <section className={`youtube-player ${track?'is-present':''} ${collapsed?'panel-is-collapsed':''}`} aria-label="YouTube 播放器" aria-hidden={!track} inert={!track?true:undefined}><div className="youtube-reveal"><div ref={host}/></div></section>;
}
