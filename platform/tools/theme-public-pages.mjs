/**
 * Make the public pages follow the user's theme.
 *
 * They were authored as dark-only pages, so the `dark` class was hardcoded on
 * the root and every surface used white-on-black. This rewrites those
 * surfaces to semantic tokens (light by default, dark under .dark).
 *
 *   node tools/theme-public-pages.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FILES = ['src/pages/Landing.jsx', 'src/pages/Gallery.jsx', 'src/pages/Changelog.jsx'];

// Ordered: the first match wins, so specific rules come before general ones.
const RULES = [
    // page root
    [/bg-\[#0a0a0a\] text-white dark/g, 'bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-white'],
    [/bg-\[#0a0a0a\]\/85/g, 'bg-gray-50/85 dark:bg-[#0a0a0a]/85'],
    // translucent surfaces
    [/bg-white\/5\b/g, 'bg-black/[0.03] dark:bg-white/5'],
    [/bg-white\/\[0\.02\]/g, 'bg-black/[0.02] dark:bg-white/[0.02]'],
    [/bg-white\/\[0\.03\]/g, 'bg-black/[0.03] dark:bg-white/[0.03]'],
    [/bg-white\/8\b/g, 'bg-black/[0.05] dark:bg-white/10'],
    // borders
    [/border-white\/10\b/g, 'border-gray-200 dark:border-white/10'],
    [/border-white\/12\b/g, 'border-gray-300 dark:border-white/12'],
    [/border-white\/5\b/g, 'border-gray-200 dark:border-white/5'],
    // accent text that only reads on dark
    [/text-accent-300\b/g, 'text-accent-600 dark:text-accent-300'],
    [/text-emerald-300\b/g, 'text-emerald-700 dark:text-emerald-300'],
    // white text at any opacity
    [/text-white\/(\d+)/g, 'text-gray-900/$1 dark:text-white/$1'],
    [/text-white\b/g, 'text-gray-900 dark:text-white'],
    [/hover:text-white\b/g, 'hover:text-gray-900 dark:hover:text-white'],
];

const run = async () => {
    for (const file of FILES) {
        const full = path.resolve(file);
        let src = await readFile(full, 'utf8');
        const before = src;
        for (const [re, to] of RULES) src = src.replace(re, to);
        // keep the deliberate dark panels (the WebGL canvas stays black)
        src = src.replace(/className="absolute inset-0 bg-\[#0a0a0a\] flex items-center justify-center"/g,
            'className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center"');
        if (src !== before) {
            await writeFile(full, src, 'utf8');
            console.log(`✓ ${file}`);
        } else {
            console.log(`- ${file} (no change)`);
        }
    }
};

run();
