import {localLibraryEnabled, readLocalRecords, writeLocalRecord, deleteLocalRecord} from './localLibrary.js';
const DB_NAME = 'slowly-record-library';
export function openLibrary() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('records', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('另一個分頁正在更新唱片庫，請關閉該分頁後重試。'));
  });
}
async function listBrowserRecords() {
  const db = await openLibrary();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly'), req = tx.objectStore('records').getAll();
    tx.oncomplete = () => { db.close(); resolve(req.result.sort((a,b) => b.updatedAt - a.updatedAt)); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
export async function saveRecord(record) {
  if(localLibraryEnabled())return writeLocalRecord(record);
  const db = await openLibrary();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    tx.objectStore('records').put(record);
    tx.oncomplete = () => { db.close(); resolve(record); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('唱片無法儲存')); };
  });
}

export async function deleteRecord(id) {
  if(localLibraryEnabled()){
   // Remove the old browser copy first so migration cannot resurrect it.
   const db=await openLibrary();
   await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});
   await deleteLocalRecord(id);return;
  }
  const db = await openLibrary();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    tx.objectStore('records').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('唱片無法刪除')); };
  });
}

export async function listRecords() {
 if(!localLibraryEnabled())return listBrowserRecords();
 const records=await readLocalRecords();
 // Import older browser-only collections without overwriting disk records.
 const browserRecords=await listBrowserRecords().catch(()=>[]);
 const known=new Set(records.map(record=>record.id));
 for(const record of browserRecords){if(!known.has(record.id)){await writeLocalRecord(record);records.push(record);}}
 return records.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
}
