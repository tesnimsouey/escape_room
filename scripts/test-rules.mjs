import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cache = new Map();
function load(name) {
 if(cache.has(name)) return cache.get(name);
 const source = ts.transpileModule(readFileSync(`src/lib/${name}.ts`,'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 }}).outputText;
 const exports = {};
 cache.set(name,exports);
 new Function('require','exports',source)((id)=> id.startsWith('./') ? load(id.slice(2)) : id === '@opennextjs/cloudflare' ? {} : require(id),exports);
 return exports;
}
const { phaseOf, rank } = load('server');
const env = { INVESTIGATION_MINUTES:'35', GRACE_MINUTES:'5' };
const start = 1_000_000;
const event = { started_at:start, locked:0, revealed:0 };
for(const [now,phase] of [[start,'investigation'],[start+35*60000-1,'investigation'],[start+35*60000,'final'],[start+40*60000-1,'final'],[start+40*60000,'closed']]) assert.equal(phaseOf(event,env,now).phase,phase);
assert.equal(phaseOf({...event,started_at:null},env,start).phase,'lobby');
assert.equal(phaseOf({...event,locked:1},env,start).phase,'closed');
const a={id:1,total:100,finished_at:100,reason_pts:20};
const b={id:2,total:100,finished_at:101,reason_pts:40};
const c={id:3,total:100,finished_at:100,reason_pts:30};
const d={id:4,total:99,finished_at:50,reason_pts:40};
assert.deepEqual(rank([b,a,d,c]).map(t=>t.id),[3,1,2,4]);
assert.deepEqual(rank([{...a,finished_at:null},b]).map(t=>t.id),[2,1]);
console.log('9 timer-boundary and ranking checks passed.');
