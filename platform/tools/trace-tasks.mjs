// Find the longest main-thread tasks in a Chrome trace and name what ran in them.
import fs from 'node:fs';

const file = process.argv[2];
const trace = JSON.parse(fs.readFileSync(file, 'utf8'));
const events = Array.isArray(trace) ? trace : trace.traceEvents;

// --- main thread: the renderer that did the most work ---
const threads = events
  .filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
  .map((e) => ({ pid: e.pid, tid: e.tid }));

const work = new Map();
for (const e of events) {
  if (e.name !== 'RunTask' || !e.dur) continue;
  const key = `${e.pid}:${e.tid}`;
  work.set(key, (work.get(key) || 0) + e.dur);
}

let best = null;
for (const t of threads) {
  const key = `${t.pid}:${t.tid}`;
  const total = work.get(key) || 0;
  if (!best || total > best.total) best = { ...t, total };
}

const pid = best.pid;
const tid = best.tid;
const onMain = (e) => e.pid === pid && e.tid === tid;

const tasks = events
  .filter((e) => onMain(e) && (e.name === 'RunTask' || e.name === 'TaskQueueManager::ProcessTaskFromWorkQueue'))
  .filter((e) => e.dur)
  .map((e) => ({ start: e.ts, dur: e.dur, name: e.name }))
  .sort((a, b) => b.dur - a.dur)
  .slice(0, 12);

const calls = events.filter((e) => onMain(e) && e.dur && (e.name === 'FunctionCall' || e.name === 'EvaluateScript' || e.name === 'v8.callFunction' || e.name === 'V8.Execute'));

console.log(`main thread pid=${pid} tid=${tid}`);
for (const t of tasks) {
  const inside = events
    .filter((c) => onMain(c) && c.dur && c.ts >= t.start && c.ts + c.dur <= t.start + t.dur)
    .filter((c) => !['RunTask', 'ThreadControllerImpl::RunTask'].includes(c.name))
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 8);
  console.log(`\nTASK ${Math.round(t.dur / 1000)}ms @ ${Math.round(t.start / 1000)}ms`);
  for (const c of inside) {
    const url = (c.args?.data?.url || '').split('/').pop();
    const fn = c.args?.data?.functionName || '';
    console.log(`   ${String(Math.round(c.dur / 1000)).padStart(6)}ms  ${c.name} ${fn} ${url}`);
  }
}

// --- counters ---
const counts = {};
for (const c of calls) {
  const key = (c.args?.data?.functionName || c.name) + ' @ ' + (c.args?.data?.url || '').split('/').pop();
  counts[key] = (counts[key] || 0) + c.dur;
}
console.log('\n=== top self-time functions ===');
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 18)) {
  console.log(String(Math.round(v / 1000)).padStart(8) + 'ms  ' + k);
}
