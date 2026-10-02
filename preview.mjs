import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const worker=(await import(pathToFileURL(process.cwd()+'/dist/server/index.js'))).default;
if(!process.env.STORE_PASSWORD)throw Error('Set STORE_PASSWORD for local preview.');
const env={STORE_PASSWORD:process.env.STORE_PASSWORD,SESSION_SECRET:randomBytes(32).toString('hex')};
http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const request=new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500).end('Error de vista previa');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
