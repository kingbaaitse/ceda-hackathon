/**
 * One-off: finish the loader swap, drop unused lucide imports, and remove
 * every use of the Sparkles icon (prohibited in this product).
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

/* remaining spinner markup -> loaders */
const SWAPS = [
    [/<Loader2 className="w-4 h-4 text-accent-500 animate-spin" \/>/g, '<InlineLoader size={16} />'],
    [/<Loader2 className="w-3\.5 h-3\.5 text-gray-400 animate-spin" \/>/g, '<InlineLoader size={14} />'],
    [/<Loader2 className="w-3\.5 h-3\.5 text-accent-500 animate-spin" \/>/g, '<InlineLoader size={14} />'],
    [/<Loader2 className="w-6 h-6 animate-spin text-white\/30" \/>/g, '<InlineLoader size={28} />'],
    [/<Loader2 className="w-6 h-6 animate-spin" \/>/g, '<InlineLoader size={28} />'],
    [/<Loader2 className="w-3\.5 h-3\.5 animate-spin" \/>/g, '<ButtonLoader size={14} />'],
];

let changed = 0;
for (const f of files) {
    let s = fs.readFileSync(f, 'utf8');
    const orig = s;
    for (const [re, to] of SWAPS) s = s.replace(re, to);

    /* the app-level auth spinner becomes the fullscreen loader */
    s = s.replace(
        /<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-\[#0a0a0a\]">\s*<div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" \/>\s*<\/div>/,
        '<FullscreenLoader />'
    );

    /* remove every Sparkles usage (prohibited) */
    s = s.replace(/<Sparkles className="[^"]*" \/>/g, '');
    s = s.replace(/<Sparkles\b[^>]*>[\s\S]*?<\/Sparkles>/g, '');

    /* prune lucide imports that are no longer referenced */
    s = s.replace(/import \{([^}]*)\} from 'lucide-react';/g, (m, inner) => {
        const names = inner.split(',').map(x => x.trim()).filter(Boolean);
        const body = s.slice(s.indexOf(m) + m.length);
        const kept = names.filter(n => {
            const local = n.includes(' as ') ? n.split(' as ')[1].trim() : n;
            return new RegExp(`\\b${local.replace(/[^A-Za-z0-9_]/g, '')}\\b`).test(body);
        });
        if (!kept.length) return '';
        const multi = kept.length > 2 || kept.some(n => n.length > 18);
        return `import {${multi ? '\n    ' : ' '}${kept.join(multi ? ',\n    ' : ', ')}${multi ? ',\n' : ' '}} from 'lucide-react';`;
    });

    if (s !== orig) {
        if (/ButtonLoader|InlineLoader|FullscreenLoader/.test(s) && !/components\/Loader'/.test(s)) {
            const rel = f.startsWith('src/pages') || f.startsWith('src/portals')
                ? '../../components/Loader'
                : './components/Loader';
            const lines = s.split('\n');
            let last = 0;
            lines.forEach((l, i) => { if (l.startsWith('import ')) last = i; });
            const names = ['ButtonLoader', 'InlineLoader', 'FullscreenLoader'].filter(n => s.includes(n));
            lines.splice(last + 1, 0, `import { ${names.join(', ')} } from '${rel}';`);
            s = lines.join('\n');
        }
        fs.writeFileSync(f, s, 'utf8');
        console.log('updated', f);
        changed++;
    }
}
console.log('files changed:', changed);
