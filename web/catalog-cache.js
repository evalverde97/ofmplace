// Tab-scoped metadata only. Session identity is verified before restoration.
export const CACHE_KEY='dollars.catalog.v1';
export const CACHE_TTL=120000;
export function clearCatalog(storage){try{storage.removeItem(CACHE_KEY);}catch{}}
export function readCatalog(storage,session,now=Date.now()){
 try{const entry=JSON.parse(storage.getItem(CACHE_KEY));if(!entry||entry.session!==session||!Number.isFinite(entry.at)||now-entry.at>=CACHE_TTL||entry.at>now||!Array.isArray(entry.profiles)){clearCatalog(storage);return null;}return entry.profiles;}catch{clearCatalog(storage);return null;}
}
export function writeCatalog(storage,session,profiles,now=Date.now()){
 const cards=profiles.map(({id,name,country,english,available,image})=>({id,name,country,english,available,image}));
 try{storage.setItem(CACHE_KEY,JSON.stringify({session,at:now,profiles:cards}));}catch{}
}
