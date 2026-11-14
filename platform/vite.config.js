import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * The stylesheet is the only render-blocking request on the page, and it is
 * small enough to travel with the HTML. Inlining it removes a round trip
 * before the first paint, and the primary webfont is preloaded so the text
 * never has to be laid out twice.
 */
function inlineCriticalAssets() {
  return {
    name: 'ceda-inline-critical-assets',
    enforce: 'post',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir || 'dist'
      const htmlEntry = Object.values(bundle).find((f) => f.fileName.endsWith('.html'))
      const cssEntries = Object.values(bundle).filter((f) => f.fileName.endsWith('.css'))
      if (!htmlEntry || !cssEntries.length) return

      const htmlPath = path.join(outDir, htmlEntry.fileName)
      let html = fs.readFileSync(htmlPath, 'utf8')

      const css = cssEntries
        .map((f) => fs.readFileSync(path.join(outDir, f.fileName), 'utf8')
          .replace(/\/\*# sourceMappingURL=.*?\*\//g, ''))
        .join('\n')
      html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/g, `<style>${css}</style>`)

      const font = Object.keys(bundle).find((name) => /elms-sans-400[^/]*\.woff2$/.test(name))
      if (font) {
        html = html.replace(
          '</head>',
          `    <link rel="preload" href="/${font}" as="font" type="font/woff2" crossorigin />\n</head>`
        )
      }

      fs.writeFileSync(htmlPath, html)

      // The stylesheet now lives inside the HTML, so the standalone files go.
      cssEntries.forEach((f) => fs.rmSync(path.join(outDir, f.fileName), { force: true }))
      Object.keys(bundle)
        .filter((name) => name.endsWith('.css.map'))
        .forEach((name) => fs.rmSync(path.join(outDir, name), { force: true }))
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineCriticalAssets()],
  appType: 'spa',
  resolve: {
    alias: [
      // the Obsidian UI originals use the "@/..." convention
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
      { find: /^next\/image$/, replacement: path.resolve(__dirname, 'src/shims/next-image.tsx') },
      { find: /^next-themes$/, replacement: path.resolve(__dirname, 'src/shims/next-themes.tsx') },
      // `lucide-animated-icons` asks for the `motion` package. The app already
      // runs on framer-motion, which is the same library under its old name,
      // so both used to ship a second copy of the animation runtime.
      { find: /^motion\/react$/, replacement: 'framer-motion' },
    ],
  },
  build: {
    chunkSizeWarningLimit: 3000,
    // Source maps are published so errors in the wild can be traced back to
    // the module that produced them.
    sourcemap: true,
  },
})
