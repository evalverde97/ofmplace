import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import catalog from './dist/catalog/index.js';
import admin from './dist/admin/index.js';
const origin='https://management.test';
const common={SESSION_SECRET:'separate-secret',ADMIN_USERNAME:'admin',ADMIN_PASSWORD:'management-password'};
const catalogEnv={...common,STORE_PASSWORD:'catalog-password',SITE_ROLE:'catalog'};
const adminEnv={...common,SITE_ROLE:'admin'};
const request=(path,opts={})=>new Request(origin+path,opts);
const login=await admin.fetch(request('/admin/acceso',{method:'POST',headers:{Origin:origin},body:'username=admin&password=management-password'}),adminEnv);
assert.equal(login.status,303);assert.equal(login.headers.get('Location'),'/');const cookie=login.headers.get('Set-Cookie').split(';')[0];
for(const path of ['/admin','/admin/','/admin/index.html','/admin/admin.js','/admin/api/profiles','/admin/Perfiles.gs']){
 assert.equal((await catalog.fetch(request(path,{headers:{Cookie:cookie}}),catalogEnv)).status,404,path);
 assert.equal((await catalog.fetch(request(path),catalogEnv)).status,404,path+' anonymous');
}
assert.equal((await catalog.fetch(request('/admin/acceso',{method:'POST',headers:{Origin:origin},body:'username=admin&password=management-password'}),catalogEnv)).status,404);
assert.equal((await catalog.fetch(request('/api/profiles',{headers:{Cookie:cookie}}),catalogEnv)).status,401);
const home=await admin.fetch(request('/'),adminEnv);assert.equal(home.status,200);assert.match(await home.text(),/name="username"/);
const panel=await admin.fetch(request('/',{headers:{Cookie:cookie}}),adminEnv);assert.equal(panel.status,200);assert.match(await panel.text(),/https:\/\/ofmplace.netlify.app\/catalogo/);
assert.equal((await admin.fetch(request('/admin/api/profiles'),adminEnv)).status,401);
assert.equal((await admin.fetch(request('/catalogo',{headers:{Cookie:cookie}}),adminEnv)).status,404);
const bundle=readFileSync('dist/catalog/index.js','utf8');const assets=JSON.parse(bundle.slice('const FILES = '.length,bundle.indexOf(';\n')));assert(!Object.keys(assets).some(k=>k.startsWith('/admin/')));
console.log('PASS: separate admin root and credentials, public admin routes blocked even with admin cookie, no admin assets in catalog bundle, admin API still protected.');
