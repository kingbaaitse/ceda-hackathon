/** Fix the Loader import path (the first pass used POSIX separators on Windows). */
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(d) {
    for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.(jsx|tsx)$/.test(f)) files.push(p);
    }
})('src');

for (const f of files) {
    let s = fs.readFileSync(f, 'utf8');
    if (!/components\/Loader'/.test(s)) continue;
    const depth = f.split(path.sep).length - 2;
    const rel = depth ? '.'.repeat(depth) + '/components/Loader' : './components/Loader';
    s = s.replace(/from '\.\/components\/Loader'/g, `from '${rel}'`);
    fs.writeFileSync(f, s, 'utf8');
    console.log(f, '->', rel);
}
