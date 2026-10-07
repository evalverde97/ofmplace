import {spawnSync} from 'node:child_process';
for(const file of ['build.mjs','verify.mjs','verify-source.mjs','verify-profiles.mjs','verify-cache.mjs','verify-audit.mjs','verify-separation.mjs']){
 const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
console.log('All verification suites passed.');
