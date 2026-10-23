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

const { PUZZLE_KEYS, REPORT_FIELD_CHECKS } = load('keys');
const { getPuzzle } = load('content');
const { normTime } = load('grade');
assert.equal(normTime('١٨:٢٠'), '18:20');
assert.equal(normTime('۱۸:۱۲'), '18:12');
assert.equal(normTime('18:99'), '');
assert.ok(PUZZLE_KEYS[2].check({word:'الأزرق'}));
assert.ok(PUZZLE_KEYS[5].check({code:'٣٧١'}));
assert.ok(!PUZZLE_KEYS[5].check({code:'٣١٧'}));
assert.ok(REPORT_FIELD_CHECKS.who('السبوعي'));
const grid = getPuzzle(4,'A').blocks.find(b=>b.type==='table');
for(const variant of ['B','C']) assert.deepEqual(getPuzzle(4,variant).blocks.find(b=>b.type==='table').rows,grid.rows);
let row=0,col=0;
for(const [dr,dc] of [[1,0],[0,1],[1,0],[0,1],[-1,0]]) { row+=dr; col+=dc; }
assert.equal(grid.rows[row][col],'خزانة الكوجينة');
const clues=[['401',1,1],['427',1,0],['134',2,0],['650',0,0],['603',1,0]];
const solutions=[];
for(let n=0;n<1000;n++) {
 const code=String(n).padStart(3,'0');
 if(new Set(code).size!==3) continue;
 if(clues.every(([guess,present,placed])=>[...guess].filter(c=>code.includes(c)).length===present && [...guess].filter((c,i)=>code[i]===c).length===placed)) solutions.push(code);
}
assert.deepEqual(solutions,['371']);
console.log('Arabic normalization, fixed RTL map and unique lock solution checks passed.');
