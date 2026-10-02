import worker from '../../dist/server/index.js';
export default async function(request) {
 const env=Object.fromEntries(['STORE_PASSWORD','SESSION_SECRET','ADMIN_USERNAME','ADMIN_PASSWORD','CATALOG_ENDPOINT','CATALOG_TOKEN'].map(name=>[name,Netlify.env.get(name)]));
 return worker.fetch(request,env);
}
export const config={path:'/*'};
