/** REEMPLAZAR TODO Código.gs CON ESTE ARCHIVO. No envolver en myFunction().
 * Ejecutar prepararPerfiles; luego implementar como aplicación web.
 */
const SHEET_ID='1TVEuvhJtnvHDB12x0hrebl6QGKrdfMmpAJaSxFkMycQ';
const FIELD_COLUMNS={onlyfansStatus:'OnlyFans status',monthlyRevenue:'Monthly Revenue',currentSubscribers:'Current Subscribers',contentLibrary:'Ya tiene contenidos creados',notes:'Notes / Highlights',age:'Edad',country:'País de origen',english:'Nivel de ingles',creatorType:'Creator Type',smartphone:'Smartphone',countriesBlocked:'Países bloqueados',accountAccess:'Account access',revenueSplit:'Revenue Split (%)',dailyWeeklyAvailability:'Availability Day/Week',startAvailability:'Start Availability',agency:'Actualmente con agencia?',socialMedia:'Social Media Set Up',contentType:'Tipo de contenido aceptado'};
function tablaPerfiles(){const ss=SpreadsheetApp.openById(SHEET_ID);for(const sheet of ss.getSheets()){if(!sheet.getLastColumn())continue;const rows=sheet.getDataRange().getValues(),headers=rows[0].map(x=>String(x).trim());if(['Nombre','Edad','País de origen','Nivel de ingles','Fotos del perfil'].every(x=>headers.includes(x)))return {sheet,rows,headers};}throw new Error('No se encontró la pestaña de respuestas con los encabezados esperados.');}
function prepararPerfiles(){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const {sheet}=tablaPerfiles();let headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(x=>String(x).trim());
 for(const title of ['Publicar','Perfil ID','Disponible',...Object.values(FIELD_COLUMNS)])if(!headers.includes(title)){sheet.getRange(1,sheet.getLastColumn()+1).setValue(title);headers.push(title);}
 const count=Math.max(sheet.getLastRow()-1,0);if(count){for(const title of ['Publicar','Disponible'])sheet.getRange(2,headers.indexOf(title)+1,count).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());const range=sheet.getRange(2,headers.indexOf('Perfil ID')+1,count),ids=range.getValues();for(let i=0;i<ids.length;i++)if(!ids[i][0])ids[i][0]=Utilities.getUuid();range.setValues(ids);}
 const props=PropertiesService.getScriptProperties();if(!props.getProperty('CATALOG_TOKEN'))props.setProperty('CATALOG_TOKEN',Utilities.getUuid()+Utilities.getUuid());
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='nuevoPerfil'))ScriptApp.newTrigger('nuevoPerfil').forSpreadsheet(SHEET_ID).onFormSubmit().create();
 console.log('Preparado. Las respuestas se administran desde el panel.');console.log('CATALOG_TOKEN está en Configuración del proyecto > Propiedades del script.');
 }finally{lock.releaseLock();}
}
function nuevoPerfil(e){if(!e?.range)return;const lock=LockService.getScriptLock();lock.waitLock(30000);try{const {sheet,headers}=tablaPerfiles();if(e.range.getSheet().getSheetId()!==sheet.getSheetId())return;const row=e.range.getRow(),id=headers.indexOf('Perfil ID')+1;if(!id)throw new Error('Ejecutá prepararPerfiles primero.');if(!sheet.getRange(row,id).getValue())sheet.getRange(row,id).setValue(Utilities.getUuid());for(const title of ['Publicar','Disponible']){const col=headers.indexOf(title)+1;if(col)sheet.getRange(row,col).insertCheckboxes().setValue(false);}}finally{lock.releaseLock();}}
function versionPerfil(row){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(row)));}
function registros(){const table=tablaPerfiles();const get=(row,name)=>{const i=table.headers.indexOf(name);return i<0?'':row[i];};return {...table,profiles:table.rows.slice(1).map((row,index)=>{const age=String(get(row,'Edad')).trim();const eligible=/^\d{2,3}$/.test(age)&&Number(age)>=18&&Number(age)<=120;const details=Object.fromEntries(Object.entries(FIELD_COLUMNS).map(([key,col])=>[key,String(get(row,col)??'')]));if(!details.dailyWeeklyAvailability)details.dailyWeeklyAvailability=String(get(row,'Disponibilidad diaria')||'');return {row:index+2,id:String(get(row,'Perfil ID')||''),name:String(get(row,'Nombre')||''),country:details.country,english:details.english,photo:String(get(row,'Fotos del perfil')||''),available:get(row,'Disponible')===true,approved:get(row,'Publicar')===true,eligible,details,revision:versionPerfil(row),originalRevenue:String(get(row,'Ingreso mensual/subs')||'')};}).filter(p=>p.id&&p.name)};}
function tarjeta(p){return {id:p.id,name:p.name,country:p.country,english:p.english,available:p.available,hasPhoto:!!p.photo};}
function detalle(p){return {...tarjeta(p),details:p.details};}
function actualizarPerfil(data){
 if(typeof data.id!=='string'||typeof data.revision!=='string'||(data.approved!==undefined&&typeof data.approved!=='boolean')||(data.available!==undefined&&typeof data.available!=='boolean'))return {error:'invalid_request'};
 if(data.details&&(!Object.keys(data.details).every(k=>Object.prototype.hasOwnProperty.call(FIELD_COLUMNS,k)&&typeof data.details[k]==='string'&&data.details[k].length<=1000)))return {error:'invalid_fields'};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const {sheet,profiles,headers}=registros(),p=profiles.find(x=>x.id===data.id);if(!p)return {error:'not_found'};if(p.revision!==data.revision)return {error:'conflict'};
 const details={...p.details,...data.details};const age=String(details.age).trim();const eligible=/^\d{2,3}$/.test(age)&&Number(age)>=18&&Number(age)<=120;
 const approved=data.approved===undefined?p.approved:data.approved;if(approved&&!eligible)return {error:'adult_required'};
 let available=data.available===undefined?p.available:data.available;if(approved&&!p.approved)available=true;if(!approved)available=false;
 const updates=[];for(const [k,v] of Object.entries(data.details||{})){const col=headers.indexOf(FIELD_COLUMNS[k])+1;if(!col)return {error:'setup_required'};updates.push([col,v]);}const pub=headers.indexOf('Publicar')+1,avail=headers.indexOf('Disponible')+1;if(!pub||!avail)return {error:'setup_required'};
 // Solo columnas permitidas; las fórmulas se guardan como texto literal.
 for(const [col,value] of updates)sheet.getRange(p.row,col).setValue(/^[=+@-]/.test(value)?"'"+value:value);
 sheet.getRange(p.row,pub).setValue(approved);sheet.getRange(p.row,avail).setValue(available);SpreadsheetApp.flush();return {ok:true};
 }finally{lock.releaseLock();}
}
function fotoPerfil(p){const id=p.photo.match(/(?:\/d\/|[?&]id=)([a-zA-Z0-9_-]{10,})/)?.[1];if(!id)return {error:'photo_requires_drive'};const file=DriveApp.getFileById(id),blob=file.getThumbnail()||file.getBlob(),bytes=blob.getBytes();if(!['image/jpeg','image/png','image/webp'].includes(blob.getContentType())||bytes.length>2000000)return {error:'unsupported_photo'};return {mime:blob.getContentType(),base64:Utilities.base64Encode(bytes)};}
function doPost(e){const json=value=>ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);try{const data=JSON.parse(e.postData.contents),secret=PropertiesService.getScriptProperties().getProperty('CATALOG_TOKEN');if(!secret||data.token!==secret)return json({error:'unauthorized'});
 if(data.action==='adminUpdate')return json(actualizarPerfil(data));
 const {profiles}=registros();const approved=profiles.filter(p=>p.eligible&&p.approved);
 if(data.action==='profiles')return json({profiles:approved.map(tarjeta)});
 if(data.action==='profile'){const p=approved.find(p=>p.id===data.id);return json(p?{profile:detalle(p)}:{error:'not_found'});}
 if(data.action==='adminList')return json({profiles:profiles.map(p=>({...detalle(p),hasPhoto:p.eligible&&!!p.photo,eligible:p.eligible,approved:p.approved,revision:p.revision,originalRevenue:p.originalRevenue}))});
 if(data.action==='photo'||data.action==='adminPhoto'){const p=(data.action==='adminPhoto'?profiles.filter(p=>p.eligible):approved).find(p=>p.id===data.id);return json(p?fotoPerfil(p):{error:'not_found'});}
 return json({error:'invalid_action'});
 }catch(error){console.error(error);return json({error:'source_unavailable'});}}
function doGet(){return ContentService.createTextOutput('Conector DOLL ARS activo. El acceso a los datos requiere autenticación.').setMimeType(ContentService.MimeType.TEXT);}
