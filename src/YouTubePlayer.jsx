import { useTranslation } from "./i18n";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { youtubeAPI } from "./youtube";
export function YouTubePlayer({ videoLayer, background, onRequireInteraction, collapsed, track, audioRef, onPlaying, onEnded, onError, onTime, onDuration, volume }) {const { t: tr } = useTranslation();
  const host = useRef(null),slot = useRef(null),surface = useRef(null),playerRef = useRef(null),live = useRef({});
  live.current = { onRequireInteraction, track, onPlaying, onEnded, onError, onTime, onDuration, volume };
  useEffect(() => {
    if (!track || !videoLayer) return;
    let player,disposed = false,ready = false,wantsPlay = false,paused = true,level = live.current.volume,position = 0;
    const adapter = {
      get paused() {return paused;},
      play() {wantsPlay = true;if (ready) player.playVideo();return Promise.resolve();},
      pause() {wantsPlay = false;paused = true;if (ready) player.pauseVideo();live.current.onPlaying(false);},
      get currentTime() {return ready ? player.getCurrentTime() : position;},
      set currentTime(value) {position = value;if (ready) player.seekTo(value, true);},
      get volume() {return level;},
      set volume(value) {level = value;if (ready) player.setVolume(value * 100);}
    };
    audioRef.current = adapter;
    live.current.onPlaying(false);
    const mount = document.createElement("div");host.current.appendChild(mount);
    youtubeAPI().then((YT) => {
      if (disposed) return;
      player = new YT.Player(mount, { width: "100%", height: "200", videoId: live.current.track.youtubeId, playerVars: { playsinline: 1, origin: window.location.origin }, events: {
          onReady: () => {if (disposed) return;ready = true;playerRef.current=player;mount.classList.add("is-ready");player.getIframe?.().classList.add("is-ready");player.setVolume(level * 100);if (position) player.seekTo(position, true);if (wantsPlay) player.loadVideoById(live.current.track.youtubeId);},
          onStateChange: (e) => {if (disposed) return;paused = e.data !== 1;live.current.onPlaying(e.data === 1);live.current.onDuration(player.getDuration() || 0);if (e.data === 0) live.current.onEnded();},
          onAutoplayBlocked: () => {live.current.onRequireInteraction?.();wantsPlay = false;live.current.onPlaying(false);live.current.onError("請點右側 YouTube 播放器開始播放。");},
          onError: (e) => {paused = true;wantsPlay = false;live.current.onPlaying(false);live.current.onError([101, 150].includes(e.data) ? "這部影片不允許嵌入播放，請更換 YouTube 連結。" : "YouTube 影片無法播放，可能已移除、受到限制或連線失敗。");}
        } });
    }).catch((error) => {if (!disposed) live.current.onError(error.message);});
    const timer = setInterval(() => {if (ready && !disposed) {live.current.onTime(player.getCurrentTime() || 0);live.current.onDuration(player.getDuration() || 0);}}, 300);
    return () => {
      disposed = true;playerRef.current=null;clearInterval(timer);if (ready) player.pauseVideo();
      if (audioRef.current === adapter) audioRef.current = null;
      const remove = () => {player?.destroy();mount.remove();};
      if (!live.current.track && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setTimeout(remove, 320);else remove();
    };
  }, [Boolean(track), videoLayer]);
  useEffect(()=>{if(playerRef.current&&track)playerRef.current.cueVideoById(track.youtubeId);},[track?.id]);
  // Keep one portal target and iframe throughout mode changes. Only its CSS rectangle moves.
  useLayoutEffect(() => {
    if (!videoLayer || !track || background || collapsed) return;
    let frame, lastRectangle;
    const position = () => {
      if (slot.current && surface.current) {
        const rect = slot.current.getBoundingClientRect();
        const rectangle = [rect.left, rect.top, rect.width, rect.height].join(":");
        if (rectangle !== lastRectangle) {Object.assign(surface.current.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });lastRectangle = rectangle;}
      }
      frame = requestAnimationFrame(position);
    };
    position();return () => cancelAnimationFrame(frame);
  }, [videoLayer, track?.id, background, collapsed]);
  return <>
  <div ref={slot} className={`youtube-player ${track && !background ? "is-present" : ""} ${collapsed ? "panel-is-collapsed" : ""}`} aria-hidden="true" />
  {videoLayer && createPortal(<section ref={surface} className={`youtube-surface ${background ? "is-background" : ""} ${track ? "is-present" : ""} ${collapsed && !background ? "is-concealed" : ""}`} aria-label={tr("YouTube 播放器")} aria-hidden={!track || collapsed && !background} inert={!track || collapsed && !background ? true : undefined}>
   <div className="youtube-reveal"><div ref={host} /></div>
   <div className="youtube-background-shade" aria-hidden="true" />
  </section>, videoLayer)}
 </>;
}
