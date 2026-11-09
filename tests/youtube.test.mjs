import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeId} from '../src/youtube.js';
import {archiveSnapshot,createRecord} from '../src/records.js';
test('YouTube links parse only supported hosts and valid video IDs',()=>{
 for(const url of ['https://youtu.be/dQw4w9WgXcQ?t=20','https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=x','https://m.youtube.com/shorts/dQw4w9WgXcQ','https://youtube.com/live/dQw4w9WgXcQ'])assert.equal(youtubeId(url),'dQw4w9WgXcQ');
 for(const url of ['https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ','https://youtube.com/playlist?list=x','not a URL','https://youtu.be/abc'])assert.equal(youtubeId(url),null);
 const r=createRecord();r.tracks.push({id:'yt',youtubeId:'dQw4w9WgXcQ',side:'B'});assert.equal(archiveSnapshot(r).tracks[0].youtubeId,'dQw4w9WgXcQ');
});

import {extractPlaylist} from '../server/youtube.mjs';
test('album playlists support current lockups alongside legacy rows in order',()=>{
 const lockup={lockupViewModel:{contentId:'nvJoqGZOPcQ',contentType:'LOCKUP_CONTENT_TYPE_VIDEO',metadata:{lockupMetadataViewModel:{title:{content:'new beginning'}}}}};
 const data={contents:[lockup,{playlistVideoRenderer:{videoId:'Ns42XmBGAqw',title:{runs:[{text:'Second track'}]}}},lockup,{lockupViewModel:{contentId:'PLnotavideo',contentType:'LOCKUP_CONTENT_TYPE_PLAYLIST'}},{playlistVideoRenderer:{videoId:'private0000',isPlayable:false}},{continuationItemRenderer:{continuationEndpoint:{continuationCommand:{token:'next-page'}}}}]};
 assert.deepEqual(extractPlaylist(data),{videos:[{youtubeId:'nvJoqGZOPcQ',title:'new beginning'},{youtubeId:'Ns42XmBGAqw',title:'Second track'}],continuation:'next-page'});
});

import {playlistResponse,youtubePlugin} from '../server/youtube.mjs';
import vercelHandler from '../api/youtube-playlist.js';
import {youtubePlaylist} from '../src/youtube.js';
const albumPage = '<script>var ytInitialData = '+JSON.stringify({contents:[{playlistVideoRenderer:{videoId:'iRb67zfMF7M',title:{simpleText:'IRANAI'}}}]})+';</script>';
test('Vercel handler returns JSON rather than a static 404',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(albumPage);
 try {
  const headers={};let body;
  const res={setHeader:(key,value)=>headers[key]=value,end:value=>body=value};
  await vercelHandler({url:'/api/youtube-playlist?list=PLq_XQuPL5jQY82NqiXCARwU4VWc8x2paO',method:'GET'},res);
  assert.equal(res.statusCode,200);assert.match(headers['content-type'],/application\/json/);
  assert.equal(JSON.parse(body).videos[0].title,'IRANAI');
 } finally {globalThis.fetch=original;}
});
test('development and preview both register the import API',()=>{
 for(const hook of ['configureServer','configurePreviewServer']) {
  let path,handler;youtubePlugin()[hook]({middlewares:{use:(p,h)=>{path=p;handler=h;}}});
  assert.equal(path,'/api/youtube-playlist');assert.equal(handler,vercelHandler);
 }
});
test('API rejects invalid requests and reports upstream failures separately',async()=>{
 const fail=()=>{throw Error('must not fetch');};
 assert.equal((await playlistResponse('/?list=bad','GET',fail)).status,400);
 assert.equal((await playlistResponse('/?list=PLabcdefghij','POST',fail)).status,405);
 const upstream=await playlistResponse('/?list=PLabcdefghij','GET',async()=>new Response('',{status:429}));
 assert.equal(upstream.status,502);assert.equal((await upstream.json()).error,'YOUTUBE_UPSTREAM');
});
test('client distinguishes an undeployed API from a playlist visibility error',async()=>{
 const original=globalThis.fetch;
 try {
  for (const status of [200,404]) {
   globalThis.fetch=async()=>new Response('<html>not an API</html>',{status,headers:{'content-type':'text/html'}});
   await assert.rejects(youtubePlaylist('PLabcdefghij'),/尚未提供 YouTube 匯入服務/);
  }
 } finally {globalThis.fetch=original;}
});
test('playlist import follows continuation pages and preserves order without duplicates',async()=>{
 const row=id=>({playlistVideoRenderer:{videoId:id,title:{simpleText:id}}});
 const first={contents:[row('iRb67zfMF7M'),{continuationItemRenderer:{continuationEndpoint:{continuationCommand:{token:'page-two'}}}}]};
 let calls=0;
 const response=await playlistResponse('/?list=PLabcdefghij','GET',async(url,options)=>{
  if (++calls === 1) return new Response('<script>var ytInitialData = '+JSON.stringify(first)+';</script><script>ytcfg.set({"INNERTUBE_CONTEXT":{"client":{"clientName":"WEB"}}});</script>');
  assert.equal(JSON.parse(options.body).continuation,'page-two');
  return Response.json({contents:[row('iRb67zfMF7M'),row('nvJoqGZOPcQ')]});
 });
 assert.equal(response.status,200);assert.equal(calls,2);
 assert.deepEqual((await response.json()).videos.map(v=>v.youtubeId),['iRb67zfMF7M','nvJoqGZOPcQ']);
});
