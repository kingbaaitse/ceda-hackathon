/**
 * Report JSX component names used in a file that are not imported anywhere.
 * Catches the class of bug where a script rewrites an import list but the
 * JSX still references a name that no longer exists.
 */
import fs from 'node:fs';

for (const file of process.argv.slice(2)) {
    const s = fs.readFileSync(file, 'utf8');

    // every identifier imported anywhere
    const imported = new Set();
    for (const m of s.matchAll(/import\s+([^;]*?)\s+from\s+['"][^'"]+['"]/gs)) {
        const clause = m[1];
        const braced = clause.match(/\{([\s\S]*)\}/);
        if (braced) {
            for (const part of braced[1].split(',')) {
                const name = part.trim().split(/\s+as\s+/).pop()?.trim();
                if (name) imported.add(name);
            }
        }
        const def = clause.replace(/\{[\s\S]*\}/, '').replace(/,/g, ' ').trim();
        for (const w of def.split(/\s+/)) if (w && w !== '*' && w !== 'as') imported.add(w);
    }
    // locally declared names
    for (const m of s.matchAll(/(?:function|const|let|class)\s+([A-Z][A-Za-z0-9_]*)/g)) imported.add(m[1]);

    const used = new Set();
    for (const m of s.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)) used.add(m[1]);

    const missing = [...used].filter(n => !imported.has(n));
    console.log(`${file}\n  missing: ${missing.length ? missing.join(', ') : 'none'}`);
}
