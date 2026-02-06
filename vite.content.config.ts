import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Un solo content script por build (entry desde env) → IIFE + inlineDynamicImports
// Uso: VITE_CONTENT_ENTRY=falabella vite build --config vite.content.config.ts
const entryName = process.env.VITE_CONTENT_ENTRY
if (!entryName) {
  throw new Error('Define VITE_CONTENT_ENTRY (ej: falabella o mercadoLibre)')
}

const contentDir = resolve(__dirname, 'src', 'content')
const entryPath = resolve(contentDir, `${entryName}.ts`)
if (!fs.existsSync(entryPath)) {
  throw new Error(`No existe src/content/${entryName}.ts`)
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: { [entryName]: entryPath },
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: `content/[name].js`,
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
