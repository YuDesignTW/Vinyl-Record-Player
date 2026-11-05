import {mkdir, readdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export function localLibrary(directory) {
 const prefix='/api/local-library';
 const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
 return async (req,res,next)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname!==prefix&&!pathname.startsWith(prefix+'/'))return next();
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  // Only the local app may access the on-disk collection.
  const host=req.headers.host||'';
  if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)||
     (req.headers.origin&&req.headers.origin!==`http://${host}`)||
     req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Forbidden'});
  try{
   await mkdir(directory,{recursive:true});
   if(req.method==='GET'&&pathname===prefix){
    const files=(await readdir(directory)).filter(f=>f.endsWith('.json'));
    const records=await Promise.all(files.map(async file=>JSON.parse(await readFile(path.join(directory,file),'utf8'))));
    return send(200,{records});
   }
   const id=pathname.slice(prefix.length+1);
   if(!validId(id))return send(400,{error:'Invalid record ID'});
   const file=path.join(directory,`${id}.json`);
   if(req.method==='DELETE'){
    await unlink(file).catch(error=>{if(error.code!=='ENOENT')throw error;});return send(200,{ok:true});
   }
   if(req.method!=='PUT')return send(405,{error:'Method not allowed'});
   if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});
   let size=0;const chunks=[];
   for await(const chunk of req){size+=chunk.length;if(size>256*1024*1024)return send(413,{error:'Record exceeds 256 MB'});chunks.push(chunk);}
   let record;try{record=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Invalid JSON'});}
   if(record.id!==id||!Array.isArray(record.tracks)||!record.labels||!record.sleeve)return send(400,{error:'Invalid record'});
   const temporary=path.join(directory,`${id}.${randomUUID()}.tmp`);
   try{await writeFile(temporary,JSON.stringify(record));await rename(temporary,file);}
   finally{await unlink(temporary).catch(()=>{});}
   return send(200,{ok:true});
  }catch(error){console.error('Local library:',error.message);return send(500,{error:'Local library could not be read or saved'});}
 };
}
export function localLibraryPlugin(directory){
 return {name:'hdame-local-library',configureServer(server){server.middlewares.use(localLibrary(directory));}};
}
