export function extractPlaylist(data) {
  const videos = [], seen = new Set();
  let continuation;
  function add(id, title) {
    if (!/^[\w-]{11}$/.test(id || '') || seen.has(id)) return;
    seen.add(id);
    videos.push({ youtubeId: id, title: title || id });
  }
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    const legacy = value.playlistVideoRenderer;
    if (legacy && legacy.isPlayable !== false) {
      add(legacy.videoId, legacy.title?.runs?.map(run => run.text).join('') || legacy.title?.simpleText);
    }
    const lockup = value.lockupViewModel;
    if (lockup?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      add(lockup.contentId, lockup.metadata?.lockupMetadataViewModel?.title?.content);
    }
    if (value.continuationItemRenderer) {
      continuation = value.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token;
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit(data);
  return { videos, continuation };
}

export async function playlistResponse(url, method = 'GET', fetcher = fetch) {
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'},
  });
  if (method !== 'GET') return json({error:'METHOD_NOT_ALLOWED'},405);
  const id = new URL(url, 'http://localhost').searchParams.get('list');
  if (!/^[\w-]{10,150}$/.test(id || '')) return json({error:'INVALID_PLAYLIST'},400);
  const signal = AbortSignal.timeout(25000);
  try {
    const response = await fetcher('https://www.youtube.com/playlist?list='+encodeURIComponent(id), {signal});
    if (!response.ok) return json({error:'YOUTUBE_UPSTREAM',upstreamStatus:response.status},502);
    const html = await response.text();
    const match = html.match(/var ytInitialData\s*=\s*(.*?);<\/script>/s);
    if (!match) return json({error:'YOUTUBE_UNAVAILABLE'},502);
    let page = extractPlaylist(JSON.parse(match[1]));
    let videos = [...page.videos];
    const config = html.match(/ytcfg.set\((\{.*?\})\);/s);
    const context = config ? JSON.parse(config[1]).INNERTUBE_CONTEXT : null;
    const tokens = new Set();
    while (page.continuation && context && tokens.size < 50) {
      if (tokens.has(page.continuation)) break;
      tokens.add(page.continuation);
      const next = await fetcher('https://www.youtube.com/youtubei/v1/browse', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({context,continuation:page.continuation}), signal,
      });
      if (!next.ok) return json({error:'YOUTUBE_UPSTREAM',upstreamStatus:next.status},502);
      page = extractPlaylist(await next.json());
      videos.push(...page.videos);
    }
    if (page.continuation) return json({error:'PLAYLIST_INCOMPLETE'},502);
    videos = [...new Map(videos.map(video => [video.youtubeId,video])).values()];
    if (!videos.length) return json({error:'PLAYLIST_EMPTY_OR_UNAVAILABLE'},422);
    return json({videos});
  } catch (error) {
    return json({error:signal.aborted || error.name === 'TimeoutError' ? 'YOUTUBE_TIMEOUT' : 'YOUTUBE_UNAVAILABLE'},502);
  }
}

// Shared Node adapter for Vite and Vercel's /api function.
export async function youtubeNodeHandler(req, res) {
  const response = await playlistResponse(req.url, req.method);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}
export function youtubePlugin() {
  const install = server => server.middlewares.use('/api/youtube-playlist', youtubeNodeHandler);
  return {name:'youtube-import', configureServer:install, configurePreviewServer:install};
}
