const endpoint='/api/local-library';
export const localLibraryEnabled=()=>import.meta.env?.DEV===true;
async function request(path='',options){
 const response=await fetch(endpoint+path,options);
 if(!response.ok)throw new Error(`本機存檔失敗 (${response.status})`);
 return response.json();
}
export async function encodeRecord(record){
 return {...record,tracks:await Promise.all(record.tracks.map(async({blob,url,...track})=>{
  if(!blob)return track;
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
  return {...track,audioData:data};
 }))};
}
export async function decodeRecord(record){
 return {...record,tracks:await Promise.all(record.tracks.map(async({audioData,...track})=>{
  if(!audioData)return track;
  const response=await fetch(audioData);return {...track,blob:await response.blob()};
 }))};
}
export async function readLocalRecords(){const {records}=await request();return Promise.all(records.map(decodeRecord));}
export async function writeLocalRecord(record){await request('/'+encodeURIComponent(record.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(await encodeRecord(record))});return record;}
export async function deleteLocalRecord(id){await request('/'+encodeURIComponent(id),{method:'DELETE'});}

// Keep the real page origin consistent: YouTube can reject embeds from IP origins.
export function canonicalLocalUrl(href){
 const url=new URL(href);
 if(!['127.0.0.1','[::1]'].includes(url.hostname))return null;
 url.hostname='localhost';return url.href;
}
