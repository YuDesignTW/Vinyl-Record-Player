import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {createRecord,archiveSnapshot,moveTrack,recordSides} from '../src/records.js';
import {saveRecord,listRecords} from '../src/storage.js';

test('both faces retain independent labels, and a second disc adds independent C/D faces',()=>{
 const r=createRecord();r.labels.A.image='data:image/png;base64,A';r.labels.B.title='BACK';
 assert.equal(r.labels.B.image,'');assert.notEqual(r.labels.A.title,r.labels.B.title);
 assert.deepEqual(recordSides(r),['A','B']);r.sleeve.type='double';assert.deepEqual(recordSides(r),['A','B','C','D']);
});
test('drag ordering stays within a side without changing tracks on other sides',()=>{
 const tracks=[{id:'1',side:'A'},{id:'b',side:'B'},{id:'2',side:'A'},{id:'3',side:'A'}];
 assert.deepEqual(moveTrack(tracks,'3','1').map(t=>t.id),['3','b','1','2']);
 assert.equal(moveTrack(tracks,'1','b'),tracks);
 assert.deepEqual(tracks.map(t=>t.id),['1','b','2','3']);
});
test('archive survives database reopening with audio bytes, images, all faces and ordering',async()=>{
 const r=createRecord();r.name='Persistence test';r.sleeve.type='double';r.sleeve.front='data:image/png;base64,front';r.labels.B.image='data:image/png;base64,back';
 r.sleeve.back='outer-back';r.sleeve.insideLeft='inner-left';r.sleeve.insideRight='inner-right';r.vinylFinish='transparent';r.vinylPattern='splatter';r.vinylAccent='#ffcc00';
 r.tracks=[{id:'persist-1',side:'C',title:'Audio',blob:new Blob(['audio-bytes'],{type:'audio/wav'}),url:'blob:temporary'}];
 await saveRecord(archiveSnapshot(r));const loaded=(await listRecords()).find(x=>x.id===r.id);
 assert.equal(await loaded.tracks[0].blob.text(),'audio-bytes');assert.equal(loaded.tracks[0].url,undefined);
 assert.equal(loaded.sleeve.back,'outer-back');assert.equal(loaded.sleeve.insideLeft,'inner-left');assert.equal(loaded.sleeve.insideRight,'inner-right');assert.equal(loaded.vinylFinish,'transparent');assert.equal(loaded.vinylPattern,'splatter');assert.equal(loaded.vinylAccent,'#ffcc00');
 assert.equal(loaded.labels.B.image,r.labels.B.image);assert.equal(loaded.sleeve.front,r.sleeve.front);assert.equal(loaded.tracks[0].side,'C');
 loaded.name='Updated';await saveRecord(archiveSnapshot(loaded));assert.equal((await listRecords()).filter(x=>x.id===r.id).length,1);assert.equal((await listRecords()).find(x=>x.id===r.id).name,'Updated');
});

 test('gatefold disc stays inside its pocket throughout the hinge motion',async()=>{
 const {gatefoldPosition}=await import('../src/gatefold.js');
 for(const angle of [0,.2,.8,Math.PI/2,2.6,Math.PI]){
  assert.deepEqual(gatefoldPosition(angle,0),gatefoldPosition(angle));
  const pocket=gatefoldPosition(angle),disc=gatefoldPosition(angle,.5);
  const dx=disc.x-pocket.x,dz=disc.z-pocket.z;
  assert.ok(Math.abs(dx*Math.sin(angle)+dz*Math.cos(angle))<1e-10);
 }
 assert.equal(gatefoldPosition(0).z,0);
 assert.ok(Math.abs(gatefoldPosition(Math.PI).z-.25)<1e-10);
});
