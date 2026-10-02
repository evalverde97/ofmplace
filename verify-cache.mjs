import assert from 'node:assert/strict';
import {readCatalog,writeCatalog,CACHE_KEY,CACHE_TTL} from './web/catalog-cache.js';
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
const cards=[{id:'1',name:'Example',country:'Argentina',english:'Advanced',available:true,image:'/api/profile-photo?id=1',email:'private',details:{notes:'private'}}];
writeCatalog(storage,'session-a',cards,1000);assert.equal(readCatalog(storage,'session-a',1100)[0].name,'Example');assert(!values.get(CACHE_KEY).includes('private'));
assert.equal(readCatalog(storage,'session-b',1100),null);assert(!values.has(CACHE_KEY));writeCatalog(storage,'session-a',cards,1000);assert.equal(readCatalog(storage,'session-a',1000+CACHE_TTL),null);
values.set(CACHE_KEY,'broken');assert.equal(readCatalog(storage,'session-a'),null);const denied={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};writeCatalog(denied,'session-a',cards);assert.equal(readCatalog(denied,'session-a'),null);
console.log('PASS: session-bound cache, metadata allowlist, expiry, malformed storage, denied storage.');
