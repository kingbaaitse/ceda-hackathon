/**
 * One-off: replace every browser-default spinner with the CEDA loaders.
 */
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

const SWAPS = [
    [/\<Loader2 className="w-4 h-4 animate-spin" \/>/g, '<ButtonLoader />'],
    [/\<Loader2 className="w-3\.5 h-3\.5 animate-spin" \/>/g, '<ButtonLoader size={14} />'],
    [/\<Loader2 className="w-6 h-6 animate-spin" \/>/g, '<InlineLoader size={28} />'],
    [/\<Loader2 className="w-5 h-5 animate-spin" \/>/g, '<InlineLoader size={24} />'],
    [/\<Loader2 className="w-8 h-8 animate-spin" \/>/g, '<InlineLoader size={36} />'],
    [/\<Loader2 className="w-3 h-3 animate-spin" \/>/g, '<InlineLoader size={14} />'],
];

let changed = 0;
for (const f of files) {
    let s = fs.readFileSync(f, 'utf8');
    const orig = s;
    for (const [re, to] of SWAPS) s = s.replace(re, to);
    if (s === orig) continue;

    if (/ButtonLoader|InlineLoader/.test(s) && !/components\/Loader'/.test(s)) {
        const rel = f.startsWith('src/pages') || f.startsWith('src/portals')
            ? '../../components/Loader'
            : './components/Loader';
        // insert after the last import line
        const lines = s.split('\n');
        let last = 0;
        lines.forEach((l, i) => { if (l.startsWith('import ')) last = i; });
        lines.splice(last + 1, 0, `import { ButtonLoader, InlineLoader } from '${rel}';`);
        s = lines.join('\n');
    }
    fs.writeFileSync(f, s, 'utf8');
    console.log(f, '| remaining:', (s.match(/Loader2|animate-spin/g) || []).length);
    changed++;
}
console.log('files changed:', changed);
