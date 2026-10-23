import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local testing only');
const passwordLine = readFileSync('.dev.vars', 'utf8').split('\n').find(line => /^ADMIN_PASSWORD\s*=/.test(line));
const password = passwordLine?.slice(passwordLine.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
let checks = 0;
async function request(path, { body, cookie, status = 200, raw = false } = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, status, `${path}: expected ${status}, got ${response.status}: ${text.slice(0, 200)}`);
  checks++;
  return { data: raw ? text : JSON.parse(text), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
const pause = () => new Promise(resolve => setTimeout(resolve, 1600));
for (const path of ['/', '/play', '/admin']) await request(path, { raw: true });
for (const path of ['/api/state', '/api/admin/overview']) await request(path, { status: 401 });
for (const path of ['/api/submit', '/api/hint', '/api/report', '/api/admin/action']) await request(path, { body: {}, status: 401 });
await request('/api/admin/login', { body: { password: 'invalid-test-password' }, status: 401 });
const { cookie: admin } = await request('/api/admin/login', { body: { password } });
const action = (action, values = {}, status = 200) => request('/api/admin/action', { cookie: admin, body: { action, ...values }, status });
await action('nonexistent', {}, 400);
await request('/api/join', { body: {}, status: 400 });
await request('/api/join', { body: { code: 'DOES-NOT-EXIST', name: 'Invalid team' }, status: 404 });
const overview = () => request('/api/admin/overview', { cookie: admin }).then(r => r.data);
let data = await overview();
const teams = data.teams.filter(t => /^TEST-0[1-6]$/.test(t.code)).sort((a,b) => a.code.localeCompare(b.code));
assert.equal(teams.length, 6, 'Run npm run db:seed first');
assert.ok(teams.every(t => t.solved === 0 && !t.finished_at), 'Test teams must have no previous progress');
await action('resetClock');
await action('unreveal');
for (const team of teams) {
  const joined = await request('/api/join', { body: { code: ` ${team.code.toLowerCase()} `, name: team.name } });
  team.cookie = joined.cookie;
  const state = (await request('/api/state', { cookie: team.cookie })).data;
  assert.equal(state.stage, 'lobby'); assert.equal(state.puzzles.length, 0);
}
const first = teams[0].cookie;
await request('/api/submit', { cookie: first, body: { puzzle: 1 }, status: 409 });
await request('/api/hint', { cookie: first, body: { puzzle: 1 }, status: 409 });
await request('/api/report', { cookie: first, body: {}, status: 409 });
await action('start');
const started = (await overview()).event.startedAt;
await action('start'); assert.equal((await overview()).event.startedAt, started);
await action('lock');
await request('/api/submit', { cookie: first, body: { puzzle: 1 }, status: 409 });
await request('/api/hint', { cookie: first, body: { puzzle: 1 }, status: 409 });
await request('/api/report', { cookie: first, body: {}, status: 409 });
await action('unlock');
await request('/api/submit', { cookie: first, body: { puzzle: 3 }, status: 409 });
await request('/api/hint', { cookie: first, body: { puzzle: 2 }, status: 409 });
await request('/api/report', { cookie: first, body: {}, status: 409 });
const wrong = await request('/api/submit', { cookie: first, body: { puzzle: 1, answers: {} } });
assert.equal(wrong.data.ok, false);
await request('/api/submit', { cookie: first, body: { puzzle: 1, answers: {} }, status: 429 });
for(let i=0;i<3;i++) await request('/api/hint', { cookie: teams[5].cookie, body: { puzzle: 1 } });
await request('/api/hint', { cookie: teams[5].cookie, body: { puzzle: 1 }, status: 409 });
await request('/api/hint', { cookie: teams[4].cookie, body: { puzzle: 1 } });
await pause();
const puzzles = [
  [{ check: '١٨:٢٠', sighting: '18:12' }, 'تفقيدة 18:20 ما تثبتش وجود المفتاح وحدو. عزة شافت المفتاح على 18:12.'],
  [{ word: 'أزرق' }, 'زوز خبز والقفة 4000 والباقي 1000 يعني العلبة الزرقاء.'],
  [{ azza: 'باب الدار', slimane: 'الصالة', fadhila: 'السطح', sboui: 'الكوجينة' }, 'عزة عند الباب والسبوعي في الكوجينة وفضيلة في السطح وسليمان في الصالة بالاستبعاد.'],
  [{ place: 'خزانة الكوجينة' }, 'نبدا من المدخل ونتحرك خانة لتحت ويسار حسب المسار حتى خزانة الكوجينة.'],
  [{ code: '٣٧١' }, 'حذفت 650 ونحيت الاربعة. الثلاثة في الاولى والواحد في الثالثة والسبعة في الوسط والخانات مختلفة.'],
];
await Promise.all(teams.map(async (team, index) => {
 for (let i=0; i<puzzles.length; i++) {
   if (i === 1) await request('/api/submit', { cookie: team.cookie, body: { puzzle: 2, answers: { word: 'أزرق' } }, status: 400 });
   const [answers, explanation] = puzzles[i];
   const result = await request('/api/submit', { cookie: team.cookie, body: { puzzle: i+1, answers, explanation } });
   assert.equal(result.data.ok, true);
   const state = (await request('/api/state', { cookie: team.cookie })).data;
   assert.equal(state.solved, i+1);
   assert.equal(state.puzzles.length, Math.min(i+2,5));
   await request('/api/submit', { cookie: team.cookie, body: { puzzle: i+1, answers, explanation }, status: 409 });
   if(i<4) await pause();
 }
 await request('/api/report', { cookie: team.cookie, body: { fields: {} }, status: 400 });
 await request('/api/report', { cookie: team.cookie, body: { fields: {
   who: 'السبوعي', folder: 'العلبة الزرقاء', place: 'خزانة الكوجينة', check: '١٨:٢٠', sighting: '١٨:١٢', key: '٣٧١',
   evidence: 'عزة شافت المفتاح على 18:12 والتفقيدة على 18:20 ما تثبتش وجودو. العلبة والمسار لخزانة الكوجينة يرجحوا السبوعي.',
   noprove: 'لا، ما تثبتش المفتاح كان موجود ولا تفقد وحدو.',
   verify: 'لا، المفتاح ما تفقدش وحدو. ورقة التفقيدة تخص الضو والباب والكراسي.'
 } } });
 await request('/api/report', { cookie: team.cookie, body: {}, status: 409 });
 const state = (await request('/api/state', { cookie: team.cookie })).data;
 assert.equal(state.stage,'done'); assert.equal(state.reveal,null);
}));
await action('review', { teamId: teams[0].id, item: 'p1', points: 35 });
assert.equal((await overview()).review.find(r=>r.teamId===teams[0].id && r.item==='p1').admin,35);
await action('review', { teamId: teams[0].id, item: 'p1', points: null });
await action('review', { teamId: teams[0].id, item: 'missing', points: 1 },404);
await action('rename', { teamId: teams[0].id, name: 'فريق التجربة الفايز' });
await action('reveal');
assert.ok((await request('/api/state', { cookie:first })).data.reveal);
await action('lock');
data = await overview();
const winners = data.teams.filter(t=>t.finished_at).slice(0,3);
assert.ok(winners.every(t => t.total === 650));
assert.ok(winners.every((t,i) => i === 0 || winners[i-1].finished_at <= t.finished_at));
assert.ok(data.teams.every(t => !('teamwork' in t)));
assert.ok(!('teamworkMax' in data));
assert.equal(winners[0].total,650);
const report = `# Local gameplay test results\n\n${checks} HTTP response checks passed, plus gameplay, score, isolation and ranking assertions.\n\n## Winners\n\n${winners.map((t,i)=>`${i+1}. ${t.name}: ${t.total} points`).join('\n')}\n\nCovered: all three pages, all eight API routes, authentication, joining, lobby, start, lock/unlock, wrong answers, throttling, puzzle ordering, required explanations, all five puzzles for six teams across A/B/C, hints and limits, report validation, duplicate reports, manual review, rename, reveal, scoring and ranking.\n\nNot covered by HTTP run: destructive resetAll (existing data preserved), natural timer expiry/grace boundary, concurrent duplicate submissions, browser rendering and cross-browser/device compatibility, remote Cloudflare deployment.\n`;
writeFileSync('SCENARIO_TEST_RESULTS.md',report);
console.log(report);
