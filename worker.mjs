const encoder=new TextEncoder();
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const fields=['onlyfansStatus','monthlyRevenue','currentSubscribers','contentLibrary','notes','age','country','english','creatorType','smartphone','countriesBlocked','accountAccess','revenueSplit','dailyWeeklyAvailability','startAvailability','agency','socialMedia','contentType'];
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
async function key(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);}
async function sign(value,secret){return b64(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(value)));}
async function equal(a,b){const hashes=await Promise.all([a,b].map(x=>crypto.subtle.digest('SHA-256',encoder.encode(String(x)))));const x=new Uint8Array(hashes[0]),y=new Uint8Array(hashes[1]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
const sessionName=admin=>admin?'dollars_admin':'dollars_session';
const lifetime=admin=>admin?7200:43200;
const sessionKey=(env,admin)=>env.SESSION_SECRET+'|'+(admin?'admin|'+env.ADMIN_PASSWORD:'catalog|'+env.STORE_PASSWORD);
async function authorized(request,env,admin=false){try{const name=sessionName(admin);const cookie=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);if(!cookie)return false;const [expires,nonce,signature,...extra]=cookie.split('.');if(extra.length||!/^\d+$/.test(expires)||!nonce||!signature||Number(expires)<=Date.now()||Number(expires)>Date.now()+lifetime(admin)*1000)return false;return equal(signature,await sign(expires+'.'+nonce,sessionKey(env,admin)));}catch{return false;}}
async function cookie(env,admin){const token=(Date.now()+lifetime(admin)*1000)+'.'+crypto.randomUUID();return sessionName(admin)+'='+token+'.'+await sign(token,sessionKey(env,admin))+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+lifetime(admin);}
function redirect(to,cookie){return new Response(null,{status:303,headers:{...headers,Location:to,...(cookie?{'Set-Cookie':cookie}:{})}});}
function bytes(path){return Uint8Array.from(atob(FILES[path]),c=>c.charCodeAt(0));}
function login(admin=false,error='',status=200){const html=new TextDecoder().decode(bytes('/access.html')).replaceAll('__TITLE__',admin?'Administración':'Bienvenido a DOLL✦ARS').replaceAll('__INTRO__',admin?'Ingresá con tu usuario y contraseña.':'Ingresá tu contraseña para explorar el catálogo.').replaceAll('__ACTION__',admin?'/admin/acceso':'/acceso').replaceAll('__USERNAME__',admin?'<label for="username">Usuario</label><input id="username" name="username" autocomplete="username" required maxlength="80">':'').replaceAll('__ERROR__',error);return new Response(html,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'self'; form-action 'self'; base-uri 'none'"}});}
function json(data,status=200){return Response.json(data,{status,headers});}
async function source(env,action,payload={}){if(!env.CATALOG_ENDPOINT||!env.CATALOG_TOKEN)throw Error('not_connected');const endpoint=new URL(env.CATALOG_ENDPOINT);if(endpoint.protocol!=='https:'||endpoint.hostname!=='script.google.com'||!endpoint.pathname.endsWith('/exec'))throw Error('invalid_endpoint');const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,action,token:env.CATALOG_TOKEN}),signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('source_unavailable');return response.json();}
function card(p,admin=false){return {id:String(p.id),name:String(p.name),country:String(p.country||''),english:String(p.english||''),available:p.available===true,image:p.hasPhoto?(admin?'/admin/api/photo?id=':'/api/profile-photo?id=')+encodeURIComponent(p.id):''};}
function detail(p,admin=false){return {...card(p,admin),images:Array.from({length:Math.min(Math.max(Number(p.photoCount)||0,0),30)},(_,index)=>'/api/profile-photo?id='+encodeURIComponent(p.id)+'&index='+index),details:Object.fromEntries(fields.map(k=>[k,String(p.details?.[k]??'')]))};}
export default {async fetch(request,env){try{
 const url=new URL(request.url),route=url.pathname,isAdmin=route==='/admin'||route.startsWith('/admin/');
 if(!env.SESSION_SECRET||!env.STORE_PASSWORD)return new Response('Acceso temporalmente no disponible.',{status:503,headers});
 if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return new Response('Solicitud no permitida.',{status:403,headers});
 if((route==='/acceso'||route==='/admin/acceso')&&request.method==='POST'){
  if(isAdmin&&(!env.ADMIN_USERNAME||!env.ADMIN_PASSWORD))return login(true,'El acceso de administración todavía no está configurado.',503);
  const raw=await request.text();if(raw.length>2048)return json({error:'request_too_large'},413);const form=new URLSearchParams(raw);
  const validPassword=await equal(form.get('password')||'',isAdmin?env.ADMIN_PASSWORD:env.STORE_PASSWORD);const validUser=!isAdmin||await equal(form.get('username')||'',env.ADMIN_USERNAME);
  if(!validPassword||!validUser)return login(isAdmin,isAdmin?'Usuario o contraseña incorrectos.':'La contraseña no es correcta. Probá nuevamente.',401);
  return redirect(isAdmin?'/admin':'/catalogo',await cookie(env,isAdmin));
 }
 if((route==='/salir'||route==='/admin/salir')&&request.method==='POST')return redirect(isAdmin?'/admin':'/',sessionName(isAdmin)+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
 const adminAuth=isAdmin&&await authorized(request,env,true);
 const allowed=route==='/assets/mark.jpg'||route==='/i18n.js'||(isAdmin?adminAuth:(await authorized(request,env)||await authorized(request,env,true)));
 if(!allowed){if(['/','/catalogo','/index.html','/acceso','/admin','/admin/acceso'].includes(route))return login(isAdmin);return json({error:'unauthorized'},401);}
 if(route==='/')return redirect('/catalogo');
 if(route.startsWith('/admin/api/')){
  if(!env.CATALOG_ENDPOINT||!env.CATALOG_TOKEN)return route==='/admin/api/profiles'&&request.method==='GET'?json({profiles:[],connected:false}):json({error:'not_connected'},503);
  if(route==='/admin/api/profiles'&&request.method==='GET'){const data=await source(env,'adminList');if(data.error)return json(data,502);return json({connected:true,profiles:data.profiles.map(p=>({...detail(p,true),approved:p.approved===true,eligible:p.eligible===true,revision:String(p.revision),editingEnabled:data.editingVersion===2,telegramEnabled:data.telegramVersion===1,listingPrice:String(p.listingPrice||''),photos:Array.isArray(p.photos)?p.photos.map((key,index)=>({key:String(key),image:p.eligible?'/admin/api/photo?id='+encodeURIComponent(p.id)+'&index='+index:''})):[],originalRevenue:String(p.originalRevenue||'')}))});}
  if(route==='/admin/api/profile'&&request.method==='POST'){
   const raw=await request.text();if(raw.length>16000)return json({error:'request_too_large'},413);let body;try{body=JSON.parse(raw);}catch{return json({error:'invalid_request'},400);}
   if(typeof body.id!=='string'||typeof body.revision!=='string'||(body.approved!==undefined&&typeof body.approved!=='boolean')||(body.available!==undefined&&typeof body.available!=='boolean'))return json({error:'invalid_request'},400);
   if(body.listingPrice!==undefined&&(typeof body.listingPrice!=='string'||!/^\d{1,9}(\.\d{1,2})?$/.test(body.listingPrice)))return json({error:'invalid_price'},400);
   if(body.details&&(!Object.keys(body.details).every(k=>fields.includes(k)&&typeof body.details[k]==='string'&&body.details[k].length<=1000)))return json({error:'invalid_fields'},400);
   if(body.name!==undefined&&(typeof body.name!=='string'||!body.name.trim()||body.name.length>120))return json({error:'invalid_name'},400);
   if(body.photos!==undefined&&(!Array.isArray(body.photos)||body.photos.length>30||new Set(body.photos).size!==body.photos.length||!body.photos.every(x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{10,}$/.test(x))))return json({error:'invalid_photos'},400);
   if(body.name!==undefined||body.photos!==undefined){const connector=await source(env,'adminList');if(connector.editingVersion!==2)return json({error:'setup_required'},409);}
   const data=await source(env,'adminUpdate',{id:body.id,revision:body.revision,approved:body.approved,available:body.available,details:body.details,name:body.name,photos:body.photos,listingPrice:body.listingPrice});return json(data,data.error?(data.error==='conflict'?409:400):200);
  }
  if(['/admin/api/telegram-preview','/admin/api/telegram-publish'].includes(route)&&request.method==='POST'){
   const raw=await request.text();if(raw.length>16000)return json({error:'request_too_large'},413);let body;try{body=JSON.parse(raw);}catch{return json({error:'invalid_request'},400);}
   if(typeof body.id!=='string'||typeof body.revision!=='string')return json({error:'invalid_request'},400);
   const action=route.endsWith('preview')?'telegramPreview':'telegramPublish';
   if(action==='telegramPublish'&&(typeof body.draft!=='string'||typeof body.text!=='string'||!body.text.trim()||body.text.length>4096))return json({error:'invalid_request'},400);
   const data=await source(env,action,{id:body.id,revision:body.revision,draft:body.draft,text:body.text});return json(data,data.error?400:200);
  }
  if(route==='/admin/api/photo'&&request.method==='GET')return await photo(env,'adminPhoto',url.searchParams.get('id'),Number(url.searchParams.get('index')||0));
  return json({error:'not_found'},404);
 }
 if(!['GET','HEAD'].includes(request.method))return json({error:'method_not_allowed'},405);
 if(route==='/api/session'){const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('dollars_session=')||x.startsWith('dollars_admin=')).join(';');return json({session:await sign(token,env.SESSION_SECRET)});}
 if(route==='/api/profiles'){if(!env.CATALOG_ENDPOINT||!env.CATALOG_TOKEN)return json({profiles:[],connected:false});const data=await source(env,'profiles');if(data.error)return json(data,502);return json({profiles:data.profiles.map(p=>card(p)),connected:true});}
 if(route==='/api/profile'){const data=await source(env,'profile',{id:url.searchParams.get('id')});if(data.error)return json(data,data.error==='not_found'?404:502);return json({profile:detail(data.profile)});}
 if(route==='/api/profile-photo')return await photo(env,'photo',url.searchParams.get('id'),Number(url.searchParams.get('index')||0));
 const path=route==='/catalogo'?'/index.html':route==='/admin'?'/admin/index.html':route;
 if(!FILES[path])return new Response('No encontrado',{status:404,headers});
 const type={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',jpg:'image/jpeg',png:'image/png',gs:'text/plain; charset=utf-8'}[path.split('.').pop()]||'application/octet-stream';
 return new Response(request.method==='HEAD'?null:bytes(path),{headers:{...headers,'Content-Type':type,...(path.endsWith('.gs')?{'Content-Disposition':'attachment; filename="Perfiles.gs"'}:{})}});
 }catch{return json({error:'source_unavailable'},502);}
}};
async function photo(env,action,id,index=0){if(!Number.isInteger(index)||index<0||index>29)return json({error:'invalid_index'},400);const data=await source(env,action,{id,index});if(data.error)return json({error:'photo_unavailable'},404);if(!['image/jpeg','image/png','image/webp'].includes(data.mime)||typeof data.base64!=='string'||data.base64.length>3000000)return json({error:'invalid_photo'},502);return new Response(Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':data.mime}});}
