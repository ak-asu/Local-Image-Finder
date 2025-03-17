import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import { builtinModules } from 'module'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules,
              ],
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.mjs'),
        vite: {
          build: {
            // Make sure the preload is built as a separate chunk
            rollupOptions: {
              output: {
                format: 'es',
                entryFileNames: '[name].mjs',
              },
              external: [
                'electron',
                ...builtinModules,
              ],
            },
          },
        },
      },
      // Polyfill the Electron and Node.js API for Renderer process.
      renderer: {},
    }),
  ],
  base: './', // This is important for Electron to find assets
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: process.env.NODE_ENV === 'production',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
})
