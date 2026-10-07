import {readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const files={};
function collect(dir,base=''){for(const item of readdirSync(dir,{withFileTypes:true})){const key=base+'/'+item.name;const full=path.join(dir,item.name);if(item.isDirectory())collect(full,key);else if(!key.startsWith('/assets/')||['/assets/logo.jpg','/assets/mark.jpg'].includes(key))files[key]=readFileSync(full).toString('base64');}}
collect('web');
files['/admin/Perfiles.gs']=readFileSync('google/Perfiles.gs').toString('base64');
files['/admin/profile-ui.js']=files['/profile-ui.js'];
files['/admin/i18n.js']=files['/i18n.js'];
mkdirSync('dist/server',{recursive:true});
writeFileSync('dist/server/index.js','const FILES = '+JSON.stringify(files)+';\n'+readFileSync('worker.mjs','utf8'));
console.log('Worker built with '+Object.keys(files).length+' assets.');

for(const role of ['catalog','admin']){
 const selected=Object.fromEntries(Object.entries(files).filter(([key])=>role==='catalog'?!key.startsWith('/admin/'):key.startsWith('/admin/')||['/access.html','/assets/mark.jpg','/i18n.js'].includes(key)));
 mkdirSync('dist/'+role,{recursive:true});
 writeFileSync('dist/'+role+'/index.js','const FILES = '+JSON.stringify(selected)+';\n'+readFileSync('worker.mjs','utf8'));
}
