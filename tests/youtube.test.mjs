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
