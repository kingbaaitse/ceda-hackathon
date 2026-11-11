/**
 * Mirror the Obsidian UI assets the original components load, and point the
 * components at the local copies.
 *
 * Their CDN does not send CORS headers, so a cross-origin load of the prism
 * textures and model fails in the browser. Serving the same files from our
 * own origin removes the problem entirely (and works offline).
 *
 *   node tools/mirror-obsidian-assets.mjs
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const CDN = 'https://cdn-new.obsidianui.dev';
const ASSETS = [
    { url: `${CDN}/effects/v-prism/prism.glb`, file: 'prism.glb' },
    { url: `${CDN}/effects/v-prism/lensflare0_bw.png`, file: 'lensflare0_bw.png' },
    { url: `${CDN}/effects/v-prism/lensflare0_bw.jpg`, file: 'lensflare0_bw.jpg' },
    { url: `${CDN}/effects/v-prism/lensflare2.png`, file: 'lensflare2.png' },
    { url: `${CDN}/effects/v-prism/lensflare3.png`, file: 'lensflare3.png' },
];

const OUT_DIR = path.resolve('public/prism');
const TARGETS = [path.resolve('src/components/block/v-prism.tsx')];

const run = async () => {
    await mkdir(OUT_DIR, { recursive: true });

    for (const asset of ASSETS) {
        const res = await fetch(asset.url);
        if (!res.ok) { console.error(`✗ ${asset.file}: HTTP ${res.status}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(path.join(OUT_DIR, asset.file), buf);
        console.log(`✓ ${asset.file} (${Math.round(buf.length / 1024)} KB)`);
    }

    for (const target of TARGETS) {
        let src = await readFile(target, 'utf8');
        const before = src;
        src = src.replaceAll(`${CDN}/effects/v-prism/`, '/prism/');
        if (src !== before) {
            await writeFile(target, src, 'utf8');
            console.log(`✓ rewrote asset paths in ${path.relative(path.resolve('.'), target)}`);
        }
    }

    const dir = await readdir(OUT_DIR);
    console.log(`→ public/prism: ${dir.length} files`);
};

run();
