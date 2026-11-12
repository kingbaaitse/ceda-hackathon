/**
 * Pull the original Obsidian UI components from their public registry.
 *
 *   node tools/sync-obsidian.mjs
 *
 * The registry (https://obsidianui.dev/r/<name>.json) is a shadcn registry
 * item, so each file is written verbatim. Imports are left as they are and
 * resolved through the Vite aliases ('@' -> src, 'motion/react' -> framer-motion,
 * 'next/image' and 'next-themes' -> local shims).
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const REGISTRY = 'https://obsidianui.dev/r';
const OUT = path.resolve('src/components/blocks');

const BLOCKS = [
    'active-sessions',
    'art-gallery',
    'draggable-marquee',
    'hover-img',
    'parallax-slider',
    'split-showcase',
    'status-bars',
    'text-stream',
    'v-prism',
];

/* Pinned: our flip-text is the hover-to-flip variant supplied by hand, which
   differs from the registry build (that one loops on its own). */
const PINNED = ['flip-text'];

async function fetchItem(name) {
    const res = await fetch(`${REGISTRY}/${name}.json`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
}

async function writeFiles(name, item) {
    const written = [];
    for (const file of item.files || []) {
        // mirror the registry paths into src/ so the originals' own relative
        // imports (css, sibling modules) keep working
        const target = path.join(path.resolve('src'), file.path);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, file.content, 'utf8');
        written.push(path.relative(path.resolve('.'), target));
    }
    return written;
}

const run = async () => {
    for (const name of BLOCKS) {
        if (PINNED.includes(name)) {
            console.log(`- ${name} (pinned, left as supplied)`);
            continue;
        }
        try {
            const item = await fetchItem(name);
            const written = await writeFiles(name, item);
            console.log(`✓ ${name} -> ${written.join(', ')}`);
        } catch (e) {
            console.error(`✗ ${name}: ${e.message}`);
        }
    }

    // cn() helper used by most of the originals
    const utils = path.resolve('src/lib/utils.ts');
    if (!existsSync(utils)) {
        await writeFile(utils, `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`, 'utf8');
        console.log('✓ lib/utils.ts');
    }
};

run();
