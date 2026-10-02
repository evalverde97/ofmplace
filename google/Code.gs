/** DOLL ARS: script vinculado a una planilla de Google Sheets.
 * Ejecutar prepararCatalogo una vez. Nunca publica respuestas sin aprobación.
 * La única salida pública es doGet: campos de producto aprobados.
 */
const HEADERS = ['id','nombre','categoria','precio','moneda','imagen','descripcion','stock','variantes','material','publicado','origen'];
function prepararCatalogo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abrí este script desde Extensiones > Apps Script de tu planilla.');
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CATALOG_SHEET_ID', ss.getId());
  let sheet = ss.getSheetByName('Productos');
  if (!sheet) sheet = ss.insertSheet('Productos');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold');
    sheet.getRange('K2:K1000').insertCheckboxes();
    sheet.getRange('D2:D1000').setNumberFormat('0.00');
    sheet.getRange('H2:H1000').setNumberFormat('0');
  }
  const existingHeaders=sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  if (HEADERS.some((h,i)=>existingHeaders[i]!==h)) throw new Error('Los encabezados de Productos no coinciden. Conservá tus datos y adaptá la importación.');
  let form;
  const formId = props.getProperty('CATALOG_FORM_ID');
  if (formId) form=FormApp.openById(formId);
  else {
    form=FormApp.create('DOLL ARS · Cargar un producto');
    props.setProperty('CATALOG_FORM_ID',form.getId());
    form.setDescription('Completá los datos del producto. Se publicará después de su revisión. Usá enlaces HTTPS públicos para las imágenes.');
    form.addTextItem().setTitle('Nombre').setRequired(true);
    form.addTextItem().setTitle('Categoría').setRequired(true);
    form.addTextItem().setTitle('Precio').setHelpText('Solo números, sin símbolo de moneda ni separador de miles.').setRequired(true).setValidation(FormApp.createTextValidation().requireNumberGreaterThanOrEqualTo(0).build());
    form.addListItem().setTitle('Moneda').setChoiceValues(['ARS']).setRequired(true);
    form.addTextItem().setTitle('Imagen').setHelpText('URL HTTPS directa de una imagen pública, accesible sin iniciar sesión.').setRequired(true);
    form.addParagraphTextItem().setTitle('Descripción').setRequired(true);
    form.addTextItem().setTitle('Stock').setHelpText('Un número entero mayor o igual a cero.').setRequired(true).setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^[0-9]+$').build());
    form.addTextItem().setTitle('Variantes').setHelpText('Opcional: talles, colores o medidas.');
    form.addTextItem().setTitle('Material').setHelpText('Opcional.');
    form.setDestination(FormApp.DestinationType.SPREADSHEET,ss.getId());
    form.setConfirmationMessage('Recibimos tu producto. Quedará pendiente de revisión.');
  }
  if (!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='recibirProducto')) ScriptApp.newTrigger('recibirProducto').forSpreadsheet(ss).onFormSubmit().create();
  console.log('Formulario para completar: '+form.getPublishedUrl());
  console.log('Editar formulario: '+form.getEditUrl());
  console.log('Planilla: '+ss.getUrl());
  return {formUrl:form.getPublishedUrl(),sheetUrl:ss.getUrl()};
}
function recibirProducto(e) {
  if (!e || !e.namedValues || !e.range) throw new Error('Esta función se ejecuta al enviar el formulario.');
  const get = key => String((e.namedValues[key]||[''])[0]).trim();
  if (!get('Nombre')) return;
  const amount = Number(get('Precio').replace(',','.'));
  const stock = Number(get('Stock'));
  if (!get('Precio')||!get('Stock')||!Number.isFinite(amount)||amount<0||!Number.isInteger(stock)||stock<0) throw new Error('Precio o stock inválidos. La respuesta original permanece en la planilla.');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('CATALOG_SHEET_ID'));
    const sheet=ss.getSheetByName('Productos');
    const source=e.range.getSheet().getSheetId()+':'+e.range.getRow();
    const rows=sheet.getDataRange().getValues();
    if(rows.slice(1).some(r=>String(r[11])===source))return;
    // Preserve user input as text rather than executable spreadsheet formulas.
    const literal=value=>/^[=+@-]/.test(value)?"'"+value:value;
    const row=['P-'+Utilities.getUuid().slice(0,8).toUpperCase(),literal(get('Nombre')),literal(get('Categoría')),amount,'ARS',literal(get('Imagen')),literal(get('Descripción')),stock,literal(get('Variantes')),literal(get('Material')),false,source];
    // Checkbox formatting may extend getLastRow; use the last actual product ID.
    let next=2;for(let i=1;i<rows.length;i++)if(rows[i][0])next=i+2;
    sheet.getRange(next,1,1,row.length).setValues([row]);
    sheet.getRange(next,11).insertCheckboxes();
  } finally {lock.releaseLock();}
}
function doGet() {
  try {
    const sheet=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('CATALOG_SHEET_ID')).getSheetByName('Productos');
    const rows=sheet.getDataRange().getValues();
    if(HEADERS.some((h,i)=>rows[0][i]!==h))throw new Error('Encabezados inválidos');
    const products=rows.slice(1).filter(r=>r[10]===true && r[0] && r[1] && r[3]!=='' && Number.isFinite(Number(r[3])) && Number(r[3])>=0 && r[7]!=='' && Number.isInteger(Number(r[7])) && Number(r[7])>=0).map(r=>({id:String(r[0]),name:String(r[1]),category:String(r[2]||'Otros'),price:Number(r[3]),currency:String(r[4]||'ARS'),image:/^https:\/\//i.test(String(r[5]))?String(r[5]):'',description:String(r[6]),stock:Number(r[7]),variants:String(r[8]),material:String(r[9])}));
    return ContentService.createTextOutput(JSON.stringify({products,updatedAt:new Date().toISOString()})).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({error:'catalog_unavailable'})).setMimeType(ContentService.MimeType.JSON);
  }
}
