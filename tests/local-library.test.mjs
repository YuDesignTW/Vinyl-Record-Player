import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {localLibrary} from '../server/local-library.mjs';
import {encodeRecord,decodeRecord} from '../src/localLibrary.js';
import {JSDOM} from 'jsdom';
const {window}=new JSDOM();
globalThis.FileReader=window.FileReader;
async function call(middleware,method,url,body,headers={}){
 const req=Readable.from(body?[Buffer.from(JSON.stringify(body))]:[]);
 Object.assign(req,{method,url,headers:{host:'localhost:4173','content-type':'application/json',...headers}});
 let status,data;
 await middleware(req,{writeHead(code){status=code;},end(value){data=JSON.parse(value);}},()=>{status=404;});
 return {status,data};
}
test('disk records survive server recreation and a fresh browser, preserving audio and artwork',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'hdame-library-'));
 try{
  let server=localLibrary(directory);
  const original={id:'record-1',name:'My record',labels:{A:{title:'A',image:'data:image/png;base64,YQ=='}},sleeve:{front:'cover'},tracks:[{id:'audio',blob:new window.Blob(['music bytes'],{type:'audio/wav'}),side:'A'},{id:'video',youtubeId:'M7lc1UVf-VE',side:'B'}]};
  const encoded=await encodeRecord(original);
  assert.equal((await call(server,'PUT','/api/local-library/record-1',encoded)).status,200);
  server=localLibrary(directory); // No browser IndexedDB or old middleware state.
  const loaded=await call(server,'GET','/api/local-library');assert.equal(loaded.status,200);
  const restored=await decodeRecord(loaded.data.records[0]);
  assert.equal(restored.name,'My record');assert.deepEqual(restored.labels,original.labels);
  assert.equal(await restored.tracks[0].blob.text(),'music bytes');assert.equal(restored.tracks[0].blob.type,'audio/wav');
  assert.equal(restored.tracks[1].youtubeId,'M7lc1UVf-VE');
  encoded.name='Updated';await call(server,'PUT','/api/local-library/record-1',encoded);
  assert.deepEqual(await readdir(directory),['record-1.json']);
  assert.equal((await call(server,'GET','/api/local-library')).data.records[0].name,'Updated');
  assert.equal((await call(server,'DELETE','/api/local-library/record-1')).status,200);
  assert.deepEqual((await call(localLibrary(directory),'GET','/api/local-library')).data.records,[]);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('rejects cross-origin requests, unsafe IDs and malformed records',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'hdame-library-'));
 try{
  const server=localLibrary(directory);
  assert.equal((await call(server,'GET','/api/local-library',null,{origin:'https://other.test'})).status,403);
  assert.equal((await call(server,'GET','/api/local-library',null,{host:'other.test'})).status,403);
  assert.equal((await call(server,'PUT','/api/local-library/bad%2Fid',{})).status,400);
  assert.equal((await call(server,'PUT','/api/local-library/record-1',{id:'wrong'})).status,400);
  assert.deepEqual(await readdir(directory),[]);
 }finally{await rm(directory,{recursive:true,force:true});}
});


test('local storage migrates old collections and never resurrects deleted records',async()=>{
 await import('fake-indexeddb/auto');
 const {build}=await import('esbuild');
 const browser=await import('../src/storage.js');
 const record={id:'migrated',name:'Old collection',updatedAt:1,labels:{A:{title:'Old'}},sleeve:{front:'image'},tracks:[]};
 await browser.saveRecord(record);
 const directory=await mkdtemp(path.join(tmpdir(),'hdame-migration-'));
 const originalFetch=globalThis.fetch;
 try{
  let server=localLibrary(directory);
  globalThis.fetch=async(url,options={})=>{
   if(!String(url).startsWith('/api/local-library'))return originalFetch(url,options);
   const result=await call(server,options.method||'GET',url,options.body?JSON.parse(options.body):undefined);
   return new Response(JSON.stringify(result.data),{status:result.status});
  };
  const bundle=await build({entryPoints:['src/storage.js'],bundle:true,write:false,format:'esm',define:{'import.meta.env.DEV':'true'}});
  const disk=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  assert.equal((await disk.listRecords())[0].name,'Old collection');
  await disk.saveRecord({...record,name:'Disk change',updatedAt:2});
  server=localLibrary(directory);
  assert.equal((await disk.listRecords())[0].name,'Disk change','stale browser data must not overwrite disk');
  await disk.deleteRecord(record.id);
  assert.deepEqual(await disk.listRecords(),[]);
  assert.deepEqual(await browser.listRecords(),[]);
  globalThis.fetch=async()=>{throw new Error('offline');};
  await assert.rejects(disk.listRecords,/offline/,'server failure must not silently become an empty library');
 }finally{globalThis.fetch=originalFetch;await rm(directory,{recursive:true,force:true});}
});
