import assert from 'node:assert/strict';
import {source} from './dist/server/index.js';
const env={CATALOG_ENDPOINT:'https://script.google.com/macros/s/test/exec',CATALOG_TOKEN:'test-secret'};
const originalFetch=globalThis.fetch;let calls=0;
try {
 globalThis.fetch=async()=>{calls++;if(calls<3)return new Response('Busy',{status:503});return Response.json({profiles:[]});};
 assert.deepEqual(await source(env,'profiles'),{profiles:[]});assert.equal(calls,3);
 calls=0;globalThis.fetch=async()=>{calls++;return new Response('<html>Sign in</html>');};
 await assert.rejects(()=>source(env,'adminList'),/source_unavailable/);assert.equal(calls,3);
 calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status:403});};
 await assert.rejects(()=>source(env,'profile'),/source_unavailable/);assert.equal(calls,1);
 for(const action of ['adminUpdate','telegramPublish']){
  calls=0;globalThis.fetch=async()=>{calls++;throw new TypeError('Network failed');};
  await assert.rejects(()=>source(env,action),/source_unavailable/);assert.equal(calls,1);
 }
 calls=0;globalThis.fetch=async()=>{calls++;return Response.json({error:'unauthorized'});};
 assert.equal((await source(env,'profiles')).error,'unauthorized');assert.equal(calls,1);
 calls=0;globalThis.fetch=async()=>{calls++;if(calls===1)throw new DOMException('Timeout','TimeoutError');return Response.json({profile:{id:'a'}});};
 assert.equal((await source(env,'profile')).profile.id,'a');assert.equal(calls,2);
 console.log('PASS: transient HTTP and timeouts retried, malformed responses bounded, forbidden and business errors not retried, writes and Telegram never repeated.');
}finally{globalThis.fetch=originalFetch;}
