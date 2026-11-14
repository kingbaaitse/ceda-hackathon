// Report the frame cadence of the page's animation frames in a Chrome trace.
import fs from 'node:fs';

const trace = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const events = Array.isArray(trace) ? trace : trace.traceEvents;

const threads = events
  .filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
  .map((e) => ({ pid: e.pid, tid: e.tid }));
const work = new Map();
for (const e of events) {
  if (e.name !== 'RunTask' || !e.dur) continue;
  work.set(`${e.pid}:${e.tid}`, (work.get(`${e.pid}:${e.tid}`) || 0) + e.dur);
}
let best = null;
for (const t of threads) {
  const total = work.get(`${t.pid}:${t.tid}`) || 0;
  if (!best || total > best.total) best = { ...t, total };
}
const onMain = (e) => e.pid === best.pid && e.tid === best.tid;

// Every animation frame the page asked for, and how long each took.
const frames = events
  .filter((e) => onMain(e) && e.name === 'FireAnimationFrame' && e.dur)
  .sort((a, b) => a.ts - b.ts);

console.log(`frames: ${frames.length}`);
const gaps = [];
for (let i = 1; i < frames.length; i++) gaps.push(Math.round(frames[i].ts - frames[i - 1].ts));
console.log('gaps(ms):', gaps.join(' '));
console.log('durs(ms):', frames.map((f) => Math.round(f.dur)).join(' '));

// Which scripts run inside the animation frames.
const calls = events.filter((e) => onMain(e) && e.name === 'FunctionCall' && e.dur);
const byUrl = new Map();
for (const c of calls) {
  const url = (c.args?.data?.url || '').split('/').pop() || '(anon)';
  byUrl.set(url, (byUrl.get(url) || 0) + c.dur);
}
console.log('\nscript time inside frames:');
for (const [k, v] of [...byUrl].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
  console.log(`  ${String(Math.round(v / 1000)).padStart(7)}ms  ${k}`);
}
