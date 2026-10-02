import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=['Nombre','Edad','País de origen','Nivel de ingles','Fotos del perfil','Publicar','Perfil ID','Disponible','Dirección de correo electrónico','Ingreso mensual/subs'];
let headers=[...base];const rows=[headers];
const sheet={getLastColumn:()=>headers.length,getDataRange:()=>({getValues:()=>rows}),getRange:(r,c)=>({setValue(value){rows[r-1][c-1]=value;return this;}})};
const context={SpreadsheetApp:{openById:()=>({getSheets:()=>[sheet]}),flush(){}},PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-token'})},ContentService:{MimeType:{JSON:'json',TEXT:'text'},createTextOutput:text=>({text,setMimeType(){return this;}})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(algo,text)=>Array.from(createHash('sha256').update(text).digest()),base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url')},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},console};
vm.createContext(context);vm.runInContext(readFileSync('google/Perfiles.gs','utf8'),context);
const columns=vm.runInContext('FIELD_COLUMNS',context);headers.push(...Object.values(columns).filter(c=>!headers.includes(c)));
function add(name,age,approved,id){const row=headers.map(()=> '');for(const [col,value] of Object.entries({'Nombre':name,'Edad':age,'País de origen':'Argentina','Nivel de ingles':'Avanzado','Publicar':approved,'Perfil ID':id,'Disponible':false,'Dirección de correo electrónico':'hidden@example.com','Ingreso mensual/subs':'original 100/10'}))row[headers.indexOf(col)]=value;rows.push(row);}
add('Aprobado',24,true,'adult');add('Menor',17,false,'minor');add('Pendiente',25,false,'pending');add('Edad dudosa','18 años',true,'unclear');
const call=data=>JSON.parse(context.doPost({postData:{contents:JSON.stringify({token:'test-token',...data})}}).text);
assert.equal(call({action:'profiles'}).profiles.length,1);const publicCard=call({action:'profiles'}).profiles[0];assert.deepEqual(Object.keys(publicCard).sort(),['available','country','english','hasPhoto','id','name']);
assert.equal(call({action:'profile',id:'minor'}).error,'not_found');assert.equal(call({action:'adminPhoto',id:'minor'}).error,'not_found');assert(!JSON.stringify(call({action:'adminList'})).includes('hidden@example.com'));
let p=call({action:'adminList'}).profiles.find(x=>x.id==='pending');assert.equal(call({action:'adminUpdate',id:p.id,revision:p.revision,approved:true}).ok,true);p=call({action:'adminList'}).profiles.find(x=>x.id==='pending');assert.equal(p.available,true);assert.equal(p.approved,true);
assert.equal(call({action:'adminUpdate',id:p.id,revision:'stale',available:false}).error,'conflict');assert.equal(call({action:'adminUpdate',id:p.id,revision:p.revision,available:false}).ok,true);p=call({action:'adminList'}).profiles.find(x=>x.id==='pending');assert.equal(p.available,false);assert.equal(p.approved,true);
assert.equal(call({action:'adminUpdate',id:p.id,revision:p.revision,details:{email:'forbidden'}}).error,'invalid_fields');
let minor=call({action:'adminList'}).profiles.find(x=>x.id==='minor');assert.equal(call({action:'adminUpdate',id:minor.id,revision:minor.revision,approved:true}).error,'adult_required');
assert.equal(call({token:'wrong',action:'adminList'}).error,'unauthorized');assert.equal(call({action:'profile',id:'adult'}).profile.details.age,'24');
assert.equal(call({action:'adminUpdate',id:p.id,revision:p.revision,approved:false}).ok,true);assert.equal(call({action:'profile',id:p.id}).error,'not_found');
console.log('PASS: adults-only publication, approval activates availability, availability independent, unpublish, optimistic concurrency, detail allowlist, private email excluded, authentication.');

headers.push('Nombre publicado','Fotos publicadas');rows.forEach((row,index)=>{if(index)row.push('','');});
const photoA='abcdefghij_123',photoB='klmnopqrst_456';rows[1][headers.indexOf('Fotos del perfil')]='https://drive.google.com/file/d/'+photoA+'/view, https://drive.google.com/open?id='+photoB;
let adult=call({action:'adminList'}).profiles.find(x=>x.id==='adult');assert.equal(call({action:'adminList'}).editingVersion,2);assert.deepEqual(adult.photos,[photoA,photoB]);
assert.equal(call({action:'adminUpdate',id:adult.id,revision:adult.revision,name:'Nombre nuevo',photos:[photoB,photoA]}).ok,true);adult=call({action:'adminList'}).profiles.find(x=>x.id==='adult');assert.equal(adult.name,'Nombre nuevo');assert.deepEqual(adult.photos,[photoB,photoA]);assert.equal(rows[1][headers.indexOf('Nombre')],'Aprobado');assert(rows[1][headers.indexOf('Fotos del perfil')].includes(photoA));
assert.equal(call({action:'adminUpdate',id:adult.id,revision:adult.revision,photos:['foreign_photo_123']}).error,'invalid_photos');assert.equal(call({action:'adminUpdate',id:adult.id,revision:adult.revision,name:' '}).error,'invalid_name');assert.equal(call({action:'adminUpdate',id:adult.id,revision:adult.revision,photos:[photoA,photoA]}).error,'invalid_photos');
assert.equal(call({action:'adminUpdate',id:adult.id,revision:adult.revision,photos:[]}).ok,true);adult=call({action:'adminList'}).profiles.find(x=>x.id==='adult');assert.equal(adult.hasPhoto,false);assert.equal(adult.photos.length,0);assert.equal(call({action:'profile',id:'adult'}).profile.photoCount,0);console.log('PASS: name override, photo order/removal, original answers preserved, invalid photos rejected.');
