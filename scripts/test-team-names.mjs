import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const exports = {};
new Function('exports',ts.transpileModule(readFileSync('src/lib/team-name.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);
for(const name of [undefined,null,'','   ','\t\n','\u00a0\u2003',123,{},[], 'x'.repeat(31)]) assert.ok(exports.validateTeamName(name).error);
assert.equal(exports.validateTeamName('  Team Alpha  ').name,'Team Alpha');
assert.ok(!exports.validateTeamName('فريق الابتكار').error);
const line=readFileSync('.dev.vars','utf8').split('\n').find(l=>l.startsWith('ADMIN_PASSWORD='));
const password=line.slice(line.indexOf('=')+1).trim().replace(/^(["'])(.*)\1$/,'$2');
const base='http://localhost:3000';
async function post(path,body,status,cookie){
 const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 assert.equal(r.status,status,`${path}: ${await r.clone().text()}`);return r;
}
const login=await post('/api/admin/login',{password},200);
const cookie=login.headers.get('set-cookie').split(';')[0];
const overview=await (await fetch(base+'/api/admin/overview',{headers:{Cookie:cookie}})).json();
const team=overview.teams.find(t=>t.code==='TEST-02');
for(const name of [undefined,null,'','  ','\t\n','\u2003',123,{},'x'.repeat(31)]){
 await post('/api/join',{code:team.code,name},400);
 await post('/api/admin/action',{action:'rename',teamId:team.id,name},400,cookie);
}
await post('/api/join',{code:team.code,name:team.name},200);
if(overview.event.startedAt) await post('/api/join',{code:team.code,name:'Changed after start'},409);
await post('/api/admin/action',{action:'rename',teamId:team.id,name:team.name},200,cookie);
console.log('Name validation checks passed: blank, whitespace, wrong types, length, Arabic, valid join/rename, and locked names.');
