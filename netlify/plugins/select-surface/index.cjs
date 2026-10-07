// Deployment identity is fixed by Netlify, not supplied by the browser.
const ADMIN_SITE_ID='983c2e62-4e8e-40fe-9740-44259b323c35';
module.exports={onPreBuild({netlifyConfig}){
 if(process.env.SITE_ID!==ADMIN_SITE_ID)return;
 netlifyConfig.build.publish='admin-site/public';
 netlifyConfig.build.edge_functions='admin-site/netlify/edge-functions';
 netlifyConfig.functions={...netlifyConfig.functions,directory:'admin-site/netlify/functions'};
 netlifyConfig.edge_functions=[{path:'/*',function:'admin'}];
 console.log('Selected the isolated administration deployment.');
}};
