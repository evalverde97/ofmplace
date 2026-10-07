import worker from '../../../dist/admin/index.js';
export default async function(request){
 const env=Object.fromEntries(['SESSION_SECRET','ADMIN_USERNAME','ADMIN_PASSWORD','CATALOG_ENDPOINT','CATALOG_TOKEN'].map(name=>[name,Netlify.env.get(name)]));
 return worker.fetch(request,{...env,SITE_ROLE:'admin'});
}
export const config={path:'/*'};
