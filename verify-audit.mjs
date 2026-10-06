import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker from './dist/server/index.js';
const origin='https://audit.local',env={STORE_PASSWORD:'test-only',SESSION_SECRET:'audit-secret',ADMIN_USERNAME:'admin',ADMIN_PASSWORD:'audit-only',CATALOG_ENDPOINT:'https://script.google.com/macros/s/test/exec',CATALOG_TOKEN:'test-token'};
const login=await worker.fetch(new Request(origin+'/admin/acceso',{method:'POST',headers:{Origin:origin},body:'username=admin&password=audit-only'}),env);
const cookie=login.headers.get('Set-Cookie').split(';')[0];
const originalFetch=globalThis.fetch;let calls=0;
try {
 globalThis.fetch=async()=>{calls++;throw Error('Invalid inputs must not reach Google');};
 for(const route of ['/admin/api/profile','/admin/api/telegram-preview','/admin/api/telegram-publish']){
  for(const body of ['null','[]','42','"x"','{']){
   const response=await worker.fetch(new Request(origin+route,{method:'POST',headers:{Origin:origin,Cookie:cookie},body}),env);
   assert.equal(response.status,400,route+' '+body);
  }
 }
 for(const details of [null,[],false,42,'bad']){
  const response=await worker.fetch(new Request(origin+'/admin/api/profile',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:JSON.stringify({id:'a',revision:'b',details})}),env);
  assert.equal(response.status,400);
 }
 assert.equal(calls,0);
 for(const route of ['/salir','/admin/salir']){
  const response=await worker.fetch(new Request(origin+route,{method:'POST',headers:{Origin:origin,Cookie:cookie}}),env);
  const deleted=response.headers.getSetCookie();assert.equal(deleted.length,2);
  assert(deleted.some(x=>x.startsWith('dollars_admin=;')&&x.includes('Max-Age=0')));
  assert(deleted.some(x=>x.startsWith('dollars_session=;')&&x.includes('Max-Age=0')));
 }
}finally{globalThis.fetch=originalFetch;}
// Exercise the actual browser admin code with a deferred response: repeated refreshes cannot race.
const elements=new Map();const element=()=>({value:'',textContent:'',hidden:false,disabled:false,children:[],addEventListener(){},replaceChildren(...v){this.children=v;},append(...v){this.children.push(...v);},setAttribute(){}});
const document={getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:()=>[],createElement:element};
let resolveResponse,requests=0;
const context={document,fetch:()=>{requests++;return new Promise(resolve=>{resolveResponse=resolve;});},window:{},console};vm.createContext(context);
vm.runInContext(readFileSync('web/admin/admin.js','utf8'),context);
assert.equal(requests,1);assert.equal(elements.get('refresh').disabled,true);
await context.load();await context.load();assert.equal(requests,1);
resolveResponse({ok:true,json:async()=>({connected:true,profiles:[]})});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(elements.get('refresh').disabled,false);
console.log('PASS: malformed admin payloads rejected before Google, both sessions cleared on logout, simultaneous refresh requests prevented.');
